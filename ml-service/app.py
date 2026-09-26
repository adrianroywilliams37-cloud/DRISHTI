from flask import Flask, request, jsonify
import pickle
import os
import pandas as pd
import numpy as np

app = Flask(__name__)

model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    print("Loaded XGBoost Risk Model successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/api/predict', methods=['POST'])
def predict_risk():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    data = request.json
    try:
        with open(os.path.join(os.path.dirname(__file__), 'threshold.json'), 'r') as f:
            import json
            optimal_threshold = json.load(f)['optimal_threshold']
    except Exception:
        optimal_threshold = 0.5 # fallback

    try:
        # Extract features expected by the model
        features = {
            'sanctioned_cost': data.get('sanctioned_cost_cr', 0),
            'contractor_track_record': data.get('contractor_track_record_score', 50),
            'contractor_z_score': data.get('contractor_z_score', 2.8),
            'geospatial_risk_index': data.get('geospatial_risk_index', 20),
            'land_delay': 1 if data.get('land_acquisition_delay_flag') else 0,
            'monsoon_index': data.get('monsoon_disruption_index', 50),
            'financial_progress_pct': data.get('financial_progress_pct', 0),
            'physical_progress_pct': data.get('physical_progress_pct', 0),
            'progress_mismatch': data.get('financial_progress_pct', 0) - data.get('physical_progress_pct', 0),
            'revised_cost_ratio': data.get('latest_revised_cost_cr', 1) / (data.get('sanctioned_cost_cr', 1) or 1),
            'schedule_slip_months': data.get('schedule_slip_months', 0)
        }
        
        # Convert to DataFrame to match XGBoost training shape
        df = pd.DataFrame([features])
        
        # Predict probability of being Critical (1)
        probability = model.predict_proba(df)[0][1]
        
        # Determine risk band using dynamically tuned threshold
        if probability >= optimal_threshold:
            riskBand = "High"
            status = "Critical"
        elif probability >= optimal_threshold * 0.6:
            riskBand = "Medium"
            status = "Delayed"
        else:
            riskBand = "Low"
            status = "On Track"
            
        return jsonify({
            "ai_risk_score": float(probability * 100),
            "ai_riskBand": riskBand,
            "ai_status": status,
            "features_used": features,
            "threshold_used": optimal_threshold
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
