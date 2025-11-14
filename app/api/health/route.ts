import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check API - Industry Standard Format
 *
 * GET /api/health
 *
 * Returns public system status following industry best practices.
 * Only exposes non-sensitive information safe for public consumption.
 *
 * Format based on:
 * - RFC 7807 (Problem Details for HTTP APIs)
 * - Google Cloud Health Check format
 * - AWS ELB Health Check format
 */

interface ServiceCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  lastChecked: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: ServiceCheck[]
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: ServiceCheck[] = []
  const timestamp = new Date().toISOString()

  // =========================================================================
  // 1. Database Health (Supabase)
  // =========================================================================
  try {
    const dbStartTime = Date.now()
    const supabase = await createClient()

    const { error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    const dbResponseTime = Date.now() - dbStartTime

    checks.push({
      name: 'database',
      status: dbError ? 'unhealthy' : (dbResponseTime > 1000 ? 'degraded' : 'healthy'),
      responseTime: dbResponseTime,
      lastChecked: new Date().toISOString()
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      lastChecked: new Date().toISOString()
    })
  }

  // =========================================================================
  // 2. x402 Payment Infrastructure
  // =========================================================================
  try {
    const x402StartTime = Date.now()

    // Get RPC URL (public env var)
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'

    // Simple RPC health check (eth_blockNumber)
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }),
      signal: AbortSignal.timeout(5000)
    })

    const x402ResponseTime = Date.now() - x402StartTime
    const rpcData = await rpcResponse.json()

    checks.push({
      name: 'blockchain_rpc',
      status: rpcData.result ? (x402ResponseTime > 2000 ? 'degraded' : 'healthy') : 'unhealthy',
      responseTime: x402ResponseTime,
      lastChecked: new Date().toISOString()
    })
  } catch (error) {
    checks.push({
      name: 'blockchain_rpc',
      status: 'unhealthy',
      lastChecked: new Date().toISOString()
    })
  }

  // =========================================================================
  // 3. Email Service Configuration (No API calls, just config check)
  // =========================================================================
  const hasEmailProvider = !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY)
  checks.push({
    name: 'email_service',
    status: hasEmailProvider ? 'healthy' : 'unhealthy',
    lastChecked: new Date().toISOString()
  })

  // =========================================================================
  // Calculate Overall Status
  // =========================================================================
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
  const hasDegraded = checks.some(check => check.status === 'degraded')

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  if (hasUnhealthy) {
    overallStatus = 'unhealthy'
  } else if (hasDegraded) {
    overallStatus = 'degraded'
  } else {
    overallStatus = 'healthy'
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp,
    version: '1.0.0',
    checks
  }

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 :
                     overallStatus === 'degraded' ? 200 : 503

  return Response.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Response-Time': `${Date.now() - startTime}ms`
    }
  })
}
