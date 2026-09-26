"""
DRISHTI NGT Anti-Tamper IoT Gateway
Author: Adrian Roy Williams
Role: Ingests live environmental telemetry and runs volatility heuristics 
to detect physical obstruction or indoor relocation of site sensors.
"""

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import statistics
from datetime import datetime, timezone
import os
from supabase import create_client, Client

app = FastAPI(title="DRISHTI Anti-Tamper IoT Gateway")
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

class AirQualityPing(BaseModel):
    project_id: str
    sensor_id: str
    pm25_level: float
    pm10_level: float
    timestamp: str

# --- HEURISTIC THRESHOLDS ---
NGT_PM10_LIMIT = 100.0          # Legal maximum (µg/m3)
MIN_VOLATILITY_STDEV = 0.8      # Minimum natural variance expected outdoors
IMPOSSIBLE_BASELINE = 5.0       # PM10 too low for an active Indian construction site

@app.post("/api/v2/iot/environment-ping")
async def process_secure_aqi(ping: AirQualityPing):
    # 1. Log the raw sensor ping
    supabase.table('iot_environmental_logs').insert(ping.model_dump()).execute()

    # 2. Fetch the last 2 hours of telemetry (Assume 1 ping every 5 minutes = 24 pings)
    recent_logs = supabase.table('iot_environmental_logs')\
        .select('pm10_level, timestamp')\
        .eq('sensor_id', ping.sensor_id)\
        .order('timestamp', desc=True)\
        .limit(24).execute()

    if len(recent_logs.data) < 24:
        return {"status": "CALIBRATING_BASELINE"}

    pm10_readings = [log['pm10_level'] for log in recent_logs.data]
    
    # 3. Heuristic 1: The "Plastic Bag" Detection (Zero Variance)
    # Calculates the standard deviation. If it's near zero, the sensor is sealed.
    pm10_variance = statistics.stdev(pm10_readings)
    is_sealed = pm10_variance < MIN_VOLATILITY_STDEV

    # 4. Heuristic 2: The "Indoor Relocation" Detection
    # If the average reading is pristine during active daylight hours, it was moved indoors.
    current_hour = datetime.fromisoformat(ping.timestamp.replace('Z', '+00:00')).hour
    is_active_hours = 8 <= current_hour <= 18
    avg_pm10 = statistics.mean(pm10_readings)
    is_indoors = is_active_hours and avg_pm10 < IMPOSSIBLE_BASELINE

    # ==========================================
    # ADVERSARIAL ENFORCEMENT
    # ==========================================
    if is_sealed or is_indoors:
        tamper_reason = "SENSOR_OBSTRUCTED (Zero Variance)" if is_sealed else "SENSOR_RELOCATED (Impossible Baseline)"
        
        # Lock the sensor status in the DB
        # If the table doesn't exist, this might fail, so we wrap it in a try-except for the SIH demo fallback
        try:
            supabase.table('iot_sensor_registry').update({
                'status': 'TAMPER_LOCKOUT',
                'last_tamper_event': datetime.now(timezone.utc).isoformat()
            }).eq('sensor_id', ping.sensor_id).execute()
        except Exception:
            pass

        # Execute severe administrative penalty
        supabase.table('inter_departmental_ledger').insert({
            'project_id': ping.project_id,
            'action_type': 'IOT_TAMPERING_DETECTED',
            'initiated_by': 'HEURISTIC_TAMPER_ENGINE',
            'notes': f"FRAUD ALERT: {tamper_reason}. NGT compliance voided. Imposing automatic penalty."
        }).execute()
        
        return {"status": "TAMPER_DETECTED", "action": "PENALTY_LOCKED"}

    # ==========================================
    # STANDARD NGT ENFORCEMENT (If not tampered)
    # ==========================================
    if avg_pm10 > NGT_PM10_LIMIT:
        return {"status": "NGT_BREACH", "action": "EARTHWORK_FROZEN"}

    return {
        "status": "NOMINAL",
        "current_volatility": round(pm10_variance, 3)
    }
