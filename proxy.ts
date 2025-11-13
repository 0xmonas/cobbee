import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Next.js 16: Renamed from "middleware" to "proxy"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================================================
  // ADMIN ROUTE PROTECTION
  // ============================================================================
  if (pathname.startsWith('/admin')) {
    let response = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Get user's wallet address from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    const walletAddress = userProfile?.wallet_address

    // Check if wallet is in admin list
    const adminWallets = process.env.ADMIN_WALLET_ADDRESSES?.split(',')
      .map(w => w.trim().toLowerCase()) || []

    const isAdmin = walletAddress && adminWallets.includes(walletAddress.toLowerCase())

    if (!isAdmin) {
      // Not an admin - redirect to dashboard
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Admin verified - allow access
    return response
  }

  // ============================================================================
  // DEFAULT: Update Supabase session
  // ============================================================================
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
