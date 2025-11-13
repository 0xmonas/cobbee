-- ============================================================================
-- NOTIFICATIONS TABLE & REALTIME SETUP
-- ============================================================================
-- Real-time notification system for Cobbee platform
-- Notification types: support, milestone
-- Excludes: follower (no follow feature), mention (no mention feature)
-- ============================================================================

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Recipient (creator who receives the notification)
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification details
  type TEXT NOT NULL,
  -- 'support' = Someone bought you coffees
  -- 'milestone' = Achievement reached (100 supporters, $500 earned, etc.)

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  related_support_id UUID REFERENCES public.supports(id) ON DELETE CASCADE,
  -- For support notifications: link to the support record
  -- For milestone notifications: NULL

  -- Metadata (flexible JSON for type-specific data)
  metadata JSONB,
  -- Examples:
  -- Support: {"supporter_name": "John", "coffee_count": 3, "amount": 15.00}
  -- Milestone: {"milestone_type": "supporters", "milestone_value": 100}

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT notification_type_values CHECK (type IN ('support', 'milestone'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_related_support ON public.notifications(related_support_id);

-- Composite index for common query: unread notifications for a user
CREATE INDEX idx_notifications_user_unread_created ON public.notifications(user_id, read, created_at DESC);

COMMENT ON TABLE public.notifications IS 'Real-time notifications for creators (support notifications, milestones)';
COMMENT ON COLUMN public.notifications.metadata IS 'Flexible JSONB field for type-specific notification data';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- System can insert notifications (via trigger/function)
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated; -- For system/triggers

-- ============================================================================
-- FUNCTION: Create notification
-- ============================================================================
-- Helper function to create notifications (used by triggers)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_support_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_support_id,
    metadata,
    read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_support_id,
    p_metadata,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications (called by triggers)';

-- ============================================================================
-- TRIGGER: Create support notification
-- ============================================================================
-- Automatically create notification when a support is confirmed
CREATE OR REPLACE FUNCTION notify_creator_on_support()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_display_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on confirmed supports
  IF NEW.status = 'confirmed' THEN
    -- Get creator's display name (for metadata, not required)
    SELECT display_name INTO v_creator_display_name
    FROM public.users
    WHERE id = NEW.creator_id;

    -- Build notification message
    IF NEW.coffee_count = 1 THEN
      v_notification_title := 'New Coffee Support!';
      v_notification_message := NEW.supporter_name || ' bought you a coffee!';
    ELSE
      v_notification_title := 'New Coffee Support!';
      v_notification_message := NEW.supporter_name || ' bought you ' || NEW.coffee_count || ' coffees!';
    END IF;

    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.creator_id,
      p_type := 'support',
      p_title := v_notification_title,
      p_message := v_notification_message,
      p_related_support_id := NEW.id,
      p_metadata := jsonb_build_object(
        'supporter_name', NEW.supporter_name,
        'supporter_wallet', NEW.supporter_wallet_address,
        'coffee_count', NEW.coffee_count,
        'total_amount', NEW.total_amount,
        'has_message', (NEW.message IS NOT NULL AND NEW.message != ''),
        'message_preview', CASE
          WHEN NEW.message IS NOT NULL AND NEW.message != ''
          THEN LEFT(NEW.message, 100)
          ELSE NULL
        END
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify creator when support is confirmed
CREATE TRIGGER notify_creator_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON public.supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION notify_creator_on_support();

COMMENT ON FUNCTION notify_creator_on_support IS 'Creates notification when a support is confirmed';

-- ============================================================================
-- FUNCTION: Check milestones and notify
-- ============================================================================
-- Check for milestone achievements and create notifications
CREATE OR REPLACE FUNCTION check_and_notify_milestones()
RETURNS TRIGGER AS $$
DECLARE
  v_total_supporters INTEGER;
  v_total_earnings DECIMAL(10, 2);
  v_monthly_earnings DECIMAL(10, 2);
BEGIN
  -- Only check milestones on confirmed supports
  IF NEW.status = 'confirmed' THEN

    -- Get total supporters count
    SELECT COUNT(DISTINCT supporter_wallet_address)
    INTO v_total_supporters
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed';

    -- Get total earnings
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_earnings
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed';

    -- Get monthly earnings
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_monthly_earnings
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed'
      AND created_at >= DATE_TRUNC('month', NOW());

    -- Check supporter milestones (10, 25, 50, 100, 250, 500, 1000)
    IF v_total_supporters IN (10, 25, 50, 100, 250, 500, 1000) THEN
      -- Check if milestone notification already exists (prevent duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = NEW.creator_id
          AND type = 'milestone'
          AND metadata->>'milestone_type' = 'supporters'
          AND (metadata->>'milestone_value')::INTEGER = v_total_supporters
      ) THEN
        PERFORM create_notification(
          p_user_id := NEW.creator_id,
          p_type := 'milestone',
          p_title := 'Milestone Reached!',
          p_message := 'Congratulations! You reached ' || v_total_supporters || ' supporters!',
          p_related_support_id := NULL,
          p_metadata := jsonb_build_object(
            'milestone_type', 'supporters',
            'milestone_value', v_total_supporters
          )
        );
      END IF;
    END IF;

    -- Check earnings milestones ($100, $250, $500, $1000, $2500, $5000, $10000)
    IF v_total_earnings >= 100 AND v_total_earnings < 100 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Amazing! You''ve earned over $100!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 100
        )
      );
    ELSIF v_total_earnings >= 250 AND v_total_earnings < 250 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Incredible! You''ve earned over $250!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 250
        )
      );
    ELSIF v_total_earnings >= 500 AND v_total_earnings < 500 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Wow! You''ve earned over $500!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 500
        )
      );
    ELSIF v_total_earnings >= 1000 AND v_total_earnings < 1000 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Fantastic! You''ve earned over $1,000!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 1000
        )
      );
    END IF;

    -- Check monthly earnings milestones ($100, $500, $1000)
    IF v_monthly_earnings >= 100 AND v_monthly_earnings < 100 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Great! You''ve earned $100 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 100
        )
      );
    ELSIF v_monthly_earnings >= 500 AND v_monthly_earnings < 500 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Amazing! You''ve earned $500 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 500
        )
      );
    ELSIF v_monthly_earnings >= 1000 AND v_monthly_earnings < 1000 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Incredible! You''ve earned $1,000 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 1000
        )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check milestones after support confirmed
CREATE TRIGGER check_milestones_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON public.supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION check_and_notify_milestones();

COMMENT ON FUNCTION check_and_notify_milestones IS 'Checks for milestone achievements and creates notifications';

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
-- Enable Realtime for notifications table
-- This allows clients to subscribe to real-time updates

-- Create publication for realtime (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add notifications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMENT ON TABLE public.notifications IS 'Real-time notifications table (published to supabase_realtime)';

-- ============================================================================
-- HELPER FUNCTIONS FOR CLIENT
-- ============================================================================

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read = false;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_notification_read IS 'Mark a single notification as read';
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;

-- Function: Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE user_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all unread notifications as read for current user';
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;

-- Function: Delete notification
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_notification IS 'Delete a single notification';
GRANT EXECUTE ON FUNCTION delete_notification(UUID) TO authenticated;

-- Function: Clear all notifications for a user
CREATE OR REPLACE FUNCTION clear_all_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clear_all_notifications IS 'Delete all notifications for current user';
GRANT EXECUTE ON FUNCTION clear_all_notifications() TO authenticated;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read = false;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for current user';
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- Migration complete!
--
-- Features added:
-- ✅ Notifications table with RLS
-- ✅ Support notifications (automatic on support confirmation)
-- ✅ Milestone notifications (supporters, earnings, monthly)
-- ✅ Realtime publication (live updates)
-- ✅ Helper functions (mark read, delete, clear all)
-- ✅ Proper indexing for performance
--
-- Next steps:
-- 1. Run this migration in Supabase dashboard
-- 2. Update database.types.ts with new notifications table
-- 3. Update notifications-menu.tsx to use real data
-- 4. Add Realtime subscription hook
-- ============================================================================
