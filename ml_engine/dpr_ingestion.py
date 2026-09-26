"""
DRISHTI Document-to-Telemetry (D2T) Extraction Engine
Author: Adrian Roy Williams
Role: Ingests raw PDF Daily Progress Reports (DPRs), extracts structured MoSPI metrics, 
and flags low-fidelity bureaucratic language for frontend micro-interrogation.
"""

import google.generativeai as genai
import json
import os
import time

# Initialize the Gemini API (Ensure GEMINI_API_KEY is in your environment variables)
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def process_daily_report(pdf_file_path: str):
    """
    Uploads a raw DPR PDF to Gemini 1.5 Pro and forces a strict JSON output 
    that powers the Nodal Officer's Verification UI.
    """
    
    # 1. Upload the document to the Gemini File API
    print(f"Uploading {pdf_file_path} to secure AI staging...")
    report_file = genai.upload_file(path=pdf_file_path, display_name="Daily Progress Report")
    
    # Wait briefly for the file to process on Google's servers
    while report_file.state.name == 'PROCESSING':
        time.sleep(2)
        report_file = genai.get_file(report_file.name)

    # 2. Configure the Gemini 1.5 Pro Model for strict JSON output
    model = genai.GenerativeModel(
        model_name='gemini-1.5-pro',
        generation_config={
            "temperature": 0.0, # 0.0 forces deterministic, analytical extraction
            "response_mime_type": "application/json" 
        }
    )
    
    # 3. The Auditor System Prompt
    system_instruction = """
    You are an elite infrastructure auditor for the DRISHTI framework.
    Analyze the provided Daily Progress Report (DPR).
    
    TASK 1: Extract all quantifiable physical and financial metrics.
    TASK 2: Identify any reported delays, stoppages, or bottlenecks.
    TASK 3: Evaluate the quality of the bottleneck description. If the language is vague 
    (e.g., "local issues", "bad weather", "material delay", "clearance pending"), you MUST 
    flag it as low fidelity and generate the necessary categories for a follow-up interrogation.

    Return EXACTLY this JSON schema:
    {
      "metadata": {
        "report_date": "YYYY-MM-DD",
        "project_id": "string",
        "submitted_by": "string"
      },
      "extracted_metrics": {
        "daily_physical_progress_pct": "float",
        "labor_headcount": "integer"
      },
      "bottlenecks": [
        {
          "raw_text": "string (the exact phrase from the PDF)",
          "is_vague": "boolean",
          "interrogation_required": "boolean",
          "ui_prompt": "string (What should the UI ask the officer? e.g., 'Please specify the exact nature of the local issue.')",
          "required_dropdown_categories": ["string", "string"] (e.g., ["Land Dispute", "Labor Strike", "Political Rally"])
        }
      ]
    }
    """

    # 4. Execute the Multimodal Extraction
    print("Executing Cognitive Extraction and Fidelity Audit...")
    response = model.generate_content([report_file, system_instruction])
    
    # Clean up the file from Google's servers for data security
    genai.delete_file(report_file.name)
    
    # 5. Parse and return the JSON payload for the frontend
    try:
        telemetry_data = json.loads(response.text)
        return telemetry_data
    except json.JSONDecodeError:
        raise ValueError("AI failed to return valid JSON schema.")

# ==========================================
# Example Usage 
# ==========================================
if __name__ == "__main__":
    # Simulate processing a PDF submitted by a Nodal Officer
    # mock_pdf_path = "sample_dpr_navi_mumbai_airport.pdf"
    # result = process_daily_report(mock_pdf_path)
    # print(json.dumps(result, indent=2))
    pass
