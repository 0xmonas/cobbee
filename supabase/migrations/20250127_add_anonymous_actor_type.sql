-- Migration: Add 'anonymous' to audit_logs actor_type constraint
-- This allows logging anonymous supporter actions (payments without login)

-- Check if audit_logs table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    CREATE TABLE public.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id UUID,
      target_type TEXT,
      target_id UUID,
      metadata JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT actor_type_values CHECK (actor_type IN ('user', 'admin', 'system', 'anonymous'))
    );

    -- Create indexes
    CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
    CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_type, actor_id);
    CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
    CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

    COMMENT ON TABLE public.audit_logs IS 'Complete audit trail for all platform activities';
  ELSE
    -- Table exists, just update the constraint
    ALTER TABLE public.audit_logs
      DROP CONSTRAINT IF EXISTS actor_type_values;

    ALTER TABLE public.audit_logs
      ADD CONSTRAINT actor_type_values
      CHECK (actor_type IN ('user', 'admin', 'system', 'anonymous'));

    COMMENT ON CONSTRAINT actor_type_values ON public.audit_logs IS
      'Valid actor types: user (authenticated user), admin (platform admin), system (automated process), anonymous (unauthenticated actor)';
  END IF;
END $$;
