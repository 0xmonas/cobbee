/**
 * Audit Logging Utility
 *
 * Comprehensive audit logging with geolocation and device detection
 * Following Next.js 16 and Vercel best practices for monitoring
 *
 * Features:
 * - Vercel Edge geolocation (city, country, region, lat/long)
 * - User-agent parsing (browser, OS, device info)
 * - Session tracking
 * - IP address capture
 * - Structured metadata
 *
 * Usage:
 * ```ts
 * import { createAuditLog } from '@/lib/utils/audit-logger'
 *
 * await createAuditLog({
 *   request,
 *   supabase,
 *   eventType: 'user_login',
 *   actorType: 'user',
 *   actorId: user.id,
 *   metadata: { login_method: 'wallet' }
 * })
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { geolocation } from '@vercel/functions'
import UAParser from 'ua-parser-js'

/**
 * Audit log event types (standardized)
 */
export type AuditEventType =
  // Authentication
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'wallet_connected'
  | 'wallet_disconnected'
  // Profile
  | 'profile_updated'
  | 'avatar_uploaded'
  | 'cover_uploaded'
  | 'email_added'
  | 'email_changed'
  // Support/Payments
  | 'support_created'
  | 'payment_received'
  | 'payout_initiated'
  | 'payout_completed'
  // Admin actions
  | 'user_blocked'
  | 'user_unblocked'
  | 'admin_action'
  // Security
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'suspicious_activity'
  // System
  | 'api_error'
  | 'webhook_received'

/**
 * Actor types for audit logs
 */
export type ActorType = 'user' | 'admin' | 'system' | 'anonymous'

/**
 * Target types (what was affected)
 */
export type TargetType = 'user' | 'support' | 'profile' | 'payment' | 'setting' | null

/**
 * Geolocation data from Vercel
 */
interface GeolocationData {
  city?: string
  country?: string
  region?: string
  latitude?: string
  longitude?: string
  flag?: string
  countryRegion?: string
}

/**
 * Device/browser info from User-Agent
 */
interface DeviceInfo {
  userAgent: string
  deviceType?: string
  deviceBrand?: string
  deviceModel?: string
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
}

/**
 * Audit log creation options
 */
export interface CreateAuditLogOptions {
  request: Request
  supabase: SupabaseClient
  eventType: AuditEventType
  actorType: ActorType
  actorId?: string | null
  targetType?: TargetType
  targetId?: string | null
  changes?: Record<string, any>
  metadata?: Record<string, any>
  sessionId?: string | null
}

/**
 * Extract IP address from request headers
 */
function getIPAddress(request: Request): string | null {
  // Try multiple headers (Vercel, Cloudflare, standard)
  const headers = request.headers
  const cfConnectingIp = headers.get('cf-connecting-ip')
  const xRealIp = headers.get('x-real-ip')
  const xForwardedFor = headers.get('x-forwarded-for')

  const ip = cfConnectingIp || xRealIp || xForwardedFor?.split(',')[0]

  return ip?.trim() || null
}

/**
 * Get geolocation data from Vercel Edge
 * Only works in Vercel deployment (returns null in dev)
 */
function getGeolocation(request: Request): GeolocationData | null {
  try {
    const geo = geolocation(request)

    // If no geolocation data available (local dev), return null
    if (!geo || Object.keys(geo).length === 0) {
      return null
    }

    return {
      city: geo.city,
      country: geo.country,
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      flag: geo.flag,
      countryRegion: geo.countryRegion,
    }
  } catch (error) {
    // Geolocation not available (local dev or non-Vercel environment)
    console.debug('Geolocation not available:', error)
    return null
  }
}

/**
 * Parse User-Agent header for device/browser info
 */
function parseUserAgent(request: Request): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      userAgent,
      deviceType: result.device.type || 'desktop', // mobile, tablet, desktop, console, wearable, embedded
      deviceBrand: result.device.vendor || undefined,
      deviceModel: result.device.model || undefined,
      browserName: result.browser.name || undefined,
      browserVersion: result.browser.version || undefined,
      osName: result.os.name || undefined,
      osVersion: result.os.version || undefined,
    }
  } catch (error) {
    console.error('Failed to parse user-agent:', error)
    return { userAgent }
  }
}

/**
 * Create audit log entry with enriched metadata
 *
 * This function automatically captures:
 * - IP address
 * - Geolocation (city, country, region, lat/long) via Vercel Edge
 * - Device info (type, brand, model) via ua-parser-js
 * - Browser info (name, version)
 * - OS info (name, version)
 * - Session ID (if provided)
 *
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function createAuditLog(options: CreateAuditLogOptions): Promise<boolean> {
  const {
    request,
    supabase,
    eventType,
    actorType,
    actorId = null,
    targetType = null,
    targetId = null,
    changes = {},
    metadata = {},
    sessionId = null,
  } = options

  try {
    // Extract IP address
    const ipAddress = getIPAddress(request)

    // Get geolocation (Vercel Edge only, returns null in dev)
    const geo = getGeolocation(request)

    // Parse user-agent
    const deviceInfo = parseUserAgent(request)

    // Insert audit log with enriched data
    const { error } = await supabase.from('audit_logs').insert({
      event_type: eventType,
      actor_type: actorType,
      actor_id: actorId,
      target_type: targetType,
      target_id: targetId,
      changes: changes && Object.keys(changes).length > 0 ? changes : null,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
      ip_address: ipAddress,

      // User-Agent & Device Info
      user_agent: deviceInfo.userAgent,
      device_type: deviceInfo.deviceType,
      device_brand: deviceInfo.deviceBrand,
      device_model: deviceInfo.deviceModel,
      browser_name: deviceInfo.browserName,
      browser_version: deviceInfo.browserVersion,
      os_name: deviceInfo.osName,
      os_version: deviceInfo.osVersion,

      // Geolocation (Vercel Edge only)
      geo_city: geo?.city,
      geo_country: geo?.country,
      geo_country_code: geo?.countryRegion,
      geo_region: geo?.region,
      geo_latitude: geo?.latitude ? parseFloat(geo.latitude) : null,
      geo_longitude: geo?.longitude ? parseFloat(geo.longitude) : null,
      geo_flag: geo?.flag,

      // Session tracking
      session_id: sessionId,

      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to create audit log:', error)
      return false
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', {
        event: eventType,
        actor: actorType,
        ip: ipAddress,
        geo: geo?.country || 'N/A',
        device: `${deviceInfo.osName || 'Unknown OS'} / ${deviceInfo.browserName || 'Unknown Browser'}`,
      })
    }

    return true
  } catch (error) {
    console.error('Audit log creation failed:', error)
    return false
  }
}

/**
 * Helper: Create session ID from user ID and timestamp
 * Useful for tracking multi-step flows (e.g., signup, checkout)
 */
export function generateSessionId(userId?: string | null): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 9)
  const userPart = userId ? userId.substring(0, 8) : 'anon'

  return `${userPart}-${timestamp}-${randomPart}`
}

/**
 * Helper: Quick audit log for common patterns
 */
export const AuditLogger = {
  /**
   * Log user signup
   */
  signup: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'user_signup',
      actorType: 'user',
    })
  },

  /**
   * Log user login
   */
  login: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'user_login',
      actorType: 'user',
    })
  },

  /**
   * Log profile update
   */
  profileUpdate: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'profile_updated',
      actorType: 'user',
    })
  },

  /**
   * Log support/payment
   */
  support: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'support_created',
      actorType: 'user',
    })
  },

  /**
   * Log admin action
   */
  adminAction: async (options: Omit<CreateAuditLogOptions, 'actorType'>) => {
    return createAuditLog({
      ...options,
      actorType: 'admin',
    })
  },

  /**
   * Log rate limit exceeded
   */
  rateLimit: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'rate_limit_exceeded',
      actorType: options.actorId ? 'user' : 'anonymous',
    })
  },

  /**
   * Log unauthorized access attempt
   */
  unauthorized: async (options: Omit<CreateAuditLogOptions, 'eventType' | 'actorType'>) => {
    return createAuditLog({
      ...options,
      eventType: 'unauthorized_access',
      actorType: options.actorId ? 'user' : 'anonymous',
    })
  },
}
