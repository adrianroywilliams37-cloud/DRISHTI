-- ===========================================================================
-- PAIMANA CORE DATABASE SCHEMA
-- Author: Adrian Roy Williams
-- Purpose: Two-tiered ingestion for SIH26103 Predictive Analytics Pipeline
-- ===========================================================================

-- 1. Create strict Enum types for bureaucratic tracking
CREATE TYPE report_status AS ENUM (
    'PENDING_VERIFICATION', 
    'MICRO_INTERROGATION_REQUIRED', 
    'VERIFIED_AND_COMMITTED'
);

CREATE TYPE risk_level AS ENUM ('Critical', 'High', 'Moderate', 'Low');

-- ===========================================================================
-- TIER 0: Master Project Registry
-- ===========================================================================
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name TEXT NOT NULL,
    ministry_name TEXT NOT NULL,
    total_approved_budget NUMERIC NOT NULL, -- Stored in INR Crores
    baseline_completion_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- TIER 1: The Staging Area (Document Ingestion)
-- ===========================================================================
-- When an officer uploads a PDF, the file goes to Supabase Storage, 
-- and the Gemini extraction dumps into this table. It does NOT trigger the ML model.
CREATE TABLE raw_daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    nodal_officer_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    document_storage_path TEXT NOT NULL, -- Link to the raw PDF in the bucket
    raw_ai_extraction JSONB NOT NULL,    -- The exact JSON returned by Gemini 1.5
    verification_status report_status DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- TIER 2: The Immutable Telemetry Ledger (ML Trigger)
-- ===========================================================================
-- Data only enters this table AFTER the Nodal Officer completes the side-by-side
-- verification and satisfies any Micro-Interrogation prompts. 
-- *THIS* is the table your Supabase Webhook listens to.
CREATE TABLE project_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_report_id UUID REFERENCES raw_daily_reports(id) UNIQUE, -- 1:1 mapping
    
    -- Clean, verified mathematical inputs for the ML Pipeline
    financial_expenditure_pct NUMERIC NOT NULL,
    physical_progress_pct NUMERIC NOT NULL,
    labor_headcount INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- TIER 2.5: High-Fidelity Bottleneck Tracking
-- ===========================================================================
-- If the report contained delays, the highly granular Micro-Interrogation 
-- answers are stored here, linked to the telemetry row.
CREATE TABLE bottleneck_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID REFERENCES project_telemetry(id) ON DELETE CASCADE,
    
    -- Specific constraints demanded by the ML feature engineering
    primary_bottleneck TEXT NOT NULL, -- e.g., 'land_acquisition_dispute'
    clearance_target_date DATE,
    nodal_officer_remarks TEXT,       -- The clarified, NLP-ready text
    geotagged_proof_path TEXT,        -- Link to the mandatory hardware photo capture
    
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- TIER 3: The AI Prediction Output Table (The PMG View)
-- ===========================================================================
-- The Python FastAPI server writes its final predictions back here.
CREATE TABLE project_risk_assessments (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    ai_risk_score risk_level NOT NULL,
    anomaly_score NUMERIC NOT NULL, -- The exact float from the Isolation Forest
    render_status TEXT NOT NULL,    -- e.g., 'BlinkingRed' for the UI/3D Twin
    cascading_delay_prediction TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- SECURITY: Enable Row Level Security (RLS)
-- ===========================================================================
ALTER TABLE raw_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottleneck_logs ENABLE ROW LEVEL SECURITY;

-- Example Policy: Nodal Officers can only insert data, never delete or update 
-- (ensuring the audit trail remains immutable).
CREATE POLICY "Officers can insert telemetry" ON project_telemetry 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
