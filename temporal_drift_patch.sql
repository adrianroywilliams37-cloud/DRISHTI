-- ===========================================================================
-- PAIMANA OFFLINE SYNC DRIFT PATCH (Vector 2)
-- Author: Adrian Roy Williams
-- Purpose: Corrects the temporal integrity trigger to support "Dark Zone" offline sync.
-- 
-- Vulnerability: The previous trigger rejected valid offline payloads if the server time 
-- (NOW()) drifted from the capture time (GPS Atomic Time) by > 5 minutes.
-- 
-- Fix: We ONLY enforce that the Local OS Timestamp (os_timestamp) and the GPS Atomic 
-- Timestamp (gps_timestamp) match at the moment of capture. We DO NOT restrict the 
-- server sync time, as long as the capture integrity is mathematically proven.
-- ===========================================================================

CREATE OR REPLACE FUNCTION enforce_temporal_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Defeat Local Clock Spoofing
    -- If the user manually sets their Android clock back 5 hours, the OS timestamp will diverge 
    -- from the incorruptible GPS atomic timestamp.
    IF abs(extract(epoch from (NEW.os_timestamp - NEW.gps_timestamp))) > 300 THEN
        RAISE EXCEPTION 'FRAUD_DETECTED: Local OS clock variance exceeds GPS atomic consensus. Temporal spoofing attempt flagged.';
    END IF;

    -- 2. Allow Offline Sync (The Patch)
    -- We removed the check against NOW() (server time). If the OS and GPS matched exactly at capture,
    -- the photo is valid, even if it took 12 hours for the worker to find cellular service to upload it.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assuming this is attached to the media_captures table:
-- DROP TRIGGER IF EXISTS trigger_temporal_integrity ON media_captures;
-- CREATE TRIGGER trigger_temporal_integrity
-- BEFORE INSERT ON media_captures
-- FOR EACH ROW EXECUTE FUNCTION enforce_temporal_integrity();
