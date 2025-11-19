/**
 * Simple OG Image Test Route
 * Test if ImageResponse works at all
 */

import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  try {
    return new ImageResponse(
      (
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
              fontSize: '60px',
              fontWeight: 'bold',
              color: 'black',
            }}
          >
            Test Image ✅
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('[OG Test] Error:', error)
    return new Response(`Error: ${error}`, { status: 500 })
  }
}
