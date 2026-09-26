import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import os
import json
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, accuracy_score

print("Generating synthetic HOLDOUT data...")
np.random.seed(99) # Different seed for holdout set

n_samples = 5000

# Features
sanctioned_cost = np.random.uniform(10, 5000, n_samples)
contractor_track_record = np.random.uniform(0, 100, n_samples)
land_delay = np.random.choice([0, 1], p=[0.7, 0.3], size=n_samples)
monsoon_index = np.random.uniform(0, 100, n_samples)

# Synthetic Advanced Features
contractor_z_score = np.random.normal(loc=3.0, scale=0.5, size=n_samples)
contractor_z_score[contractor_track_record < 40] = np.random.uniform(0.1, 1.5, np.sum(contractor_track_record < 40))

geospatial_risk_index = np.random.uniform(0, 40, n_samples)
geospatial_risk_index[monsoon_index > 80] = np.random.uniform(60, 100, np.sum(monsoon_index > 80))

financial_progress_pct = np.random.uniform(0, 100, n_samples)

physical_progress_pct = financial_progress_pct - np.random.uniform(0, 2, n_samples)
physical_progress_pct[land_delay == 1] -= np.random.uniform(15, 30, np.sum(land_delay == 1))
physical_progress_pct[contractor_track_record < 40] -= np.random.uniform(10, 20, np.sum(contractor_track_record < 40))
physical_progress_pct = np.clip(physical_progress_pct, 0, 100)

progress_mismatch = financial_progress_pct - physical_progress_pct

# Target variable (True Critical Status)
is_critical = np.zeros(n_samples, dtype=int)
is_critical[(contractor_track_record < 40) & (land_delay == 1)] = 1
is_critical[progress_mismatch > 15] = 1
is_critical[(monsoon_index > 80) & (land_delay == 1)] = 1
is_critical[(contractor_z_score < 1.5) & (geospatial_risk_index > 60)] = 1

# Introduce 1.5% unpredictable real-world noise (False alarms in reality, or stealth failures)
noise_indices = np.random.choice(n_samples, size=int(0.015 * n_samples), replace=False)
is_critical[noise_indices] = 1 - is_critical[noise_indices]

revised_cost_ratio = np.ones(n_samples)
revised_cost_ratio[is_critical == 1] += np.random.uniform(0.3, 0.6, np.sum(is_critical == 1))
revised_cost_ratio[is_critical == 0] += np.random.uniform(0, 0.05, np.sum(is_critical == 0))

schedule_slip_months = np.zeros(n_samples)
schedule_slip_months[is_critical == 1] = np.random.uniform(12, 48, np.sum(is_critical == 1))
schedule_slip_months[is_critical == 0] = np.random.uniform(0, 4, np.sum(is_critical == 0))

X = pd.DataFrame({
    'sanctioned_cost': sanctioned_cost,
    'contractor_track_record': contractor_track_record,
    'contractor_z_score': contractor_z_score,
    'geospatial_risk_index': geospatial_risk_index,
    'land_delay': land_delay,
    'monsoon_index': monsoon_index,
    'financial_progress_pct': financial_progress_pct,
    'physical_progress_pct': physical_progress_pct,
    'progress_mismatch': progress_mismatch,
    'revised_cost_ratio': revised_cost_ratio,
    'schedule_slip_months': schedule_slip_months
})

y_true = is_critical

# Load the model and threshold
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
with open(model_path, 'rb') as f:
    model = pickle.load(f)
    
threshold_path = os.path.join(os.path.dirname(__file__), 'threshold.json')
try:
    with open(threshold_path, 'r') as f:
        optimal_threshold = json.load(f)['optimal_threshold']
except Exception:
    optimal_threshold = 0.5

print(f"Predicting with Tuned XGBoost Model (Threshold: {optimal_threshold:.4f})...")
val_probs = model.predict_proba(X)[:, 1]
y_pred = (val_probs >= optimal_threshold).astype(int)

# Calculate metrics
cm = confusion_matrix(y_true, y_pred)
tn, fp, fn, tp = cm.ravel()

metrics = {
    "accuracy": float(accuracy_score(y_true, y_pred)),
    "precision": float(precision_score(y_true, y_pred)),
    "recall": float(recall_score(y_true, y_pred)),
    "f1_score": float(f1_score(y_true, y_pred)),
    "optimal_threshold": float(optimal_threshold),
    "true_positives": int(tp),
    "true_negatives": int(tn),
    "false_positives": int(fp),
    "false_negatives": int(fn),
    "total_samples": int(n_samples),
    "critical_count": int(np.sum(y_true))
}

# Output to JSON
out_path = os.path.join(os.path.dirname(__file__), 'evaluation_results.json')
with open(out_path, 'w') as f:
    json.dump(metrics, f, indent=4)

print(f"Evaluation complete. Results saved to {out_path}")
print(json.dumps(metrics, indent=4))
