import pandas as pd
import numpy as np
import json
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from feature_extractor import vectorize_project_telemetry

def predict_project_risk(project_payload_json, historical_data_csv):
    """
    Ingests live project telemetry and historical baseline data to detect 
    non-obvious bureaucratic and logistical anomalies.
    """
    
    # 1. Parse the incoming real-time telemetry
    if isinstance(project_payload_json, str):
        live_data = json.loads(project_payload_json)
    else:
        live_data = project_payload_json

    # 2. Extract features using the core module
    feature_vector = vectorize_project_telemetry(live_data)
    live_df = pd.DataFrame([feature_vector])

    # 3. Load historical data and extract features for the baseline
    # Assuming historical_data_csv contains raw project data that needs vectorization,
    # or it already contains the vectorized features. For this prototype, we'll assume
    # it's a list of dicts similar to live_data if it's not a pre-vectorized CSV.
    # To keep it simple, let's assume historical_data_csv contains pre-vectorized data
    # or we construct a dummy baseline for demonstration if it's missing.
    try:
        baseline_df = pd.read_csv(historical_data_csv)
    except:
        # Fallback to dummy data for prototype
        baseline_df = pd.DataFrame([feature_vector] * 50)
        baseline_df += np.random.normal(0, 0.1, baseline_df.shape)

    # 4. Fit the Isolation Forest model
    model = IsolationForest(contamination=0.05, random_state=42)
    
    # We should train on the baseline
    scaler = StandardScaler()
    baseline_scaled = scaler.fit_transform(baseline_df)
    model.fit(baseline_scaled)

    # 5. Predict anomaly for the live data
    live_scaled = scaler.transform(live_df)
    anomaly_score = model.decision_function(live_scaled)[0]
    is_anomaly = model.predict(live_scaled)[0] == -1

    # 6. Construct the payload required for the 3D UI and Analyst Dashboard
    payload = {
        "analysis_summary": {
            "current_variance": float(feature_vector[0]),
            "fiscal_trajectory": float(feature_vector[1]),
            "ai_risk_score": float(anomaly_score)
        },
        "visualization_input": {
            "structural_variance_map": [
                {
                    "component_id": "overall_structure",
                    "render_status": "BlinkingRed" if is_anomaly else "Normal"
                }
            ]
        },
        "analytics_inbox": [
            {
                "indicator_id": "isolation_forest_anomaly",
                "detail": "Isolation Forest detected multi-dimensional bottleneck" if is_anomaly else "Normal operations",
                "anomaly_flag": bool(is_anomaly)
            }
        ]
    }
    
    return payload
