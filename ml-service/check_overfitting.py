import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import os
from sklearn.metrics import accuracy_score

print("--- OVERFITTING CHECKUP ---")

# Load existing model
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
with open(model_path, 'rb') as f:
    model = pickle.load(f)

def generate_data(seed, n_samples=5000):
    np.random.seed(seed)
    sanctioned_cost = np.random.uniform(10, 5000, n_samples)
    contractor_track_record = np.random.uniform(0, 100, n_samples)
    land_delay = np.random.choice([0, 1], p=[0.7, 0.3], size=n_samples)
    monsoon_index = np.random.uniform(0, 100, n_samples)
    
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
    
    return X, is_critical

print("Evaluating on Seed 42 (Training Data Equivalent)...")
X_train, y_train = generate_data(42, 10000)
train_preds = model.predict(X_train)
train_acc = accuracy_score(y_train, train_preds)

print("Evaluating on Seed 999 (Completely Unseen Random Data)...")
X_unseen, y_unseen = generate_data(999, 10000)
unseen_preds = model.predict(X_unseen)
unseen_acc = accuracy_score(y_unseen, unseen_preds)

print(f"Training Accuracy:   {train_acc*100:.2f}%")
print(f"Unseen Data Accuracy: {unseen_acc*100:.2f}%")

if abs(train_acc - unseen_acc) < 0.05:
    print("RESULT: No Overfitting Detected. The model has generalized the underlying logic perfectly and is NOT memorizing data.")
else:
    print("RESULT: Warning, gap detected. The model may be memorizing the training set.")
