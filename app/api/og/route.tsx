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

    // TEMPORARY: Use mock data for debugging
    const creator = {
      username: username,
      display_name: 'Test User',
      bio: 'Hello to you!',
      coffee_price: 5.00,
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

    // Generate OG image with ImageResponse (simplified version)
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
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
            {/* Initials Circle */}
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
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {initials}
              </div>
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'black',
                marginBottom: '10px',
              }}
            >
              {creator.display_name}
            </div>

            {/* Username */}
            <div
              style={{
                fontSize: '32px',
                color: '#0000FF',
                marginBottom: '20px',
              }}
            >
              @{creator.username}
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'black',
              }}
            >
              ☕ ${coffeePrice}
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
