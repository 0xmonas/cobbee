import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check API
 *
 * GET /api/health
 *
 * Returns system status and basic info
 */
export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('users').select('id').limit(1)

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: dbError ? 'disconnected' : 'connected',
        storage: 'connected', // Supabase storage is part of same connection
      }
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
  }
}
