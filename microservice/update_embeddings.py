import json
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

# --- Load Config ---
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "hanalysis-db"
COLLECTION_NAME = "health_facts"

# --- Connect to DB ---
try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client[DB_NAME]
    health_facts_collection = db[COLLECTION_NAME]
    print(f"--- Connected to MongoDB collection '{COLLECTION_NAME}' ---")
except Exception as e:
    print(f"FATAL: Failed to connect to MongoDB. {e}")
    exit()

# --- Load Embedding Model ---
try:
    # This MUST be the same model as in app.py
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("--- Sentence Transformer model loaded ---")
except Exception as e:
    print(f"FATAL: Failed to load Sentence Transformer. {e}")
    exit()

# --- Find documents that need an embedding ---
# We look for documents where the 'chunk_embedding' field does not exist
documents_to_update = list(health_facts_collection.find({ "chunk_embedding": { "$exists": False } }))

total_docs = len(documents_to_update)
if total_docs == 0:
    print("--- All documents already have embeddings. Nothing to do. ---")
    exit()

print(f"--- Found {total_docs} documents without embeddings. Starting update... ---")

# --- Process and Update ---
for i, doc in enumerate(documents_to_update):
    try:
        text_to_embed = doc.get('chunk_text')
        
        if not text_to_embed:
            print(f"Skipping doc {doc['_id']}, no 'chunk_text'.")
            continue
            
        # 1. Create the vector embedding
        embedding = model.encode(text_to_embed).tolist()
        
        # 2. Update the document in the database, adding the new field
        health_facts_collection.update_one(
            { "_id": doc['_id'] }, # Find this specific document
            { "$set": { "chunk_embedding": embedding } } # Add the new field
        )
        
        if (i+1) % 50 == 0 or (i+1) == total_docs:
            print(f"Processed and updated {i+1}/{total_docs} documents...")

    except Exception as e:
        print(f"Failed to update document {doc['_id']}: {e}")

print(f"\nSUCCESS: Successfully added embeddings to {total_docs} documents.")