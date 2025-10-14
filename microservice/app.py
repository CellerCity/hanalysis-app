from flask import Flask, jsonify, request
# ... other imports remain the same ...
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
import json

# ... (Configuration remains the same) ...
load_dotenv()
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    genai.configure(api_key=GOOGLE_API_KEY)
    model_name = os.getenv('LLM_MODEL_NAME', 'models/gemini-pro')
    model = genai.GenerativeModel(model_name)
except Exception as e:
    model = None

app = Flask(__name__)
CORS(app)

# --- UPDATED Helper function for the LLM Prompt ---
def create_analysis_prompt(data):
    """Formats data for the one-shot dashboard analysis, now with anchoring."""
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    trends_data = data.get('trends', [])
    baseline_analysis = data.get('baselineAnalysis', None) # Get the new baseline data

    home_location = user_profile.get('location', 'N/A')
    current_location = weather.get('location', {}).get('name', 'N/A')

    # --- NEW: Format the baseline information for the prompt ---
    baseline_prompt_part = "No baseline is available. Calculate the risk from scratch."
    if baseline_analysis:
        baseline_prompt_part = f"""You have already determined that the baseline risk for a generic healthy person in this environment is {baseline_analysis.get('riskScore')}/10 ({baseline_analysis.get('riskLevel')}), with the summary: '{baseline_analysis.get('summary')}'. """

    # ... (trends summary logic remains the same) ...
    trends_summary = "No significant trend data."
    if trends_data and isinstance(trends_data, list) and trends_data:
        latest = trends_data[-1]
        points = [f"'{k}' interest: {v}/100" for k, v in latest.items() if k != 'date']
        if points: trends_summary = ", ".join(points) + "."

    # --- THE FIX: The prompt is now much more detailed and directive ---
    prompt = f"""
    You are HANALYSIS, a health risk analyst. Your response MUST be a clean JSON object with "riskScore" (integer 1-10), "riskLevel", "summary", and "recommendations".
    
    TASK: First, consider the baseline environmental risk. Then, adjust the risk score and recommendations based on the specific user's profile. Explain your reasoning in the summary.

    **1. Environmental Baseline:**
    {baseline_prompt_part}

    **2. Specific User Profile:**
    - Age: {user_profile.get('age', 'N/A')}
    - Home Location: {home_location}
    - Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}
    - Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}

    **3. Current Environmental Data:**
    - Current Location: {current_location}
    - Temperature: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C
    - AQI: {air_quality.get('us_epa_index', 'N/A')}
    
    **4. Local Search Trends:**
    - {trends_summary}

    Now, generate the final, adjusted JSON analysis for this specific user.
    """
    return prompt

# ... (rest of app.py remains the same) ...
@app.route('/api/analyze', methods=['POST'])
def analyze_health_data():
    # ... logic is unchanged ...
    if not model: return jsonify({"error": "AI model not configured."}), 503
    try:
        combined_data = request.get_json()
        prompt = create_analysis_prompt(combined_data)
        response = model.generate_content(prompt)
        response_text = response.text.strip().replace('```json', '').replace('```', '')
        return jsonify(json.loads(response_text))
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return jsonify({"error": "Failed to get analysis from AI model."}), 500
# ... (other routes and main block) ...
def create_chat_message_list(data):
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    chat_history = data.get('history', [])
    system_instruction = f"""
    You are HANALYSIS, a helpful and cautious personal health assistant. Answer the user's questions based on their profile and the real-time data provided below. Be conversational and concise.
    Current User Profile: Age {user_profile.get('age', 'N/A')}, Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}, Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}.
    Current Environmental Data: Location: {weather.get('location', {}).get('name', 'N/A')}, Temp: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C, AQI: {air_quality.get('us_epa_index', 'N/A')}.
    """
    messages = [{"role": "user", "parts": [{"text": system_instruction}]}]
    messages.append({"role": "model", "parts": [{"text": "Understood. I am ready to help with this context."}]})
    for message in chat_history:
        messages.append({"role": "user" if message["role"] == "user" else "model", "parts": [{"text": message["content"]}]})
    return messages
@app.route('/')
def index(): return jsonify({"message": "Welcome!"})
@app.route('/api/trends')
def get_trends(): return jsonify([]) # Disabled for now
@app.route('/api/chat', methods=['POST'])
def handle_chat():
    if not model: return jsonify({"error": "AI model is not configured."}), 503
    try:
        data = request.get_json()
        messages = create_chat_message_list(data)
        response = model.generate_content(messages)
        return jsonify({"reply": response.text})
    except Exception as e:
        print(f"An error during chat: {e}")
        return jsonify({"error": "Failed to get chat response."}), 500
if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 8000))
    app.run(debug=True, port=port)

