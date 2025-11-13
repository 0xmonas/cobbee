# Notifications System Setup Guide

## ✅ Tamamlanan İşlemler

### 1. Database Migration Oluşturuldu
**Dosya:** `supabase/migrations/20250113000000_create_notifications.sql`

**İçerik:**
- ✅ `notifications` tablosu
- ✅ Row Level Security (RLS) policies
- ✅ Otomatik trigger'lar (support ve milestone bildirimleri)
- ✅ Realtime publication (canlı güncellemeler)
- ✅ Helper functions (mark as read, delete, clear all)

### 2. React Hook Oluşturuldu
**Dosya:** `hooks/use-notifications.ts`

**Özellikler:**
- ✅ Supabase'den bildirimleri çekme
- ✅ Realtime subscription (canlı güncellemeler)
- ✅ Mark as read/unread
- ✅ Delete notification
- ✅ Clear all notifications
- ✅ Unread count

### 3. UI Component Güncellendi
**Dosya:** `components/notifications-menu.tsx`

**Değişiklikler:**
- ✅ Mock data kaldırıldı
- ✅ `useNotifications` hook entegre edildi
- ✅ Realtime güncellemeler aktif
- ✅ Tasarım korundu (100% aynı görünüm)

---

## 🚀 Kurulum Adımları

### 1. Migration'ı Supabase'e Yükle

**Option A: Supabase Dashboard (Önerilen)**
1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin
4. **New Query** tıklayın
5. `supabase/migrations/20250113000000_create_notifications.sql` dosyasının içeriğini kopyalayıp yapıştırın
6. **Run** butonuna tıklayın
7. ✅ Success mesajı görmelisiniz

**Option B: Supabase CLI**
```bash
cd /Users/mertcanokumuslar/Desktop/vibecode/code\ \(1\)
supabase db push
```

### 2. Database Types'ı Güncelle

Migration çalıştıktan sonra TypeScript types'ları güncelleyin:

```bash
# Supabase CLI ile types generate et
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts
```

**VEYA**

Supabase Dashboard'dan:
1. Settings > API > Project URL kopyalayın
2. Settings > API > anon public key kopyalayın
3. Şu komutu çalıştırın:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/types/database.types.ts
```

### 3. Realtime'ı Aktifleştir (Önemli!)

Supabase Dashboard'da:
1. **Database** > **Replication** > **Publications**
2. `supabase_realtime` publication'ını bulun
3. `notifications` tablosunun eklendiğinden emin olun
4. Eğer yoksa **Add table** ile ekleyin

### 4. Test Et

```bash
pnpm dev
```

1. Dashboard'a giriş yap
2. Sağ üstteki 🔔 bell icon'a tıkla
3. Boş "No notifications yet" mesajını göreceksin

---

## 📋 Bildirim Türleri

### 1. Support Notifications (Destek Bildirimleri)
**Tetikleme:** Birisi kahve satın aldığında otomatik

**Örnekler:**
- "John Doe bought you a coffee!" (1 kahve)
- "Jane Smith bought you 3 coffees!" (3+ kahve)

**Metadata:**
```json
{
  "supporter_name": "John Doe",
  "supporter_wallet": "0x123...",
  "coffee_count": 3,
  "total_amount": 15.00,
  "has_message": true,
  "message_preview": "Thanks for your work!"
}
```

### 2. Milestone Notifications (Başarı Bildirimleri)
**Tetikleme:** Belirli hedeflere ulaşıldığında otomatik

**Supporter Milestones:**
- 10, 25, 50, 100, 250, 500, 1000 supporters

**Earnings Milestones:**
- $100, $250, $500, $1000 (toplam kazanç)

**Monthly Earnings:**
- $100, $500, $1000 (aylık kazanç)

**Örnekler:**
- "Congratulations! You reached 100 supporters!"
- "Amazing! You've earned over $500!"
- "Great! You've earned $100 this month!"

---

## 🧪 Test Senaryoları

### 1. Manuel Test (Support Notification)

Supabase SQL Editor'da:

```sql
-- 1. Bir support oluştur (pending)
INSERT INTO public.supports (
  creator_id,
  supporter_name,
  supporter_wallet_address,
  coffee_count,
  coffee_price_at_time,
  total_amount,
  tx_hash,
  chain_id,
  status
) VALUES (
  'YOUR_USER_ID', -- Dashboard'daki user ID'nizi buraya
  'Test User',
  '0x1234567890abcdef',
  3,
  5.00,
  15.00,
  '0xtest123',
  1,
  'pending'
) RETURNING id;

-- 2. Status'u confirmed yap (bildirim tetiklenir!)
UPDATE public.supports
SET status = 'confirmed', confirmed_at = NOW()
WHERE id = 'SUPPORT_ID_FROM_ABOVE';
```

✅ Dashboard'da 🔔 icon'da bildirim görünmeli!

### 2. Milestone Test

```sql
-- 100 supporter milestone'u tetikle
-- (Önceden 99 support varsa, bir tane daha ekle)

INSERT INTO public.supports (
  creator_id,
  supporter_name,
  supporter_wallet_address,
  coffee_count,
  coffee_price_at_time,
  total_amount,
  tx_hash,
  chain_id,
  status
) VALUES (
  'YOUR_USER_ID',
  'Milestone Tester',
  '0xunique_wallet_100',
  1,
  5.00,
  5.00,
  '0xmilestone100',
  1,
  'confirmed'
);
```

✅ "Congratulations! You reached 100 supporters!" bildirimi gelecek!

---

## 🔍 Troubleshooting

### Problem 1: Bildirimler Gelmiyor
**Kontrol:**
```sql
-- Notifications tablosu var mı?
SELECT * FROM public.notifications LIMIT 1;

-- RLS policies aktif mi?
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Realtime publication var mı?
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
```

**Çözüm:**
1. Migration'ı tekrar çalıştır
2. Realtime publication'ı manuel ekle:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
   ```

### Problem 2: TypeScript Hataları
**Hata:** `Property 'notifications' does not exist on type 'Database'`

**Çözüm:**
```bash
# Types'ı yeniden generate et
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts
```

### Problem 3: Realtime Çalışmıyor
**Kontrol:**
```typescript
// Browser console'da:
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .limit(1)

console.log('Test:', data, error)
```

**Çözüm:**
1. Supabase Dashboard > Settings > API > Check Realtime is enabled
2. Browser console'da Realtime subscription status'u kontrol et
3. Network tab'de WebSocket connection'ı kontrol et

### Problem 4: Trigger Çalışmıyor
**Kontrol:**
```sql
-- Trigger var mı?
SELECT * FROM pg_trigger WHERE tgname LIKE 'notify%';

-- Function çalışıyor mu?
SELECT notify_creator_on_support();
```

**Çözüm:**
```sql
-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS notify_creator_on_support_confirmed ON public.supports;
CREATE TRIGGER notify_creator_on_support_confirmed
  AFTER INSERT OR UPDATE OF status ON public.supports
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION notify_creator_on_support();
```

---

## 📊 Database Schema

### notifications table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Creator (recipient) |
| `type` | TEXT | 'support' or 'milestone' |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification message |
| `related_support_id` | UUID | Link to supports table (nullable) |
| `metadata` | JSONB | Flexible data storage |
| `read` | BOOLEAN | Read status |
| `read_at` | TIMESTAMPTZ | When marked as read |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### Indexes
- `idx_notifications_user_id` - Fast user queries
- `idx_notifications_user_read` - Unread count
- `idx_notifications_user_unread_created` - Composite index for main query

---

## 🎯 Sonraki Adımlar (Opsiyonel)

### 1. Email Notifications
Settings'teki email notification toggle'ları çalışır hale getir:
- Yeni support geldiğinde email gönder
- Milestone'a ulaşıldığında email gönder

**Gerekli:**
- Resend API key
- Email template'leri
- Background job queue (Supabase Edge Functions)

### 2. Push Notifications
Web push notifications ekle:
- Browser permission iste
- Service worker kaydet
- Push subscription kaydet
- Notification trigger'larına push ekle

### 3. Notification Preferences
User'ların bildirim tercihlerini ayarlayabilmesi:
- Support notifications: on/off
- Milestone notifications: on/off
- Email notifications: on/off
- Push notifications: on/off

---

## 🔒 Güvenlik Uyarıları Düzeltildi

### 1. Function Search Path Mutable (8 Warning)
**Dosya:** `supabase/migrations/20250113000001_fix_search_path_security.sql`

**Düzeltme:**
Tüm `SECURITY DEFINER` function'lara `SET search_path = public, pg_temp` eklendi:
- ✅ `create_notification`
- ✅ `notify_creator_on_support`
- ✅ `check_and_notify_milestones`
- ✅ `mark_notification_read`
- ✅ `mark_all_notifications_read`
- ✅ `delete_notification`
- ✅ `clear_all_notifications`
- ✅ `get_unread_notification_count`

**Kurulum:**
```sql
-- Supabase Dashboard > SQL Editor'da çalıştır
-- 20250113000001_fix_search_path_security.sql içeriğini yapıştır
```

### 2. Leaked Password Protection (1 Warning)
**Dashboard'dan Aktifleştir:**
1. Supabase Dashboard > Authentication > Policies
2. **Password Strength** bölümünü bul
3. "Check passwords against HaveIBeenPwned" toggle'ını **ON** yap
4. ✅ Uyarı kaybolacak

**Neden Önemli:**
- Çalınmış/sızdırılmış şifreleri engelliyor
- HaveIBeenPwned.org database'i kontrol ediyor
- Kullanıcıların güvenliğini artırıyor

---

## ✅ Checklist

- [ ] Migration'ı Supabase'e yükle (`20250113000000_create_notifications.sql`)
- [ ] Security fix migration'ı yükle (`20250113000001_fix_search_path_security.sql`)
- [ ] Database types'ı güncelle
- [ ] Realtime publication'ı kontrol et
- [ ] Leaked password protection'ı aktifleştir
- [ ] Test support notification
- [ ] Test milestone notification
- [ ] Test mark as read
- [ ] Test delete notification
- [ ] Test clear all
- [ ] Test realtime updates (iki tab aç)
- [ ] Supabase linter'da tüm warning'ler temizlenmiş mi kontrol et
- [ ] Production'a deploy et

---

## 📞 Yardım

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin
2. Supabase Dashboard > Logs kontrol edin
3. Database logs kontrol edin
4. Bu README'yi tekrar okuyun

**Başarılar!** 🎉
