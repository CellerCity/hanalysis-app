from pytrends.request import TrendReq
import pandas as pd
import json

def fetch_and_print_trends(keywords, geo_code):
    """
    Fetches Google Trends data and prints it in a MongoDB-compatible format.
    """
    try:
        print(f"Fetching trends for keywords: {keywords} in geo: {geo_code}...")
        pytrends = TrendReq(hl='en-US', tz=330)
        pytrends.build_payload(
            kw_list=keywords,
            timeframe='today 1-m',  # Last 30 days is enough for a demo
            geo=geo_code
        )
        data = pytrends.interest_over_time()

        if data.empty:
            print("\n--> No data returned from Google Trends.")
            return

        # Prepare data for output
        data = data.reset_index()
        if 'isPartial' in data.columns:
            data = data.drop(columns=['isPartial'])
            
        # Convert date to the format MongoDB expects
        data['date'] = data['date'].apply(lambda x: {"$date": x.isoformat() + "Z"})
            
        trends_records = data.to_dict('records')
        
        # Create the full MongoDB document
        mongo_document = {
            "geo": geo_code,
            "data": trends_records,
            "lastFetched": {"$date": pd.Timestamp.now().isoformat() + "Z"}
        }

        print("\n--- COPY AND PASTE THIS INTO MONGODB ATLAS ---")
        # Use json.dumps for pretty printing
        print(json.dumps(mongo_document, indent=4))
        print("--------------------------------------------")

    except Exception as e:
        print(f"\n--> An error occurred: {e}")
        print("--> This is likely due to a 429 'Too Many Requests' error. Try again later.")

if __name__ == '__main__':
    # --- CONFIGURE YOUR TEST HERE ---
    target_keywords = ['fever', 'cough', 'flu', 'dengue']
    target_geo = 'IN-WE'  # West Bengal. Change to 'IN-DL' for Delhi, etc.

    # when no data is present this returns 400 bad request [best is to use the IN for the entire country]
    
    fetch_and_print_trends(target_keywords, target_geo)