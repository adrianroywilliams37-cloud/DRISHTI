import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import all the individual microservice apps
from ml_engine.genesis_engine import app as genesis_app
from ml_engine.biometric_dbt_engine import app as dbt_app
from ml_engine.pfms_gateway import app as pfms_app
from ml_engine.ngt_tamper_detection import app as ngt_app
from ml_engine.sar_ccd_engine import app as sar_app
from ml_engine.multi_tier_escrow import app as escrow_app
from ml_engine.osint_sybil_defense import app as osint_app
from ml_engine.logistics_telemetry import app as logistics_app
# Also the OSINT Auditor if that's a separate app (port 8007)
# from ml_engine.osint_auditor import app as osint_auditor_app 

# The Master Gateway Application
app = FastAPI(title="PAIMANA Unified Backend Gateway")

# Allow Vercel frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your Vercel domain later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all engines onto sub-paths
app.mount("/api/genesis", genesis_app)
app.mount("/api/dbt", dbt_app)
app.mount("/api/pfms", pfms_app)
app.mount("/api/ngt", ngt_app)
app.mount("/api/sar", sar_app)
app.mount("/api/escrow", escrow_app)
app.mount("/api/osint", osint_app)
app.mount("/api/logistics", logistics_app)

@app.get("/")
def health_check():
    return {"status": "PAIMANA Unified Backend Gateway is Online", "version": "1.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
