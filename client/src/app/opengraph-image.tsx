import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FilmiGuess — Guess the Indian Cinema Star';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: '#ff6b35', opacity: 0.12, filter: 'blur(80px)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: '#e91e8c', opacity: 0.12, filter: 'blur(80px)', display: 'flex' }} />

        <div style={{ fontSize: 96, marginBottom: 16, display: 'flex' }}>🎬</div>

        <div style={{ display: 'flex', fontSize: 80, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: '#ff6b35' }}>Filmi</span>
          <span style={{ color: '#ffd700' }}>Guess</span>
        </div>

        <div style={{ color: '#9ca3af', fontSize: 32, marginTop: 16, display: 'flex' }}>
          Guess the Indian Cinema Star with friends
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          {['🎬 Bollywood', '🌟 South Stars', '🏆 Classic Films'].map(label => (
            <div
              key={label}
              style={{
                background: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: 999,
                padding: '10px 24px',
                color: '#d1d5db',
                fontSize: 22,
                display: 'flex',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
