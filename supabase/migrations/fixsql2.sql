-- ============================================================================
-- Fix search_path security warning for track_supporter_wallet function
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS track_supporter_wallet() CASCADE;

-- Recreate function with SECURITY DEFINER and SET search_path
CREATE OR REPLACE FUNCTION track_supporter_wallet()
RETURNS TRIGGER 
SET search_path = public  -- FIX: Explicitly set search_path to prevent manipulation
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypass RLS for automatic tracking
AS $$
DECLARE
  v_current_names JSONB;
BEGIN
  -- Check if wallet exists in tracking table
  SELECT used_names INTO v_current_names
  FROM supporter_wallets
  WHERE wallet_address = NEW.supporter_wallet_address;

  IF FOUND THEN
    -- Update existing wallet tracking
    UPDATE supporter_wallets
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
        FROM supports
        WHERE supporter_wallet_address = NEW.supporter_wallet_address
          AND status = 'confirmed'
      ),
      last_seen_at = NOW()
    WHERE wallet_address = NEW.supporter_wallet_address;
  ELSE
    -- Insert new wallet tracking
    INSERT INTO supporter_wallets (
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS track_supporter_on_support_confirmed ON supports;
CREATE TRIGGER track_supporter_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION track_supporter_wallet();

-- Add comment
COMMENT ON FUNCTION track_supporter_wallet() IS 'Automatically tracks supporter wallet activity when support is confirmed. SECURITY DEFINER allows bypassing RLS. search_path is explicitly set for security.';