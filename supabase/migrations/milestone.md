-- 1) Milestones tablosu
CREATE TABLE IF NOT EXISTS "public"."milestones" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "goal_amount" numeric(10,2) NOT NULL,
  "current_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
  
  -- Lifecycle tracking (senin istediğin tarihler)
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "activated_at" timestamp with time zone,     -- İlk aktif edildiğinde
  "deactivated_at" timestamp with time zone,   -- Deaktif edildiğinde  
  "completed_at" timestamp with time zone,     -- Tamamlandığında (otomatik/manuel)
  "deleted_at" timestamp with time zone,       -- Soft delete
  
  -- Status
  "status" text DEFAULT 'draft' NOT NULL,  -- draft, active, completed, archived
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
    ARRAY['draft', 'active', 'completed', 'archived']
  ))
);

-- 2) supports tablosuna milestone_id ekle
ALTER TABLE "public"."supports" 
ADD COLUMN "milestone_id" uuid REFERENCES "public"."milestones"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "public"."supports"."milestone_id" IS 
  'Optional: Supporter selects which milestone this support contributes to';

-- 3) İndeksler
CREATE INDEX "idx_milestones_creator_active" 
  ON "public"."milestones" ("creator_id", "is_active") 
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_supports_milestone" 
  ON "public"."supports" ("milestone_id") 
  WHERE "milestone_id" IS NOT NULL;
🔄 Otomatik Progress Hesaplama (Trigger)
-- Trigger: Support geldiğinde milestone progress'i güncelle
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_milestone_activated_at timestamp with time zone;
  v_milestone_goal numeric(10,2);
  v_new_current_amount numeric(10,2);
  v_milestone_status text;
BEGIN
  -- Sadece confirmed support'lar için çalış
  IF NEW.milestone_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    
    -- Milestone bilgilerini al
    SELECT activated_at, goal_amount, status
    INTO v_milestone_activated_at, v_milestone_goal, v_milestone_status
    FROM milestones
    WHERE id = NEW.milestone_id;
    
    -- Sadece activated_at'tan SONRA gelen bağışları say
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_new_current_amount
    FROM supports
    WHERE milestone_id = NEW.milestone_id
      AND status = 'confirmed'
      AND created_at >= v_milestone_activated_at;  -- ÖNEMLİ!
    
    -- Milestone progress'i güncelle
    UPDATE milestones
    SET current_amount = v_new_current_amount
    WHERE id = NEW.milestone_id;
    
    -- Hedefe ulaştıysa otomatik tamamla
    IF v_new_current_amount >= v_milestone_goal AND v_milestone_status = 'active' THEN
      UPDATE milestones
      SET 
        status = 'completed',
        completed_at = NOW(),
        is_active = false
      WHERE id = NEW.milestone_id;
      
      -- Bildirim gönder
      INSERT INTO notifications (user_id, type, title, message, metadata)
      SELECT 
        creator_id,
        'milestone',
        'Milestone Completed! 🎉',
        'Your "' || title || '" milestone has been completed!',
        jsonb_build_object(
          'milestone_id', id, 
          'goal_amount', goal_amount,
          'current_amount', v_new_current_amount
        )
      FROM milestones
      WHERE id = NEW.milestone_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_milestone_progress
AFTER INSERT OR UPDATE OF status ON supports
FOR EACH ROW
EXECUTE FUNCTION update_milestone_progress();
🚫 En Fazla 3 Aktif Milestone Limiti (Trigger)
CREATE OR REPLACE FUNCTION check_active_milestone_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_active_milestone_limit
BEFORE INSERT OR UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION check_active_milestone_limit();