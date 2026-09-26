"""
DRISHTI MoSPI S-Curve Envelope Engine (Vector 1 Diagnostic)
Author: Adrian Roy Williams
Role: Evaluates physical progress against elapsed time using a Sigmoid upper-bound.
Traps impossible leaps (e.g., 80% progress in 45 days) that defy construction physics.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="DRISHTI MoSPI S-Curve Engine")

class ProgressReport(BaseModel):
    project_id: str
    total_duration_days: int
    days_elapsed: int
    physical_progress_pct: float

@app.post("/api/v1/mospi/evaluate-envelope")
async def evaluate_scurve_envelope(report: ProgressReport):
    if report.total_duration_days <= 0:
        raise HTTPException(status_code=400, detail="Invalid total_duration_days")

    # Time ratio (0.0 to 1.0)
    t = min(1.0, max(0.0, report.days_elapsed / report.total_duration_days))

    # Sigmoid function for S-Curve theoretical upper bound
    # Using parameters that allow a slow start, fast middle, and tapering end
    # k = 10 (steepness), x0 = 0.5 (midpoint)
    k = 10
    x0 = 0.5
    
    # Calculate the theoretical max progress allowable at time 't'
    # We add a buffer of 15% to allow for aggressive pacing, but capped at 100%
    theoretical_max_progress = (1 / (1 + np.exp(-k * (t - x0)))) * 100
    allowable_upper_bound = min(100.0, theoretical_max_progress + 15.0)

    is_physically_impossible = report.physical_progress_pct > allowable_upper_bound

    return {
        "project_id": report.project_id,
        "time_ratio": round(t, 3),
        "claimed_progress_pct": report.physical_progress_pct,
        "theoretical_max_allowable_pct": round(allowable_upper_bound, 3),
        "is_physically_impossible": bool(is_physically_impossible),
        "status": "FRAUD_DETECTED" if is_physically_impossible else "NOMINAL_PROGRESS"
    }
