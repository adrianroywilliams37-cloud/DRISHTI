-- ===========================================================================
-- PAIMANA SECURE STORAGE CONFIGURATION
-- Author: Adrian Roy Williams
-- Purpose: Initialize Zero-Trust buckets and Immutable RLS Policies
-- ===========================================================================

-- 1. Initialize Private Buckets with Strict Hardware Limits
-- 'public: false' ensures no file can be accessed via a generic URL without a signed JWT token.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'dpr_documents', 
    'dpr_documents', 
    false, 
    10485760, -- 10MB limit to prevent server flooding
    ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]
  ),
  (
    'geotagged_evidence', 
    'geotagged_evidence', 
    false, 
    20971520, -- 20MB limit for high-res hardware captures
    ARRAY['image/jpeg', 'image/png']::text[]
  );

-- ===========================================================================
-- STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- Target: storage.objects (The underlying table holding the files)
-- ===========================================================================

-- 2. Upload Policy (The Ingestion Gate)
-- Allows authenticated Nodal Officers to upload files, but ONLY to our specific buckets.
CREATE POLICY "Authenticated Officers can upload telemetry files"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id IN ('dpr_documents', 'geotagged_evidence')
);

-- 3. Read Policy (The Analyst Vault)
-- Allows authenticated users (like the PMG or Analysts) to view the documents.
-- Because the bucket is private, this forces the frontend to generate a temporary, 
-- expiring signed URL to view the file.
CREATE POLICY "Authenticated users can access files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('dpr_documents', 'geotagged_evidence')
);

-- 4. THE IMMUTABLE LOCK (Explicit Denial)
-- By intentionally omitting UPDATE and DELETE policies, PostgreSQL implicitly denies 
-- these actions. Even if a compromised Nodal Officer account tries to delete a photo 
-- of a failed concrete pour via the API, the database will reject the request.
