# Author: Adrian Roy Williams
# DRISHTI Framework - Predictive ML Engine

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DrishtiPredictiveEngine:
    def __init__(self):
        # Hyperparameters for Isolation Forest (as approved in implementation plan)
        self.iso_forest_params = {
            'n_estimators': 150,
            'max_samples': 'auto',
            'contamination': 0.05,
            'max_features': 1.0,
            'bootstrap': False,
            'random_state': 42
        }
        
        self.iso_forest = IsolationForest(**self.iso_forest_params)
        
        # Multivariable Regression Models
        self.cost_model = Ridge(alpha=1.0)
        self.schedule_model = Ridge(alpha=1.0)
        self.scaler = StandardScaler()
        
        # Feature columns used for training and prediction
        self.features = [
            'financial_progress_pct',
            'physical_progress_pct',
            'schedule_slip_months',
            'land_acquisition_delay_flag',
            'unresolved_bottleneck_count',
            'monsoon_disruption_index'
        ]
        
        self.is_trained = False
        
    def _extract_features(self, project_data: Dict[str, Any]) -> pd.DataFrame:
        """Extract features from the incoming JSON payload into a DataFrame."""
        row = {
            'financial_progress_pct': project_data.get('financial_progress_pct', 0),
            'physical_progress_pct': project_data.get('physical_progress_pct', 0),
            'schedule_slip_months': project_data.get('schedule_slip_months', 0),
            'land_acquisition_delay_flag': 1 if project_data.get('land_acquisition_delay_flag') else 0,
            'unresolved_bottleneck_count': project_data.get('unresolved_bottleneck_count', 0),
            'monsoon_disruption_index': project_data.get('monsoon_disruption_index', 0)
        }
        return pd.DataFrame([row])

    def train(self, historical_data: List[Dict[str, Any]]):
        """Train the models on historical MoSPI project data."""
        if not historical_data:
            logger.warning("No data provided for training.")
            return

        df = pd.DataFrame(historical_data)
        
        # Ensure all features exist
        for col in self.features:
            if col not in df.columns:
                df[col] = 0
                
        X = df[self.features]
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Isolation Forest
        self.iso_forest.fit(X_scaled)
        
        # Train Regression Models (mock targets if not provided)
        y_cost = df.get('actual_cost_overrun_pct', np.random.uniform(0, 50, len(df)))
        y_schedule = df.get('actual_schedule_slip_months', np.random.uniform(0, 24, len(df)))
        
        self.cost_model.fit(X_scaled, y_cost)
        self.schedule_model.fit(X_scaled, y_schedule)
        
        self.is_trained = True
        logger.info("Models trained successfully.")

    def predict(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate predictions and anomaly scores for a single project."""
        if not self.is_trained:
            # If not trained, return a dummy prediction (for mock API usage)
            logger.warning("Models not trained, returning heuristic predictions.")
            return self._heuristic_prediction(project_data)

        X = self._extract_features(project_data)
        X_scaled = self.scaler.transform(X)
        
        # Isolation Forest Anomaly Detection
        # Returns -1 for outliers and 1 for inliers. We convert to a probability-like score.
        anomaly_score_raw = self.iso_forest.decision_function(X_scaled)[0]
        # Invert so higher score = more anomalous
        anomaly_score = float(-anomaly_score_raw)
        is_anomalous = self.iso_forest.predict(X_scaled)[0] == -1
        
        # Regression Predictions
        pred_cost = float(self.cost_model.predict(X_scaled)[0])
        pred_schedule = float(self.schedule_model.predict(X_scaled)[0])
        
        # Cascading Risk Logic
        cascading_results = self._apply_cascading_risk(
            pred_schedule, 
            pred_cost, 
            project_data.get('monsoon_disruption_index', 0),
            is_anomalous
        )
        
        return {
            'predicted_cost_overrun_pct': max(0, cascading_results['cost']),
            'predicted_schedule_slip_months': max(0, cascading_results['schedule']),
            'isolation_forest_anomaly_score': anomaly_score,
            'is_anomalous_bottleneck': is_anomalous,
            'risk_score': self._calculate_risk_score(cascading_results['schedule'], cascading_results['cost'], anomaly_score),
            'risk_band': self._determine_risk_band(cascading_results['schedule'], cascading_results['cost'])
        }

    def _apply_cascading_risk(self, schedule: float, cost: float, monsoon_index: float, is_anomalous: bool) -> Dict[str, float]:
        """Apply dependency algorithms, e.g. monsoon delay multipliers."""
        new_schedule = schedule
        new_cost = cost
        
        # If schedule slip > 3 months and monsoon vulnerability is high, compound the delay
        if schedule > 3 and monsoon_index > 50:
            multiplier = 1.0 + (monsoon_index / 100.0)
            new_schedule = schedule * multiplier
            logger.info(f"Cascading Risk: Monsoon multiplier applied. Schedule increased to {new_schedule:.1f}")
            
        # Anomalous bottlenecks (e.g. stalled physical but high financial spend) escalate costs quickly
        if is_anomalous:
            new_cost = cost * 1.5
            logger.info("Cascading Risk: Anomalous bottleneck detected, scaling predicted cost.")
            
        return {'schedule': new_schedule, 'cost': new_cost}
        
    def _calculate_risk_score(self, schedule: float, cost: float, anomaly_score: float) -> float:
        score = (schedule * 2) + cost + (max(0, anomaly_score) * 10)
        return min(100.0, max(0.0, score))
        
    def _determine_risk_band(self, schedule: float, cost: float) -> str:
        if schedule > 12 or cost > 20:
            return 'High'
        elif schedule > 6 or cost > 10:
            return 'Medium'
        return 'Low'

    def _heuristic_prediction(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback heuristics for mock pipeline before training."""
        slip = project_data.get('schedule_slip_months', 0)
        phys = project_data.get('physical_progress_pct', 0)
        fin = project_data.get('financial_progress_pct', 0)
        
        # Simple heuristic for anomalous divergence
        is_anomalous = (fin - phys) > 20
        anomaly_score = 0.8 if is_anomalous else 0.2
        
        pred_slip = slip * 1.1 if slip > 0 else 0
        pred_cost = (slip * 0.5) + (fin - phys) * 0.2
        
        cascaded = self._apply_cascading_risk(
            pred_slip, 
            pred_cost, 
            project_data.get('monsoon_disruption_index', 0),
            is_anomalous
        )
        
        return {
            'predicted_cost_overrun_pct': max(0, cascaded['cost']),
            'predicted_schedule_slip_months': max(0, cascaded['schedule']),
            'isolation_forest_anomaly_score': anomaly_score,
            'is_anomalous_bottleneck': is_anomalous,
            'risk_score': self._calculate_risk_score(cascaded['schedule'], cascaded['cost'], anomaly_score),
            'risk_band': self._determine_risk_band(cascaded['schedule'], cascaded['cost'])
        }

if __name__ == "__main__":
    # Test execution
    engine = DrishtiPredictiveEngine()
    test_project = {
        'financial_progress_pct': 85.0,
        'physical_progress_pct': 40.0,
        'schedule_slip_months': 5,
        'land_acquisition_delay_flag': True,
        'unresolved_bottleneck_count': 3,
        'monsoon_disruption_index': 75.0
    }
    
    print("Test Prediction (Heuristic):")
    print(json.dumps(engine.predict(test_project), indent=2))
