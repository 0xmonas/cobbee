# Cobbee Supabase Schema

Complete database schema for the Cobbee platform - a Web3-enabled creator support platform.

## 📋 Overview

This schema supports:
- ✅ **Dual authentication**: Web3 wallet (SIWE) OR email (OTP)
- ✅ **Creator profiles**: Immutable wallet + email, customizable settings
- ✅ **Support transactions**: Blockchain-verified payments
- ✅ **Supporter tracking**: Wallet-based analytics (no auth required)
- ✅ **Admin monitoring**: Complete audit logs + blacklist management
- ✅ **Row Level Security**: Fine-grained access control

## 🗂️ Tables

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Creator accounts | Dual auth (wallet + email), both immutable |
| `supports` | Support transactions | Creator-centric, blockchain-verified |
| `supporter_wallets` | Wallet tracking | Admin-only, fraud detection |
| `blacklisted_wallets` | Platform bans | Admin-only, prevents support + signup |
| `audit_logs` | Activity tracking | Complete audit trail for admin |
| `email_verification_tokens` | OTP tokens | Signup, login, change email |

### Views

| View | Purpose |
|------|---------|
| `public_creator_profiles` | Public creator data (excludes email) |
| `creator_dashboard_stats` | Aggregated stats for dashboard |

## 🔐 Authentication Flow

### Creator Signup

```
1. Connect wallet → SIWE signature
2. Enter email + username + display name
3. Receive email OTP
4. Verify OTP → Account created
5. Can login with EITHER wallet OR email
```

### Creator Login

**Option A: Wallet**
```
1. Connect wallet
2. Sign SIWE message
3. Logged in
```

**Option B: Email**
```
1. Enter email
2. Receive OTP
3. Enter OTP
4. Logged in
```

### Supporter Flow (No Auth)

```
1. Enter name + message + coffee count
2. Connect wallet
3. Send blockchain transaction
4. Transaction confirmed → Support recorded
```

## 💰 Support Transaction Flow

```sql
-- 1. Frontend creates support via RPC
SELECT create_support(
  'sarahdesigns',    -- creator username
  'Alice',           -- supporter name
  '0xABC...',        -- supporter wallet
  5,                 -- coffee count
  'Great work!',     -- message
  '0x123...',        -- tx hash
  1                  -- chain ID (Ethereum)
);

-- 2. Blockchain listener confirms transaction
UPDATE supports
SET status = 'confirmed', confirmed_at = NOW()
WHERE tx_hash = '0x123...';

-- 3. Trigger automatically updates:
--    - supporter_wallets (tracking)
--    - audit_logs (activity log)
```

## 🛡️ Security Features

### Row Level Security (RLS)

- ✅ **Users table**: Public profiles visible, users can only edit their own
- ✅ **Supports table**: Public confirmed supports, creators can moderate their own
- ✅ **Admin tables**: No public access (enforced via middleware)

### Admin Access

Admin wallets are defined in `.env`:
```env
ADMIN_WALLET_ADDRESSES=0x123...,0xabc...
```

Admin capabilities (via service_role key):
- View all tables (supporter_wallets, blacklisted_wallets, audit_logs)
- Blacklist wallets
- Delete users
- View complete audit trail

Access is enforced via:
1. **Middleware**: Check if wallet in env list
2. **Backend API**: Use service_role key to bypass RLS
3. **Admin dashboard**: `/admin` route protected

### Blacklist System

Blacklisted wallets CANNOT:
- Create support transactions
- Sign up as creators

Check before any action:
```sql
SELECT is_wallet_blacklisted('0xABC...');
-- Returns: true/false
```

## 📊 Audit Logging

Every action is logged automatically:

```sql
-- Example: User profile update
INSERT INTO audit_logs (
  event_type,
  actor_type,
  actor_id,
  target_type,
  target_id,
  changes
) VALUES (
  'user_profile_updated',
  'user',
  'user-uuid',
  'user',
  'user-uuid',
  '{"bio": {"old": "...", "new": "..."}}'
);
```

### Event Types

**User Events**:
- `user_registered`
- `user_profile_updated`
- `user_deleted`
- `user_email_verified`
- `user_coffee_price_changed`

**Support Events**:
- `support_created`
- `support_transaction_confirmed`
- `support_transaction_failed`
- `support_message_hidden`

**Admin Events**:
- `wallet_blacklisted`
- `admin_user_deleted`
- `admin_logged_in`

## 🚀 Setup Instructions

### 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 2. Run Migration

```bash
# Apply schema
supabase db push

# Or manually in Supabase dashboard:
# SQL Editor → Paste schema.sql → Run
```

### 3. Configure Environment

Copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_WALLET_ADDRESSES=0x123...
```

### 4. Test RPC Functions

```javascript
// Test blacklist check
const { data } = await supabase.rpc('is_wallet_blacklisted', {
  p_wallet_address: '0xABC...'
});

// Test support creation
const { data } = await supabase.rpc('create_support', {
  p_creator_username: 'sarahdesigns',
  p_supporter_name: 'Alice',
  p_supporter_wallet: '0xABC...',
  p_coffee_count: 5,
  p_message: 'Great work!',
  p_tx_hash: '0x123...',
  p_chain_id: 1
});
```

## 📈 Monitoring Queries

### Top Supporters (by total amount)
```sql
SELECT
  supporter_wallet_address,
  used_names,
  total_support_count,
  SUM(total_amount) as total_spent
FROM supporter_wallets sw
JOIN supports s ON sw.wallet_address = s.supporter_wallet_address
WHERE s.status = 'confirmed'
GROUP BY sw.wallet_address, sw.used_names, sw.total_support_count
ORDER BY total_spent DESC
LIMIT 10;
```

### Recent Activity (last 24h)
```sql
SELECT * FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Suspicious Activity
```sql
-- Wallets using many different names
SELECT
  wallet_address,
  jsonb_array_length(used_names) as name_count,
  used_names
FROM supporter_wallets
WHERE jsonb_array_length(used_names) > 5
ORDER BY name_count DESC;
```

## 🔧 Maintenance

### Cleanup Old OTP Tokens
```sql
-- Run daily
DELETE FROM email_verification_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Recompute Supporter Stats
```sql
-- If data gets out of sync
UPDATE supporter_wallets sw
SET
  total_support_count = (
    SELECT COUNT(*)
    FROM supports
    WHERE supporter_wallet_address = sw.wallet_address
      AND status = 'confirmed'
  ),
  total_creators_supported = (
    SELECT COUNT(DISTINCT creator_id)
    FROM supports
    WHERE supporter_wallet_address = sw.wallet_address
      AND status = 'confirmed'
  );
```

## ⚠️ Important Notes

1. **Immutable Fields**: `wallet_address` and `email` CANNOT be changed after registration
2. **Price Freeze**: Coffee price is frozen when support is created (`coffee_price_at_time`)
3. **Blacklist Check**: Always check `is_wallet_blacklisted()` before accepting support or signup
4. **Admin Access**: Never expose service_role key to frontend - use backend API only
5. **Audit Logs**: Never delete - they're your legal/compliance record

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
