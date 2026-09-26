-- ===========================================================================
-- PAIMANA BIOMETRIC DBT SCHEMA UPGRADE
-- Author: Adrian Roy Williams
-- Purpose: Dynamic Skill-Mapping and Liveness Fraud Prevention
-- ===========================================================================

CREATE TYPE labor_skill_tier AS ENUM (
    'UNSKILLED_EARTHWORK', 
    'SEMI_SKILLED_MASON', 
    'SKILLED_OPERATOR', 
    'MASTER_TECHNICIAN'
);

-- 1. The Skill Registry
-- We NEVER store raw government IDs. We store the cryptographic hash.
CREATE TABLE labor_skill_registry (
    aadhaar_hash TEXT PRIMARY KEY, 
    worker_name_encrypted TEXT NOT NULL,
    certified_skill_tier labor_skill_tier NOT NULL,
    base_daily_wage_inr NUMERIC NOT NULL,
    certifying_authority TEXT DEFAULT 'NSDC_INDIA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. The Upgraded Attendance Ledger
CREATE TABLE labor_attendance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    aadhaar_hash TEXT REFERENCES labor_skill_registry(aadhaar_hash),
    
    clock_out_time TIMESTAMPTZ NOT NULL,
    verified_geohash TEXT NOT NULL,
    
    -- The Hardware Anti-Spoofing Vector
    liveness_coefficient NUMERIC NOT NULL, 
    is_fraud_flagged BOOLEAN DEFAULT FALSE,
    
    -- The specific wage calculated for this exact shift
    wage_disbursed_inr NUMERIC NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid PMG queries on fraud events
CREATE INDEX idx_fraud_flags ON labor_attendance_ledger(is_fraud_flagged) WHERE is_fraud_flagged = TRUE;
