-- ============================================================================
-- FIX REMAINING 3 FUNCTIONS - Add search_path
-- ============================================================================

-- Function: Track supporter wallet activity
CREATE OR REPLACE FUNCTION track_supporter_wallet()
RETURNS TRIGGER
SET search_path = public  -- ✅ FIX: Prevent injection
AS $$
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

-- Function: Create audit log entry
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
RETURNS UUID
SET search_path = public  -- ✅ FIX: Prevent injection
AS $$
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

-- RPC FUNCTION: Create support transaction
CREATE OR REPLACE FUNCTION create_support(
  p_creator_username TEXT,
  p_supporter_name TEXT,
  p_supporter_wallet TEXT,
  p_coffee_count INTEGER,
  p_message TEXT,
  p_tx_hash TEXT,
  p_chain_id INTEGER
)
RETURNS JSON
SET search_path = public  -- ✅ FIX: Prevent injection
AS $$
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
-- VERIFICATION
-- ============================================================================
-- After running this, check linter again. Should see:
-- - 0 ERRORS ✅
-- - 1 WARNING (auth_leaked_password_protection) - OK for Web3 auth ✅
-- ============================================================================
