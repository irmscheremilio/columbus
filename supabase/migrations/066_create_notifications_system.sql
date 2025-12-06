-- Create notifications table for persistent in-app notifications
-- Used for team invites, job completion alerts, gap discoveries, and system messages

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'team_invite',      -- Invitation to join an organization
    'member_joined',    -- Someone accepted an invite to your org
    'member_left',      -- Someone left your org
    'role_changed',     -- Your role was changed
    'scan_complete',    -- Visibility scan finished
    'gap_found',        -- New visibility gap discovered
    'recommendation',   -- New recommendation generated
    'system'            -- System announcements
  )),
  title TEXT NOT NULL,
  message TEXT,
  -- Flexible metadata for different notification types
  -- For team_invite: {invitation_id, organization_id, organization_name, role, invited_by}
  -- For scan_complete: {job_id, product_id, product_name, results_count}
  -- For gap_found: {gap_id, prompt_text, competitor_name}
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,           -- When user marked as read
  dismissed_at TIMESTAMPTZ,      -- When user dismissed (hidden from list)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ         -- Optional expiration (e.g., invites expire after 7 days)
);

-- Index for fetching user's unread notifications quickly
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL AND dismissed_at IS NULL;

-- Index for fetching all user notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);

-- Index for cleanup of expired notifications
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read, dismiss)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Service role can manage all notifications (for creating notifications from edge functions)
CREATE POLICY "Service role full access"
  ON notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable realtime for notifications (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to clean up expired notifications (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count for a user (useful for badge)
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid()
      AND read_at IS NULL
      AND dismissed_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
