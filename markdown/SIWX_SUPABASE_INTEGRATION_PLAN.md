# SIWX + Supabase Entegrasyon Planı

## Özet

**Hayır, SIWX için ekstra Supabase eklemesi GEREKMEZ.**

Ancak Supabase'i **kullanıcı verilerini saklamak** için kullanacaksanız (creator profilleri, destek kayıtları, vb.), wallet authentication ile Supabase'i **senkronize etmemiz** gerekir.

---

## SIWX Nedir?

**SIWX (Sign In With X)** = Blockchain cüzdan tabanlı kimlik doğrulama sistemi
- Multi-chain desteği (Ethereum, Polygon, Solana, Bitcoin)
- CAIP-122 standardına uygun
- Kullanıcı cüzdanıyla mesaj imzalayarak kimliğini kanıtlar
- **SIWE'nin yeni versiyonu** (SIWE = Ethereum only, SIWX = multi-chain)

---

## Reown'un Önerileri

### 1. **Reown Authentication (ÖNERİLEN)**

✅ **En kolay ve önerilen yöntem**

**Avantajları:**
- ✅ **Zero backend code** - Reown Cloud tüm session management'ı halleder
- ✅ **Reown Dashboard** - Tüm user sessions'ları görebilirsiniz
- ✅ **Multi-chain** - EVM, Solana, Bitcoin desteği
- ✅ **Built-in analytics** - Ocak 2025'te eklendi
- ✅ **Production-ready** - Güvenilir ve bakımı kolay

**Kurulum:**
```typescript
import { ReownAuthentication } from '@reown/appkit-siwx'

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, base],
  siwx: new ReownAuthentication({
    // Opsiyonel konfigürasyon
    required: true, // Authentication zorunlu mu? (default: true)
    localAuthStorageKey: '@appkit/siwx-auth-token', // Custom storage key
    localNonceStorageKey: '@appkit/siwx-nonce-token'
  })
})
```

**Ne zaman kullanmalı:**
- Hızlı prototipleme
- Backend yazmak istemiyorsanız
- Reown Dashboard'dan session yönetimi istiyorsanız
- Production ortamı için güvenilir çözüm

---

### 2. **Custom SIWX Implementation**

⚠️ **Sadece özel gereksinimler varsa**

**Ne zaman kullanmalı:**
- Kendi backend'inizi kullanmak istiyorsanız
- Session logic'i üzerinde tam kontrol istiyorsanız
- Özel iş kuralları gerekiyorsa

**Gerekli Interface:**
```typescript
interface SIWXConfig {
  createMessage: (args: SIWXCreateMessageArgs) => Promise<string>
  addSession: (session: SIWXSession) => Promise<void>
  revokeSession: (chainId: string, address: string) => Promise<void>
  setSessions: (sessions: SIWXSession[]) => Promise<void>
  getSessions: (chainId?: string, address?: string) => Promise<SIWXSession[]>
}
```

**Backend gereksinimleri:**
- Nonce generation endpoint
- Message verification endpoint
- Session storage (database veya cache)
- Session expiry management

---

## SIWX + Supabase Entegrasyonu

### Senaryo 1: Reown Authentication + Supabase (ÖNERİLEN)

**Akış:**
1. **SIWX Authentication** → Reown Cloud (session management)
2. **User onboarding** → Wallet address ile Supabase'de user kaydı oluştur
3. **User data** → Creator profilleri, destekler, ayarlar Supabase'de saklanır

**Avantajları:**
- ✅ Reown Cloud authentication'ı halleder
- ✅ Supabase sadece data storage için kullanılır
- ✅ Her iki sistemin güçlü yönlerini kullanırsınız
- ✅ Minimal backend kodu

**Implementasyon:**

```typescript
// 1. SIWX config
import { ReownAuthentication } from '@reown/appkit-siwx'

const siwx = new ReownAuthentication({
  onSignIn: async (session) => {
    // SIWX authentication başarılı
    // Supabase'de user kaydı oluştur veya güncelle
    await syncUserToSupabase(session.address, session.chainId)
  },
  onSignOut: async () => {
    // Supabase session'ını temizle (opsiyonel)
    await clearSupabaseSession()
  }
})

// 2. User sync fonksiyonu
async function syncUserToSupabase(address: string, chainId: number) {
  const supabase = createClient()

  // User var mı kontrol et
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', address)
    .single()

  if (!existingUser) {
    // Yeni user oluştur
    await supabase.from('users').insert({
      wallet_address: address,
      chain_id: chainId,
      created_at: new Date().toISOString()
    })
  }
}
```

**Database Schema (Supabase):**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  coffee_price DECIMAL DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Supports table
CREATE TABLE supports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id),
  supporter_address TEXT NOT NULL,
  coffee_count INTEGER NOT NULL,
  amount DECIMAL NOT NULL,
  message TEXT,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (wallet_address = current_setting('app.current_wallet_address'));
```

---

### Senaryo 2: Custom SIWX + Supabase Backend

⚠️ **Sadece özel gereksinimler varsa önerilir**

**Akış:**
1. **SIWX Authentication** → Custom backend (Next.js API routes)
2. **Session storage** → Supabase sessions table
3. **User data** → Supabase database

**Backend requirements:**
- API Routes: `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/session`
- Supabase: `sessions` table, `users` table
- Message verification logic

---

## SSR/CSR/Cookie/Session Önerileri

### Reown Authentication ile:

**SSR Pattern (Next.js App Router):**
```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  const headersList = await headers()
  const cookies = headersList.get('cookie')

  return (
    <ContextProvider cookies={cookies}>
      {children}
    </ContextProvider>
  )
}
```

**Session Storage:**
- ✅ **Local Storage** - Reown Authentication otomatik kullanır
- ✅ **Cookie-based** - SSR için cookie header
- ✅ **Reown Cloud** - Backend session management

**Session Lifecycle:**
- **Auto-refresh** - 5 dakikada bir (default)
- **Sign out on disconnect** - Wallet disconnect olunca session temizlenir
- **Sign out on network change** - Network değişince yeniden imza ister

---

## Cobbee İçin Önerilen Yaklaşım

### ✅ **Reown Authentication + Supabase Hybrid**

**Neden bu yaklaşım:**
1. ✅ **Hız** - Reown Cloud ile hızlıca production'a çıkabilirsiniz
2. ✅ **Güvenlik** - Reown'un test edilmiş authentication sistemi
3. ✅ **Esneklik** - Supabase ile user data'yı istediğiniz gibi yönetebilirsiniz
4. ✅ **Dashboard** - Reown Dashboard'da tüm sessions'ları görebilirsiniz
5. ✅ **Multi-chain** - Gelecekte Solana, Bitcoin desteği ekleyebilirsiniz

**Implementation Steps:**

### Aşama 1: Reown Authentication Kurulumu
```bash
pnpm add @reown/appkit-siwx
```

### Aşama 2: SIWX Config
```typescript
// config/siwx.ts
import { ReownAuthentication } from '@reown/appkit-siwx'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'

export const siwxConfig = new ReownAuthentication({
  required: true,
  onSignIn: async (session) => {
    // User'ı Supabase'e sync et
    await syncUserToSupabase(session.address, session.chainId)
  }
})
```

### Aşama 3: AppKit'e Ekle
```typescript
// context/index.tsx
import { siwxConfig } from '@/config/siwx'

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, base],
  siwx: siwxConfig // ← SIWX ekle
})
```

### Aşama 4: Supabase Schema
```sql
-- users, supports, settings tables
-- RLS policies
-- Indexes
```

### Aşama 5: User Sync Logic
```typescript
// lib/supabase/sync-user.ts
export async function syncUserToSupabase(
  address: string,
  chainId: number
) {
  // Supabase'de user oluştur/güncelle
}
```

---

## Onboarding Flow

**Login/Signup Akışı:**
```
1. User "Connect Wallet" tıklar
   ↓
2. AppKit modal açılır, wallet seçimi
   ↓
3. Wallet bağlanır
   ↓
4. SIWX message sign ister (Reown Authentication)
   ↓
5. User imzalar
   ↓
6. Reown Cloud session oluşturur
   ↓
7. `onSignIn` callback tetiklenir
   ↓
8. Supabase'de user kaydı kontrol edilir
   ↓
9a. User varsa → Dashboard'a yönlendir
9b. User yoksa → Onboarding flow'a yönlendir (username, bio, vs.)
```

**Onboarding Steps:**
1. Welcome screen
2. Username seç
3. Display name, bio ekle (opsiyonel)
4. Avatar upload (opsiyonel)
5. Coffee price ayarla
6. Profile oluştur → Supabase'e kaydet

---

## Logging & Analytics

**SIWX Authentication Events:**
- ✅ **Reown Dashboard** - Reown Cloud'da otomatik tracking
- ✅ **Built-in Analytics** - Ocak 2025'te eklendi

**User Activity Logging (Supabase):**
```sql
-- activity_logs table (opsiyonel)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Custom Events:**
```typescript
// lib/analytics.ts
export async function logActivity(
  userId: string,
  eventType: string,
  eventData: any
) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    event_type: eventType,
    event_data: eventData
  })
}

// Kullanım
await logActivity(userId, 'profile_updated', { field: 'bio' })
await logActivity(userId, 'support_sent', { creator: 'sarah', amount: 25 })
```

---

## Environment Variables

```bash
# .env.local

# Supabase (mevcut)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# WalletConnect / Reown AppKit (mevcut)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# SIWX için ekstra env variable GEREKMEZ
# Reown Authentication kendi Cloud service'ini kullanır
```

---

## Sonuç ve Tavsiye

### ✅ **Reown Authentication Kullanın**

**Sebep:**
1. **Zero backend** - Session management Reown Cloud'da
2. **Production-ready** - Güvenilir ve test edilmiş
3. **Dashboard** - Reown Dashboard'da tüm sessions'ları görebilirsiniz
4. **Future-proof** - Multi-chain desteği hazır
5. **Minimal code** - Sadece `onSignIn` callback'te Supabase sync yapın

**Supabase Rolü:**
- ✅ User profilleri (username, bio, avatar, vs.)
- ✅ Creator settings (coffee price, payment info)
- ✅ Support kayıtları (tx history)
- ✅ Activity logs (opsiyonel)
- ❌ Authentication/session management (Reown halleder)

**Ekstra Supabase Eklemesi Gerekmez:**
- ❌ Sessions table (Reown Cloud'da)
- ❌ Nonce management (Reown Cloud'da)
- ❌ Message verification logic (Reown Cloud'da)

---

## Next Steps

1. ✅ `@reown/appkit-siwx` paketi kur
2. ✅ `ReownAuthentication` config oluştur
3. ✅ `createAppKit`'e `siwx` parametresi ekle
4. ✅ Supabase schema oluştur (users, supports tables)
5. ✅ `onSignIn` callback'te user sync logic yaz
6. ✅ Onboarding flow UI'ı hazırla (mevcut tasarımlarınızı kullanarak)
7. ✅ Test et

---

**Özet:** Reown Authentication kullanın, sadece `onSignIn` callback'inde wallet address'i Supabase'e kaydedin. Session management Reown Cloud'da, user data Supabase'de. Basit, güvenli, production-ready.
