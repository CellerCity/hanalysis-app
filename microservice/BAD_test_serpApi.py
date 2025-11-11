from serpapi import GoogleSearch  # Make sure this is the import
import json
import os
from dotenv import load_dotenv

def fetch_trends_serpapi(keywords, geo_code, api_key):
    """
    Fetches Google Trends data using the SerpApi client.
    """
    try:
        query_string = ", ".join(keywords)
        
        print(f"Fetching trends for keywords: '{query_string}' in geo: {geo_code}...")

        params = {
            "engine": "google_trends",
            "q": query_string,
            "geo": geo_code,
            "data_type": "TIMESERIES",
            "date": "today 30-m",  # <-- THE FIX: Changed 'timeframe' to 'date'
            "api_key": api_key
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            print(f"\n--> SerpApi Error: {results['error']}")
            return

        if "interest_over_time" not in results:
            print("\n--> No 'interest_over_time' data returned from SerpApi.")
            return
            
        timeline_data = results.get("interest_over_time", {}).get("timeline_data", [])

        if not timeline_data:
            print("\n--> No timeline_data found in the response. (No search volume for this period)")
            return

        print("\n--- SerpApi Response Data (Interest Over Time) ---")
        print(json.dumps(timeline_data, indent=4))
        print("-------------------------------------------------")
        
        # --- Your MongoDB formatting logic ---
        mongo_docs = []
        for entry in timeline_data:
            doc = {
                "timestamp": entry.get("time"), # This is a UNIX timestamp
                "date": entry.get("formattedTime"), # This is a human-readable date string
                "values": {}
            }
            
            # 'values' is a list of dicts, one for each keyword
            for val in entry.get("values", []):
                # Use val.get("query") to get the keyword name (e.g., "fever")
                # and val.get("value") to get its interest score
                doc["values"][val.get("query")] = val.get("value")
            
            mongo_docs.append(doc)
            
        print("\n--- Example MongoDB-compatible format ---")
        print(json.dumps(mongo_docs, indent=4))
        print("-----------------------------------------")

    except Exception as e:
        print(f"\n--> An unexpected error occurred: {e}")

if __name__ == '__main__':
    load_dotenv() 
    MY_API_KEY = os.environ.get("SERPAPI_KEY") 
    
    if not MY_API_KEY:
        print("Error: SERPAPI_KEY not found in .env file.")
    else:
        target_keywords = ['fever', 'cough', 'flu', 'dengue']
        target_geo = 'IN'
        
        fetch_trends_serpapi(target_keywords, target_geo, MY_API_KEY)