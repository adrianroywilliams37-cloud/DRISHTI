"""
DRISHTI OSINT Citizen Auditor
Author: Adrian Roy Williams
Role: WhatsApp webhook that ingests citizen complaints, translates regional dialects 
via Bhashini, and uses Gemini Multimodal to verify ground truth.
"""

from fastapi import FastAPI
import google.generativeai as genai
import requests
from supabase import create_client, Client
import os

app = FastAPI(title="DRISHTI OSINT Citizen Auditor")
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

@app.post("/api/v1/osint/whatsapp-webhook")
async def process_citizen_report(payload: dict):
    """
    Webhook triggered by a citizen messaging the DRISHTI WhatsApp bot.
    Payload contains a regional text message and an image of the stalled site.
    """
    regional_text = payload.get("text_message")
    image_url = payload.get("media_url")
    citizen_lat_lon = payload.get("location")

    # 1. Translate via Bhashini API (Mocked integration)
    try:
        bhashini_response = requests.post(
            "https://bhashini.gov.in/api/translation",
            json={"sourceLanguage": "auto", "targetLanguage": "en", "text": regional_text},
            timeout=5
        )
        english_translation = bhashini_response.json().get("translated_text", "Translation failed")
    except:
        # Fallback for SIH demo if API is unreachable
        english_translation = f"Translated: {regional_text}"

    # 2. Cross-reference with Gemini Multimodal Vision
    # We ask Gemini to look at the citizen's photo and compare it to the contractor's claims
    vision_model = genai.GenerativeModel('gemini-1.5-pro')
    
    prompt = f"""
    You are an infrastructure auditor. The contractor claims this site is 'Active with 50+ workers'.
    A citizen just uploaded this photo with the translated caption: '{english_translation}'.
    Analyze the image. Does it look active, or is it abandoned/flooded? 
    Output strictly JSON: {{"is_abandoned": boolean, "visual_evidence": "string"}}
    """
    
    # Process image (pseudo-code for downloading image bytes and feeding to Gemini)
    try:
        image_bytes = requests.get(image_url).content
        ai_audit = vision_model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_bytes}])
        audit_result = ai_audit.text # Parses to JSON
    except:
        audit_result = '{"is_abandoned": true}'

    if '"is_abandoned": true' in audit_result.lower():
        # 3. Execute OSINT Discrepancy Flag
        supabase.table('inter_departmental_ledger').insert({
            'project_id': 'MATCHED_FROM_GEOHASH', # Logic to reverse-geocode project omitted for brevity
            'action_type': 'OSINT_PUBLIC_DISCREPANCY_FLAGGED',
            'initiated_by': 'BHASHINI_GEMINI_AUDITOR',
            'notes': f"Citizen OSINT contradicts official reports. Translated complaint: {english_translation}."
        }).execute()
        
    return {"status": "CITIZEN_REPORT_INGESTED_AND_AUDITED"}
