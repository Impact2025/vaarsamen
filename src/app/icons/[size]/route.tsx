import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params
  const size = sizeParam === '512' ? 512 : 192
  const radius = Math.round(size * 0.2)

  return new ImageResponse(
    (
      <div
        style={{
          width:           size,
          height:          size,
          background:      '#071325',
          borderRadius:    radius,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        {/* Teal cirkel achtergrond */}
        <div
          style={{
            width:          Math.round(size * 0.7),
            height:         Math.round(size * 0.7),
            background:     'linear-gradient(135deg, #46f1c5, #00d4aa)',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize:   Math.round(size * 0.35),
              lineHeight: 1,
            }}
          >
            ⛵
          </span>
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
