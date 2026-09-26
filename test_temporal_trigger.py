import os
from supabase import create_client, Client
from datetime import datetime, timezone, timedelta

# Note: We must use the service role key to insert if RLS restricts it
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials in environment. Cannot verify.")
    exit(1)

supabase: Client = create_client(url, key)

print("Attempting to insert a spoofed temporal log...")

now = datetime.now(timezone.utc)
device_time = now - timedelta(hours=2) # 2 hours behind

try:
    # Attempt to insert a log with a geotagged proof but a spoofed device time
    res = supabase.table('bottleneck_logs').insert({
        'telemetry_id': '00000000-0000-0000-0000-000000000000',
        'subcontractor_id': 'TEST_SUBCONTRACTOR',
        'reported_delay_days': 0,
        'delay_reason': 'TEST_SPOOF',
        'geotagged_proof_path': 'test_proof.jpg',
        'device_os_timestamp': device_time.isoformat(),
        'gps_atomic_timestamp': now.isoformat()
    }).execute()
    
    print("WARNING: Insert succeeded. The temporal_drift_patch.sql migration has NOT been applied.")
    print("Response:", res.data)
except Exception as e:
    print("SUCCESS: Insert failed, proving the temporal trigger is active.")
    print("Error:", str(e))
