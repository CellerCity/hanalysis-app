from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pytrends.request import TrendReq
import pandas as pd
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

# --- Configure the Gemini API ---
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file.")
    genai.configure(api_key=GOOGLE_API_KEY)
    # --- THE FIX: Using a stable model name from the provided list ---
    model_name = os.getenv('LLM_MODEL_NAME', 'models/gemini-flash-latest')
    print(f"--- Using Gemini Model: {model_name} ---")
    model = genai.GenerativeModel(model_name)

except Exception as e:
    print(f"FATAL ERROR: Failed to configure Google AI. {e}")
    model = None

# Initialize Flask App
app = Flask(__name__)
CORS(app)


# --- Helper function for the LLM Prompt ---
def create_llm_prompt(data):
    """Formats all combined data into a detailed prompt for the LLM."""
    user_profile = data.get('userProfile', {})
    weather_data_from_node = data.get('weather', {})
    trends_data = data.get('trends', [])

    # Access data from the correct nested levels
    home_location = user_profile.get('location', 'N/A')
    current_location_obj = weather_data_from_node.get('location', {})
    current_weather_obj = weather_data_from_node.get('weather', {})
    air_quality_obj = weather_data_from_node.get('air_quality', {})
    
    trends_summary = "No significant trend data available."
    if trends_data:
        if isinstance(trends_data, list) and trends_data:
            latest_trends = trends_data[-1]
            trend_points = [f"'{key}' interest is {value}/100" for key, value in latest_trends.items() if key != 'date']
            if trend_points:
                trends_summary = ", ".join(trend_points) + "."

    prompt = f"""
    You are HANALYSIS, a helpful and cautious personal health assistant. 
    Your goal is to provide a risk assessment and actionable recommendations based on the user's profile and real-time environmental data. 
    Your response MUST be a clean JSON object with four keys: "riskScore" (a number from 1 to 10, where 10 is the highest risk), "riskLevel" (string: "Low", "Moderate", "High", or "Very High"), "summary" (a concise, one-sentence explanation), and "recommendations" (a list of 3-4 string bullet points).
    
    Analyze the following data. Pay special attention if the user's current location is different from their home location and if local search trends indicate a potential health concern.

    **User Profile:**
    - Age: {user_profile.get('age', 'N/A')}
    - Home Location: {home_location}
    - Pre-existing Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}
    - Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}

    **Environmental Data:**
    - Current Location: {current_location_obj.get('name', 'N/A')}
    - Temperature: {current_weather_obj.get('temperature_celsius', 'N/A')}°C
    - Humidity: {current_weather_obj.get('humidity_percent', 'N/A')}%
    - Air Quality (US EPA Index): {air_quality_obj.get('us_epa_index', 'N/A')} (1=Good, 2=Moderate, 3=Unhealthy for Sensitive, 4=Unhealthy)
    - PM2.5: {air_quality_obj.get('pm2_5', 'N/A')} µg/m³

    **Local Search Trends (Interest out of 100):**
    - {trends_summary}
    """
    return prompt


# --- API ROUTES ---

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the HANALYSIS Flask Microservice!"})


@app.route('/api/trends')
def get_trends():
    try:
        keywords_str = request.args.get('keywords', 'fever')
        geo_location = request.args.get('geo', 'IN')
        keywords_list = [kw.strip() for kw in keywords_str.split(',')]
        pytrends = TrendReq(hl='en-US', tz=330)
        pytrends.build_payload(kw_list=keywords_list, timeframe='today 3-m', geo=geo_location)
        data = pytrends.interest_over_time()
        if data.empty: return jsonify({"error": "No trend data found."}), 404
        data = data.reset_index()
        if 'isPartial' in data.columns: data = data.drop(columns=['isPartial'])
        return jsonify(data.to_dict('records'))
    except Exception as e:
        print(f"An error occurred in trends: {e}")
        return jsonify({"error": "Failed to fetch Google Trends data."}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_health_data():
    if not model:
        return jsonify({"error": "AI model is not configured. Check server logs."}), 503
    try:
        combined_data = request.get_json()
        if not combined_data: return jsonify({"error": "Invalid request body."}), 400
        
        prompt = create_llm_prompt(combined_data)
        response = model.generate_content(prompt)
        
        print("--- RAW LLM RESPONSE ---")
        print(response.text)
        print("------------------------")
        
        response_text = response.text.strip().replace('```json', '').replace('```', '')
        analysis_json = json.loads(response_text)
        
        return jsonify(analysis_json)
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return jsonify({"error": "Failed to get analysis from the AI model."}), 500


if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    app.run(debug=True, port=port)

