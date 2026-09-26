"""
DRISHTI Contractor Genesis Risk Matrix (Procurement Node)
Author: Adrian Roy Williams
Role: Evaluates bidding contractors using historical telemetry to predict 
project default, litigation probability, and liquidity crises before contract award.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import joblib # Used to load the pre-trained Scikit-Learn model

app = FastAPI(title="DRISHTI Genesis Risk Matrix")

# In production, you would train this model on historical MoRTH/NHAI datasets:
# Features: [past_projects, avg_delay_days, active_litigations, liquidity_ratio, subcontractor_churn]
# Target: 1 (Default/Severe Delay) or 0 (Nominal Completion)
try:
    genesis_model = joblib.load("models/random_forest_genesis_v1.pkl")
except:
    # Fallback mock model for the SIH prototype if the .pkl isn't loaded
    genesis_model = None

class BidderTelemetry(BaseModel):
    contractor_id: str
    company_name: str
    past_projects_completed: int
    avg_delay_variance_days: int
    active_litigation_count: int
    current_liquidity_ratio: float
    subcontractor_churn_pct: float

@app.post("/api/v1/procurement/evaluate-bidder")
async def evaluate_contractor(bidder: BidderTelemetry):
    """
    Executes the pre-crime risk matrix on a prospective bidder.
    """
    # 1. Vectorize the contractor's historical data
    feature_vector = np.array([[
        bidder.past_projects_completed,
        bidder.avg_delay_variance_days,
        bidder.active_litigation_count,
        bidder.current_liquidity_ratio,
        bidder.subcontractor_churn_pct
    ]])

    # 2. Execute Model Inference
    if genesis_model:
        probability_of_default = genesis_model.predict_proba(feature_vector)[0][1]
        # In a real model, we'd use SHAP values to extract feature importance dynamically
    else:
        # SIH Prototype Mock Logic: Weighted heuristic mimicking the Random Forest output
        base_risk = 0.1
        litigation_penalty = bidder.active_litigation_count * 0.15
        liquidity_penalty = max(0, (1.2 - bidder.current_liquidity_ratio) * 0.4)
        delay_penalty = bidder.avg_delay_variance_days * 0.002
        experience_bonus = min(0.2, bidder.past_projects_completed * 0.01)
        cold_start_penalty = 0.4 if bidder.past_projects_completed == 0 else 0.0
        
        probability_of_default = min(0.99, max(0.01, base_risk + litigation_penalty + liquidity_penalty + delay_penalty + cold_start_penalty - experience_bonus))

    # 3. Categorize the Risk and isolate the Primary Drivers
    risk_tier = "Nominal"
    render_color = "emerald"
    action = "PROCEED_TO_FINANCIAL_BID"
    
    drivers = []
    
    if probability_of_default > 0.75:
        risk_tier = "Blacklist Warning"
        render_color = "mahogany"
        action = "REJECT_TECHNICAL_BID"
        if bidder.active_litigation_count > 2: drivers.append("Severe Litigation Overhead")
        if bidder.current_liquidity_ratio < 1.0: drivers.append("Insolvent Liquidity Ratio")
        if bidder.past_projects_completed == 0: drivers.append("Unproven Entity (Cold Start Penalty)")
    elif probability_of_default > 0.45:
        risk_tier = "High Risk"
        render_color = "amber"
        action = "REQUIRE_ADDITIONAL_ESCROW"
        if bidder.avg_delay_variance_days > 0: drivers.append("Historical Delay Variance Exceeds Threshold")
        if bidder.past_projects_completed == 0: drivers.append("Unproven Entity (Cold Start Penalty)")

    return {
        "contractor_id": bidder.contractor_id,
        "genesis_score": round(probability_of_default, 3),
        "risk_tier": risk_tier,
        "render_color": render_color,
        "primary_risk_drivers": drivers if drivers else ["Stable Historical Execution", "Healthy Capital Reserves"],
        "recommended_action": action
    }
