"""
DRISHTI Feature Engineering & Vectorization Engine
Author: Adrian Roy Williams
Role: Translates raw MoSPI text telemetry into weighted numerical vectors for Isolation Forest ingestion.
Updated for Advanced MoSPI Parameters (Cost Overrun, Time Overrun, Multi-Bottlenecks).
"""

from datetime import datetime

# Proprietary Severity Matrix for Indian Infrastructure Bottlenecks
SEVERITY_COEFFICIENTS = {
    "land_acquisition_dispute": 1.5,
    "environmental_clearance": 1.2,
    "utility_shifting": 0.8,
    "law_and_order": 1.4,
    "fund_constraints": 1.1,
    "equipment_shortage": 0.4,
    "none": 0.0
}

AGENCY_RISK_MULTIPLIERS = {
    "State": 1.5,    # Historically higher bureaucratic friction
    "Joint": 1.2,
    "Private": 1.1,
    "Central": 1.0   # Baseline
}

URGENCY_KEYWORDS = {
    1.0: ["protest", "court stay", "litigation", "halted", "strike"],
    0.6: ["delayed", "waiting", "shortage", "pending"],
    0.0: ["progressing", "resumed", "clear", "on track"]
}

def vectorize_project_telemetry(raw_json_payload):
    """
    Ingests raw JSON from the DRISHTI-CRIP API and returns a normalized mathematical vector.
    """
    current_date = datetime.utcnow()
    
    # 1. Calculate Time Overrun Vector
    orig_date_str = raw_json_payload.get('original_commission_date')
    ant_date_str = raw_json_payload.get('anticipated_commission_date')
    
    v_time_overrun = 0.0
    if orig_date_str and ant_date_str:
        orig_date = datetime.fromisoformat(orig_date_str.replace("Z", "+00:00"))
        ant_date = datetime.fromisoformat(ant_date_str.replace("Z", "+00:00"))
        # Positive days means delay
        days_delayed = (ant_date - orig_date).days
        v_time_overrun = max(0, days_delayed) / 30.0 # Convert to months
        
    # 2. Calculate Cost Overrun Index
    try:
        orig_cost = float(raw_json_payload.get('original_cost', 1.0)) or 1.0
        ant_cost = float(raw_json_payload.get('anticipated_cost', orig_cost))
        v_cost_overrun = max(0, (ant_cost - orig_cost) / orig_cost)
    except (ValueError, TypeError):
        v_cost_overrun = 0.0
        
    # 3. Calculate Multi-Factor Bottleneck Severity
    bottlenecks = raw_json_payload.get('bottlenecks', [])
    if isinstance(bottlenecks, str):
        bottlenecks = [bottlenecks] # Fallback if single string
        
    v_bottleneck = sum(SEVERITY_COEFFICIENTS.get(b, 0.1) for b in bottlenecks)
    
    # 4. Apply Agency Multiplier
    agency = raw_json_payload.get('implementing_agency_level', 'State')
    agency_multiplier = AGENCY_RISK_MULTIPLIERS.get(agency, 1.0)
    
    # 5. Burn-to-Yield (Physical Progress vs Cost)
    physical_pct = float(raw_json_payload.get('physical_progress_pct', 0.01)) or 0.01
    
    # 6. NLP Urgency Extraction
    officer_notes = str(raw_json_payload.get('nodal_officer_remarks', '')).lower()
    v_urgency = 0.0
    
    for score, words in URGENCY_KEYWORDS.items():
        if any(word in officer_notes for word in words):
            v_urgency = score
            break
            
    # 7. Construct the Final Proprietary Feature Vector
    feature_vector = [
        v_time_overrun * agency_multiplier, # Vector 1: Agency-weighted Time Overrun
        v_cost_overrun * agency_multiplier, # Vector 2: Agency-weighted Cost Overrun
        v_bottleneck,                       # Vector 3: Compound Bottleneck Severity
        v_urgency,                          # Vector 4: Extracted Text Urgency
        physical_pct                        # Vector 5: Physical Progress
    ]
    
    return feature_vector
