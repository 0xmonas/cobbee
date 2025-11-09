# Supabase Kurulum Dokümantasyonu - Cobbee

## 📋 İçindekiler
1. [Supabase Nedir?](#supabase-nedir)
2. [Kurulum Gereksinimleri](#kurulum-gereksinimleri)
3. [Temel Kurulum Adımları](#temel-kurulum-adımları)
4. [Client Yapılandırması](#client-yapılandırması)
5. [Authentication Setup](#authentication-setup)
6. [Supabase Özellikleri](#supabase-özellikleri)
7. [Cobbee için Öneriler](#cobbee-için-öneriler)

---

## Supabase Nedir?

**Supabase**, açık kaynaklı bir Firebase alternatifidir ve her projeye tam PostgreSQL veritabanı sağlar.

### Ana Özellikler:

✅ **Database** - Tam PostgreSQL veritabanı
- Tablo yönetimi (spreadsheet-like UI)
- SQL Editor
- Otomatik backup
- CSV/Excel import
- PostgreSQL extensions desteği

✅ **Auth** - Kimlik doğrulama ve yetkilendirme
- Email/Password
- Magic Links (Passwordless)
- OAuth (Google, GitHub, Discord, Apple, vb. 20+ provider)
- Phone Login (OTP)
- Enterprise SSO
- Web3 (Ethereum/Solana)
- Multi-Factor Authentication (MFA)
- Anonymous sign-ins

✅ **Storage** - Dosya yönetimi
- Herhangi boyutta dosya upload
- Global CDN (285+ şehir)
- Image optimization (otomatik resize/compress)
- S3-compatible API
- Resumable uploads

✅ **Realtime** - Canlı veri senkronizasyonu
- Database değişikliklerini dinleme
- Broadcast (client-to-client messaging)
- Presence (kullanıcı durumu tracking)
- WebSocket tabanlı

✅ **Edge Functions** - Serverless functions
- Deno runtime
- Global distribution

---

## Kurulum Gereksinimleri

### Gerekli Paketler:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",  // Ana client library
    "@supabase/ssr": "latest"           // Server-side rendering desteği
  },
  "devDependencies": {
    "supabase": "latest"                 // CLI (opsiyonel, local dev için)
  }
}
```

### Supabase Project

1. **Yeni Proje Oluşturma:**
   - https://database.new adresine git
   - Veya https://supabase.com/dashboard
   - Organization seç veya oluştur
   - Proje adı belirle
   - Database şifresi oluştur (GÜÇ LÜ olmalı!)
   - Region seç (önerilen: eu-central-1 veya us-east-1)

2. **API Keys Alma:**
   - Project Settings → API
   - `Project URL` kopyala
   - `anon/public` key kopyala (bu güvenli, client-side kullanılabilir)
   - `service_role` key **GİZLİ** (sadece server-side!)

---

## Temel Kurulum Adımları

### 1. Paket Kurulumu

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**Opsiyonel - CLI kurulumu (local development için):**
```bash
pnpm add supabase --save-dev
```

### 2. Environment Variables

**`.env.local` dosyası oluştur:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role (SADECE server-side!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database connection (ihtiyaç olursa)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

**`.env.example` dosyası oluştur:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

### 3. TypeScript Types (Opsiyonel ama Önerilir)

Supabase CLI ile database schema'dan otomatik TypeScript types oluşturulabilir:

```bash
# CLI login
npx supabase login

# Link project
npx supabase link --project-ref your-project-ref

# Generate types
npx supabase gen types typescript --linked > lib/database.types.ts
```

**Not:** Şu an migration yapmayacağız, bu adımı daha sonra uygulayacağız.

---

## Client Yapılandırması

### Klasör Yapısı

```
/lib/
  └── supabase/
      ├── client.ts       # Browser client (Client Components)
      ├── server.ts       # Server client (Server Components)
      └── middleware.ts   # Middleware client
```

### 1. Browser Client (Client Components için)

**`lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Kullanım:**

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const supabase = createClient()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('your_table').select()
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{JSON.stringify(data)}</div>
}
```

### 2. Server Client (Server Components için)

**`lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'ta cookie set edilemez
          }
        },
      },
    }
  )
}
```

**Kullanım:**

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('your_table').select()

  return <div>{JSON.stringify(data)}</div>
}
```

### 3. Middleware Client

**`lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ÖNEMLİ: Auth token'ı refresh et
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
```

### 4. Root Middleware

**`middleware.ts` (root dizinde)**

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Authentication Setup

### 1. Login Page (Server Actions ile)

**`app/login/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      redirect('/login?error=invalid-credentials')
    }

    redirect('/dashboard')
  }

  return (
    <form action={login}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  )
}
```

### 2. Signup Page

**`app/signup/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default function SignupPage() {
  async function signup(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Signup error:', error)
      redirect('/signup?error=signup-failed')
    }

    redirect('/signup?success=check-email')
  }

  return (
    <form action={signup}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

### 3. Auth Callback Handler

**`app/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error durumunda login'e yönlendir
  return NextResponse.redirect(`${origin}/login`)
}
```

### 4. Kullanıcı Bilgisine Erişim

**Server Component:**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()

  // ÖNEMLİ: getUser() kullan, getSession() değil!
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <div>Welcome {user.email}!</div>
}
```

**Client Component:**

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function ClientAuth() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (!user) return <div>Not logged in</div>

  return <div>Welcome {user.email}!</div>
}
```

### 5. Logout

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

---

## Supabase Özellikleri

### 1. Database Queries

**Select:**
```typescript
const { data, error } = await supabase
  .from('creators')
  .select('*')
```

**Insert:**
```typescript
const { data, error } = await supabase
  .from('creators')
  .insert({
    username: 'sarah',
    display_name: 'Sarah Johnson',
    bio: 'Coffee lover ☕'
  })
```

**Update:**
```typescript
const { data, error } = await supabase
  .from('creators')
  .update({ bio: 'Updated bio' })
  .eq('id', userId)
```

**Delete:**
```typescript
const { data, error } = await supabase
  .from('supports')
  .delete()
  .eq('id', supportId)
```

**Filtering:**
```typescript
const { data, error } = await supabase
  .from('supports')
  .select('*')
  .eq('creator_id', creatorId)
  .gte('amount', 10)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Joins (Relations):**
```typescript
const { data, error } = await supabase
  .from('supports')
  .select(`
    *,
    creator:creators (
      username,
      display_name
    )
  `)
```

### 2. Realtime Subscriptions

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function RealtimeSupports() {
  const [supports, setSupports] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    // İlk data'yı fetch et
    const fetchSupports = async () => {
      const { data } = await supabase.from('supports').select('*')
      setSupports(data || [])
    }
    fetchSupports()

    // Realtime subscription
    const channel = supabase
      .channel('supports-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // 'INSERT', 'UPDATE', 'DELETE' veya '*'
          schema: 'public',
          table: 'supports',
        },
        (payload) => {
          console.log('Change received!', payload)

          if (payload.eventType === 'INSERT') {
            setSupports((prev) => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setSupports((prev) =>
              prev.map((s) => (s.id === payload.new.id ? payload.new : s))
            )
          } else if (payload.eventType === 'DELETE') {
            setSupports((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <ul>
      {supports.map((support) => (
        <li key={support.id}>{support.supporter_name}</li>
      ))}
    </ul>
  )
}
```

### 3. Storage (File Upload)

**Upload:**
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-id/avatar.png', file, {
    cacheControl: '3600',
    upsert: true
  })
```

**Get Public URL:**
```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-id/avatar.png')

console.log(data.publicUrl)
```

**Download:**
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .download('user-id/avatar.png')
```

**Delete:**
```typescript
const { error } = await supabase.storage
  .from('avatars')
  .remove(['user-id/avatar.png'])
```

### 4. Edge Functions (Serverless)

**Invoke:**
```typescript
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Sarah' }
})
```

---

## Cobbee için Öneriler

### 1. Database Schema Planlaması

**Öneri tablolar (şimdilik sadece plan, migration daha sonra):**

```sql
-- creators tablosu
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  coffee_price DECIMAL DEFAULT 5.00,
  wallet_address TEXT, -- Blockchain wallet adresi
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- supports tablosu
CREATE TABLE supports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) NOT NULL,
  supporter_name TEXT NOT NULL,
  supporter_wallet TEXT, -- Supporter'ın wallet adresi
  coffee_count INTEGER NOT NULL,
  amount DECIMAL NOT NULL,
  message TEXT,
  transaction_hash TEXT, -- Blockchain tx hash
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications tablosu
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'new_support', 'milestone', etc.
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Authentication Stratejisi

**Önerilen flow:**

1. **Email/Password ile signup**
   - Email verification gerekli
   - Onaylandıktan sonra `/onboarding` sayfasına yönlendir

2. **Onboarding:**
   - Username seçimi (unique check)
   - Display name
   - Bio
   - Avatar upload (Supabase Storage)
   - `creators` tablosuna kayıt

3. **Protected Routes:**
   - `/dashboard` - Creator'ın paneli
   - `/profile/edit` - Profil düzenleme
   - `/settings` - Ayarlar

4. **Public Routes:**
   - `/[username]` - Creator profil sayfası
   - `/discover` - Creator keşfet
   - `/` - Landing page

### 3. Row Level Security (RLS) Politikaları

**Öneri RLS policies:**

```sql
-- creators tablosu
-- Public read, authenticated update (own record only)
CREATE POLICY "Anyone can view creators"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can update own creator profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id);

-- supports tablosu
-- Anyone can insert, creator can view their supports
CREATE POLICY "Anyone can insert supports"
  ON supports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can view their supports"
  ON supports FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));
```

### 4. Klasör Yapısı Önerisi

```
/lib/
  ├── supabase/
  │   ├── client.ts
  │   ├── server.ts
  │   └── middleware.ts
  ├── database.types.ts (auto-generated)
  └── queries/
      ├── creators.ts      # Creator queries
      ├── supports.ts      # Support queries
      └── notifications.ts # Notification queries

/app/
  ├── auth/
  │   ├── callback/route.ts
  │   ├── login/page.tsx
  │   └── signup/page.tsx
  ├── onboarding/page.tsx
  ├── dashboard/page.tsx
  └── [username]/page.tsx

/components/
  ├── auth/
  │   ├── login-form.tsx
  │   ├── signup-form.tsx
  │   └── logout-button.tsx
  └── providers/
      └── supabase-provider.tsx (opsiyonel)
```

### 5. Environment Variables

**`.env.local`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WalletConnect (RainbowKit ile birlikte)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### 6. Realtime Kullanım Senaryoları

**Cobbee için realtime önerileri:**

1. **Dashboard - Yeni destek bildirimleri:**
   ```tsx
   // Creator dashboard'da yeni support geldiğinde toast göster
   supabase
     .channel('new-supports')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'supports',
       filter: `creator_id=eq.${creatorId}`
     }, (payload) => {
       toast.success(`${payload.new.supporter_name} sent you ${payload.new.coffee_count} coffees!`)
     })
   ```

2. **Creator Profile - Live support counter:**
   ```tsx
   // Profil sayfasında total support sayısını realtime güncelle
   ```

### 7. Storage Kullanımı

**Avatar ve Cover Image için:**

```typescript
// Avatar upload
export async function uploadAvatar(file: File, userId: string) {
  const supabase = await createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return publicUrl
}
```

### 8. Güvenlik En İyi Pratikleri

**✅ Yapılması Gerekenler:**

1. **Her zaman `getUser()` kullan (server-side):**
   ```typescript
   // ✅ Güvenli
   const { data: { user } } = await supabase.auth.getUser()

   // ❌ GÜVENSİZ (server-side)
   const { data: { session } } = await supabase.auth.getSession()
   ```

2. **RLS (Row Level Security) aktif et:**
   - Tüm tablolarda RLS enable edilmeli
   - Politikalar dikkatlice tasarlanmalı

3. **Service Role Key'i SADECE server-side kullan:**
   - Client-side'da KESİNLİKLE kullanma
   - `.env.local` dosyasını git'e commit etme

4. **Input validation:**
   - Kullanıcı girdilerini her zaman validate et
   - SQL injection'dan korun (Supabase client otomatik korur)

5. **Rate limiting:**
   - Auth endpoints için rate limit ekle
   - API abuse'i önle

### 9. Performance İyileştirmeleri

**Caching stratejileri:**

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedCreator = unstable_cache(
  async (username: string) => {
    const supabase = await createClient()
    return await supabase
      .from('creators')
      .select('*')
      .eq('username', username)
      .single()
  },
  ['creator'],
  {
    revalidate: 60, // 60 saniye cache
    tags: ['creator']
  }
)
```

**Database indexes:**
```sql
-- Frequently queried columns için index
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_supports_creator_id ON supports(creator_id);
CREATE INDEX idx_supports_created_at ON supports(created_at DESC);
```

---

## Sonraki Adımlar

### Aşama 1: Temel Kurulum (Bugün)
1. ✅ Supabase paketlerini yükle
2. ✅ Supabase projesini oluştur
3. ✅ Environment variables ayarla
4. ✅ Client/Server utilities oluştur
5. ✅ Middleware kur

### Aşama 2: Authentication (Yarın)
1. ⏳ Login/Signup sayfaları
2. ⏳ Auth callback handler
3. ⏳ Protected routes
4. ⏳ User context/state management

### Aşama 3: Database Schema (Daha Sonra)
1. ❓ Migration dosyaları oluştur
2. ❓ RLS policies tanımla
3. ❓ Seed data ekle
4. ❓ TypeScript types generate et

### Aşama 4: Feature Integration (Gelecek)
1. ❓ Creator profilleri
2. ❓ Support sistemi
3. ❓ Realtime notifications
4. ❓ Storage (avatar/cover uploads)

---

## Kaynaklar

### Resmi Dokümantasyon:
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Guide:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **JavaScript Client:** https://supabase.com/docs/reference/javascript/introduction
- **Auth Guide:** https://supabase.com/docs/guides/auth
- **Database Guide:** https://supabase.com/docs/guides/database

### GitHub:
- **Supabase:** https://github.com/supabase/supabase
- **Next.js Template:** https://github.com/vercel/next.js/tree/canary/examples/with-supabase

---

## Notlar

**UYARI:** Bu dokümanda Supabase kurulum ve temel yapılandırma bilgileri verilmiştir. Migration, schema tasarımı ve production deployment konuları ayrı bir aşamada ele alınacaktır.

**GÜVENLİK:**
- `.env.local` dosyasını KESİNLİKLE git'e commit etmeyin
- Service role key'i sadece server-side kullanın
- Her zaman RLS policies ile database'i koruyun
- Production'da HTTPS kullanın
