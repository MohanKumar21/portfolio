# import os
# from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import FAISS
# from langchain_openai import OpenAIEmbeddings
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_chroma import Chroma
# from dotenv import load_dotenv 
# load_dotenv()
# # OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
# OPENROUTER_API_KEY ="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"
# CV_PATH = "data/resume.pdf"   # replace with your CV filename
# DB_PATH = "vectorstore"

# # Load and chunk PDF
# loader = PyPDFLoader(CV_PATH)
# docs = loader.load()

# splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
# splits = splitter.split_documents(docs)

# # Create embeddings + FAISS
# # embeddings = OpenAIEmbeddings(model="thenlper/gte-large", api_key=OPENROUTER_API_KEY,base_url="https://openrouter.ai/api/v1")
# embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
# print(embeddings)
# vectorstore = FAISS.from_documents(splits, embeddings)

# # Save FAISS index locally
# vectorstore.save_local(DB_PATH)
# print(f"Vector store saved to {DB_PATH}")


from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv 

load_dotenv()
# Make sure OPENAI_API_KEY is set in .env

# Load & split
loader = PyPDFLoader("data/resume.pdf")
docs = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = splitter.split_documents(docs)

# ✅ No need to create `OpenAI` client manually
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.environ["OPENAI_API_KEY"])

# Create FAISS vectorstore
vectorstore = FAISS.from_documents(splits, embeddings)
vectorstore.save_local("vectorstore")

