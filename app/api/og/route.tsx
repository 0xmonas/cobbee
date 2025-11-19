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

    // Generate OG image with ImageResponse
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#CCFF00',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'white',
            border: '8px solid black',
            borderRadius: '48px',
            padding: '60px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#0000FF',
              border: '6px solid black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
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
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'black',
              marginBottom: '10px',
            }}
          >
            {creator.display_name}
          </span>
          <span
            style={{
              fontSize: '32px',
              color: '#0000FF',
              marginBottom: '20px',
            }}
          >
            @{creator.username}
          </span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'black',
            }}
          >
            ☕ ${coffeePrice}
          </span>
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
