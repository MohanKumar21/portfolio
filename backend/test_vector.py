# import faiss

# # Load FAISS index
# index = faiss.read_index("vectorstore/index.faiss")

# # Get number of vectors
# print("Number of vectors:", index.ntotal)

# # Extract the first 5 embeddings
# xb = index.reconstruct_n(0, min(5, index.ntotal))
# print("First few vectors:", xb)
