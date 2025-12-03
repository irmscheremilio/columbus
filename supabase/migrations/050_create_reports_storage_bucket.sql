-- Create reports storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,  -- Private bucket, requires signed URLs
  10485760,  -- 10MB max file size
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for reports bucket
-- Allow service role to upload reports (worker uses service role)
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reports');

-- Allow service role to manage reports
CREATE POLICY "Service role can manage reports"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'reports');

-- Allow authenticated users to read their organization's reports
CREATE POLICY "Users can read their organization's reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = 'reports'
  AND (storage.foldername(name))[2] IN (
    SELECT p.organization_id::text
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);
