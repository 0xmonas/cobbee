import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/utils/audit-logger'

/**
 * Auth Callback Handler
 *
 * GET /api/auth/callback
 *
 * Handles Supabase auth callbacks including email confirmations
 * When user clicks email confirmation link, this updates public.users table
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/settings'

  if (token_hash && type) {
    const supabase = await createClient()

    // Verify the token and get the updated user
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (error) {
      console.error('Auth callback error:', error)
      return Response.redirect(new URL('/settings?error=confirmation_failed', request.url))
    }

    // If this is an email change confirmation, update public.users
    if (type === 'email_change' && data.user) {
      const newEmail = data.user.email
      const oldEmail = data.user.user_metadata?.old_email

      if (newEmail) {
        // Update email in public.users table
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: newEmail,
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Failed to update email in public.users:', updateError)
        } else {
          // Get username for cache revalidation
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', data.user.id)
            .single()

          // Create audit log for email change
          await createAuditLog({
            request,
            supabase,
            eventType: 'email_changed',
            actorType: 'user',
            actorId: data.user.id,
            targetType: 'user',
            targetId: data.user.id,
            changes: {
              email: {
                old: oldEmail || null,
                new: newEmail,
              },
            },
            metadata: {
              verification_method: 'email_otp',
              email_verified: true,
            },
          })

          // Revalidate cached pages
          revalidatePath('/settings')
          revalidatePath('/profile/edit')
          revalidatePath('/dashboard')
          if (userData?.username) {
            revalidatePath(`/${userData.username}`)
          }
        }
      }
    }

    // Redirect to settings with success message
    return Response.redirect(new URL('/settings?email_updated=true', request.url))
  }

  // No token_hash, redirect to home
  return Response.redirect(new URL('/', request.url))
}
