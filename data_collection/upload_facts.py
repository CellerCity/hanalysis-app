import json
import os
from pymongo import MongoClient, TEXT
from dotenv import load_dotenv

# Load environment variables (specifically MONGODB_URI)
load_dotenv()

# --- Configuration ---
DATABASE_NAME = "hanalysis-db"
COLLECTION_NAME = "health_facts"
JSON_FILE_PATH = "who_facts.json"
# ---------------------

def upload_data_to_mongo():
    """
    Connects to MongoDB, reads the JSON file, and uploads the data.
    """
    try:
        # 1. Connect to MongoDB
        uri = os.getenv("MONGODB_URI")
        if not uri:
            print("Error: MONGODB_URI not found in .env file.")
            return

        client = MongoClient(uri)
        db = client[DATABASE_NAME]
        
        # Check if the collection already exists and drop it for a fresh start
        if COLLECTION_NAME in db.list_collection_names():
            print(f"Collection '{COLLECTION_NAME}' already exists. Dropping it for a fresh upload.")
            db[COLLECTION_NAME].drop()
            
        collection = db[COLLECTION_NAME]
        print("Connected to MongoDB successfully.")

        # 2. Read the local JSON file
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"Error: {JSON_FILE_PATH} is empty or invalid.")
            return

        # 3. Insert the data into the collection
        print(f"Uploading {len(data)} documents to '{COLLECTION_NAME}'...")
        result = collection.insert_many(data)
        print(f"Successfully inserted {len(result.inserted_ids)} documents.")

        # 4. --- CRITICAL: Create the Text Search Index ---
        # This allows us to search inside the 'topic' and 'chunk_text' fields.
        print("Creating text index for searching...")
        collection.create_index([
            ("topic", TEXT),
            ("chunk_text", TEXT)
        ], name="search_index")
        
        print("Text index created successfully.")
        print("\n--- Data Upload Complete ---")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    upload_data_to_mongo()


"""
3.  **Run the script:** In your `(venv)` terminal, run this script one time:
    ```bash
    python upload_facts.py

"""