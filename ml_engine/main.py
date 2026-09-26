"""
DRISHTI ML Inference API
Author: Adrian Roy Williams
Role: Receives proprietary vectors from Supabase, executes the Isolation Forest model, 
and returns the predictive UI payload.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import numpy as np
import joblib
import subprocess
import json
import os
from dotenv import load_dotenv

# Load env variables from parent directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

app = FastAPI(title="DRISHTI Predictive Inference Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attempt to load pre-trained model and scaler files.
# (For your SIH prototype, you will generate these .joblib files by fitting the 
# model on historical MoSPI dummy data beforehand).
try:
    isolation_forest = joblib.load("isolation_forest_model.joblib")
    feature_scaler = joblib.load("feature_scaler.joblib")
    MODEL_LOADED = True
except FileNotFoundError:
    MODEL_LOADED = False
    print("Warning: Pre-trained ML models not found. Running in prototype mock mode.")

# Define the exact JSON schema expected from the Supabase Edge Function
class ProjectVectorPayload(BaseModel):
    project_id: str
    vectorized_features: list[float]

@app.post("/predict-risk")
async def predict_risk(payload: ProjectVectorPayload):
    # 1. Reshape the 1D feature array into a 2D array for scikit-learn
    features = np.array(payload.vectorized_features).reshape(1, -1)
    
    # 2. Run the Inference Model
    if MODEL_LOADED:
        scaled_features = feature_scaler.transform(features)
        # Returns -1 for anomaly, 1 for normal
        is_anomaly = isolation_forest.predict(scaled_features)[0] == -1
        # Returns the continuous anomaly score
        anomaly_score = float(isolation_forest.decision_function(scaled_features)[0])
    else:
        # Mock logic for testing the API before training a full dataset
        v_burn_yield = payload.vectorized_features[1]
        anomaly_score = -0.2 if v_burn_yield > 2.0 else 0.1
        is_anomaly = anomaly_score < 0

    # 3. Apply Cascading Risk Logic
    if is_anomaly and anomaly_score < -0.15:
        ai_risk_score = "Critical"
        render_status = "BlinkingRed"
        cascading_delay = "Forecast: 6+ months delay due to compounded logistical gridlock."
    elif is_anomaly:
        ai_risk_score = "High"
        render_status = "Amber"
        cascading_delay = "Forecast: 2-3 months delay detected."
    elif anomaly_score < 0.05:
        ai_risk_score = "Moderate"
        render_status = "Amber"
        cascading_delay = "Forecast: On track, but expenditure is outpacing physical progress."
    else:
        ai_risk_score = "Low"
        render_status = "Green"
        cascading_delay = "Forecast: Project is progressing according to baseline schedule."

    # 4. Return the structured payload for the frontend and digital twin
    return {
        "project_id": payload.project_id,
        "timestamp": datetime.utcnow().isoformat(),
        "analysis_summary": {
            "ai_risk_score": ai_risk_score,
            "anomaly_score": round(anomaly_score, 4)
        },
        "visualization_input": {
            "render_status": render_status,
            "cascading_delay_prediction": cascading_delay
        }
    }

@app.post("/diagnostics/run")
async def run_model_diagnostics():
    """
    Triggers the DRISHTI ML Diagnostic Engine to run synthetic Monte Carlo simulations,
    train the Isolation Forest, output mathematical accuracy metrics, and save the model.
    """
    try:
        # Run the diagnostic engine as a subprocess to keep the async loop unblocked
        # and to ensure a clean execution context.
        result = subprocess.run(
            ["python", "diagnostic_engine.py"], 
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True, 
            text=True
        )
        
        # The script saves diagnostic_report.json to disk
        report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagnostic_report.json")
        if os.path.exists(report_path):
            with open(report_path, "r") as f:
                report = json.load(f)
            
            # Since the model was re-trained and saved, we could dynamically reload it here 
            # if we added dynamic reloading logic. For now, restarting the server will pick it up.
            
            return {
                "status": "success",
                "logs": result.stdout.split('\n'),
                "metrics": report
            }
        else:
            raise HTTPException(status_code=500, detail="Diagnostic report not generated. Logs: " + result.stdout)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from spatial_constructor import AutonomousSpatialConstructor

spatial_ai = AutonomousSpatialConstructor()

@app.get("/api/v1/spatial-twin/{project_id}")
async def get_spatial_twin(project_id: str, sector: str = "Roads", completion_pct: float = 0.0):
    """
    Generates a deterministic 3D topology for a given project based on its ID, sector, and completion percentage.
    """
    print(f"Received request for {project_id}")
    try:
        # Pass to the async method. (Wait, if spatial_ai.generate_topology is async now, we need to await it)
        topology = await spatial_ai.generate_topology_async(project_id, sector, completion_pct)
        print(f"Successfully generated topology for {project_id}")
        return topology
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in get_spatial_twin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

