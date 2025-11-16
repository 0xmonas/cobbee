/**
 * Rate Limiting Configuration
 *
 * Centralized rate limiting using Upstash Redis.
 * Provides different rate limit tiers for different API endpoints.
 *
 * Usage:
 * ```ts
 * import { apiRateLimit, authRateLimit } from '@/lib/security/ratelimit'
 *
 * const { success, limit, remaining, reset } = await apiRateLimit.limit(identifier)
 * if (!success) {
 *   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client (uses env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
let redis: Redis | undefined = undefined

function getRedis(): Redis | undefined {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Rate limiting disabled: Upstash Redis not configured')
    }
    return undefined
  }

  redis = new Redis({ url, token })
  return redis
}

/**
 * No-op rate limiter for when Redis is not configured
 * Always returns success to allow app to function without rate limiting
 */
class NoOpRateLimit {
  async limit(_identifier: string) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve()
    }
  }
}

/**
 * Create rate limiter with fallback
 */
function createRateLimiter(requests: number, windowMs: number, prefix: string) {
  const redisClient = getRedis()

  if (!redisClient) {
    return new NoOpRateLimit()
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(requests, `${windowMs} ms`),
    analytics: true,
    prefix: `cobbee:ratelimit:${prefix}`,
  })
}

/**
 * Rate Limiters by Tier
 */

// Strict rate limit for authentication endpoints (prevent brute force)
// 5 requests per 15 minutes
export const authRateLimit = createRateLimiter(5, 15 * 60 * 1000, 'auth')

// Standard rate limit for general API endpoints
// 30 requests per minute
export const apiRateLimit = createRateLimiter(30, 60 * 1000, 'api')

// Lenient rate limit for payment endpoints (more generous for legitimate users)
// 10 requests per minute (allows retry on failure)
export const paymentRateLimit = createRateLimiter(10, 60 * 1000, 'payment')

// Very strict rate limit for expensive operations (admin actions, bulk operations)
// 3 requests per minute
export const strictRateLimit = createRateLimiter(3, 60 * 1000, 'strict')

/**
 * Helper function to get rate limit identifier from request
 * Uses IP address as primary identifier, falls back to 'anonymous' if unavailable
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get real IP from headers (works with Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'anonymous'

  return ip.trim()
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: {
    limit: number
    remaining: number
    reset: number
  }
): Headers {
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())

  return headers
}

/**
 * Check if rate limiting is enabled (requires Upstash credentials)
 */
export function isRateLimitEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
