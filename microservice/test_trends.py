from pytrends.request import TrendReq
from pytrends.exceptions import ResponseError
import pandas as pd
import json
import time

def fetch_and_print_trends(keywords, geo_code, max_retries=3):
    """
    Fetches Google Trends data and saves it to a JSON file.
    Includes exponential backoff for 429 errors.
    """
    
    pytrends = TrendReq(hl='en-US', tz=330)
    
    for attempt in range(max_retries):
        try:
            print(f"Fetching trends for keywords: {keywords} in geo: {geo_code}... (Attempt {attempt + 1}/{max_retries})")
            
            pytrends.build_payload(
                kw_list=keywords,
                timeframe='today 1-m',
                geo=geo_code
            )
            data = pytrends.interest_over_time()

            if data.empty:
                print("\n--> No data returned from Google Trends.")
                return

            # --- Data processing (same as before) ---
            data = data.reset_index()
            if 'isPartial' in data.columns:
                data = data.drop(columns=['isPartial'])
            
            data['date'] = data['date'].apply(lambda x: {"$date": x.isoformat() + "Z"})
            
            trends_records = data.to_dict('records')
            
            mongo_document = {
                "geo": geo_code,
                "data": trends_records,
                "lastFetched": {"$date": pd.Timestamp.now().isoformat() + "Z"}
            }

            # --- THIS IS THE MODIFIED PART ---
            # Instead of printing, we save the 'mongo_document' to a file.
            
            output_filename = "trends_data.json"
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(mongo_document, f, indent=4)
            
            print(f"\n--- SUCCESS! ---")
            print(f"Real data has been saved to the file: {output_filename}")
            print("You can now open this file, copy its contents, and paste it into MongoDB Atlas.")
            print("--------------------------------------------")
            
            return # Success!

        except ResponseError as e:
            print(f"\n--> An error occurred: {e}")
            
            if "code 429" in str(e):
                if attempt < max_retries - 1:
                    wait_time = 10 * (2 ** attempt) # Exponential backoff
                    print(f"--> Received 429 'Too Many Requests'. Waiting {wait_time} seconds before retrying...")
                    time.sleep(wait_time)
                else:
                    print(f"--> Max retries reached ({max_retries}). Aborting.")
                    break
            else:
                print("--> This is not a 429 error. Aborting.")
                break
        
        except Exception as e:
            print(f"\n--> An unexpected error occurred: {e}")
            break

if __name__ == '__main__':
    target_keywords = ['fever', 'cough', 'flu', 'dengue']
    target_geo = 'IN' 
    
    # We can try a few more times to be safe
    fetch_and_print_trends(target_keywords, target_geo, max_retries=5)