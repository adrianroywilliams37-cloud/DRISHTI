"""
DRISHTI Multi-Tier Escrow & Fragmentation Engine
Author: Adrian Roy Williams
Role: Autonomously routes capital directly to MSME subcontractors 
upon FASTag-verified physical delivery, bypassing the primary contractor's ledger.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import os
from supabase import create_client, Client
from decimal import Decimal, ROUND_HALF_UP

app = FastAPI(title="DRISHTI Fractional Escrow Node")
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

class FastagSiteArrival(BaseModel):
    eway_bill_no: str
    project_id: str
    geofence_arrival_timestamp: str

class PfmsTrancheRelease(BaseModel):
    project_id: str
    primary_contractor_id: str
    total_tranche_inr: Decimal

@app.post("/api/v2/escrow/verify-physical-delivery")
async def verify_material_delivery(payload: FastagSiteArrival):
    """
    Triggered automatically when the MSME's truck enters the site geofence.
    """
    # Lock the smart contract as physically fulfilled
    response = supabase.table('smart_material_contracts').update({
        'is_physically_delivered': True,
        'delivery_verified_at': payload.geofence_arrival_timestamp
    }).eq('eway_bill_no', payload.eway_bill_no).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="E-Way Bill not registered as a Smart Contract.")

    return {"status": "DELIVERY_LOCKED", "escrow_status": "AWAITING_TRANCHE_RELEASE"}


@app.post("/api/v2/escrow/fragment-tranche-payout")
async def fragment_pfms_tranche(payload: PfmsTrancheRelease):
    """
    Intercepts the Apex PFMS Gateway just before the multi-crore release.
    """
    # 1. Fetch all fulfilled, unpaid material contracts for this project
    pending_contracts = supabase.table('smart_material_contracts')\
        .select('*')\
        .eq('project_id', payload.project_id)\
        .eq('is_physically_delivered', True)\
        .eq('is_financially_settled', False)\
        .execute()

    total_msme_deduction = Decimal('0.0')
    msme_payout_manifest = []

    # 2. Tally the MSME fractional payouts
    for contract in pending_contracts.data:
        total_msme_deduction += Decimal(str(contract['invoice_amount_inr']))

    # Mathematical safety check: Ensure the tranche is large enough to cover the MSMEs
    if total_msme_deduction > payload.total_tranche_inr:
        # Proportional fractional distribution for tranche deficits
        proportion = payload.total_tranche_inr / total_msme_deduction
        total_msme_deduction_actual = Decimal('0.0')
        
        for contract in pending_contracts.data:
            original_inr = Decimal(str(contract['invoice_amount_inr']))
            new_inr = (original_inr * proportion).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            total_msme_deduction_actual += new_inr
            msme_payout_manifest.append({
                "subcontractor_id": contract['subcontractor_id'],
                "invoice_inr": float(new_inr),
                "eway_bill_no": contract['eway_bill_no']
            })

        primary_contractor_payout = payload.total_tranche_inr - total_msme_deduction_actual

        supabase.table('inter_departmental_ledger').insert({
            'project_id': payload.project_id,
            'action_type': 'TRANCHE_DEFICIT_PROPORTIONAL_DISTRIBUTION',
            'initiated_by': 'ESCROW_FRAGMENTATION_ENGINE',
            'notes': f"Tranche (₹{payload.total_tranche_inr}) insufficient. Proportionally distributed ₹{total_msme_deduction_actual} to MSMEs. Primary receives ₹{primary_contractor_payout}."
        }).execute()
        
        # We don't mark them as fully settled yet, or we mark them as partially settled.
        # Assuming we just log and return the routing instructions.
        total_msme_deduction = total_msme_deduction_actual
    else:
        for contract in pending_contracts.data:
            msme_payout_manifest.append({
                "subcontractor_id": contract['subcontractor_id'],
                "invoice_inr": float(contract['invoice_amount_inr']),
                "eway_bill_no": contract['eway_bill_no']
            })
            
        primary_contractor_payout = payload.total_tranche_inr - total_msme_deduction

        # 4. Mark contracts as financially settled in the ledger
        for contract in pending_contracts.data:
            supabase.table('smart_material_contracts').update({
                'is_financially_settled': True,
                'pfms_transaction_ref': f"AUTO_FRAG_{payload.project_id[:8]}"
            }).eq('contract_id', contract['contract_id']).execute()

        # Log the autonomous intervention
        supabase.table('inter_departmental_ledger').insert({
            'project_id': payload.project_id,
            'action_type': 'MULTI_TIER_ESCROW_EXECUTED',
            'initiated_by': 'ESCROW_FRAGMENTATION_ENGINE',
            'notes': f"Fragmented ₹{payload.total_tranche_inr} tranche. ₹{total_msme_deduction} routed to {len(msme_payout_manifest)} MSMEs. ₹{primary_contractor_payout} released to Primary."
        }).execute()

    # 5. Return the explicit routing instructions to the government banking API
    return {
        "status": "TRANCHE_FRAGMENTED",
        "primary_contractor_routing_inr": float(primary_contractor_payout),
        "msme_direct_routing": msme_payout_manifest
    }
