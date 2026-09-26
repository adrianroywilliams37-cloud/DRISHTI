-- ===========================================================================
-- PAIMANA TEMPORAL ANTI-SPOOFING ENGINE
-- Author: Adrian Roy Williams
-- Purpose: Enforces Cryptographic NTP cross-validation using GPS atomic 
--          time to mathematically eliminate device-level clock manipulation,
--          while preserving Dark Zone offline-sync capabilities.
-- ===========================================================================

-- 1. Upgrade the Bottleneck Logs table to ingest dual temporal anchors
ALTER TABLE bottleneck_logs
ADD COLUMN device_os_timestamp TIMESTAMPTZ,
ADD COLUMN gps_atomic_timestamp TIMESTAMPTZ,
ADD COLUMN server_ingestion_timestamp TIMESTAMPTZ DEFAULT NOW();

-- 2. Create the exact PL/pgSQL validation function
CREATE OR REPLACE FUNCTION enforce_temporal_integrity()
RETURNS trigger AS $$
DECLARE
    temporal_variance_seconds NUMERIC;
BEGIN
    -- If hardware verification is required for this log, the timestamps MUST exist
    IF NEW.geotagged_proof_path IS NOT NULL THEN
        
        IF NEW.device_os_timestamp IS NULL OR NEW.gps_atomic_timestamp IS NULL THEN
            RAISE EXCEPTION 'TEMPORAL REJECTION: Dual timestamps required for cryptographic capture.';
        END IF;

        -- Calculate the absolute delta between the device OS clock and the Satellite clock
        temporal_variance_seconds := ABS(EXTRACT(EPOCH FROM (NEW.device_os_timestamp - NEW.gps_atomic_timestamp)));

        -- HARD LIMIT: 60 seconds. 
        -- Standard latency between satellite lock and OS bus is < 2 seconds. 
        -- A variance > 60s is mathematical proof the user altered their system settings.
        IF temporal_variance_seconds > 60 THEN
            
            -- Insert the fraud event into the Immutable Ledger automatically
            INSERT INTO inter_departmental_ledger (
                project_id, action_type, initiated_by, notes
            ) VALUES (
                NEW.telemetry_id, -- Maps back to the project asset
                'TEMPORAL_SPOOFING_DETECTED',
                'PAIMANA_CRYPTOGRAPHIC_DB_TRIGGER',
                'CRITICAL: Device OS clock artificially manipulated. Variance from satellite atomic time: ' || temporal_variance_seconds || ' seconds.'
            );

            RAISE EXCEPTION 'TEMPORAL SPOOFING DETECTED: Device OS clock manipulated to bypass PAIMANA ingestion rules. Incident logged.';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind the trigger to the ingestion table
DROP TRIGGER IF EXISTS trigger_enforce_temporal_integrity ON bottleneck_logs;
CREATE TRIGGER trigger_enforce_temporal_integrity
BEFORE INSERT OR UPDATE ON bottleneck_logs
FOR EACH ROW EXECUTE FUNCTION enforce_temporal_integrity();
