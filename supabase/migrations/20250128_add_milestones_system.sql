-- Migration: Add Milestones System
-- Created: 2025-01-28
-- Description: Complete milestone tracking system with progress calculation, lifecycle tracking, and automatic completion

-- =====================================================
-- 1) CREATE MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "public"."milestones" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "goal_amount" numeric(10,2) NOT NULL,
  "current_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,

  -- Lifecycle tracking
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "activated_at" timestamp with time zone,
  "deactivated_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,

  -- Status
  "status" text DEFAULT 'draft' NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,

  -- Constraints
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestones_creator_id_fkey" FOREIGN KEY ("creator_id")
    REFERENCES "public"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "title_length" CHECK (char_length("title") BETWEEN 1 AND 100),
  CONSTRAINT "description_length" CHECK (char_length("description") <= 500),
  CONSTRAINT "goal_amount_range" CHECK ("goal_amount" > 0 AND "goal_amount" <= 1000000),
  CONSTRAINT "current_amount_positive" CHECK ("current_amount" >= 0),
  CONSTRAINT "status_values" CHECK ("status" = ANY (
    ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]
  ))
);

ALTER TABLE "public"."milestones" OWNER TO "postgres";

COMMENT ON TABLE "public"."milestones" IS 'Creator milestone goals with automatic progress tracking';
COMMENT ON COLUMN "public"."milestones"."activated_at" IS 'First time milestone was activated (used to calculate progress from this point)';
COMMENT ON COLUMN "public"."milestones"."completed_at" IS 'When milestone was completed (automatic when goal reached or manual)';
COMMENT ON COLUMN "public"."milestones"."deleted_at" IS 'Soft delete timestamp';

-- =====================================================
-- 2) ADD MILESTONE_ID TO SUPPORTS TABLE
-- =====================================================
ALTER TABLE "public"."supports"
ADD COLUMN IF NOT EXISTS "milestone_id" uuid REFERENCES "public"."milestones"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "public"."supports"."milestone_id" IS
  'Optional: Supporter selects which milestone this support contributes to';

-- =====================================================
-- 3) CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_milestones_creator_active"
  ON "public"."milestones" ("creator_id", "is_active")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_supports_milestone"
  ON "public"."supports" ("milestone_id")
  WHERE "milestone_id" IS NOT NULL;

-- =====================================================
-- 4) ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE "public"."milestones" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active milestones
CREATE POLICY "Anyone can view non-deleted milestones"
  ON "public"."milestones"
  FOR SELECT
  USING ("deleted_at" IS NULL);

-- Policy: Creators can manage their own milestones
CREATE POLICY "Creators can manage their own milestones"
  ON "public"."milestones"
  FOR ALL
  USING (auth.uid() = "creator_id")
  WITH CHECK (auth.uid() = "creator_id");

-- Policy: Service role can do anything (for API)
CREATE POLICY "Service role can manage all milestones"
  ON "public"."milestones"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5) TRIGGER: Update milestone progress automatically
-- =====================================================

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trigger_update_milestone_progress ON supports;

CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_milestone_activated_at timestamp with time zone;
  v_milestone_goal numeric(10,2);
  v_new_current_amount numeric(10,2);
  v_milestone_status text;
  v_milestone_creator_id uuid;
  v_milestone_title text;
BEGIN
  -- Only process confirmed supports with milestone_id
  IF NEW.milestone_id IS NOT NULL AND NEW.status = 'confirmed' THEN

    -- Get milestone info
    SELECT activated_at, goal_amount, status, creator_id, title
    INTO v_milestone_activated_at, v_milestone_goal, v_milestone_status, v_milestone_creator_id, v_milestone_title
    FROM milestones
    WHERE id = NEW.milestone_id;

    -- Only count supports created AFTER milestone was activated
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_new_current_amount
    FROM supports
    WHERE milestone_id = NEW.milestone_id
      AND status = 'confirmed'
      AND created_at >= v_milestone_activated_at;

    -- Update milestone progress
    UPDATE milestones
    SET current_amount = v_new_current_amount
    WHERE id = NEW.milestone_id;

    -- Auto-complete if goal reached
    IF v_new_current_amount >= v_milestone_goal AND v_milestone_status = 'active' THEN
      UPDATE milestones
      SET
        status = 'completed',
        completed_at = NOW(),
        is_active = false
      WHERE id = NEW.milestone_id;

      -- Send notification
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_milestone_creator_id,
        'milestone',
        'Milestone Completed! 🎉',
        'Your "' || v_milestone_title || '" milestone has been completed!',
        jsonb_build_object(
          'milestone_id', NEW.milestone_id,
          'goal_amount', v_milestone_goal,
          'current_amount', v_new_current_amount
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_milestone_progress
AFTER INSERT OR UPDATE OF status ON supports
FOR EACH ROW
EXECUTE FUNCTION update_milestone_progress();

COMMENT ON FUNCTION update_milestone_progress() IS
  'Automatically updates milestone progress when new support is confirmed. Only counts supports created after milestone activation.';

-- =====================================================
-- 6) TRIGGER: Limit active milestones to 3 per creator
-- =====================================================

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trigger_check_active_milestone_limit ON milestones;

CREATE OR REPLACE FUNCTION check_active_milestone_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  IF NEW.is_active = true AND NEW.deleted_at IS NULL THEN
    SELECT COUNT(*)
    INTO active_count
    FROM milestones
    WHERE creator_id = NEW.creator_id
      AND is_active = true
      AND deleted_at IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF active_count >= 3 THEN
      RAISE EXCEPTION 'Cannot have more than 3 active milestones. Please deactivate an existing milestone first.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_active_milestone_limit
BEFORE INSERT OR UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION check_active_milestone_limit();

COMMENT ON FUNCTION check_active_milestone_limit() IS
  'Enforces maximum 3 active milestones per creator';

-- =====================================================
-- 7) TRIGGER: Set activated_at timestamp
-- =====================================================

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trigger_set_milestone_activated_at ON milestones;

CREATE OR REPLACE FUNCTION set_milestone_activated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Set activated_at when milestone becomes active for the first time
  IF NEW.is_active = true AND OLD.is_active = false AND NEW.activated_at IS NULL THEN
    NEW.activated_at = NOW();
  END IF;

  -- Set deactivated_at when milestone is deactivated
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.deactivated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_milestone_activated_at
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION set_milestone_activated_at();

COMMENT ON FUNCTION set_milestone_activated_at() IS
  'Automatically sets activated_at timestamp when milestone is first activated';
