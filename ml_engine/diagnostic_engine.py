"""
DRISHTI ML Diagnostic & Accuracy Engine
Author: Adrian Roy Williams
Role: Generates synthetic MoSPI telemetry, trains the Isolation Forest, and 
validates model accuracy using standard classification and regression metrics.
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
import joblib
import random
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from feature_extractor import vectorize_project_telemetry

def generate_synthetic_telemetry(num_samples=1000):
    """
    Generates realistic project telemetry data matching the Advanced MoSPI parameters.
    """
    data = []
    ground_truth_labels = [] # 1 for normal, -1 for anomaly
    true_delays = [] # Ground truth delays in months
    
    # Base datetime (using timezone-aware objects as per best practices)
    now = datetime.now(timezone.utc)
    
    for _ in range(num_samples):
        is_anomalous = random.random() < 0.15
        
        orig_cost = random.uniform(100.0, 5000.0)
        orig_date = now + timedelta(days=random.randint(-365, 365))
        
        if not is_anomalous:
            # Normal Project Profile
            physical_pct = random.uniform(30, 100)
            ant_cost = orig_cost * random.uniform(0.95, 1.05) # Minor cost variations
            ant_date = orig_date + timedelta(days=random.randint(-15, 30)) # Minor delays or early
            agency = random.choice(["Central", "Private", "Joint", "State"])
            bottlenecks = ["none"]
            remarks = "progressing on track"
            
            ground_truth_labels.append(1) # Normal
            true_delays.append(0.0) # 0 months delay
        else:
            # Anomalous Project Profile (High risk gridlock)
            physical_pct = random.uniform(10, 40)
            ant_cost = orig_cost * random.uniform(1.2, 3.0) # Massive cost overruns
            
            # Massive time overruns
            delay_days = random.randint(180, 1000)
            ant_date = orig_date + timedelta(days=delay_days)
            
            # State agencies are more prone to bureaucratic gridlock in our mock simulation logic
            agency = random.choice(["State", "State", "Joint", "Central"]) 
            
            # Multiple concurrent bottlenecks
            possible_bottlenecks = ["land_acquisition_dispute", "environmental_clearance", "law_and_order", "fund_constraints"]
            bottlenecks = random.sample(possible_bottlenecks, k=random.randint(2, 4))
            
            remarks = random.choice(["litigation halted work", "protest by locals", "waiting for funds"])
            
            ground_truth_labels.append(-1) # Anomaly
            true_delays.append(delay_days / 30.0) # Ground truth true delay in months

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
        data.append(payload)
        
    return data, ground_truth_labels, true_delays

def map_score_to_delay(anomaly_score):
    """
    Simulates the continuous regression aspect by mapping the IsolationForest 
    decision function (which ranges roughly from -0.5 to 0.5) to an estimated delay in months.
    """
    if anomaly_score >= 0:
        return 0.0
    delay = abs(anomaly_score) * 40 # Adjusted mapping to fit the larger variance in new data
    return min(delay, 48.0) # Cap at 4 years

def run_diagnostics():
    print("Initializing DRISHTI ML Diagnostic Engine (Advanced MoSPI Model)...")
    
    print("\n1. Generating synthetic ground-truth dataset (10,000 samples)...")
    payloads, true_labels, true_delays = generate_synthetic_telemetry(10000)
    
    print("2. Vectorizing raw telemetry...")
    feature_matrix = [vectorize_project_telemetry(p) for p in payloads]
    X = np.array(feature_matrix)
    
    print("3. Implementing Train-Test Split (80% Train, 20% Test) to prevent data memorization...")
    X_train, X_test, y_train, y_test, delays_train, delays_test = train_test_split(
        X, true_labels, true_delays, test_size=0.20, random_state=42
    )
    
    print("4. Training Isolation Forest & Scaler on TRAINING data only...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = IsolationForest(n_estimators=200, contamination=0.15, random_state=42)
    model.fit(X_train_scaled)
    
    print("5. Saving trained models to disk (.joblib)...")
    joblib.dump(model, "isolation_forest_model.joblib")
    joblib.dump(scaler, "feature_scaler.joblib")
    
    print("\n6. Running Predictive Inference on UNSEEN TEST data...")
    X_test_scaled = scaler.transform(X_test)
    predictions = model.predict(X_test_scaled)
    anomaly_scores = model.decision_function(X_test_scaled)
    
    predicted_delays = [map_score_to_delay(score) for score in anomaly_scores]
    
    print("\n=======================================================")
    print("      DRISHTI ML ACCURACY REPORT (UNSEEN DATA)         ")
    print("=======================================================")
    
    print("\n[ CLASSIFICATION METRICS - Anomaly Detection ]")
    print(f"Accuracy:  {accuracy_score(y_test, predictions) * 100:.2f}%")
    print(f"Precision: {precision_score(y_test, predictions, pos_label=-1) * 100:.2f}%")
    print(f"Recall:    {recall_score(y_test, predictions, pos_label=-1) * 100:.2f}%")
    print(f"F1-Score:  {f1_score(y_test, predictions, pos_label=-1) * 100:.2f}%")
    
    print("\n[ REGRESSION METRICS - Delay Forecasting ]")
    mae = mean_absolute_error(delays_test, predicted_delays)
    rmse = np.sqrt(mean_squared_error(delays_test, predicted_delays))
    
    print(f"Mean Absolute Error (MAE): {mae:.2f} months")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} months")
    print("=======================================================\n")
    
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "samples_tested": len(y_test),
        "classification": {
            "accuracy": accuracy_score(y_test, predictions),
            "precision": precision_score(y_test, predictions, pos_label=-1),
            "recall": recall_score(y_test, predictions, pos_label=-1),
            "f1_score": f1_score(y_test, predictions, pos_label=-1)
        },
        "regression": {
            "mae_months": mae,
            "rmse_months": rmse
        }
    }
    
    with open("diagnostic_report.json", "w") as f:
        json.dump(report, f, indent=4)
        
    return report

if __name__ == "__main__":
    run_diagnostics()
