"""
DRISHTI OSINT Sybil Defense Gateway
Role: Intercepts WhatsApp Document uploads, extracts raw EXIF data to detect 
forgery or temporal anomalies, and routes payloads through the Citizen Trust Matrix.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import exifread
import requests
import hashlib
from datetime import datetime, timezone, timedelta
import os
from supabase import create_client, Client

app = FastAPI(title="DRISHTI Sybil Defense Node")
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

class WhatsAppOsintPayload(BaseModel):
    project_id: str
    phone_number_raw: str
    document_media_url: str # Must be a raw document to preserve EXIF
    bhashini_translated_text: str

@app.post("/api/v2/osint/verify-and-cluster")
async def process_secure_osint(payload: WhatsAppOsintPayload):
    # 1. Privacy-First Identity Hashing
    phone_hash = hashlib.sha256(payload.phone_number_raw.encode()).hexdigest()
    
    # Fetch Citizen Trust Score
    trust_req = supabase.table('citizen_trust_registry').select('*').eq('phone_hash', phone_hash).execute()
    if trust_req.data and trust_req.data[0]['is_blacklisted']:
        return {"status": "SILENT_DROP", "reason": "Node Blacklisted"}
        
    trust_score = trust_req.data[0]['current_trust_score'] if trust_req.data else 0.20

    # 2. Download and Validate MIME Type
    response = requests.get(payload.document_media_url, stream=True)
    content_type = response.headers.get('Content-Type', '')
    
    if not content_type.startswith('image/'):
        _penalize_citizen(phone_hash)
        return {"status": "REJECTED", "reason": "INVALID_MIME_TYPE"}
        
    image_bytes = response.content
    
    import io
    image_stream = io.BytesIO(image_bytes)
    tags = exifread.process_file(image_stream, details=False)

    # 3. Forgery Detection Heuristics
    if 'Image DateTime' not in tags or 'GPS GPSLatitude' not in tags:
        _penalize_citizen(phone_hash)
        return {"status": "REJECTED", "reason": "EXIF_STRIPPED_OR_MISSING"}

    # Detect temporal forgery (e.g., uploading a 2-year-old flood photo today)
    capture_time_str = str(tags['Image DateTime'])
    capture_time = datetime.strptime(capture_time_str, '%Y:%m:%d %H:%M:%S')
    time_variance = datetime.now() - capture_time
    
    if time_variance > timedelta(hours=48):
        _penalize_citizen(phone_hash)
        return {"status": "REJECTED", "reason": "TEMPORAL_ANOMALY (Old Image)"}

    # Detect Software Manipulation (Photoshop/Lightroom signatures)
    software_tag = str(tags.get('Image Software', ''))
    if 'Adobe' in software_tag or 'Photoshop' in software_tag:
        _penalize_citizen(phone_hash)
        return {"status": "REJECTED", "reason": "SOFTWARE_MANIPULATION_DETECTED"}

    # 4. Spatial Clustering (Sybil Resistance)
    # If a rival firm buys 50 SIM cards, their trust scores are all 0.20 (new).
    # We only escalate to the PMG if the cumulative trust weight of a geographic cluster exceeds 1.5.
    # This requires either ONE highly trusted citizen (Score 1.0 + 0.5) OR EIGHT brand new citizens.
    
    cluster = _update_spatial_cluster(payload.project_id, trust_score)
    
    if cluster['cumulative_trust_weight'] >= 1.5 and not cluster['is_escalated_to_pmg']:
        # Escalate to Apex Queue
        supabase.table('inter_departmental_ledger').insert({
            'project_id': payload.project_id,
            'action_type': 'OSINT_CONSENSUS_REACHED',
            'notes': f"Verified citizen consensus contradicts official reports. Translated complaint: '{payload.bhashini_translated_text}'"
        }).execute()
        
        supabase.table('osint_spatial_clusters').update({'is_escalated_to_pmg': True}).eq('id', cluster['id']).execute()
        return {"status": "CONSENSUS_ESCALATED"}

    return {"status": "QUEUED_FOR_CONSENSUS", "current_cluster_weight": cluster['cumulative_trust_weight']}

def _penalize_citizen(phone_hash):
    # Logic to decrement trust score and flag as blacklisted if it hits 0.0
    pass

def _update_spatial_cluster(project_id, trust_score):
    # Logic to upsert into osint_spatial_clusters and return the updated row
    return {"id": "mock-uuid", "cumulative_trust_weight": 1.6, "is_escalated_to_pmg": False}
