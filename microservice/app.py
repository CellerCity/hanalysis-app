from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pytrends.request import TrendReq
import pandas as pd

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing) to allow our frontend to make requests
CORS(app)


# --- API ROUTES ---

@app.route('/')
def index():
    """A simple test route to confirm the service is alive."""
    return jsonify({"message": "Welcome to the HANALYSIS Flask Microservice!"})

# --- NEW: Trend Analysis Endpoint ---
@app.route('/api/trends')
def get_trends():
    """
    Fetches Google Trends data for a list of keywords in a specific geo-location.
    Query Parameters:
    - keywords: A comma-separated list of keywords (e.g., "dengue,flu")
    - geo: A country/region code (e.g., "IN" for India, "IN-WB" for West Bengal)
    """
    try:
        # 1. Get parameters from the request URL
        keywords_str = request.args.get('keywords', 'fever') # Default to 'fever' if not provided
        geo_location = request.args.get('geo', 'IN') # Default to 'IN' (India)
        
        keywords_list = [kw.strip() for kw in keywords_str.split(',')]

        # 2. Connect to Google Trends
        pytrends = TrendReq(hl='en-US', tz=330) # tz=330 is for India Standard Time

        # 3. Build the payload
        pytrends.build_payload(
            kw_list=keywords_list,
            cat=0,
            timeframe='today 3-m', # Get data for the last 3 months
            geo=geo_location,
            gprop=''
        )

        # 4. Fetch the interest over time data
        # This returns a pandas DataFrame
        data = pytrends.interest_over_time()
        
        if data.empty:
            return jsonify({"error": "No trend data found for the given keywords/location."}), 404

        # 5. Convert the DataFrame to a JSON format that's easy to use
        # We reset the index to make the 'date' a regular column
        data = data.reset_index()
        # The 'isPartial' column is not needed for our charts
        if 'isPartial' in data.columns:
            data = data.drop(columns=['isPartial'])
        
        # Convert the DataFrame to a list of dictionaries (records)
        trends_json = data.to_dict('records')

        return jsonify(trends_json)

    except Exception as e:
        # Handle potential errors (e.g., too many requests, invalid keyword)
        print(f"An error occurred: {e}")
        return jsonify({"error": "Failed to fetch Google Trends data."}), 500


# This block ensures the server runs only when the script is executed directly
if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    app.run(debug=True, port=port)