 Kritik Analiz: Supabase SIWE Implementation
⚠️ BÜYÜK SORUN 1: Blacklist Check Eksik!
Mevcut Kod (signup/page.tsx:59-99):
const handleSignMessage = async () => {
  // ...
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'ethereum',
    statement: '...',
  })
  
  // ❌ BLACKLIST CHECK YOK!
  // Supabase Auth session oluşturdu bile
}
Sorun:
Blacklisted wallet sign edebiliyor
auth.users kaydı oluşuyor
Session veriliyor
SONRA blacklist check yapmak geç!
Çözüm: BEFORE Supabase SIWE:
const handleSignMessage = async () => {
  if (!address) return

  setIsSigning(true)
  try {
    // ✅ 1. ÖNCE BLACKLIST CHECK
    const { data: isBlacklisted } = await supabase.rpc('is_wallet_blacklisted', {
      p_wallet_address: address
    })

    if (isBlacklisted) {
      alert('Your wallet is banned from the platform')
      return
    }

    // ✅ 2. SONRA SUPABASE SIWE
    const { data, error } = await supabase.auth.signInWithWeb3({...})
  }
}
⚠️ BÜYÜK SORUN 2: Profile Completeness Check Eksik!
Mevcut Kod (signup/page.tsx:82-92):
if (data.session) {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    setWalletAddress(address)
    setSignupStep("details")  // ❌ HER ZAMAN DETAILS'E GİDİYOR
  }
}
Sorun:
Eğer user zaten kayıtlı ise (public.users var)?
TEKRAR onboarding'e gönderiyoruz!
Dashboard'a yönlendirme yok
Doğru Flow:
if (data.session) {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // ✅ CHECK: public.users var mı?
    const { data: profile } = await supabase
      .from('users')
      .select('username, display_name')
      .eq('id', user.id)
      .single()

    if (profile && profile.username) {
      // ✅ Already registered
      router.push('/dashboard')
    } else {
      // ✅ Incomplete signup
      setWalletAddress(address)
      setSignupStep("details")
    }
  }
}
⚠️ BÜYÜK SORUN 3: Duplicate Signup Prevention Yok!
Senaryo:
1. User Web3 signup → Sign ✅
2. auth.users oluştu
3. User sayfayı kapattı (onboarding tamamlamadı)
4. Tekrar /signup'a geldi
5. Tekrar "Connect Wallet" → Sign
6. Supabase: "User already exists" hatası
7. ❌ Frontend bu hatayı handle etmiyor!
Çözüm:
const { data, error } = await supabase.auth.signInWithWeb3({...})

if (error) {
  if (error.message.includes('already exists') || error.message.includes('already registered')) {
    // ✅ Existing user - check if profile complete
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (profile?.username) {
        // Complete profile exists
        router.push('/dashboard')
      } else {
        // Incomplete profile
        setSignupStep("details")
      }
    }
  } else {
    console.error('Supabase SIWE error:', error)
  }
  return
}
⚠️ BÜYÜK SORUN 4: email_verification_tokens Policy Hatası
Schema (schema.sql:304-305):
CREATE POLICY "Users can view their own email tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (email = current_setting('request.jwt.claim.email', true));
Sorun:
request.jwt.claim.email Supabase'de YOK!
Supabase JWT'de email claim'i farklı yerde: user_metadata.email
Düzeltme:
-- ❌ YANLIŞ
USING (email = current_setting('request.jwt.claim.email', true));

-- ✅ DOĞRU (Supabase için)
USING (email = (auth.jwt() -> 'email')::text);
VEYA basitleştir:
-- Email tokens public olabilir (OTP expire olacak zaten)
CREATE POLICY "Anyone can view valid tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (expires_at > NOW() AND used = false);
⚠️ BÜYÜK SORUN 5: Wallet Address Extract Hatası
Şu An:
// Supabase raw_user_meta_data:
{
  "sub": "web3:ethereum:0xABC...",
  "custom_claims": {
    "address": "0xABC...",
    "network": "8453"
  }
}
Sorun:
custom_claims.address her zaman lowercase mı?
Checksum address kontrolü yok
public.users'a kayıt yaparken nasıl alınacak?
Çözüm:
// Wallet address extract helper
function getWalletAddressFromUser(user: User): string | null {
  const address = user.user_metadata?.custom_claims?.address
  if (!address) return null
  
  // Normalize to lowercase (database'de lowercase saklayalım)
  return address.toLowerCase()
}

// Usage
const walletAddress = getWalletAddressFromUser(user)
if (!walletAddress) {
  console.error('Wallet address not found in user metadata')
  return
}
⚠️ BÜYÜK SORUN 6: public.users INSERT Eksik!
Mevcut Kod:
setSignupStep("details")  // ✅ Details step'e gidiyor
Ama details step'de submit olunca ne oluyor? Şu an signup/page.tsx'de handleDetailsSubmit yok! Gerekli:
const handleDetailsSubmit = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No authenticated user')
    return
  }

  // Get wallet address from user metadata
  const walletAddress = user.user_metadata?.custom_claims?.address?.toLowerCase()

  // Insert into public.users
  const { error } = await supabase.from('users').insert({
    id: user.id,  // ✅ MUST match auth.users.id
    wallet_address: walletAddress,
    email: null,  // Web3 user
    username: username.toLowerCase(),
    display_name: name,
    bio: null,
    coffee_price: 5.00,
    is_active: true
  })

  if (error) {
    if (error.code === '23505') {  // Unique constraint violation
      if (error.message.includes('username')) {
        setFormErrors({ username: 'Username already taken' })
      }
    } else {
      console.error('Profile creation error:', error)
    }
    return
  }

  // ✅ Success
  router.push('/dashboard')
}
⚠️ BÜYÜK SORUN 7: RLS Policy - auth.uid() vs JWT
Schema'daki Policies:
CREATE POLICY "Users can create their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
Soru: auth.uid() Supabase'de her zaman çalışır mı? Cevap: ✅ EVET, ama dikkat:
auth.uid() → auth.users.id döner
Client-side'da çalışır (anon key)
Server-side'da çalışır (service_role key bypass eder)
Potansiyel Sorun:
Eğer session expire olursa?
auth.uid() NULL döner
INSERT FAIL
Güvenlik Check:
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  console.error('Session expired')
  router.push('/login')
  return
}

// THEN insert
const { error } = await supabase.from('users').insert({...})
⚠️ BÜYÜK SORUN 8: Network ID Mismatch
Supabase Data:
"network": "8453"  // String
Schema:
chain_id INTEGER NOT NULL
Sorun: Type mismatch! Çözüm:
const chainId = parseInt(user.user_metadata?.custom_claims?.network || '8453')

await supabase.from('supports').insert({
  chain_id: chainId,  // ✅ Integer
  // ...
})
⚠️ BÜYÜK SORUN 9: Session Management Eksik
Mevcut Durum:
Session oluşturuluyor
Cookie'ye kaydediliyor
Ama refresh mechanism yok!
Supabase Session Expiry:
Default: 1 saat
Refresh token: 24 saat
Gerekli (lib/supabase/middleware.ts):
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ✅ IMPORTANT: Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}
Root middleware.ts:
// middleware.ts (root)
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
⚠️ BÜYÜK SORUN 10: Error Handling Zayıf
Mevcut:
if (error) {
  console.error('Supabase SIWE error:', error)
  return  // ❌ User'a feedback yok
}
Gerekli:
const [errorMessage, setErrorMessage] = useState<string | null>(null)

if (error) {
  let userMessage = 'Sign-in failed. Please try again.'
  
  if (error.message.includes('already exists')) {
    userMessage = 'This wallet is already registered. Please login.'
  } else if (error.message.includes('banned')) {
    userMessage = 'Your wallet is banned from the platform.'
  } else if (error.message.includes('rejected')) {
    userMessage = 'Signature rejected. Please try again.'
  }
  
  setErrorMessage(userMessage)
  return
}
📊 Kör Noktalar Özeti
#	Sorun	Etki	Çözüm Gerekli Mi?
1	Blacklist check eksik	⚠️ HIGH	✅ EVET
2	Profile completeness check eksik	⚠️ HIGH	✅ EVET
3	Duplicate signup handling yok	⚠️ MEDIUM	✅ EVET
4	email_verification_tokens policy hatası	⚠️ LOW	⚠️ Email auth eklenince
5	Wallet address extract standardı yok	⚠️ MEDIUM	✅ EVET
6	public.users INSERT eksik	⚠️ HIGH	✅ EVET
7	Session expiry handling yok	⚠️ MEDIUM	✅ EVET
8	Network ID type mismatch	⚠️ LOW	⚠️ Supports eklenince
9	Middleware session refresh yok	⚠️ HIGH	✅ EVET
10	Error messages user-friendly değil	⚠️ LOW	⚠️ İyileştirme
🎯 Öncelikli Düzeltmeler (Hemen Yapılmalı)
1. handleSignMessage Fix (Critical):
const handleSignMessage = async () => {
  if (!address) return
  
  setIsSigning(true)
  setErrorMessage(null)
  
  try {
    // 1. Blacklist check
    const { data: isBlacklisted } = await supabase.rpc('is_wallet_blacklisted', {
      p_wallet_address: address.toLowerCase()
    })
    
    if (isBlacklisted) {
      setErrorMessage('Your wallet is banned from the platform')
      return
    }
    
    // 2. Supabase SIWE
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: 'ethereum',
      statement: 'Welcome to Cobbee!...',
    })
    
    if (error) {
      // Handle duplicate
      if (error.message.includes('already exists')) {
        // Try to get user and check profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single()
          
          if (profile?.username) {
            router.push('/dashboard')
            return
          } else {
            setWalletAddress(address)
            setSignupStep("details")
            return
          }
        }
      }
      
      setErrorMessage('Sign-in failed. Please try again.')
      return
    }
    
    // 3. Check profile completeness
    if (data.session) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('id', user.id)
          .single()
        
        if (profile && profile.username) {
          router.push('/dashboard')
        } else {
          setWalletAddress(address)
          setSignupStep("details")
        }
      }
    }
  } catch (error) {
    console.error('Sign message error:', error)
    setErrorMessage('An unexpected error occurred')
  } finally {
    setIsSigning(false)
  }
}