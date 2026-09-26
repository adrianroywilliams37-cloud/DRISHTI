-- ===========================================================================
-- PAIMANA OSINT SYBIL DEFENSE SCHEMA
-- ===========================================================================

CREATE TABLE citizen_trust_registry (
    phone_hash TEXT PRIMARY KEY, -- Cryptographic hash of the phone number for privacy
    total_submissions INTEGER DEFAULT 0,
    verified_submissions INTEGER DEFAULT 0,
    rejected_submissions INTEGER DEFAULT 0,
    
    -- Trust Score floats between 0.0 (Blacklisted) and 1.0 (Oracle)
    current_trust_score NUMERIC DEFAULT 0.20, 
    
    is_blacklisted BOOLEAN DEFAULT FALSE,
    last_interaction TIMESTAMPTZ DEFAULT NOW()
);

-- OSINT Spatial Clusters (Groups multiple citizen reports into one verifiable event)
CREATE TABLE osint_spatial_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    cluster_geohash TEXT NOT NULL,
    active_reports_count INTEGER DEFAULT 1,
    cumulative_trust_weight NUMERIC NOT NULL,
    
    is_escalated_to_pmg BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
