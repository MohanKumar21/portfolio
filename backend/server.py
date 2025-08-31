# server.py (patched)
import time
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import OpenAIEmbeddings

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver

from langchain_core.messages import (
    BaseMessage, HumanMessage, AIMessage, SystemMessage
)
import os
from dotenv import load_dotenv 
load_dotenv()
# -------------------------------
# Config
# -------------------------------
# OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or "REPLACE_ME" 
OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
MODEL_NAME = "gpt-oss-20b"
DB_PATH = "vectorstore"

# -------------------------------
# Embeddings + FAISS
# -------------------------------
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.environ["OPENAI_API_KEY"])
vectorstore = FAISS.load_local(
    DB_PATH, embeddings=embeddings, allow_dangerous_deserialization=True
)
# Guard against older versions that don't attach embedding_function
if getattr(vectorstore, "embedding_function", None) is None:
    vectorstore.embedding_function = embeddings

retriever = vectorstore.as_retriever(search_kwargs={"k": 6})

print("FAISS index size:", vectorstore.index.ntotal)

# -------------------------------
# Helpers
# -------------------------------
ROLE_MAP = {"user": HumanMessage, "assistant": AIMessage, "system": SystemMessage}

def to_lc_messages(messages_json) -> list[BaseMessage]:
    out = []
    for m in messages_json:
        cls = ROLE_MAP.get(m.get("role", "user"), HumanMessage)
        out.append(cls(content=m.get("content", "")))
    return out

def last_human_text(msgs: list[BaseMessage]) -> str:
    for m in reversed(msgs or []):
        if isinstance(m, HumanMessage):
            return m.content
    return msgs[-1].content if msgs else ""

# -------------------------------
# LangGraph workflow (non-streaming path)
# -------------------------------
def build_rag_graph(_retriever):
    graph = StateGraph(MessagesState)

    def retrieve_node(state: MessagesState):
        query = last_human_text(state["messages"])
        docs = _retriever.invoke(query) if query else []
        context = "\n\n".join(d.page_content for d in docs)
        return {"context": context}

    llm = ChatOpenAI(
        model=MODEL_NAME,
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )

    def generate_node(state: MessagesState):
        user_msg = last_human_text(state["messages"])
        context = state.get("context", "")
        sys = SystemMessage(content=(
            "You are a helpful assistant answering questions strictly with the provided CV context. "
            "If something isn't in the context, say you don't see it in the CV."
        ))
        prompt_user = HumanMessage(content=f"CV Context:\n{context}\n\nUser Query:\n{user_msg}")
        result = llm.invoke([sys, prompt_user])
        print([AIMessage(content=result.content)])
        return {"messages": [AIMessage(content=result.content)]}

    graph.add_node("retrieve", retrieve_node)
    graph.add_node("generate", generate_node)
    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)

    return graph.compile(checkpointer=MemorySaver())

workflow = build_rag_graph(retriever)

# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI()
# CORS (adjust for your SvelteKit origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Streaming SSE/OpenAI-chunk helper
# -------------------------------
def sse(data: dict) -> bytes:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")

def sse_done() -> bytes:
    return b"data: [DONE]\n\n"

# -------------------------------
# Chat endpoint (streaming + non-streaming)
# -------------------------------
@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages_json = body.get("messages", [])
    stream = bool(body.get("stream", False))
    thread_id = body.get("thread_id", "default")

    if not stream:
        # Non-streaming: use the LangGraph workflow
        lc_messages = to_lc_messages(messages_json)
        result = workflow.invoke(
            {"messages": lc_messages},
            config={"configurable": {"thread_id": thread_id}},
        )
        return {
            "id": f"chatcmpl-{thread_id}",
            "object": "chat.completion",
            "choices": [{
                "message": {"role": "assistant", "content": result["messages"][-1].content}
            }]
        }

    # Streaming path: do RAG retrieval first, then stream LLM tokens
    lc_messages = to_lc_messages(messages_json)
    query = last_human_text(lc_messages)
    docs = retriever.invoke(query) if query else []
    context = "\n\n".join(d.page_content for d in docs) if docs else ""

    llm = ChatOpenAI(
        model=MODEL_NAME,
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        streaming=True,  # not strictly required for .stream(), but fine
    )

    sys = SystemMessage(content=(
        "You are a helpful assistant answering questions strictly with the provided CV context. "
        # "If something isn't in the context, say you don't see it in the CV."
    ))
    prompt_user = HumanMessage(content=f"CV Context:\n{context}\n\nUser Query:\n{query}")

    async def token_stream():
        # Send an initial chunk (OpenAI-compatible)
        chunk_id = f"chatcmpl-{thread_id}"
        yield sse({
            "id": chunk_id,
            "object": "chat.completion.chunk",
            "choices": [{"delta": {"role": "assistant"}, "index": 0, "finish_reason": None}]
        })

        # Stream tokens
        for part in llm.stream([sys, prompt_user]):
            # part is an AIMessageChunk (can contain multiple token pieces)
            text = part.content or ""
            if text:
                yield sse({
                    "id": chunk_id,
                    "object": "chat.completion.chunk",
                    "choices": [{"delta": {"content": text}, "index": 0, "finish_reason": None}]
                })

        # Final chunk with finish_reason
        yield sse({
            "id": chunk_id,
            "object": "chat.completion.chunk",
            "choices": [{"delta": {}, "index": 0, "finish_reason": "stop"}]
        })
        yield sse_done()

    return StreamingResponse(
        token_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # for nginx dev setups
        },
    )

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "service": "portfolio-contact"
    }
