-- ===========================================================================
-- PAIMANA MULTI-TIER SMART ESCROW SCHEMA
-- Author: Adrian Roy Williams
-- Purpose: Fragments PFMS tranches to directly pay MSME subcontractors 
--          based on autonomous FASTag delivery verification.
-- ===========================================================================

-- 1. The MSME Registry (Direct Beneficiaries)
CREATE TABLE msme_subcontractor_registry (
    subcontractor_id TEXT PRIMARY KEY,
    legal_entity_name TEXT NOT NULL,
    pfms_routing_hash TEXT NOT NULL, -- Cryptographic hash of bank details
    gstin_number TEXT NOT NULL UNIQUE,
    kyc_verified BOOLEAN DEFAULT TRUE
);

-- 2. The Smart Material Contract Ledger
CREATE TABLE smart_material_contracts (
    contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    primary_contractor_id TEXT NOT NULL,
    subcontractor_id TEXT REFERENCES msme_subcontractor_registry(subcontractor_id),
    
    eway_bill_no TEXT UNIQUE NOT NULL,
    material_category TEXT NOT NULL,
    invoice_amount_inr NUMERIC NOT NULL,
    
    -- Execution Flags
    is_physically_delivered BOOLEAN DEFAULT FALSE,
    delivery_verified_at TIMESTAMPTZ,
    
    is_financially_settled BOOLEAN DEFAULT FALSE,
    pfms_transaction_ref TEXT
);

-- Index for rapid calculation during multi-crore tranche releases
CREATE INDEX idx_pending_escrow ON smart_material_contracts(project_id, is_physically_delivered, is_financially_settled);
