"""
DRISHTI Cost Overrun & Explainer Engine (Outcome A & F)
Author: Adrian Roy Williams
Role: Predicts exact financial cost overruns using a Random Forest Regressor 
and explains the exact drivers causing the overrun using SHAP values.
"""

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta, timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

# Optional SHAP import (we handle gracefully if not installed in the hackathon environment)
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("Warning: SHAP library not found. Falling back to heuristic driver extraction.")

from feature_extractor import vectorize_project_telemetry

# Feature Names mapping back to the vector indices from feature_extractor.py
FEATURE_NAMES = [
    "Agency-weighted Time Overrun", 
    "Agency-weighted Cost Overrun", 
    "Compound Bottleneck Severity", 
    "Extracted Text Urgency", 
    "Physical Progress"
]

def generate_regression_training_data(num_samples=2000):
    """
    Generates synthetic data specifically for training the cost overrun regression model.
    """
    X = []
    y = [] # Target: Anticipated Cost Overrun Percentage (e.g. 0.15 = 15%)
    
    now = datetime.now(timezone.utc)
    
    for _ in range(num_samples):
        orig_cost = random.uniform(50.0, 5000.0)
        orig_date = now + timedelta(days=random.randint(-365, 365))
        
        is_delayed = random.random() < 0.3
        
        if not is_delayed:
            physical_pct = random.uniform(40, 100)
            cost_multiplier = random.uniform(0.95, 1.05)
            delay_days = random.randint(-15, 30)
            bottlenecks = ["none"]
            remarks = "on track"
        else:
            physical_pct = random.uniform(5, 50)
            cost_multiplier = random.uniform(1.1, 2.5)
            delay_days = random.randint(90, 800)
            bottlenecks = random.sample(
                ["land_acquisition_dispute", "environmental_clearance", "law_and_order", "fund_constraints", "utility_shifting"],
                k=random.randint(1, 3)
            )
            remarks = "severe delays and litigation"
            
        ant_cost = orig_cost * cost_multiplier
        ant_date = orig_date + timedelta(days=delay_days)
        agency = random.choice(["Central", "State", "Joint", "Private"])
        
        payload = {
            "physical_progress_pct": min(100.0, physical_pct),
            "original_cost": orig_cost,
            "anticipated_cost": ant_cost,
            "original_commission_date": orig_date.isoformat(),
            "anticipated_commission_date": ant_date.isoformat(),
            "implementing_agency_level": agency,
            "bottlenecks": bottlenecks,
            "nodal_officer_remarks": remarks
        }
        
        feature_vector = vectorize_project_telemetry(payload)
        
        # Calculate true variance percentage to serve as the regression label
        true_variance = max(0, (ant_cost - orig_cost) / orig_cost)
        
        X.append(feature_vector)
        y.append(true_variance)
        
    return np.array(X), np.array(y)


def train_and_save_model():
    """Trains the Random Forest Regressor and saves it to disk."""
    print("Initializing DRISHTI Cost Overrun Regression Engine...")
    X, y = generate_regression_training_data(5000)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Model Trained. Mean Absolute Error on Test Set: {mae * 100:.2f}% Cost Variance")
    
    joblib.dump(model, "cost_overrun_regressor.joblib")
    return model

def analyze_project_cost_risk(live_payload):
    """
    Predicts the cost overrun for a live project and uses SHAP to extract the drivers.
    """
    try:
        model = joblib.load("cost_overrun_regressor.joblib")
    except FileNotFoundError:
        print("Model not found. Training a new one on the fly for the hackathon prototype...")
        model = train_and_save_model()
        
    feature_vector = vectorize_project_telemetry(live_payload)
    X_live = np.array([feature_vector])
    
    # 1. Predict Exact Financial Overrun (Outcome A)
    predicted_variance_pct = model.predict(X_live)[0]
    
    # Calculate absolute financial impact
    orig_cost = float(live_payload.get('original_cost', 0))
    predicted_excess_cost = orig_cost * predicted_variance_pct
    
    # 2. Extract Escalation Drivers using SHAP (Outcome F)
    drivers = []
    if SHAP_AVAILABLE:
        # TreeExplainer is fast for Random Forests
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_live)
        
        # shap_values is an array of feature contributions for this specific prediction
        feature_contributions = shap_values[0]
        
        # Sort features by their absolute impact on the prediction
        sorted_indices = np.argsort(np.abs(feature_contributions))[::-1]
        
        for idx in sorted_indices:
            impact = feature_contributions[idx]
            # Only flag significant drivers that PUSH the cost UP (positive SHAP value)
            if impact > 0.05: # > 5% cost impact
                drivers.append({
                    "driver": FEATURE_NAMES[idx],
                    "impact_pct": round(impact * 100, 2),
                    "description": f"Drove a +{impact * 100:.1f}% escalation in cost."
                })
    else:
        # Fallback Heuristic if SHAP isn't installed
        if feature_vector[0] > 0.5: drivers.append({"driver": "Severe Time Overrun", "impact_pct": 15.0})
        if feature_vector[2] > 1.0: drivers.append({"driver": "Compound Bottleneck Severity", "impact_pct": 12.0})

    if not drivers and predicted_variance_pct > 0.1:
         drivers.append({"driver": "Multi-variate systemic decay", "impact_pct": round(predicted_variance_pct * 100, 2)})

    return {
        "project_id": live_payload.get('project_id', 'UNKNOWN'),
        "original_cost": orig_cost,
        "predicted_cost_overrun_pct": round(predicted_variance_pct * 100, 2),
        "predicted_excess_financial_impact": round(predicted_excess_cost, 2),
        "escalation_drivers": drivers
    }

if __name__ == "__main__":
    # Test the module
    mock_payload = {
        "project_id": "NHAI-DEMO-01",
        "physical_progress_pct": 15,
        "original_cost": 500.0,
        "original_commission_date": "2024-01-01T00:00:00Z",
        "anticipated_commission_date": "2026-06-01T00:00:00Z",
        "implementing_agency_level": "State",
        "bottlenecks": ["land_acquisition_dispute", "environmental_clearance"],
        "nodal_officer_remarks": "severe litigation and local protests halted work"
    }
    
    result = analyze_project_cost_risk(mock_payload)
    import json
    print(json.dumps(result, indent=4))
