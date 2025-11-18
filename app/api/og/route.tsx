/**
 * API Route: Dynamic Open Graph Image Generator
 *
 * Endpoint: GET /api/og?username=<username>
 *
 * Generates a custom OG image for creator profiles using Next.js ImageResponse
 * The image includes:
 * - Creator's avatar/initials
 * - Display name
 * - Username
 * - Coffee price
 * - Cobbee branding with neo-brutalist design
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * GET /api/og?username=<username>
 * Generate dynamic OG image for creator profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return new Response('Missing username parameter', { status: 400 })
    }

    // Fetch creator data
    const supabase = await createClient()
    const { data: creator, error } = await supabase
      .from('public_creator_profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !creator) {
      return new Response('Creator not found', { status: 404 })
    }

    // Get initials for fallback
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const initials = getInitials(creator.display_name)
    const coffeePrice = Number(creator.coffee_price).toFixed(2)

    // Generate OG image with ImageResponse
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#CCFF00',
            padding: '60px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '8px solid black',
              borderRadius: '48px',
              padding: '80px 100px',
              boxShadow: '16px 16px 0px 0px rgba(0,0,0,1)',
              width: '100%',
              maxWidth: '1000px',
            }}
          >
            {/* Avatar/Initials */}
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                backgroundColor: '#0000FF',
                border: '8px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
              }}
            >
              {creator.avatar_url && !creator.avatar_url.includes('placeholder') ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 900,
                    color: 'white',
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Display Name */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 900,
                color: 'black',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {creator.display_name}
            </div>

            {/* Username */}
            <div
              style={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#0000FF',
                marginBottom: '40px',
              }}
            >
              @{creator.username}
            </div>

            {/* Coffee Price Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: '#CCFF00',
                border: '6px solid black',
                borderRadius: '999px',
                padding: '20px 40px',
                marginBottom: '40px',
              }}
            >
              <div style={{ fontSize: '40px' }}>☕</div>
              <div
                style={{
                  fontSize: '40px',
                  fontWeight: 900,
                  color: 'black',
                }}
              >
                ${coffeePrice}
              </div>
            </div>

            {/* Bio (if exists, truncated) */}
            {creator.bio && (
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#666',
                  textAlign: 'center',
                  maxWidth: '800px',
                  marginBottom: '40px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {creator.bio}
              </div>
            )}

            {/* Cobbee Branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: 'black',
                }}
              >
                ☕ Cobbee
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('[OG Image] Error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
