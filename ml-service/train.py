import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score

print("Generating synthetic data for training with Advanced Features...")
np.random.seed(42)

n_samples = 20000

# Features
sanctioned_cost = np.random.uniform(10, 5000, n_samples)
contractor_track_record = np.random.uniform(0, 100, n_samples)
land_delay = np.random.choice([0, 1], p=[0.7, 0.3], size=n_samples)
monsoon_index = np.random.uniform(0, 100, n_samples)

# Synthetic Advanced Features
# Highly predictive features
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

# Target variable (True Critical Status) - Strict deterministic rules
is_critical = np.zeros(n_samples, dtype=int)
is_critical[(contractor_track_record < 40) & (land_delay == 1)] = 1
is_critical[progress_mismatch > 15] = 1
is_critical[(monsoon_index > 80) & (land_delay == 1)] = 1
is_critical[(contractor_z_score < 1.5) & (geospatial_risk_index > 60)] = 1

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

y = is_critical

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost Classifier...")
model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1, 
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train, y_train)

print("Tuning Decision Threshold for 100% Recall...")
val_probs = model.predict_proba(X_val)[:, 1]

optimal_threshold = 0.5
best_precision = 0.0

thresholds = np.linspace(0.1, 0.9, 81)
for thresh in thresholds:
    preds = (val_probs >= thresh).astype(int)
    rec = recall_score(y_val, preds)
    prec = precision_score(y_val, preds)
    
    if rec == 1.0: 
        if prec > best_precision:
            best_precision = prec
            optimal_threshold = thresh

print(f"Optimal Threshold Found: {optimal_threshold:.4f}")
print(f"Tuned - Precision: {best_precision:.4f}")

# Save the model
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(model, f)
print(f"Model saved to {model_path}")

# Save the threshold
threshold_path = os.path.join(os.path.dirname(__file__), 'threshold.json')
with open(threshold_path, 'w') as f:
    json.dump({"optimal_threshold": float(optimal_threshold)}, f)
print(f"Threshold saved to {threshold_path}")
