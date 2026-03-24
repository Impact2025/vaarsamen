import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// iOS verwacht apple-touch-icon op /apple-touch-icon.png of /apple-touch-icon
export async function GET() {
  const size = 180

  return new ImageResponse(
    (
      <div
        style={{
          width:          size,
          height:         size,
          background:     '#071325',
          borderRadius:   36,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width:          126,
            height:         126,
            background:     'linear-gradient(135deg, #46f1c5, #00d4aa)',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 63, lineHeight: 1 }}>⛵</span>
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
