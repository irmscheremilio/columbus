-- Add INSERT policy for jobs table
-- Users should be able to create jobs for their own organization

CREATE POLICY "Users can create jobs for their organization"
  ON jobs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

-- Also add UPDATE policy so users can update their own jobs (e.g., cancel)
CREATE POLICY "Users can update their organization's jobs"
  ON jobs FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));
