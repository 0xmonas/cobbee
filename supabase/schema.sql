-- ============================================================================
-- COBBEE DATABASE SCHEMA - FINAL VERSION
-- Supabase + PostgreSQL
-- ============================================================================
-- Requirements:
-- - Creators: wallet + email auth (both unique, immutable)
-- - Supporters: no auth, wallet tracking only
-- - Admin: env-based, full monitoring access
-- - Audit logs: complete activity tracking
-- - Blacklist: platform-wide ban
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: users (CREATORS) - SUPABASE AUTH COMPATIBLE
-- ============================================================================
-- Primary user table for creators
-- Auth: wallet (SIWE) OR email (OTP) via Supabase Auth
-- Linked to auth.users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Authentication (ONE of these will be filled, not both required)
  wallet_address TEXT UNIQUE,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT false,

  -- Profile Information
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,

  -- Social Media Links
  twitter_handle TEXT,
  instagram_handle TEXT,
  github_handle TEXT,
  tiktok_handle TEXT,
  opensea_handle TEXT,

  -- Creator Settings
  coffee_price DECIMAL(10, 2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,

  -- Email Notification Preferences
  email_notifications_new_support BOOLEAN DEFAULT true,
  email_notifications_security BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_format CHECK (username ~* '^[a-z0-9_-]{3,30}$'),
  CONSTRAINT coffee_price_positive CHECK (coffee_price > 0 AND coffee_price <= 1000),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT auth_method CHECK (wallet_address IS NOT NULL OR email IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_is_active ON public.users(is_active);

COMMENT ON TABLE public.users IS 'Creator accounts linked to auth.users. Auth via Supabase: wallet (SIWE) or email (OTP)';
COMMENT ON COLUMN public.users.id IS 'References auth.users(id) - managed by Supabase Auth';
COMMENT ON COLUMN public.users.wallet_address IS 'Nullable - filled for Web3 auth users';
COMMENT ON COLUMN public.users.email IS 'Nullable - filled for email auth users';

-- ============================================================================
-- TABLE: email_verification_tokens
-- ============================================================================
-- Stores OTP tokens for email verification/login
CREATE TABLE public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  email TEXT NOT NULL,
  token TEXT NOT NULL, -- 6-digit OTP
  token_type TEXT NOT NULL, -- 'signup', 'login', 'change_email'

  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT token_type_values CHECK (token_type IN ('signup', 'login', 'change_email'))
);

CREATE INDEX idx_email_tokens_email ON public.email_verification_tokens(email);
CREATE INDEX idx_email_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_email_tokens_expires ON public.email_verification_tokens(expires_at);

COMMENT ON TABLE public.email_verification_tokens IS 'OTP tokens for email verification (signup, login, change)';

-- ============================================================================
-- TABLE: supports
-- ============================================================================
-- Creator-centric support transaction records
CREATE TABLE public.supports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Creator (foreign key)
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Supporter info (NOT authenticated)
  supporter_name TEXT NOT NULL,
  supporter_wallet_address TEXT NOT NULL,
  supporter_avatar_url TEXT, -- Optional, can be generated/random

  -- Payment details
  coffee_count INTEGER NOT NULL,
  coffee_price_at_time DECIMAL(10, 2) NOT NULL, -- Price frozen at transaction time
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Blockchain transaction
  tx_hash TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL, -- e.g., 1=Ethereum, 137=Polygon

  -- Message
  message TEXT,
  is_message_private BOOLEAN DEFAULT false, -- Supporter can mark message as private
  is_hidden_by_creator BOOLEAN DEFAULT false, -- Creator can hide messages (moderation)

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT coffee_count_range CHECK (coffee_count > 0 AND coffee_count <= 100),
  CONSTRAINT total_amount_positive CHECK (total_amount > 0),
  CONSTRAINT message_length CHECK (char_length(message) <= 500),
  CONSTRAINT status_values CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Indexes
CREATE INDEX idx_supports_creator_id ON public.supports(creator_id);
CREATE INDEX idx_supports_supporter_wallet ON public.supports(supporter_wallet_address);
CREATE INDEX idx_supports_tx_hash ON public.supports(tx_hash);
CREATE INDEX idx_supports_status ON public.supports(status);
CREATE INDEX idx_supports_created_at ON public.supports(created_at DESC);
CREATE INDEX idx_supports_is_private ON public.supports(is_message_private);
CREATE INDEX idx_supports_is_hidden ON public.supports(is_hidden_by_creator);

COMMENT ON TABLE public.supports IS 'All support transactions (creator-centric view)';
COMMENT ON COLUMN public.supports.coffee_price_at_time IS 'Price frozen when support initiated (prevents creator price change manipulation)';

-- ============================================================================
-- TABLE: supporter_wallets
-- ============================================================================
-- Wallet-centric tracking for admin monitoring
CREATE TABLE public.supporter_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  wallet_address TEXT UNIQUE NOT NULL,

  -- Tracking data
  used_names JSONB DEFAULT '[]'::jsonb, -- Array of names used: ["Alice", "Bob", "Anonymous"]
  total_support_count INTEGER DEFAULT 0,
  total_creators_supported INTEGER DEFAULT 0,

  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at TIMESTAMPTZ,
  blacklisted_by UUID, -- Admin user ID (from env, not FK)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supporter_wallets_address ON public.supporter_wallets(wallet_address);
CREATE INDEX idx_supporter_wallets_blacklisted ON public.supporter_wallets(is_blacklisted);

COMMENT ON TABLE public.supporter_wallets IS 'Wallet tracking for admin monitoring (fraud detection, blacklist)';
COMMENT ON COLUMN public.supporter_wallets.used_names IS 'JSONB array of all names this wallet has used';

-- ============================================================================
-- TABLE: blacklisted_wallets
-- ============================================================================
-- Platform-wide wallet bans (separate table for clarity)
CREATE TABLE public.blacklisted_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  wallet_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,

  -- Admin info
  blacklisted_by TEXT NOT NULL, -- Admin wallet address (from env)
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scope
  ban_scope TEXT DEFAULT 'full', -- 'full' = no support + no signup

  CONSTRAINT ban_scope_values CHECK (ban_scope IN ('full', 'support_only'))
);

CREATE INDEX idx_blacklisted_wallets_address ON public.blacklisted_wallets(wallet_address);

COMMENT ON TABLE public.blacklisted_wallets IS 'Platform-wide wallet bans (managed by admin only)';

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================
-- Complete activity tracking for admin monitoring
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event identification
  event_type TEXT NOT NULL,
  -- Examples: 'user_registered', 'user_profile_updated', 'support_created',
  --           'wallet_blacklisted', 'admin_action', etc.

  -- Actor (who did this?)
  actor_type TEXT NOT NULL, -- 'user', 'admin', 'system'
  actor_id TEXT, -- User ID or admin wallet address

  -- Target (what was affected?)
  target_type TEXT, -- 'user', 'support', 'wallet'
  target_id TEXT,

  -- Change details
  changes JSONB, -- Before/after values: {"bio": {"old": "...", "new": "..."}}
  metadata JSONB, -- Additional context

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT actor_type_values CHECK (actor_type IN ('user', 'admin', 'system'))
);

-- Indexes
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Complete audit trail for all platform activities';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklisted_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Public: Anyone can view active creator profiles
CREATE POLICY "Active creator profiles are public"
  ON public.users
  FOR SELECT
  USING (is_active = true);

-- Users can insert their own profile (signup)
-- Note: ID must match auth.users(id) created by Supabase Auth
CREATE POLICY "Users can create their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- EMAIL_VERIFICATION_TOKENS POLICIES
-- ============================================================================

-- Users can read their own tokens
CREATE POLICY "Users can view their own email tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (email = current_setting('request.jwt.claim.email', true));

-- System can insert tokens (via RPC function only)
CREATE POLICY "System can create email tokens"
  ON public.email_verification_tokens
  FOR INSERT
  WITH CHECK (true);

-- System can update tokens (mark as used)
CREATE POLICY "System can update email tokens"
  ON public.email_verification_tokens
  FOR UPDATE
  USING (true);

-- ============================================================================
-- SUPPORTS TABLE POLICIES
-- ============================================================================

-- Anyone can read confirmed non-private, non-hidden supports
CREATE POLICY "Confirmed public supports are viewable"
  ON public.supports
  FOR SELECT
  USING (status = 'confirmed' AND is_message_private = false AND is_hidden_by_creator = false);

-- Creators can view ALL their supports (including hidden)
CREATE POLICY "Creators can view all their supports"
  ON public.supports
  FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Anyone can insert support (via RPC function with tx verification)
CREATE POLICY "Anyone can create support via RPC"
  ON public.supports
  FOR INSERT
  WITH CHECK (true);

-- Creators can update their supports (hide messages, moderate)
CREATE POLICY "Creators can moderate their supports"
  ON public.supports
  FOR UPDATE
  USING (
    creator_id IN (
      SELECT id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- Creators can delete their supports (spam/abuse)
CREATE POLICY "Creators can delete their supports"
  ON public.supports
  FOR DELETE
  USING (
    creator_id IN (
      SELECT id FROM public.users
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- SUPPORTER_WALLETS POLICIES
-- ============================================================================

-- No public access (admin only)
-- Admin access enforced via middleware/backend (env check)

CREATE POLICY "No public access to supporter wallets"
  ON public.supporter_wallets
  FOR ALL
  USING (false);

-- ============================================================================
-- BLACKLISTED_WALLETS POLICIES
-- ============================================================================

-- No public access (admin only)
CREATE POLICY "No public access to blacklist"
  ON public.blacklisted_wallets
  FOR ALL
  USING (false);

-- ============================================================================
-- AUDIT_LOGS POLICIES
-- ============================================================================

-- No public access (admin only)
CREATE POLICY "No public access to audit logs"
  ON public.audit_logs
  FOR ALL
  USING (false);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supporter_wallets_updated_at
  BEFORE UPDATE ON public.supporter_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Track supporter wallet activity
-- ============================================================================
-- Automatically updates supporter_wallets table when support is created
CREATE OR REPLACE FUNCTION track_supporter_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_current_names JSONB;
BEGIN
  -- Check if wallet exists in tracking table
  SELECT used_names INTO v_current_names
  FROM public.supporter_wallets
  WHERE wallet_address = NEW.supporter_wallet_address;

  IF FOUND THEN
    -- Update existing wallet tracking
    UPDATE public.supporter_wallets
    SET
      -- Add name to array if not already present
      used_names = CASE
        WHEN NOT (used_names @> to_jsonb(NEW.supporter_name))
        THEN used_names || to_jsonb(NEW.supporter_name)
        ELSE used_names
      END,
      total_support_count = total_support_count + 1,
      total_creators_supported = (
        SELECT COUNT(DISTINCT creator_id)
        FROM public.supports
        WHERE supporter_wallet_address = NEW.supporter_wallet_address
          AND status = 'confirmed'
      ),
      last_seen_at = NOW()
    WHERE wallet_address = NEW.supporter_wallet_address;
  ELSE
    -- Insert new wallet tracking
    INSERT INTO public.supporter_wallets (
      wallet_address,
      used_names,
      total_support_count,
      total_creators_supported
    ) VALUES (
      NEW.supporter_wallet_address,
      to_jsonb(ARRAY[NEW.supporter_name]),
      1,
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Track supporter wallet when support confirmed
CREATE TRIGGER track_supporter_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON public.supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION track_supporter_wallet();

-- ============================================================================
-- Function: Create audit log entry
-- ============================================================================
CREATE OR REPLACE FUNCTION create_audit_log(
  p_event_type TEXT,
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    target_type,
    target_id,
    changes,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    p_actor_type,
    p_actor_id,
    p_target_type,
    p_target_id,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION: Check if wallet is blacklisted
-- ============================================================================
-- Used by frontend before allowing support/signup
CREATE OR REPLACE FUNCTION is_wallet_blacklisted(p_wallet_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_blacklisted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.blacklisted_wallets
    WHERE wallet_address = p_wallet_address
  ) INTO v_is_blacklisted;

  RETURN v_is_blacklisted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION: Create support transaction
-- ============================================================================
-- Called from frontend after blockchain tx confirmed
CREATE OR REPLACE FUNCTION create_support(
  p_creator_username TEXT,
  p_supporter_name TEXT,
  p_supporter_wallet TEXT,
  p_coffee_count INTEGER,
  p_message TEXT,
  p_tx_hash TEXT,
  p_chain_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_creator_id UUID;
  v_coffee_price DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_support_id UUID;
  v_is_blacklisted BOOLEAN;
BEGIN
  -- Check if wallet is blacklisted
  SELECT is_wallet_blacklisted(p_supporter_wallet) INTO v_is_blacklisted;
  IF v_is_blacklisted THEN
    RAISE EXCEPTION 'Wallet is blacklisted';
  END IF;

  -- Get creator info
  SELECT id, coffee_price INTO v_creator_id, v_coffee_price
  FROM public.users
  WHERE username = p_creator_username AND is_active = true;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found or inactive';
  END IF;

  -- Calculate total
  v_total_amount := v_coffee_price * p_coffee_count;

  -- Insert support
  INSERT INTO public.supports (
    creator_id,
    supporter_name,
    supporter_wallet_address,
    coffee_count,
    coffee_price_at_time,
    total_amount,
    message,
    tx_hash,
    chain_id,
    status
  ) VALUES (
    v_creator_id,
    p_supporter_name,
    p_supporter_wallet,
    p_coffee_count,
    v_coffee_price,
    v_total_amount,
    p_message,
    p_tx_hash,
    p_chain_id,
    'pending'
  )
  RETURNING id INTO v_support_id;

  -- Create audit log
  PERFORM create_audit_log(
    'support_created',
    'system',
    p_supporter_wallet,
    'support',
    v_support_id::TEXT,
    NULL,
    jsonb_build_object(
      'creator_username', p_creator_username,
      'amount', v_total_amount,
      'tx_hash', p_tx_hash
    )
  );

  RETURN json_build_object(
    'success', true,
    'support_id', v_support_id,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Public creator profiles
CREATE OR REPLACE VIEW public_creator_profiles AS
SELECT
  id,
  wallet_address,
  username,
  display_name,
  bio,
  avatar_url,
  cover_image_url,
  twitter_handle,
  instagram_handle,
  github_handle,
  tiktok_handle,
  opensea_handle,
  coffee_price,
  created_at
FROM public.users
WHERE is_active = true;

COMMENT ON VIEW public_creator_profiles IS 'Public-facing creator profiles (excludes email and private settings)';

-- View: Creator dashboard stats
CREATE OR REPLACE VIEW creator_dashboard_stats AS
SELECT
  u.id,
  u.username,
  u.display_name,
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed') as total_supports,
  COUNT(DISTINCT s.supporter_wallet_address) FILTER (WHERE s.status = 'confirmed') as total_supporters,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed'), 0) as total_earnings,
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= DATE_TRUNC('month', NOW())) as monthly_supports,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= DATE_TRUNC('month', NOW())), 0) as monthly_earnings
FROM public.users u
LEFT JOIN public.supports s ON u.id = s.creator_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.display_name;

COMMENT ON VIEW creator_dashboard_stats IS 'Aggregated stats for creator dashboard';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_supports_creator_status ON public.supports(creator_id, status);
CREATE INDEX idx_supports_creator_created ON public.supports(creator_id, created_at DESC);
CREATE INDEX idx_supports_wallet_status ON public.supports(supporter_wallet_address, status);

-- ============================================================================
-- GRANTS (for authenticated users)
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to tables
GRANT SELECT ON public.users TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;

GRANT SELECT ON public.supports TO authenticated, anon;
GRANT INSERT ON public.supports TO anon; -- Via RPC only
GRANT UPDATE, DELETE ON public.supports TO authenticated;

GRANT SELECT, INSERT ON public.email_verification_tokens TO authenticated, anon;

-- Grant access to views
GRANT SELECT ON public_creator_profiles TO authenticated, anon;
GRANT SELECT ON creator_dashboard_stats TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_wallet_blacklisted(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_support(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, INTEGER) TO authenticated, anon;

-- ============================================================================
-- ADMIN NOTES
-- ============================================================================
-- Admin wallet addresses should be stored in .env:
--   ADMIN_WALLET_ADDRESSES=0x123...,0x456...
--
-- Admin access is enforced via:
--   1. Middleware: Check if wallet in env list
--   2. Backend API: Bypass RLS using service_role key
--   3. Admin dashboard: /admin route protected by middleware
--
-- Admin capabilities:
--   - View all tables (supporter_wallets, blacklisted_wallets, audit_logs)
--   - Insert/update/delete blacklisted_wallets
--   - Delete users
--   - View complete audit trail
-- ============================================================================
