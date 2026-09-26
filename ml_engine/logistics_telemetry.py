"""
DRISHTI Autonomous Freight & Logistics Telemetry
Author: Adrian Roy Williams
Role: Intercepts FASTag RFID pings and GST E-Way Bill data to calculate 
transit deviations and forecast downstream construction halts.
"""

import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timezone
from supabase import create_client, Client

app = FastAPI(title="DRISHTI Supply Chain Telemetry")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# Pydantic Schemas for Incoming Data
# ==========================================
class EWayBillRegistry(BaseModel):
    eway_bill_no: str
    project_id: str
    material_type: str
    quantity_tons: float
    origin_pin: str
    destination_pin: str
    estimated_transit_hours: int

class FastagTransitPing(BaseModel):
    vehicle_rc: str
    eway_bill_no: str
    toll_plaza_id: str
    timestamp: str
    status: str # e.g., 'CLEARED', 'DETAINED'

# ==========================================
# Background ML Processing Task
# ==========================================
def calculate_downstream_impact(eway_bill_no: str, project_id: str, delay_hours: float):
    """
    Triggers the downstream DRISHTI engine to recalculate the Burn-to-Yield 
    ratio and update the spatial Digital Twin.
    """
    # 1. Fetch current project telemetry
    risk_data = supabase.table('project_risk_assessments').select('*').eq('project_id', project_id).execute()
    if not risk_data.data:
        return

    # 2. Heuristic/ML Adjustment: 
    # A 48-hour delay in structural steel might cascade into a 2-week project delay.
    severity_multiplier = 1.5 if delay_hours > 24 else 1.1
    new_anomaly_score = float(risk_data.data[0]['anomaly_score']) * severity_multiplier
    
    status_render = 'BlinkingRed' if delay_hours > 48 else 'Amber'

    # 3. Update the AI Risk Matrix
    supabase.table('project_risk_assessments').upsert({
        'project_id': project_id,
        'ai_risk_score': 'Critical' if delay_hours > 48 else 'High',
        'anomaly_score': new_anomaly_score,
        'render_status': status_render,
        'cascading_delay_prediction': f"Supply Chain Severance: Material transit delayed by {delay_hours} hours. Downstream construction halt imminent.",
        'last_updated': datetime.now(timezone.utc).isoformat()
    }).execute()

    # 4. Burn this into the Immutable Ledger for PMG visibility
    supabase.table('inter_departmental_ledger').insert({
        'project_id': project_id,
        'action_type': 'SUPPLY_CHAIN_SEVERANCE_DETECTED',
        'initiated_by': 'FASTAG_LOGISTICS_GATEWAY',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'notes': f"Critical material convoy (E-Way: {eway_bill_no}) stalled. Alerting Nodal Officer and PMG."
    }).execute()


# ==========================================
# API Endpoints
# ==========================================
@app.post("/api/v1/logistics/register-eway-bill")
async def register_freight(payload: EWayBillRegistry):
    """
    Called when a contractor generates a GST E-Way bill for a mega-project.
    Registers the expected transit timeline in DRISHTI.
    """
    supabase.table('freight_tracking').insert({
        'eway_bill_no': payload.eway_bill_no,
        'project_id': payload.project_id,
        'material_type': payload.material_type,
        'dispatch_time': datetime.now(timezone.utc).isoformat(),
        'target_arrival_hours': payload.estimated_transit_hours,
        'status': 'IN_TRANSIT'
    }).execute()
    
    return {"status": "TRACKING_INITIATED"}

@app.post("/api/v1/logistics/fastag-ping")
async def process_toll_ping(payload: FastagTransitPing, background_tasks: BackgroundTasks):
    """
    Called every time the transport truck passes an NHAI toll plaza.
    """
    # 1. Retrieve the registered freight baseline
    freight_req = supabase.table('freight_tracking').select('*').eq('eway_bill_no', payload.eway_bill_no).execute()
    if not freight_req.data:
        raise HTTPException(status_code=404, detail="E-Way Bill not registered in DRISHTI.")
        
    freight_data = freight_req.data[0]
    
    # 2. Update the latest known location
    supabase.table('freight_tracking').update({
        'last_known_toll': payload.toll_plaza_id,
        'last_ping_time': payload.timestamp,
        'status': payload.status
    }).eq('eway_bill_no', payload.eway_bill_no).execute()

    # 3. Deviation Engine Calculation
    dispatch_time = datetime.fromisoformat(freight_data['dispatch_time'].replace('Z', '+00:00'))
    current_time = datetime.fromisoformat(payload.timestamp.replace('Z', '+00:00'))
    hours_in_transit = (current_time - dispatch_time).total_seconds() / 3600

    target_hours = freight_data['target_arrival_hours']
    
    # If the truck has been in transit 20% longer than the absolute maximum ETA
    # OR if the toll plaza specifically flags the truck as 'DETAINED' (e.g. RTO check)
    if hours_in_transit > (target_hours * 1.2) or payload.status == 'DETAINED':
        delay_variance = hours_in_transit - target_hours
        
        # Offload the heavy database updates and ML triggers to a background thread
        # so the toll plaza API gets an instant 200 OK response.
        background_tasks.add_task(
            calculate_downstream_impact, 
            payload.eway_bill_no, 
            freight_data['project_id'], 
            delay_variance
        )
        return {"status": "DEVIATION_DETECTED", "action": "CASCADING_ALERTS_TRIGGERED"}

    return {"status": "NOMINAL_TRANSIT"}
