from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pytrends.request import TrendReq
import pandas as pd
import google.generativeai as genai
import json

# Load environment variables and configure the Gemini API
load_dotenv()
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file.")
    genai.configure(api_key=GOOGLE_API_KEY)
    
    model_name = os.getenv('LLM_MODEL_NAME', 'models/gemini-flash-latest')
    print(f"--- Using Gemini Model: {model_name} ---")
    model = genai.GenerativeModel(model_name)

except Exception as e:
    print(f"FATAL ERROR: Failed to configure Google AI. {e}")
    model = None

# Initialize Flask App
app = Flask(__name__)
CORS(app)


# --- Helper functions for LLM Prompts ---

def create_analysis_prompt(data):
    """Formats data for the one-shot dashboard analysis."""
    # ... This function remains unchanged ...
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    trends_data = data.get('trends', [])
    home_location = user_profile.get('location', 'N/A')
    current_location = weather.get('location', {}).get('name', 'N/A')
    trends_summary = "No significant trend data available."
    if trends_data:
        if isinstance(trends_data, list) and trends_data:
            latest_trends = trends_data[-1]
            trend_points = [f"'{key}' interest is {value}/100" for key, value in latest_trends.items() if key != 'date']
            if trend_points:
                trends_summary = ", ".join(trend_points) + "."
    return f"""
    You are HANALYSIS, a helpful health assistant. Your response MUST be a clean JSON object with four keys: "riskScore", "riskLevel", "summary", and "recommendations".
    Analyze the following data.
    User Profile: Age {user_profile.get('age', 'N/A')}, Home: {home_location}, Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}, Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}.
    Environmental Data: Current Location: {current_location}, Temp: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C, Humidity: {weather.get('weather', {}).get('humidity_percent', 'N/A')}%, AQI: {air_quality.get('us_epa_index', 'N/A')}.
    Local Search Trends: {trends_summary}
    """

# --- NEW: Helper function for building the conversational prompt ---
def create_chat_message_list(data):
    """Formats all data into a list of messages for a conversational AI model."""
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    chat_history = data.get('history', [])
    
    # Create the initial system instruction and context
    system_instruction = f"""
    You are HANALYSIS, a helpful and cautious personal health assistant. 
    Answer the user's questions based on their profile and the real-time data provided below. Be conversational and concise.

    **Current User Profile:**
    - Age: {user_profile.get('age', 'N/A')}
    - Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}
    - Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}

    **Current Environmental Data:**
    - Location: {weather.get('location', {}).get('name', 'N/A')}
    - Temperature: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C
    - Air Quality (US EPA Index): {air_quality.get('us_epa_index', 'N/A')}
    """
    
    # Construct the message history in the format the API expects
    messages = [{"role": "user", "parts": [{"text": system_instruction}]}]
    messages.append({"role": "model", "parts": [{"text": "Understood. I am ready to help with this context."}]})

    # Add the existing chat history
    for message in chat_history:
        messages.append({
            "role": message["role"],
            "parts": [{"text": message["content"]}]
        })
        
    return messages

# --- API ROUTES ---

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the HANALYSIS Flask Microservice!"})

# ... (The /api/trends and /api/analyze routes remain unchanged) ...
@app.route('/api/trends')
def get_trends():
    try:
        # ... implementation ...
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
    try:
        # ... implementation ...
        combined_data = request.get_json()
        if not combined_data: return jsonify({"error": "Invalid request body."}), 400
        prompt = create_analysis_prompt(combined_data)
        response = model.generate_content(prompt)
        response_text = response.text.strip().replace('```json', '').replace('```', '')
        analysis_json = json.loads(response_text)
        return jsonify(analysis_json)
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return jsonify({"error": "Failed to get analysis from the AI model."}), 500

# --- NEW: Chat Endpoint ---
@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Handles a turn in the conversation."""
    if not model:
        return jsonify({"error": "AI model is not configured."}), 503
    try:
        data = request.get_json()
        if not data or 'history' not in data:
            return jsonify({"error": "Invalid request: JSON with 'history' key required."}), 400
            
        # 1. Build the full message list with system instructions and history
        messages = create_chat_message_list(data)
        
        # 2. Generate the response
        response = model.generate_content(messages)
        
        # 3. Return the AI's reply
        return jsonify({"reply": response.text})

    except Exception as e:
        print(f"An error occurred during chat: {e}")
        return jsonify({"error": "Failed to get chat response from the AI model."}), 500


if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    app.run(debug=True, port=port)

