import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

/**
 * Supabase Admin Client
 *
 * Uses service role key for admin operations like:
 * - Deleting auth users
 * - Bypassing RLS policies (use with caution!)
 *
 * ⚠️ SECURITY WARNING:
 * - ONLY use in server-side code (API routes, Server Components)
 * - NEVER expose to client-side
 * - ALWAYS validate user permissions before admin operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
