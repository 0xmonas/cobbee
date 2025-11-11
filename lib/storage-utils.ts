/**
 * Storage Utilities
 * Helper functions for Supabase Storage (avatars & covers)
 * Supports custom domain configuration via NEXT_PUBLIC_STORAGE_URL
 */

import { createClient as createClientSide } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get storage base URL (custom domain or default Supabase)
 * Set NEXT_PUBLIC_STORAGE_URL in .env.local for custom domain
 * Example: NEXT_PUBLIC_STORAGE_URL=https://cdn.cobbee.fun
 */
function getStorageBaseUrl(): string {
  // Use custom domain if configured
  const customDomain = process.env.NEXT_PUBLIC_STORAGE_URL
  if (customDomain) {
    return customDomain.endsWith('/') ? customDomain.slice(0, -1) : customDomain
  }

  // Fallback to Supabase URL (for development/testing)
  return '' // Will use Supabase's default getPublicUrl()
}

/**
 * Transform Supabase URL to custom domain URL if configured
 */
function transformStorageUrl(supabaseUrl: string): string {
  const customBaseUrl = getStorageBaseUrl()

  // If no custom domain configured, return original URL
  if (!customBaseUrl) {
    return supabaseUrl
  }

  // Extract bucket and path from Supabase URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
  const match = supabaseUrl.match(/\/storage\/v1\/object\/public\/(.+)$/)
  if (match) {
    // Return custom domain URL: https://cdn.cobbee.fun/{bucket}/{path}
    return `${customBaseUrl}/${match[1]}`
  }

  // If URL format doesn't match, return as-is
  return supabaseUrl
}

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ImageValidation {
  valid: boolean
  error?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB: number
    allowedTypes: string[]
    minWidth?: number
    minHeight?: number
  }
): Promise<ImageValidation> {
  return new Promise((resolve) => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > options.maxSizeMB) {
      resolve({
        valid: false,
        error: `File size must be less than ${options.maxSizeMB}MB (current: ${fileSizeMB.toFixed(2)}MB)`
      })
      return
    }

    // Check MIME type
    if (!options.allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `File type must be ${options.allowedTypes.join(', ')} (current: ${file.type})`
      })
      return
    }

    // Check image dimensions (optional)
    if (options.minWidth || options.minHeight) {
      const img = new Image()
      img.onload = () => {
        if (options.minWidth && img.width < options.minWidth) {
          resolve({
            valid: false,
            error: `Image width must be at least ${options.minWidth}px (current: ${img.width}px)`
          })
          return
        }
        if (options.minHeight && img.height < options.minHeight) {
          resolve({
            valid: false,
            error: `Image height must be at least ${options.minHeight}px (current: ${img.height}px)`
          })
          return
        }
        resolve({ valid: true })
      }
      img.onerror = () => {
        resolve({ valid: false, error: 'Invalid image file' })
      }
      img.src = URL.createObjectURL(file)
    } else {
      resolve({ valid: true })
    }
  })
}

/**
 * Validate avatar image
 */
export async function validateAvatar(file: File): Promise<ImageValidation> {
  return validateImageFile(file, {
    maxSizeMB: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 200,  // Minimum recommended size
    minHeight: 200
  })
}

/**
 * Validate cover image
 */
export async function validateCover(file: File): Promise<ImageValidation> {
  return validateImageFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 800,  // Minimum recommended size
    minHeight: 200
  })
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload avatar image
 * Pure storage operation - validation should be done by caller
 * @param file - Image file to upload
 * @param userId - User ID (used as folder name)
 * @param supabase - Optional Supabase client (required for server-side, auto-created for client-side)
 * @returns Upload result with public URL
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  supabase?: SupabaseClient
): Promise<UploadResult> {
  try {
    // Use provided client (server-side) or create new one (client-side)
    const client = supabase || createClientSide()

    // Generate file path: {userId}/avatar.{ext}
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    // Upload to Supabase Storage
    const { error } = await client.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,  // Replace if exists
        contentType: file.type
      })

    if (error) {
      console.error('Avatar upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL from Supabase
    const { data: { publicUrl } } = client.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Transform to custom domain URL if configured
    let finalUrl = transformStorageUrl(publicUrl)

    // Add cache-busting timestamp to force browser to reload image
    const timestamp = Date.now()
    finalUrl = `${finalUrl}?v=${timestamp}`

    return { success: true, url: finalUrl }
  } catch (error) {
    console.error('Avatar upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Upload cover image
 * Pure storage operation - validation should be done by caller
 * @param file - Image file to upload
 * @param userId - User ID (used as folder name)
 * @param supabase - Optional Supabase client (required for server-side, auto-created for client-side)
 * @returns Upload result with public URL
 */
export async function uploadCover(
  file: File,
  userId: string,
  supabase?: SupabaseClient
): Promise<UploadResult> {
  try {
    // Use provided client (server-side) or create new one (client-side)
    const client = supabase || createClientSide()

    // Generate file path: {userId}/cover.{ext}
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/cover.${fileExt}`

    // Upload to Supabase Storage
    const { error} = await client.storage
      .from('covers')
      .upload(fileName, file, {
        upsert: true,  // Replace if exists
        contentType: file.type
      })

    if (error) {
      console.error('Cover upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL from Supabase
    const { data: { publicUrl } } = client.storage
      .from('covers')
      .getPublicUrl(fileName)

    // Transform to custom domain URL if configured
    let finalUrl = transformStorageUrl(publicUrl)

    // Add cache-busting timestamp to force browser to reload image
    const timestamp = Date.now()
    finalUrl = `${finalUrl}?v=${timestamp}`

    return { success: true, url: finalUrl }
  } catch (error) {
    console.error('Cover upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete avatar image
 * @param userId - User ID
 * @param supabase - Optional Supabase client (required for server-side, auto-created for client-side)
 */
export async function deleteAvatar(userId: string, supabase?: SupabaseClient): Promise<boolean> {
  try {
    const client = supabase || createClientSide()

    // List files in user's folder
    const { data: files } = await client.storage
      .from('avatars')
      .list(userId)

    if (!files || files.length === 0) {
      return true  // No files to delete
    }

    // Delete all avatar files for this user
    const filePaths = files.map(f => `${userId}/${f.name}`)
    const { error } = await client.storage
      .from('avatars')
      .remove(filePaths)

    if (error) {
      console.error('Avatar delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Avatar delete exception:', error)
    return false
  }
}

/**
 * Delete cover image
 * @param userId - User ID
 * @param supabase - Optional Supabase client (required for server-side, auto-created for client-side)
 */
export async function deleteCover(userId: string, supabase?: SupabaseClient): Promise<boolean> {
  try {
    const client = supabase || createClientSide()

    // List files in user's folder
    const { data: files } = await client.storage
      .from('covers')
      .list(userId)

    if (!files || files.length === 0) {
      return true  // No files to delete
    }

    // Delete all cover files for this user
    const filePaths = files.map(f => `${userId}/${f.name}`)
    const { error } = await client.storage
      .from('covers')
      .remove(filePaths)

    if (error) {
      console.error('Cover delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Cover delete exception:', error)
    return false
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compress image before upload (client-side)
 * Uses canvas to resize/compress large images
 */
export async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'))
            return
          }
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        },
        file.type,
        quality
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Compress avatar to 400x400 max
 */
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, 400, 400, 0.85)
}

/**
 * Compress cover to 1500x500 max
 */
export async function compressCover(file: File): Promise<File> {
  return compressImage(file, 1500, 500, 0.85)
}
