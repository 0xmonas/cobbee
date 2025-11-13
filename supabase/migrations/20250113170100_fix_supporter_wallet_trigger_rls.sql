-- ============================================================================
-- Fix RLS issue for supporter_wallets trigger
-- ============================================================================
-- Problem: track_supporter_wallet() trigger fails because it tries to insert
-- into supporter_wallets table which has RLS policy blocking all access.
--
-- Solution: Add SECURITY DEFINER to the trigger function so it bypasses RLS
-- and executes with the privileges of the function owner (postgres/service_role).
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS track_supporter_wallet() CASCADE;

-- Recreate function with SECURITY DEFINER
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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER bypasses RLS

-- Recreate the trigger
CREATE TRIGGER track_supporter_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON public.supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION track_supporter_wallet();

-- Add comment
COMMENT ON FUNCTION track_supporter_wallet() IS 'Automatically tracks supporter wallet activity when support is confirmed. SECURITY DEFINER allows bypassing RLS on supporter_wallets table.';
