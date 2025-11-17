# Storage Setup Guide

## ✅ Storage Buckets Configured

### Buckets Created:
1. **`avatars`** - Creator profile pictures
2. **`covers`** - Creator cover/banner images

### 🌐 Custom Domain Support:
- Set `NEXT_PUBLIC_STORAGE_URL` environment variable for custom domain
- **Flexible format:** Can be main domain or subdomain
- Without env var: Uses default Supabase URLs (for development)
- With env var: Transforms URLs to custom domain automatically

**URL Format Options:**
```bash
# Option 1: Main domain with path
NEXT_PUBLIC_STORAGE_URL=https://cobbee.fun/storage

# Option 2: Main domain without path
NEXT_PUBLIC_STORAGE_URL=https://cobbee.fun

# Option 3: Subdomain (cdn/media/assets/etc.)
NEXT_PUBLIC_STORAGE_URL=https://cdn.cobbee.fun
NEXT_PUBLIC_STORAGE_URL=https://media.cobbee.fun
NEXT_PUBLIC_STORAGE_URL=https://assets.cobbee.fun
```

**URL Transformation Examples:**
```
Default:  https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg

With cdn: https://cdn.cobbee.fun/avatars/user-id/avatar.jpg
With main: https://cobbee.fun/avatars/user-id/avatar.jpg
With path: https://cobbee.fun/storage/avatars/user-id/avatar.jpg
```

---

## 📊 Configuration

### Avatars Bucket
- **Max File Size:** 2MB
- **Allowed Types:** `image/jpeg`, `image/png`, `image/webp`
- **Recommended Size:** 400x400px (square)
- **Public Access:** ✅ Yes (read-only)
- **Path Structure:** `{userId}/avatar.{ext}`

### Covers Bucket
- **Max File Size:** 5MB
- **Allowed Types:** `image/jpeg`, `image/png`, `image/webp`
- **Recommended Size:** 1500x500px (wide)
- **Public Access:** ✅ Yes (read-only)
- **Path Structure:** `{userId}/cover.{ext}`

---

## 🔒 Security (RLS Policies)

### Read (SELECT)
- ✅ **Anyone** can view images (public buckets)

### Upload (INSERT)
- ✅ **Authenticated users** can upload to their own folder only
- ❌ Cannot upload to other users' folders

### Update
- ✅ **Owner** can update their own images
- ❌ Cannot update others' images

### Delete
- ✅ **Owner** can delete their own images
- ❌ Cannot delete others' images

### Policy Implementation:
```sql
-- Example: Upload policy
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explanation:**
- `auth.uid()::text` = Current user's ID
- `(storage.foldername(name))[1]` = First folder in path
- Path must be: `{userId}/filename.ext`

---

## 🧹 Auto Cleanup

### Triggers Configured:

1. **Update Avatar/Cover**
   - Old file automatically deleted when URL changes
   - Prevents orphaned files

2. **Delete User**
   - All user's files (avatar + cover) deleted automatically
   - Cascade cleanup on account deletion

### How It Works:
```sql
-- Trigger: cleanup_old_avatar
-- Fires: BEFORE UPDATE OF avatar_url
-- Action: Deletes old file from storage

-- Trigger: cleanup_user_files_on_delete
-- Fires: BEFORE DELETE ON users
-- Action: Deletes all user's files
```

---

## 💻 Frontend Usage

### 1. Upload Avatar

```typescript
import { uploadAvatar, compressAvatar } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase/client'

async function handleAvatarUpload(file: File, userId: string) {
  // Optional: Compress before upload (recommended)
  const compressed = await compressAvatar(file)

  // Upload to storage
  const result = await uploadAvatar(compressed, userId)

  if (result.success) {
    // Update user profile in database
    const supabase = createClient()
    await supabase
      .from('users')
      .update({ avatar_url: result.url })
      .eq('id', userId)

    console.log('Avatar uploaded:', result.url)
  } else {
    console.error('Upload failed:', result.error)
  }
}
```

### 2. Upload Cover

```typescript
import { uploadCover, compressCover } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase/client'

async function handleCoverUpload(file: File, userId: string) {
  // Optional: Compress before upload (recommended)
  const compressed = await compressCover(file)

  // Upload to storage
  const result = await uploadCover(compressed, userId)

  if (result.success) {
    // Update user profile in database
    const supabase = createClient()
    await supabase
      .from('users')
      .update({ cover_image_url: result.url })
      .eq('id', userId)

    console.log('Cover uploaded:', result.url)
  } else {
    console.error('Upload failed:', result.error)
  }
}
```

### 3. Delete Avatar/Cover

```typescript
import { deleteAvatar, deleteCover } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase/client'

async function handleDeleteAvatar(userId: string) {
  // Delete from storage
  const success = await deleteAvatar(userId)

  if (success) {
    // Update database (set to null)
    const supabase = createClient()
    await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', userId)
  }
}

async function handleDeleteCover(userId: string) {
  // Delete from storage
  const success = await deleteCover(userId)

  if (success) {
    // Update database (set to null)
    const supabase = createClient()
    await supabase
      .from('users')
      .update({ cover_image_url: null })
      .eq('id', userId)
  }
}
```

### 4. React Component Example

```typescript
'use client'

import { useState } from 'react'
import { uploadAvatar, compressAvatar } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase/client'

export function AvatarUpload({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Compress
      const compressed = await compressAvatar(file)

      // Upload
      const result = await uploadAvatar(compressed, userId)

      if (!result.success) {
        setError(result.error || 'Upload failed')
        return
      }

      // Update database
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: result.url })
        .eq('id', userId)

      if (dbError) {
        setError(dbError.message)
        return
      }

      // Success - reload page or update state
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

---

## 🧪 Testing

### Test Upload Limits:

1. **File Size**
   - ✅ Upload 1MB avatar → Should succeed
   - ❌ Upload 5MB avatar → Should fail (>2MB limit)
   - ✅ Upload 4MB cover → Should succeed
   - ❌ Upload 10MB cover → Should fail (>5MB limit)

2. **MIME Types**
   - ✅ Upload JPEG → Should succeed
   - ✅ Upload PNG → Should succeed
   - ✅ Upload WebP → Should succeed
   - ❌ Upload PDF → Should fail (not allowed)
   - ❌ Upload GIF → Should fail (not allowed)

3. **Security**
   - ❌ User A cannot upload to User B's folder
   - ❌ User A cannot delete User B's images
   - ✅ User A can only manage their own images

### Test Cleanup:

1. **Update Avatar**
   - Upload avatar1.jpg
   - Upload avatar2.jpg
   - ✅ avatar1.jpg should be auto-deleted

2. **Delete User**
   - Create user with avatar + cover
   - Delete user account
   - ✅ Both files should be auto-deleted

---

## 📋 Migration Checklist

### To Apply Storage Setup:

1. ✅ Run migration:
   ```bash
   # Apply via Supabase CLI
   supabase db push

   # Or run SQL directly in Supabase Studio
   ```

2. ✅ Verify buckets created:
   ```sql
   SELECT * FROM storage.buckets WHERE id IN ('avatars', 'covers');
   ```

3. ✅ Verify policies:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id IN ('avatars', 'covers');
   ```

4. ✅ Test upload via Supabase Studio:
   - Go to Storage tab
   - Select `avatars` bucket
   - Try uploading image

5. ✅ Test from frontend:
   - Use `AvatarUpload` component
   - Upload image
   - Verify URL saved to database
   - Verify image accessible publicly

---

## 🚨 Troubleshooting

### Error: "new row violates row-level security policy"
**Cause:** User trying to upload to wrong folder or not authenticated

**Fix:** Ensure path is `{userId}/filename.ext` and user is logged in

### Error: "File size exceeds maximum allowed"
**Cause:** File larger than bucket limit (2MB for avatars, 5MB for covers)

**Fix:** Compress image before upload using `compressAvatar()` or `compressCover()`

### Error: "Invalid MIME type"
**Cause:** Trying to upload non-image file (e.g., PDF, GIF)

**Fix:** Only allow JPEG, PNG, WebP in file input:
```html
<input type="file" accept="image/jpeg,image/png,image/webp" />
```

### Old files not being cleaned up
**Cause:** Triggers may not be enabled

**Fix:** Check triggers exist:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%cleanup%';
```

---

## 📚 References

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads/standard-uploads)

---

## 🌐 Custom Domain Configuration

### Setup Steps:

1. **Add Custom Domain to Supabase:**
   - Go to Supabase Dashboard → Settings → Storage
   - Configure custom domain (choose any format you prefer):
     - Subdomain: `cdn.cobbee.fun` / `media.cobbee.fun` / `assets.cobbee.fun`
     - Main domain: `cobbee.fun`
     - With path: `cobbee.fun/storage`
   - Point your DNS CNAME to Supabase storage endpoint

2. **Add Environment Variable:**
   ```bash
   # .env.local (development)
   # Choose ONE of these formats:
   NEXT_PUBLIC_STORAGE_URL=https://cobbee.fun          # Main domain
   NEXT_PUBLIC_STORAGE_URL=https://cdn.cobbee.fun      # Subdomain
   NEXT_PUBLIC_STORAGE_URL=https://cobbee.fun/storage  # With path

   # Vercel (production)
   # Add in Vercel dashboard: Settings → Environment Variables
   # Use the same format as development
   ```

3. **Verify Configuration:**
   - Upload an avatar/cover image
   - Right-click → Open in new tab
   - URL should show your custom domain:
     - `https://cobbee.fun/avatars/...` OR
     - `https://cdn.cobbee.fun/avatars/...` OR
     - `https://cobbee.fun/storage/avatars/...`
   - NOT: `https://xxx.supabase.co/storage/...`

### How It Works:

- `lib/storage-utils.ts` automatically transforms URLs
- SQL cleanup functions work with both URL formats
- No code changes needed when switching domains
- Development: Uses Supabase URLs
- Production: Uses custom domain

---

## 🎯 Summary

✅ **Buckets:** avatars (2MB), covers (5MB)
✅ **Security:** RLS policies for read/write/delete
✅ **Validation:** File size + MIME type restrictions
✅ **Cleanup:** Auto-delete old files on update/delete
✅ **Frontend:** Helper utilities in `lib/storage-utils.ts`
✅ **Compression:** Optional image compression before upload
✅ **Custom Domain:** Configurable via `NEXT_PUBLIC_STORAGE_URL` env variable

**Ready to use!** 🚀
