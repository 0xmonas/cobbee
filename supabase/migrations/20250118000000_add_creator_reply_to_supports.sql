-- Migration: Add creator_reply and creator_reply_at columns to supports table
-- Description: Allow creators to reply to supporter messages
-- Date: 2025-01-18

-- Add creator_reply column (nullable text, max 1000 characters)
ALTER TABLE supports
ADD COLUMN IF NOT EXISTS creator_reply TEXT DEFAULT NULL;

-- Add creator_reply_at column (nullable timestamp)
ALTER TABLE supports
ADD COLUMN IF NOT EXISTS creator_reply_at TIMESTAMPTZ DEFAULT NULL;

-- Add constraint for reply length (max 1000 characters)
ALTER TABLE supports
ADD CONSTRAINT creator_reply_length CHECK (char_length(creator_reply) <= 1000);

-- Add comment for documentation
COMMENT ON COLUMN supports.creator_reply IS 'Creator''s reply to the supporter''s message (max 1000 characters)';
COMMENT ON COLUMN supports.creator_reply_at IS 'Timestamp when creator replied to the message';

-- Create index for faster queries filtering by reply existence
CREATE INDEX IF NOT EXISTS idx_supports_creator_reply
ON supports(creator_id, creator_reply_at DESC)
WHERE creator_reply IS NOT NULL;

-- Note: No new RLS policies needed!
-- Existing policies already allow:
-- - Creators can UPDATE their supports (for adding/editing/deleting replies)
-- - Public can SELECT confirmed, non-private, non-hidden supports (replies will be visible)
-- - Creators can SELECT all their supports (can see all replies)
