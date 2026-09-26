"""
DRISHTI LLM Project Intelligence Assistant (Outcome H)
Author: Adrian Roy Williams
Role: Parses unstructured telemetry (Nodal Officer remarks, field notes) 
and extracts structured intelligence briefings using Generative AI.
"""

import os
import json

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("Warning: google-genai library not found. Falling back to Mock LLM Engine.")

def generate_intelligence_briefing(project_data):
    """
    Ingests raw project telemetry and uses an LLM to generate an executive briefing.
    """
    system_instruction = (
        "You are an expert infrastructure auditor for the Government of India (MoSPI). "
        "Analyze the provided project telemetry and unstructured field remarks. "
        "Your task is to extract hidden sentiments, identify unlisted risks, and generate "
        "a concise 2-sentence executive briefing for the PMG Official. "
        "Format your output strictly as a JSON object with three keys: "
        "'hidden_sentiment', 'unlisted_risks' (list of strings), and 'executive_briefing'."
    )
    
    prompt = f"Project Telemetry:\n{json.dumps(project_data, indent=2)}"
    
    # Check if API Key exists and GenAI is available
    if GENAI_AVAILABLE and os.environ.get("GEMINI_API_KEY"):
        try:
            client = genai.Client()
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"LLM API Error: {e}. Falling back to mock engine.")
    
    # Mock LLM Engine Fallback for Hackathon environments without internet/API keys
    print("Running Mock LLM Intelligence Engine...")
    remarks = str(project_data.get('nodal_officer_remarks', '')).lower()
    
    sentiment = "Neutral"
    risks = ["Systemic inefficiency"]
    if "protest" in remarks or "litigation" in remarks:
        sentiment = "Highly Negative (Friction/Hostility)"
        risks = ["Imminent Local Law & Order Escalation", "Contractor Abandonment Risk"]
    elif "delay" in remarks or "waiting" in remarks:
        sentiment = "Frustrated (Bureaucratic Blockage)"
        risks = ["Supply Chain Collapse", "Cost Inflation via Holding Penalty"]
        
    return {
        "hidden_sentiment": sentiment,
        "unlisted_risks": risks,
        "executive_briefing": f"The project exhibits signs of {sentiment.lower()} based on field notes. Immediate PMG escalation is recommended to mitigate the identified unlisted risks."
    }

if __name__ == "__main__":
    mock_payload = {
        "project_id": "NHAI-DEMO-01",
        "physical_progress_pct": 15,
        "anticipated_cost": 750.0,
        "implementing_agency_level": "State",
        "bottlenecks": ["land_acquisition_dispute", "environmental_clearance"],
        "nodal_officer_remarks": "We are facing severe litigation and local protests that have completely halted work. The contractor is threatening to pull out."
    }
    
    print(json.dumps(generate_intelligence_briefing(mock_payload), indent=4))
