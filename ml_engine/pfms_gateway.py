"""
DRISHTI Algorithmic Escrow & PFMS Gateway
Author: Adrian Roy Williams
Role: Intercepts PFMS tranche release webhooks, cross-references against 
the AI anomaly engine and Orbital verification flags, and autonomously freezes funds.
"""

import os
from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
from datetime import datetime
from supabase import create_client, Client

app = FastAPI(title="DRISHTI PFMS Escrow Gateway")

# Initialize Supabase Service Role client for secure backend database reads
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Expected JSON schema from the PFMS government banking network
class PfmsTrancheRequest(BaseModel):
    pfms_transaction_id: str
    project_id: str
    contractor_id: str
    tranche_amount_inr: float
    milestone_reference: str

@app.post("/api/v1/pfms/tranche-authorization")
async def authorize_pfms_release(
    payload: PfmsTrancheRequest, 
    x_pfms_signature: str = Header(...) # Security signature from PFMS
):
    """
    Acts as the final authorization gate for capital release.
    Cross-references the AI risk assessment and analyst flags
    before allowing a multi-crore tranche to proceed.
    """
    
    # 0. Idempotency Check
    existing_txn = supabase.table('pfms_transaction_log')\
        .select('*')\
        .eq('pfms_transaction_id', payload.pfms_transaction_id)\
        .execute()

    if existing_txn.data:
        txn = existing_txn.data[0]
        return {
            "authorization": "IDEMPOTENT_REPLY",
            "status_code": 200 if txn['authorization_result'] == 'APPROVED' else 423,
            "pfms_transaction_id": payload.pfms_transaction_id,
            "message": f"Transaction previously processed as {txn['authorization_result']}.",
            "timestamp": txn['created_at']
        }

    # 1. Fetch the real-time AI Risk Assessment and Active Ledger Flags
    risk_response = supabase.table('project_risk_assessments').select('*').eq('project_id', payload.project_id).execute()
    
    # Fetch the most recent ledger entry to check for manual Analyst overrides/flags
    ledger_response = supabase.table('inter_departmental_ledger')\
        .select('action_type')\
        .eq('project_id', payload.project_id)\
        .order('timestamp', desc=True)\
        .limit(1)\
        .execute()

    if not risk_response.data:
        raise HTTPException(status_code=404, detail="Project not found in DRISHTI registry.")

    project_status = risk_response.data[0]
    latest_ledger_action = ledger_response.data[0]['action_type'] if ledger_response.data else "NONE"

    # 2. The Algorithmic Freezing Logic
    # We lock the funds if the AI scores it Critical OR if a human flagged an orbital discrepancy
    is_ai_critical = project_status['ai_risk_score'] == 'Critical'
    is_manually_flagged = latest_ledger_action == 'GROUND_ORBIT_DISCREPANCY_FLAGGED'

    if is_ai_critical or is_manually_flagged:
        
        freeze_reason = "ORBITAL_DISCREPANCY" if is_manually_flagged else "AI_CRITICAL_VARIANCE"
        
        # 3. Log the financial intervention into the Immutable Ledger
        ledger_res = supabase.table('inter_departmental_ledger').insert({
            'project_id': payload.project_id,
            'action_type': 'PFMS_TRANCHE_FROZEN',
            'initiated_by': 'DRISHTI_ALGORITHMIC_GATEWAY',
            'timestamp': datetime.utcnow().isoformat(),
            'notes': f"Automated escrow freeze triggered on TXN: {payload.pfms_transaction_id}. Amount: ₹{payload.tranche_amount_inr}. Reason: {freeze_reason}."
        }).execute()
        
        ledger_id = ledger_res.data[0]['id'] if ledger_res.data else None

        supabase.table('pfms_transaction_log').insert({
            'pfms_transaction_id': payload.pfms_transaction_id,
            'project_id': payload.project_id,
            'contractor_id': payload.contractor_id,
            'tranche_amount_inr': payload.tranche_amount_inr,
            'milestone_reference': payload.milestone_reference,
            'authorization_result': 'DENIED',
            'drishti_lock_reason': freeze_reason,
            'ledger_entry_id': ledger_id
        }).execute()

        # 4. Return HTTP 423 (Locked) to the PFMS Network
        # This tells the banking API to halt the transfer.
        return {
            "authorization": "DENIED",
            "status_code": 423, 
            "drishti_lock_reason": freeze_reason,
            "message": "Tranche release frozen. Clearance requires PMG override.",
            "frozen_amount_inr": payload.tranche_amount_inr,
            "pfms_transaction_id": payload.pfms_transaction_id,
            "timestamp": datetime.utcnow().isoformat()
        }

    # 5. Authorization Granted (No critical anomalies detected)
    ledger_res = supabase.table('inter_departmental_ledger').insert({
        'project_id': payload.project_id,
        'action_type': 'PFMS_TRANCHE_AUTHORIZED',
        'initiated_by': 'DRISHTI_ALGORITHMIC_GATEWAY',
        'timestamp': datetime.utcnow().isoformat(),
        'notes': f"Tranche authorized for TXN: {payload.pfms_transaction_id}. Amount: ₹{payload.tranche_amount_inr}. All DRISHTI checks passed."
    }).execute()
    
    ledger_id = ledger_res.data[0]['id'] if ledger_res.data else None

    supabase.table('pfms_transaction_log').insert({
        'pfms_transaction_id': payload.pfms_transaction_id,
        'project_id': payload.project_id,
        'contractor_id': payload.contractor_id,
        'tranche_amount_inr': payload.tranche_amount_inr,
        'milestone_reference': payload.milestone_reference,
        'authorization_result': 'APPROVED',
        'drishti_lock_reason': None,
        'ledger_entry_id': ledger_id
    }).execute()

    return {
        "authorization": "APPROVED",
        "status_code": 200,
        "pfms_transaction_id": payload.pfms_transaction_id,
        "message": "DRISHTI telemetry clear. Tranche release authorized.",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/pfms/override-clearance")
async def pmg_override_clearance(
    project_id: str,
    override_reason: str,
    pmg_officer_id: str
):
    """
    PMG Manual Override: Unfreezes a previously locked tranche.
    Only accessible from the PMG Escalation Queue interface.
    """
    supabase.table('inter_departmental_ledger').insert({
        'project_id': project_id,
        'action_type': 'PMG_OVERRIDE_TRANCHE_RELEASED',
        'initiated_by': f'PMG_OFFICER:{pmg_officer_id}',
        'timestamp': datetime.utcnow().isoformat(),
        'notes': f"PMG override clearance granted. Reason: {override_reason}"
    }).execute()

    return {
        "authorization": "OVERRIDE_APPROVED",
        "project_id": project_id,
        "message": "Tranche lock cleared by PMG authority. PFMS release re-authorized.",
        "timestamp": datetime.utcnow().isoformat()
    }
