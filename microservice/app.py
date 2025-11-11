from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pytrends.request import TrendReq
import pandas as pd
import google.generativeai as genai
import json
from pymongo import MongoClient, TEXT # Import pymongo

# ... (MongoDB and Gemini Configuration remain the same) ...
load_dotenv()
try:
    MONGODB_URI = os.getenv("MONGODB_URI")
    DB_NAME = "hanalysis-db"
    COLLECTION_NAME = "health_facts"
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client[DB_NAME]
    health_facts_collection = db[COLLECTION_NAME]
    print(f"--- Successfully connected to MongoDB collection '{COLLECTION_NAME}' ---")
except Exception as e:
    print(f"FATAL ERROR: Failed to connect to MongoDB. {e}")
    health_facts_collection = None
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file.")
    genai.configure(api_key=GOOGLE_API_KEY)
    model_name = os.getenv('LLM_MODEL_NAME', 'models/gemini-pro')
    print(f"--- Using Gemini Model: {model_name} ---")
    model = genai.GenerativeModel(model_name)
except Exception as e:
    print(f"FATAL ERROR: Failed to configure Google AI. {e}")
    model = None
app = Flask(__name__)
CORS(app)


# --- (create_analysis_prompt function remains the same) ---
def create_analysis_prompt(data):
    # ... (function is unchanged) ...
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    trends_data = data.get('trends', [])
    baseline_analysis = data.get('baselineAnalysis', None)
    home_location = user_profile.get('location', 'N/A')
    current_location = weather.get('location', {}).get('name', 'N/A')
    baseline_prompt_part = "No baseline is available."
    if baseline_analysis:
        baseline_prompt_part = f"Baseline risk for a generic person is {baseline_analysis.get('riskScore')}/10."
    trends_summary = "No significant trend data."
    if trends_data and isinstance(trends_data, list) and trends_data:
        latest = trends_data[-1]
        points = [f"'{k}': {v}" for k, v in latest.items() if k != 'date']
        if points: trends_summary = ", ".join(points) + "."
    return f"""
    You are HANALYSIS, a health risk analyst. Your response MUST be a clean JSON object with four keys: "riskScore", "riskLevel", "summary", and "recommendations".
    The "riskScore" MUST be an integer between 1 and 10, where 10 is the highest possible risk.
    The "recommendations" value MUST be an array of simple, human-readable strings.
    
    TASK: First, consider the baseline environmental risk. Then, adjust the risk score and recommendations based on the specific user's profile and local search trends.
    
    1. Environmental Baseline: {baseline_prompt_part}
    2. Specific User Profile: Age {user_profile.get('age', 'N/A')}, Home: {home_location}, Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}, Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}.
    3. Current Environmental Data: Current Location: {current_location}, Temp: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C, AQI: {air_quality.get('us_epa_index', 'N/A')}.
    4. Local Search Interest Trends: {trends_summary}
    
    Now, generate the final, adjusted JSON analysis for this specific user.
    """

def create_chat_message_list(data, retrieved_context):
    user_profile = data.get('userProfile', {})
    weather = data.get('weather', {})
    air_quality = weather.get('air_quality', {})
    chat_history = data.get('history', [])

    # --- MODIFICATION 1: Simplify context ---
    # We strip all "fact sheet" language. This is just the raw
    # information and its source for the AI's internal use.
    context_text = "No additional context."
    context_source = "Internal Knowledge" # Default source
    if retrieved_context:
        context_text = retrieved_context.get('chunk_text', 'No text found.')
        # Get the source (e.g., "WHO") for citation, per your request
        context_source = retrieved_context.get('source_url', 'trusted sources') 

    # --- MODIFICATION 2: Rebuild the system_instruction ---
    # This is now a much stricter "prompt-first" instruction.
    system_instruction = f"""
    You are HANALYSIS, a helpful and cautious personal health assistant.

    **--- YOUR TASK ---**
    Answer the user's last question.
    Your answer must be based *only* on the information provided below (User Profile, Environment, Internal Knowledge).

    **--- 1. OUTPUT RULES (MANDATORY) ---**
    * Your entire response MUST be plain text.
    * DO NOT use any markdown (no `*`, `**`, `#`, or lists).
    * DO NOT use LaTeX or special formatting.
    * Write in simple, clear sentences.

    **--- 2. SAFETY RULES (MANDATORY) ---**
    * You are an AI assistant, NOT a medical professional.
    * DO NOT provide a medical diagnosis.
    * DO NOT prescribe specific medications or dosages.
    * You MAY discuss general information or light, over-the-counter suggestions ONLY if they are explicitly mentioned in the "Internal Knowledge" section.
    * If you use information from the "Internal Knowledge", you can cite its source (e.g., "According to {context_source},...").
    * You MUST NOT mention the words "fact sheet" or "internal knowledge".
    * Your response MUST end with this exact disclaimer: "Please remember, this is for informational purposes only. Consult a healthcare professional for medical advice."

    **--- 3. DATA FOR YOUR RESPONSE ---**

    **User Profile:**
    - Age: {user_profile.get('age', 'N/A')}
    - Conditions: {', '.join(user_profile.get('healthProfile', {}).get('preExistingConditions', [])) or 'None'}
    - Allergies: {', '.join(user_profile.get('healthProfile', {}).get('allergies', [])) or 'None'}

    **Environmental Data:**
    - Location: {weather.get('location', {}).get('name', 'N/A')}
    - Temperature: {weather.get('weather', {}).get('temperature_celsius', 'N/A')}°C
    - AQI: {air_quality.get('us_epa_index', 'N/A')}

    **Internal Knowledge (Source: {context_source}):**
    {context_text}

    **--- 4. CONVERSATION ---**
    [The user's previous messages will be provided after this instruction.]

    Now, answer the user's last question, following all rules.
    """

    # --- MODIFICATION 3: Message list structure ---
    # The system instruction is the first "user" message, as before.
    messages = [{"role": "user", "parts": [{"text": system_instruction}]}]
    
    # The "Understood" response helps lock in the instructions.
    messages.append({"role": "model", "parts": [{"text": "Understood. I will answer the user's last question following all output and safety rules. I will provide a plain text answer and include the required medical disclaimer."}]})
    
    # Append the actual chat history
    for message in chat_history:
        messages.append({
            "role": "user" if message["role"] == "user" else "model",
            "parts": [{"text": message["content"]}]
        })
    
    return messages

# --- (All other API routes remain the same) ---
@app.route('/')
def index():
    return jsonify({"message": "Welcome to the HANALYSIS Flask Microservice!"})
@app.route('/api/trends')
def get_trends():
    return jsonify([]) # Keep trends disabled



@app.route('/api/analyze', methods=['POST'])
def analyze_health_data():
    if not model: return jsonify({"error": "AI model is not configured."}), 503
    try:
        combined_data = request.get_json()
        prompt = create_analysis_prompt(combined_data)
        response = model.generate_content(prompt)
        response_text = response.text.strip().replace('```json', '').replace('```', '')
        return jsonify(json.loads(response_text))
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return jsonify({"error": "Failed to get analysis from AI model."}), 500

# --- UPDATED: Chat Endpoint with RAG ---
@app.route('/api/chat', methods=['POST'])
def handle_chat():
    if not model or health_facts_collection is None:
        return jsonify({"error": "AI model or database is not configured."}), 503
    try:
        data = request.get_json()
        if not data or 'history' not in data:
            return jsonify({"error": "Invalid request: 'history' key required."}), 400
        
        user_question = data['history'][-1]['content']
        
        retrieved_context = None
        try:
            # First, try to find a perfect match on the 'topic' field
            # This is great for one-word queries like "Dengue"
            # We use a case-insensitive regex for flexibility
            search_result = health_facts_collection.find_one(
                { "topic": { "$regex": f"^{user_question}$", "$options": "i" } }
            )
            
            if not search_result:
                # If no topic match, fallback to our full-text search on chunk_text
                search_result = health_facts_collection.find_one(
                    { "$text": { "$search": user_question } }
                )

            # --- THE FIX: Remove the strict score check ---
            # If the database found any result, we'll use it.
            if search_result:
                retrieved_context = search_result
                print(f"[RAG DEBUG] Found relevant context: {retrieved_context.get('topic')}")
            else:
                print("[RAG DEBUG] No specific context found. Using general knowledge.")
        except Exception as db_e:
            print(f"Error during context retrieval: {db_e}")
        
        messages = create_chat_message_list(data, retrieved_context)
        response = model.generate_content(messages)
        
        if not response.parts:
            return jsonify({"reply": "I'm sorry, I was unable to generate a response. Please try again."})
        
        return jsonify({"reply": response.text})

    except Exception as e:
        print(f"An error occurred during chat: {e}")
        return jsonify({"error": "Failed to get chat response from the AI model."}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=True, port=port)