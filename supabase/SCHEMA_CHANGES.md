# Schema Changes & Migration Guide

## ✅ Changes Made (2025-01-08)

### 1. **Naming Convention: snake_case (Supabase Standard)**

**Decision:** Use `snake_case` for all database columns (PostgreSQL/Supabase standard)

**Rationale:**
- Supabase official recommendation
- Avoids need for double quotes in SQL queries
- Type generation works automatically
- Transform utilities handle frontend camelCase

---

### 2. **Support Table Updates**

#### Changed:
- ❌ `is_message_public` → ✅ `is_message_private` (matches mock data logic)

#### Added:
- ✅ `is_hidden_by_creator` BOOLEAN - Creator can hide messages for moderation

#### New Logic:
```sql
-- Public supports (visible to everyone):
status = 'confirmed'
AND is_message_private = false
AND is_hidden_by_creator = false

-- Supporter marks as private:
is_message_private = true

-- Creator hides message (moderation/spam):
is_hidden_by_creator = true
```

---

### 3. **Avatar Generation System**

**Problem:** Supporters don't upload avatars
**Solution:** Auto-generate avatars with initials

#### Logic:
```typescript
// "John Doe" → "JD"
// "Alice" → "AL" (first + last letter)
// "Bob Smith Johnson" → "BJ" (first + last word)
```

#### Implementation:
- **File:** `/lib/avatar-utils.ts`
- **Functions:**
  - `getInitials(name)` - Extracts initials
  - `getAvatarColor(name)` - Consistent color from name hash
  - `generateAvatarDataUrl(name, size)` - SVG data URL
  - `getAvatarUrl(avatarUrl, name)` - Returns URL or generates SVG

#### Example:
```typescript
import { getAvatarUrl } from '@/lib/avatar-utils'

const avatarUrl = getAvatarUrl(null, "Sarah Chen")
// Returns: "data:image/svg+xml;base64,..." with "SC" initials
```

---

### 4. **Transform Utilities**

**Problem:** Database uses `snake_case`, frontend uses `camelCase`
**Solution:** Transform utilities for seamless conversion

#### File: `/lib/supabase-transforms.ts`

#### Database Types (snake_case):
```typescript
interface DBUser {
  id: string
  wallet_address: string
  display_name: string
  coffee_price: number
  // ... etc
}

interface DBSupport {
  supporter_name: string
  coffee_count: number
  is_message_private: boolean
  is_hidden_by_creator: boolean
  // ... etc
}
```

#### Transform Functions:
```typescript
// Database → Frontend
transformUserToCreator(dbUser, stats?) → Creator
transformSupportToSupport(dbSupport) → Support

// Frontend → Database
prepareCreatorForDB(creator) → DB object
prepareSupportForDB(support) → DB object

// Utilities
relativeTimeToISO("2 hours ago") → "2025-01-08T10:00:00Z"
isoToRelativeTime("2025-01-08T10:00:00Z") → "2 hours ago"
```

#### Usage Example:
```typescript
import { transformUserToCreator } from '@/lib/supabase-transforms'

// Fetch from Supabase
const { data: dbUser } = await supabase
  .from('users')
  .select('*')
  .eq('username', 'sarahdesigns')
  .single()

// Transform to frontend type
const creator = transformUserToCreator(dbUser)
// Now: creator.displayName, creator.coffeePrice, etc.
```

---

## 📊 Field Mapping Reference

### Creator (User) Fields

| Frontend (camelCase) | Database (snake_case) | Type | Notes |
|---------------------|----------------------|------|-------|
| `id` | `id` | UUID | Primary key |
| `username` | `username` | TEXT | Unique |
| `displayName` | `display_name` | TEXT | |
| `bio` | `bio` | TEXT | Nullable |
| `avatar` | `avatar_url` | TEXT | Nullable |
| `coverImage` | `cover_image_url` | TEXT | Nullable |
| `coffeePrice` | `coffee_price` | DECIMAL | Default 5.00 |
| `walletAddress` | `wallet_address` | TEXT | Immutable |
| `socialMedia.twitter` | `twitter_handle` | TEXT | Nested → Flat |
| `socialMedia.instagram` | `instagram_handle` | TEXT | Nested → Flat |
| `socialMedia.github` | `github_handle` | TEXT | Nested → Flat |
| `socialMedia.tiktok` | `tiktok_handle` | TEXT | Nested → Flat |
| `socialMedia.opensea` | `opensea_handle` | TEXT | Nested → Flat |
| `totalSupports` | N/A (view) | NUMBER | From `creator_dashboard_stats` |
| N/A | `email` | TEXT | Backend only |
| N/A | `email_verified` | BOOLEAN | Backend only |
| N/A | `is_active` | BOOLEAN | Backend only |

### Support Fields

| Frontend (camelCase) | Database (snake_case) | Type | Notes |
|---------------------|----------------------|------|-------|
| `id` | `id` | UUID | Primary key |
| `supporterName` | `supporter_name` | TEXT | |
| `supporterAvatar` | `supporter_avatar_url` | TEXT | Auto-generated if null |
| `coffeeCount` | `coffee_count` | INTEGER | 1-100 |
| `message` | `message` | TEXT | Nullable |
| `timestamp` | `created_at` | TIMESTAMPTZ | Converted to relative |
| `amount` | `total_amount` | DECIMAL | |
| `txHash` | `tx_hash` | TEXT | Blockchain tx |
| `isPrivate` | `is_message_private` | BOOLEAN | Supporter's choice |
| `isHidden` | `is_hidden_by_creator` | BOOLEAN | Creator moderation |
| N/A | `creator_id` | UUID | Foreign key |
| N/A | `supporter_wallet_address` | TEXT | For tracking |
| N/A | `coffee_price_at_time` | DECIMAL | Price freeze |
| N/A | `chain_id` | INTEGER | Blockchain network |
| N/A | `status` | ENUM | pending/confirmed/failed |
| N/A | `confirmed_at` | TIMESTAMPTZ | When confirmed |

---

## 🚀 Migration Steps

### For Existing Mock Data:

1. **Update mock-data.ts interfaces** (if needed) or use transform utilities
2. **When fetching from Supabase:**
   ```typescript
   import { transformUserToCreator, transformSupportToSupport } from '@/lib/supabase-transforms'

   const creators = dbUsers.map(u => transformUserToCreator(u, stats))
   const supports = dbSupports.map(s => transformSupportToSupport(s))
   ```

3. **When saving to Supabase:**
   ```typescript
   import { prepareCreatorForDB, prepareSupportForDB } from '@/lib/supabase-transforms'

   const dbData = prepareCreatorForDB(creator)
   await supabase.from('users').insert(dbData)
   ```

---

## 🧪 Testing

### Test Avatar Generation:
```typescript
import { getAvatarUrl, getInitials } from '@/lib/avatar-utils'

console.log(getInitials("John Doe")) // "JD"
console.log(getInitials("Alice")) // "AL"
console.log(getInitials("Bob Smith Johnson")) // "BJ"

const svg = getAvatarUrl(null, "Sarah Chen")
// Use in <img src={svg} />
```

### Test Transforms:
```typescript
const dbUser = {
  id: "123",
  wallet_address: "0xABC...",
  display_name: "Sarah Chen",
  coffee_price: 5.0,
  // ... etc
}

const creator = transformUserToCreator(dbUser)
console.log(creator.displayName) // "Sarah Chen"
console.log(creator.coffeePrice) // 5.0
```

---

## ⚠️ Breaking Changes

### None (backward compatible)

- Mock data still works as-is
- Transform utilities handle conversion
- Frontend code doesn't need immediate changes
- Gradual migration possible

---

## 📝 Next Steps

1. ✅ Schema updated (`supabase/schema.sql`)
2. ✅ Avatar utils created (`lib/avatar-utils.ts`)
3. ✅ Transform utils created (`lib/supabase-transforms.ts`)
4. 🔲 Apply schema to Supabase (run migration)
5. 🔲 Update components to use transform utilities
6. 🔲 Replace mock data with Supabase queries
7. 🔲 Test avatar generation in UI
8. 🔲 Test support creation flow
