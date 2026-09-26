-- ===========================================================================
-- PAIMANA INTER-DEPARTMENTAL LEDGER & PFMS GOVERNANCE TABLES
-- Author: Adrian Roy Williams
-- Purpose: Immutable audit trail for cross-departmental actions, orbital 
-- discrepancy flags, and algorithmic tranche freeze/release events.
-- ===========================================================================

-- The Inter-Departmental Ledger
-- Every significant governance action across the PAIMANA ecosystem is logged here:
--   - Orbital discrepancy flags by Ministry Analysts
--   - Algorithmic tranche freezes by the PFMS Gateway
--   - PMG override clearances
--   - Escalation queue actions
CREATE TABLE inter_departmental_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- The action taxonomy (used by the PFMS Gateway and Analyst UI)
    action_type TEXT NOT NULL CHECK (action_type IN (
        'GROUND_ORBIT_DISCREPANCY_FLAGGED',
        'PFMS_TRANCHE_FROZEN',
        'PFMS_TRANCHE_AUTHORIZED',
        'PMG_OVERRIDE_TRANCHE_RELEASED',
        'PMG_OVERRIDE_EXECUTED',
        'PMG_SUMMONS_ISSUED',
        'ESCALATION_RESOLVED',
        'AUDIT_NOTE'
    )),
    
    initiated_by TEXT NOT NULL,  -- e.g., 'MINISTRY_ANALYST_DESK', 'PAIMANA_ALGORITHMIC_GATEWAY', 'PMG_OFFICER:ID'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,                  -- Human-readable description of the action
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast project-scoped lookups (used by the PFMS Gateway)
CREATE INDEX idx_ledger_project_id ON inter_departmental_ledger(project_id);
CREATE INDEX idx_ledger_action_type ON inter_departmental_ledger(action_type);
CREATE INDEX idx_ledger_timestamp ON inter_departmental_ledger(timestamp DESC);

-- ===========================================================================
-- PFMS Transaction Log
-- ===========================================================================
-- Tracks every tranche authorization attempt and its outcome.
CREATE TABLE pfms_transaction_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pfms_transaction_id TEXT NOT NULL UNIQUE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contractor_id TEXT NOT NULL,
    tranche_amount_inr NUMERIC NOT NULL,
    milestone_reference TEXT NOT NULL,
    
    authorization_result TEXT NOT NULL CHECK (authorization_result IN (
        'APPROVED', 'DENIED', 'OVERRIDE_APPROVED'
    )),
    
    paimana_lock_reason TEXT,    -- NULL if approved, e.g., 'AI_CRITICAL_VARIANCE' or 'ORBITAL_DISCREPANCY'
    ledger_entry_id UUID REFERENCES inter_departmental_ledger(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- SECURITY: Row Level Security
-- ===========================================================================
ALTER TABLE inter_departmental_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE pfms_transaction_log ENABLE ROW LEVEL SECURITY;

-- The ledger is append-only. No role can UPDATE or DELETE entries.
-- Only authenticated users can read.
CREATE POLICY "Authenticated users can read the ledger"
ON inter_departmental_ledger
FOR SELECT TO authenticated
USING (true);

-- Only the service role (backend) can insert ledger entries
CREATE POLICY "Service role inserts ledger entries"
ON inter_departmental_ledger
FOR INSERT TO service_role
WITH CHECK (true);

-- PFMS transaction log: read-only for authenticated users
CREATE POLICY "Authenticated users can read PFMS logs"
ON pfms_transaction_log
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Service role inserts PFMS logs"
ON pfms_transaction_log
FOR INSERT TO service_role
WITH CHECK (true);
