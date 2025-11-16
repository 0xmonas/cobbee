/**
 * XSS Protection - DOMPurify Wrapper
 *
 * Sanitizes user-generated content to prevent XSS attacks.
 * Provides both server-side and client-side sanitization.
 *
 * Usage:
 * ```ts
 * import { sanitizeHTML, sanitizeText } from '@/lib/security/sanitize'
 *
 * // For HTML content (messages with formatting)
 * const clean = sanitizeHTML(userInput)
 *
 * // For plain text (names, simple fields)
 * const clean = sanitizeText(userInput)
 * ```
 */

import DOMPurify from 'dompurify'

// Server-side DOMPurify requires JSDOM
// For server-side, we'll use a simplified approach
const isServer = typeof window === 'undefined'

/**
 * Sanitize HTML content
 * Removes dangerous tags and attributes while preserving safe HTML
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''

  if (isServer) {
    // Server-side: Use conservative text-only sanitization
    // For full HTML support on server, install jsdom: pnpm add jsdom @types/jsdom
    return sanitizeText(dirty)
  }

  // Client-side: Use DOMPurify with safe defaults
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  })
}

/**
 * Sanitize plain text
 * Strips all HTML tags and dangerous characters
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ''

  // Remove all HTML tags
  let clean = dirty.replace(/<[^>]*>/g, '')

  // Remove dangerous characters
  clean = clean
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script/gi, '')
    .replace(/<\/script>/gi, '')

  // Trim and normalize whitespace
  clean = clean.trim().replace(/\s+/g, ' ')

  return clean
}

/**
 * Sanitize user name (strict)
 * Only allows alphanumeric, spaces, and common name characters
 */
export function sanitizeName(name: string): string {
  if (!name) return ''

  // Allow only letters, spaces, hyphens, apostrophes
  return name
    .replace(/[^a-zA-Z\s'-]/g, '')
    .trim()
    .slice(0, 100) // Max 100 characters
}

/**
 * Sanitize URL
 * Ensures URL is safe and well-formed
 */
export function sanitizeURL(url: string): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    return parsed.toString()
  } catch {
    // Invalid URL
    return ''
  }
}

/**
 * Sanitize markdown-like content
 * Preserves basic markdown syntax while removing dangerous content
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return ''

  // First sanitize as text to remove script tags etc
  let clean = sanitizeText(markdown)

  // Preserve basic markdown
  // (Line breaks, bold, italic, links)
  // This is a simple implementation - for full markdown, use a dedicated parser

  return clean.slice(0, 5000) // Max 5000 characters
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const cleaned = email.toLowerCase().trim()

  if (!emailRegex.test(cleaned)) {
    return ''
  }

  return cleaned.slice(0, 100)
}

/**
 * Batch sanitize object fields
 * Useful for sanitizing form data
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldSanitizers: Partial<Record<keyof T, (value: any) => any>>
): T {
  const sanitized = { ...obj }

  for (const [key, sanitizer] of Object.entries(fieldSanitizers)) {
    if (key in sanitized && sanitizer) {
      sanitized[key as keyof T] = sanitizer(sanitized[key as keyof T])
    }
  }

  return sanitized
}
