-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- Set replica identity to full for better change tracking
ALTER TABLE jobs REPLICA IDENTITY FULL;

-- Enable realtime for prompt_results table (for dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE prompt_results;
ALTER TABLE prompt_results REPLICA IDENTITY FULL;
