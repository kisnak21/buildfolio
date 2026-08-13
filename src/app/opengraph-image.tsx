import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Buildfolio — Discover Projects. Share Ideas. Build Your Portfolio.'

export default function OpenGraphImage() {
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
          backgroundColor: '#Fdfcf7',
          color: '#111111',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            border: '4px solid #111111',
            borderRadius: 24,
            padding: '24px 40px',
            backgroundColor: '#FF90E8',
            boxShadow: '8px 8px 0 0 #111111',
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 900 }}>⚡</span>
          <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2 }}>
            Buildfolio
          </span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            fontWeight: 600,
            color: '#1A7A71',
          }}
        >
          Discover Projects · Share Ideas · Build Your Portfolio
        </div>
      </div>
    ),
    { ...size },
  )
}