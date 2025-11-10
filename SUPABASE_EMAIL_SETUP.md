# 📧 SUPABASE EMAIL OTP SETUP

## ✅ Code Implementation - TAMAMLANDI

- ✅ Custom hook: `hooks/use-email-otp.ts`
- ✅ Signup flow: Email OTP send & verify
- ✅ Database: `email_verified` flag update

---

## 🔧 SUPABASE DASHBOARD SETUP - YAPILACAK

### 1️⃣ Email Template Configuration

**Adımlar**:
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. **"Confirm signup"** template'ini seç
3. Template'i aşağıdaki gibi düzenle:

#### Subject Line:
```
Verify Your Cobbee Account
```

#### Email Body (HTML):
```html
<h2>Welcome to Cobbee!</h2>
<p>Thank you for signing up. Please verify your email address using the code below:</p>

<div style="background-color: #f0f0f0; border: 4px solid #000; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
  <h1 style="font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #0000FF;">{{ .Token }}</h1>
</div>

<p style="color: #666; font-size: 14px;">This code will expire in <strong>1 hour</strong>.</p>
<p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>

<hr style="border: 2px solid #000; margin: 30px 0;">
<p style="font-size: 12px; color: #999;">© Cobbee - Support your favorite creators</p>
```

#### Neo-Brutalist Style (Alternative):
```html
<div style="font-family: 'Arial Black', sans-serif; max-width: 600px; margin: 0 auto; background-color: #CCFF00; border: 4px solid #000; border-radius: 20px; padding: 40px;">
  <h1 style="font-size: 32px; color: #000; margin-bottom: 20px;">☕ Welcome to Cobbee!</h1>

  <p style="font-size: 18px; font-weight: bold; color: #000; margin-bottom: 30px;">
    Your verification code is:
  </p>

  <div style="background-color: #fff; border: 4px solid #000; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);">
    <h1 style="font-size: 56px; font-weight: 900; letter-spacing: 10px; margin: 0; color: #0000FF; text-align: center;">{{ .Token }}</h1>
  </div>

  <p style="font-size: 16px; font-weight: bold; color: #000; margin-top: 30px;">
    ⏰ This code expires in 1 hour
  </p>

  <p style="font-size: 14px; color: #666; margin-top: 20px;">
    If you didn't request this, ignore this email.
  </p>
</div>
```

**Önemli**: `{{ .Token }}` kısmını değiştirme! Bu Supabase'in OTP kodunu inject ettiği yer.

---

### 2️⃣ Email Settings Check

**Adımlar**:
1. Supabase Dashboard → **Authentication** → **Providers**
2. **Email** provider'ını kontrol et
3. **"Enable email provider"** checked olmalı

**Rate Limits (Default)**:
- OTP request: 60 saniyede bir
- OTP expiry: 1 saat
- Built-in SMTP: Development için yeterli

---

### 3️⃣ SMTP Configuration (Production İçin)

**Development**: Supabase built-in SMTP kullan (şimdilik yeterli)

**Production İçin**:
1. Supabase Dashboard → **Project Settings** → **Auth** → **SMTP Settings**
2. "Enable Custom SMTP" aç
3. SMTP provider seç (öneriler):
   - **Resend** (recommended, kolay setup)
   - **SendGrid** (güvenilir)
   - **AWS SES** (ucuz, ama karmaşık)

**Resend Setup** (Önerilen):
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) veya 587 (TLS)
SMTP User: resend
SMTP Password: [Resend API Key]
Sender Email: noreply@cobbee.fun
Sender Name: Cobbee
```

**Rate Limits**:
- Built-in SMTP: ~30 email/saat (development için OK)
- Custom SMTP: Provider'a göre değişir

---

### 4️⃣ Email Domain Verification (Production)

**Gerekli Durumlar**:
- Custom domain kullanıyorsan (`noreply@cobbee.fun`)
- Email deliverability önemliyse

**SPF Record** (DNS'e ekle):
```
v=spf1 include:_spf.resend.com ~all
```

**DKIM & DMARC**: Provider'ın dokümanına bak

---

## 🧪 TEST CHECKLIST

### Local Development Test:
1. ✅ Signup flow başlat
2. ✅ Wallet connect → Sign
3. ✅ Details doldur (name, username, **email**)
4. ✅ Submit → Email OTP gönderildi mi?
5. ✅ Email'i kontrol et (Supabase inboxinator kullanıyor dev'de)
6. ✅ 6-digit code'u gir
7. ✅ Verify → Dashboard'a yönlendir mi?
8. ✅ Database check: `public.users.email_verified = true` mi?

### Email Template Test:
1. Supabase Dashboard → Email Templates → **"Send test email"**
2. Kendi email'ine test gönder
3. Template'in doğru göründüğünü kontrol et

---

## 🔍 TROUBLESHOOTING

### "Email not sent" Hatası:
- **Sebep 1**: Email template yanlış configure edilmiş
  - **Çözüm**: Template'de `{{ .Token }}` var mı kontrol et
- **Sebep 2**: Rate limit
  - **Çözüm**: 60 saniye bekle, tekrar dene
- **Sebep 3**: SMTP issue
  - **Çözüm**: Supabase logs kontrol et

### "Invalid OTP" Hatası:
- **Sebep 1**: Kod expire olmuş (1 saat)
  - **Çözüm**: Yeni kod iste
- **Sebep 2**: Yanlış email
  - **Çözüm**: Email field'ını kontrol et
- **Sebep 3**: Typo
  - **Çözüm**: Kodu dikkatli gir

### Email Gelmiyor:
- **Development**: Supabase inboxinator kullanıyor (sınırlı)
- **Solution**: Gerçek email test et veya custom SMTP ekle

---

## 📊 CURRENT STATUS

### ✅ TAMAMLANAN:
- Custom hook (`use-email-otp.ts`)
- Signup flow integration
- OTP verification
- Database update (`email_verified`)

### 📝 YAPILACAK:
1. Supabase Dashboard → Email template setup
2. Test signup flow
3. (Optional) Custom SMTP setup for production

---

## 🎯 NEXT STEPS

1. **Şimdi**: Supabase email template'ini yukarıdaki gibi configure et
2. **Test**: Signup flow'u baştan sona test et
3. **Production**: Custom SMTP setup (Resend recommended)

---

## 💡 NOTES

- Email field **opsiyonel** - Web3 users email olmadan da signup olabilir
- Email sadece **notification** için - authentication için değil
- OTP verification başarısız olsa bile user dashboard'a girebilir (wallet authenticated)
- `email_verified = false` olan users'a bildirim gönderilmez (sonra implement edilecek)
