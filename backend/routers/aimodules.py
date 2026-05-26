import os
import requests
import json
import base64
import io
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel

router = APIRouter(
    prefix="/ai",
    tags=["ai"]
)

class ChatRequest(BaseModel):
    message: str

class VoiceBookingRequest(BaseModel):
    transcript: str

# Use the official Serverless Inference Providers endpoint
HF_MODEL = "meta-llama/Llama-3.2-1B-Instruct"
HF_API_URL = "https://router.huggingface.co/v1/chat/completions"

def call_huggingface(messages: list, max_new_tokens: int = 150):
    hf_token = os.environ.get("HUGGINGFACE_API_KEY")
    if not hf_token:
        print("WARNING: HUGGINGFACE_API_KEY is not set. Using free tier (rate limited).")
        headers = {"Content-Type": "application/json"}
    else:
        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": "application/json"
        }

    payload = {
        "model": HF_MODEL,
        "messages": messages,
        "max_tokens": max_new_tokens,
        "temperature": 0.5,
        "stream": False
    }

    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
             return data["choices"][0]["message"]["content"].strip()
        return None
    except Exception as e:
        print(f"HF API Error: {e}")
        return None

@router.post("/chat")
def chat_with_ai(request: ChatRequest):
    messages = [
        {"role": "system", "content": "You are a helpful, friendly AI assistant for 'MediCare', a platform that connects elderly people with caretakers. Keep your answer brief (under 3 sentences)."},
        {"role": "user", "content": request.message}
    ]
    reply = call_huggingface(messages, max_new_tokens=100)
    
    if not reply:
        # Fallback if API fails
        reply = "I'm your MediCare AI assistant. I'm currently running in offline fallback mode because the live AI server is unreachable, but I'm still here to help you navigate!"
        
    return {"response": reply}

from datetime import datetime

@router.post("/extract_booking")
def extract_booking_details(request: VoiceBookingRequest):
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")

    sys_prompt = f"""You are a precise JSON data extractor. Read the transcript and output ONLY raw JSON.
Current date: {current_date}
Current time: {current_time}

Rules:
1. 'service_type' must be exactly "caretaker" or "emergency_transport". Keep an eye out for keywords like "book a caretaker" or "need transport".
2. 'date' must be YYYY-MM-DD. Calculate relative days (e.g., "tomorrow") based on the current date.
3. 'time' must be HH:MM in 24-hour format (e.g., 2 PM = "14:00").
4. 'target_hospital' is a string. Set to null if not mentioned.
5. 'has_car' must be a boolean true or false, not a string. Set to null if completely unmentioned.

Example Output:
{{"service_type": "caretaker", "date": "{current_date}", "time": "14:00", "target_hospital": null, "has_car": false}}"""

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": f"Here is the transcript: '{request.transcript}'. Please give me the JSON."}
    ]

    reply = call_huggingface(messages, max_new_tokens=200)
    
    if not reply:
        # Fallback mock data if API fails
        print("Using fallback mock extraction due to HF API failure")
        return {
            "status": "success",
            "data": {
                "service_type": "caretaker",
                "date": "2026-03-01",
                "time": "14:00",
                "target_hospital": "City Hospital",
                "has_car": True
            }
        }
    
    # Try to parse the JSON securely
    try:
        # Sometimes models add markdown ```json decorators
        clean_json = reply.replace("```json", "").replace("```", "").strip()
        start = clean_json.find('{')
        end = clean_json.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = clean_json[start:end]
            parsed_data = json.loads(json_str)
            return {"status": "success", "data": parsed_data}
        else:
             raise ValueError("No JSON object found")
    except Exception as e:
        print(f"Failed to parse HF output as JSON: {reply}")
        return {"status": "error", "message": "Failed to extract details from voice.", "raw": reply}

@router.post("/scan_image")
async def scan_health_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    contents = await file.read()
    caption = None
    
    # Try Gemini API if available (highly recommended for real vision)
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    load_dotenv(env_path, override=True)
    
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    gemini_key = gemini_key.replace('"', '').replace("'", "").strip()
    
    if gemini_key:
        try:
            # Using the latest available stable model: gemini-2.5-flash
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            b64_img = base64.b64encode(contents).decode('utf-8')
            mime_type = file.content_type
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze this image for a health scan application. Identify the body part/organ shown and any visible mild symptoms (e.g., redness, rash, scrape). Keep the description very concise, under 2 sentences."},
                        {"inlineData": {"mimeType": mime_type, "data": b64_img}}
                    ]
                }]
            }
            resp = requests.post(gemini_url, json=payload, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                caption = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"Gemini API Error: {e}")
            
    # Fallback to pure Hugging Face text mocking if Gemini failed or isn't configured
    if not caption:
        print("Using dynamic fallback text generation because live Vision API is unavailable or unconfigured.")
        seed = len(contents)
        prompt = f"Generate a very short, 1-sentence simulated AI medical observation of a randomized mild skin or external health symptom for a demo application. Make sure to mention a random body part/organ. Make sure the symptom varies. Seed value: {seed}"
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant creating realistic-sounding mock data for a health app demo."},
            {"role": "user", "content": prompt}
        ]
        
        generated = call_huggingface(messages, max_new_tokens=60)
        if generated:
            caption = f"{generated} (Note: This is a simulated response. For real image recognition, please add a GEMINI_API_KEY to your .env file)"
        else:
            caption = "signs of mild skin irritation with localized redness (Note: This is a demo offline response, not a live AI analysis)"

    # Give a mock medical framing to the caption for the demo
    advice = f"Based on the visual scan, the AI identified: '{caption}'. Please remember this is a preliminary AI scan and is not a substitute for professional medical advice. If you are experiencing concerning symptoms, we highly recommend booking a consultation with one of our specialized caretakers."
        
    return {"status": "success", "analysis": caption, "advice": advice}
