# 🔍 Monitoring & Admin Features

## Overview

Cobbee platformunda Next.js 16 ve Vercel standartlarına uygun kapsamlı monitoring ve admin kontrol sistemi.

---

## 📊 Features Implemented

### 1. **User Blocking/Moderation System**

#### Database Schema
```sql
-- Users table columns
is_blocked          BOOLEAN DEFAULT FALSE
blocked_at          TIMESTAMPTZ
blocked_reason      TEXT (max 500 chars)
blocked_by          UUID (admin user ID)
```

#### Admin UI
- **Location:** `/admin/users`
- **Features:**
  - Block/Unblock buttons per user
  - Reason modal for blocking
  - Visual blocked status badges
  - Blocked reason display

#### API Endpoints
```typescript
POST /api/admin/users/[id]/block
POST /api/admin/users/[id]/unblock
```

**Rate Limiting:** 3 requests/minute (strict tier for admin actions)

**Security:**
- Admin wallet verification
- Rate limiting
- Audit logging
- XSS sanitization on block reasons

---

### 2. **Enhanced Audit Logging**

#### Database Schema Enhancements
```sql
-- New audit_logs columns
user_agent          TEXT
device_type         VARCHAR(20)   -- mobile, tablet, desktop
device_brand        VARCHAR(100)  -- Apple, Samsung, Google
device_model        VARCHAR(100)  -- iPhone, Galaxy S21
browser_name        VARCHAR(50)   -- Chrome, Safari, Firefox
browser_version     VARCHAR(20)
os_name             VARCHAR(50)   -- iOS, Android, Windows, macOS
os_version          VARCHAR(20)
geo_city            VARCHAR(100)  -- Vercel geolocation
geo_country         VARCHAR(100)
geo_country_code    VARCHAR(10)   -- US, TR, GB
geo_region          VARCHAR(100)  -- Vercel edge region
geo_latitude        DECIMAL(9,6)
geo_longitude       DECIMAL(9,6)
geo_flag            VARCHAR(10)   -- Country flag emoji
session_id          VARCHAR(100)  -- Session tracking
```

#### Technology Stack
- **Vercel Geolocation:** `@vercel/functions` package
  - Automatic IP geolocation on Vercel Edge
  - City, country, region, lat/long, flag
  - Works only in Vercel (returns null in dev)

- **User-Agent Parsing:** `ua-parser-js` v2.0.6
  - Browser detection (name, version)
  - OS detection (name, version)
  - Device detection (type, brand, model)
  - Server-side and client-side compatible

#### Audit Logger Utility
**Location:** `lib/utils/audit-logger.ts`

**Usage:**
```typescript
import { createAuditLog, AuditLogger } from '@/lib/utils/audit-logger'

// Generic logging
await createAuditLog({
  request,
  supabase,
  eventType: 'user_blocked',
  actorType: 'admin',
  actorId: adminId,
  targetType: 'user',
  targetId: userId,
  changes: { old: {...}, new: {...} },
  metadata: { reason: 'spam' }
})

// Quick helpers
await AuditLogger.login({ request, supabase, actorId: userId })
await AuditLogger.signup({ request, supabase, actorId: userId })
await AuditLogger.profileUpdate({ request, supabase, actorId: userId, changes })
await AuditLogger.adminAction({ request, supabase, eventType: 'user_blocked', actorId })
```

**Automatic Data Capture:**
- ✅ IP address (from headers)
- ✅ Geolocation (Vercel Edge only)
- ✅ Device info (type, brand, model)
- ✅ Browser info (name, version)
- ✅ OS info (name, version)
- ✅ Session ID (optional)
- ✅ Changes tracking (old vs new values)
- ✅ Custom metadata

#### Supported Event Types
```typescript
// Authentication
'user_signup' | 'user_login' | 'user_logout'
'wallet_connected' | 'wallet_disconnected'

// Profile
'profile_updated' | 'avatar_uploaded' | 'cover_uploaded'
'email_added' | 'email_changed'

// Payments
'support_created' | 'payment_received'
'payout_initiated' | 'payout_completed'

// Admin
'user_blocked' | 'user_unblocked' | 'admin_action'

// Security
'rate_limit_exceeded' | 'unauthorized_access' | 'suspicious_activity'

// System
'api_error' | 'webhook_received'
```

---

## 🗂️ Database Functions

### Block User
```sql
SELECT admin_block_user(
  p_user_id := 'uuid-here',
  p_admin_id := 'admin-uuid',
  p_reason := 'Violation of platform policies'
);
```

**Returns:**
```json
{
  "success": true,
  "user_id": "...",
  "username": "johndoe",
  "blocked_at": "2025-01-17T...",
  "blocked_by": "admin",
  "reason": "Violation of platform policies"
}
```

### Unblock User
```sql
SELECT admin_unblock_user(
  p_user_id := 'uuid-here',
  p_admin_id := 'admin-uuid'
);
```

---

## 📁 Admin Views

### `admin_recent_activity`
Last 100 audit logs with enriched metadata:
```sql
SELECT * FROM admin_recent_activity;
```

Includes:
- Event details
- Actor info (username, display_name)
- Target info
- IP address
- Geolocation (city, country, flag)
- Device info (type, brand, model, browser, OS)
- Session ID
- Changes JSON
- Metadata JSON

### `admin_top_creators`
Creators ranked by earnings with blocking status:
```sql
SELECT * FROM admin_top_creators;
```

Includes:
- User profile
- Blocked status (is_blocked, blocked_at, blocked_reason)
- Total supports/supporters
- Total earnings
- Last 30 days stats

---

## 🛡️ Security Features

### Rate Limiting Tiers

```typescript
authRateLimit      // 5 req/15min  - Auth endpoints
apiRateLimit       // 30 req/min   - General APIs
paymentRateLimit   // 10 req/min   - Payment endpoints
strictRateLimit    // 3 req/min    - Admin actions
```

### Admin Authorization
- Wallet address verification via `isAdminWallet()`
- Environment variable: `ADMIN_WALLET_ADDRESSES`
- Comma-separated list of authorized wallets

### Input Sanitization
- XSS protection on all user inputs
- Block reason sanitized (max 500 chars)
- DOMPurify for rich text

### Audit Trail
- All admin actions logged
- Unauthorized attempts logged
- Rate limit violations logged
- Geolocation and device info captured

---

## 🔧 Required Environment Variables

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Admin wallet addresses
ADMIN_WALLET_ADDRESSES=0x123...,0xabc...
```

---

## 📝 Migration Required

Before using these features, run the migration:

**File:** `supabase/migrations/20250117000000_add_user_blocking_and_enhanced_audit_logs.sql`

**What it does:**
1. Adds `is_blocked`, `blocked_at`, `blocked_reason`, `blocked_by` to `users` table
2. Adds geolocation/device columns to `audit_logs` table
3. Creates indexes for performance
4. Creates `admin_block_user()` function
5. Creates `admin_unblock_user()` function
6. Updates `admin_recent_activity` view
7. Updates `admin_top_creators` view
8. Updates `admin_search_users()` function

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Click "Run"
4. Verify: `SELECT * FROM users LIMIT 1;` should show `is_blocked` column

---

## 🎯 Usage Examples

### Block a User (Admin UI)
1. Go to `/admin/users`
2. Find user in list
3. Click "Block User" button
4. Enter reason (required)
5. Confirm

### Unblock a User (Admin UI)
1. Go to `/admin/users`
2. Find blocked user (red badge)
3. Click "Unblock User" button
4. Confirm

### View Audit Logs
1. Go to `/admin/audit`
2. Filter by event type
3. See enriched logs with:
   - Geolocation (city, country, flag)
   - Device info (iPhone, Chrome, iOS 18)
   - IP address
   - Session ID

### Programmatic Blocking (API)
```typescript
const response = await fetch(`/api/admin/users/${userId}/block`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: 'Spam and harassment'
  })
});

const data = await response.json();
console.log(data.message); // "User blocked successfully"
```

---

## 🚀 Next Steps (Pending Implementation)

### 1. Blocked User Middleware
**File:** `middleware.ts`

**Purpose:** Automatically redirect blocked users

```typescript
// Pseudo-code
if (user.is_blocked) {
  redirect('/blocked?reason=' + encodeURIComponent(user.blocked_reason))
}
```

### 2. Enhanced Audit Log Filters
**Location:** `/admin/audit`

**Features:**
- Date range picker (last 7 days, 30 days, custom)
- User filter (by username or ID)
- Multiple event type filters
- Device type filter (mobile, desktop, tablet)
- Country filter
- Export to CSV

### 3. Real-time Monitoring Dashboard
- Active sessions counter
- Failed login attempts graph
- Blocked users list
- Suspicious activity alerts

---

## 📊 Performance Considerations

### Indexes Created
```sql
idx_users_is_blocked           -- Fast blocked user lookups
idx_users_blocked_by           -- Admin query performance
idx_audit_logs_session_id      -- Session tracking
idx_audit_logs_geo_country     -- Country filtering
idx_audit_logs_device_type     -- Device filtering
idx_audit_logs_created_at_desc -- Recent logs sorting
```

### Query Optimization
- Admin views use pre-aggregated stats
- RLS policies for security
- Limit 100 rows on recent activity
- Pagination recommended for large datasets

---

## 🔍 Monitoring Best Practices

### Development
- Geolocation returns `null` (expected)
- User-agent parsing works
- Audit logs created successfully
- Rate limiting disabled (NoOpRateLimit fallback)

### Production (Vercel)
- Geolocation auto-enriches all requests
- Upstash Redis required for rate limiting
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Monitor Redis usage (free tier: 10K commands/day)

### Security Monitoring
- Review `/admin/audit` daily
- Check for unusual `unauthorized_access` events
- Monitor `rate_limit_exceeded` events
- Investigate login attempts from unexpected countries

---

## 📚 References

- [Vercel Geolocation Docs](https://vercel.com/docs/functions/edge-functions/geolocation)
- [ua-parser-js GitHub](https://github.com/faisalman/ua-parser-js)
- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## ✅ Checklist

- [x] User blocking database schema
- [x] Admin block/unblock API endpoints
- [x] Admin UI for user moderation
- [x] Enhanced audit logs (geolocation + device)
- [x] Audit logger utility
- [x] Rate limiting for admin actions
- [x] Security headers (CSP, XSS, etc.)
- [ ] Blocked user middleware (redirect)
- [ ] Enhanced audit log filters
- [ ] Real-time monitoring dashboard

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0
**Maintainer:** Cobbee Team
