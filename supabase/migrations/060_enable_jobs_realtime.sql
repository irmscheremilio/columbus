-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- Set replica identity to full for better change tracking
ALTER TABLE jobs REPLICA IDENTITY FULL;
