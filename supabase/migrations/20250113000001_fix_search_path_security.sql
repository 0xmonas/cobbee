-- ============================================================================
-- FIX: Function Search Path Mutable Security Warning
-- ============================================================================
-- This migration fixes the security warning: "Function has a role mutable search_path"
-- By explicitly setting search_path in SECURITY DEFINER functions
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- ============================================================================

-- ============================================================================
-- 1. FIX: create_notification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_support_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications (called by triggers) - SECURITY: search_path set';

-- ============================================================================
-- 2. FIX: notify_creator_on_support
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_creator_on_support()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION notify_creator_on_support IS 'Creates notification when a support is confirmed - SECURITY: search_path set';

-- ============================================================================
-- 3. FIX: check_and_notify_milestones
-- ============================================================================
CREATE OR REPLACE FUNCTION check_and_notify_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

    -- Check earnings milestones ($100, $250, $500, $1000)
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
$$;

COMMENT ON FUNCTION check_and_notify_milestones IS 'Checks for milestone achievements and creates notifications - SECURITY: search_path set';

-- ============================================================================
-- 4. FIX: mark_notification_read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read = false;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_notification_read IS 'Mark a single notification as read - SECURITY: search_path set';

-- ============================================================================
-- 5. FIX: mark_all_notifications_read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all unread notifications as read for current user - SECURITY: search_path set';

-- ============================================================================
-- 6. FIX: delete_notification
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION delete_notification IS 'Delete a single notification - SECURITY: search_path set';

-- ============================================================================
-- 7. FIX: clear_all_notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION clear_all_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION clear_all_notifications IS 'Delete all notifications for current user - SECURITY: search_path set';

-- ============================================================================
-- 8. FIX: get_unread_notification_count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for current user - SECURITY: search_path set';

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All 8 security warnings fixed!
--
-- ✅ create_notification - search_path set
-- ✅ notify_creator_on_support - search_path set
-- ✅ check_and_notify_milestones - search_path set
-- ✅ mark_notification_read - search_path set
-- ✅ mark_all_notifications_read - search_path set
-- ✅ delete_notification - search_path set
-- ✅ clear_all_notifications - search_path set
-- ✅ get_unread_notification_count - search_path set
--
-- Note: Leaked password protection warning should be enabled in
-- Supabase Dashboard > Authentication > Policies > Password Strength
-- ============================================================================
