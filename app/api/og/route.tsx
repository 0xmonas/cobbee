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

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Create edge-compatible Supabase client (no auth needed for public profiles)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch creator data
    const { data: creator, error } = await supabase
      .from('public_creator_profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !creator) {
      console.error('[OG Image] Creator not found:', error)
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

    console.log('[OG Image] Generating for:', username, 'initials:', initials)

    // Fetch avatar image and convert to base64
    let avatarBase64 = ''
    if (creator.avatar_url) {
      try {
        const avatarResponse = await fetch(creator.avatar_url)
        const avatarBuffer = await avatarResponse.arrayBuffer()
        avatarBase64 = `data:${avatarResponse.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(avatarBuffer).toString('base64')}`
      } catch (error) {
        console.error('[OG Image] Failed to fetch avatar:', error)
      }
    }

    // Fetch cover image and convert to base64
    let coverBase64 = ''
    if (creator.cover_image) {
      try {
        const coverResponse = await fetch(creator.cover_image)
        const coverBuffer = await coverResponse.arrayBuffer()
        coverBase64 = `data:${coverResponse.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(coverBuffer).toString('base64')}`
      } catch (error) {
        console.error('[OG Image] Failed to fetch cover:', error)
      }
    }

    // Generate OG image with ImageResponse
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Background: Cover image with overlay */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            background: coverBase64
              ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${coverBase64})`
              : 'linear-gradient(135deg, #CCFF00 0%, #0000FF 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px',
          }}
        >
          {/* Top: Cobbee branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              ☕ Cobbee
            </span>
          </div>

          {/* Bottom: Creator info card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '30px 40px',
              borderRadius: '24px',
              border: '4px solid black',
              boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
            }}
          >
            {/* Avatar */}
            {avatarBase64 ? (
              <img
                src={avatarBase64}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid black',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#0000FF',
                  border: '4px solid black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Creator details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: '52px',
                  fontWeight: 'bold',
                  color: 'black',
                  lineHeight: 1.2,
                }}
              >
                {creator.display_name}
              </span>
              <span
                style={{
                  fontSize: '32px',
                  color: '#0000FF',
                  fontWeight: 600,
                }}
              >
                @{creator.username}
              </span>
            </div>
          </div>
        </div>
      </div>,
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
