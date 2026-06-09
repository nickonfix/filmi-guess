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
          background: '#fafafa',
          backgroundImage:
            'radial-gradient(at 15% 20%, rgba(0,124,240,0.30) 0px, transparent 45%),' +
            'radial-gradient(at 85% 15%, rgba(0,223,216,0.28) 0px, transparent 45%),' +
            'radial-gradient(at 70% 60%, rgba(121,40,202,0.22) 0px, transparent 45%),' +
            'radial-gradient(at 10% 80%, rgba(255,0,128,0.22) 0px, transparent 45%),' +
            'radial-gradient(at 90% 85%, rgba(249,203,40,0.26) 0px, transparent 45%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            border: '1px solid #ebebeb',
            borderRadius: 999,
            padding: '8px 20px',
            color: '#4d4d4d',
            fontSize: 22,
            marginBottom: 32,
            letterSpacing: 2,
          }}
        >
          REAL-TIME · MULTIPLAYER · NO SIGNUP
        </div>

        <div style={{ display: 'flex', fontSize: 104, fontWeight: 600, letterSpacing: -5 }}>
          <span style={{ color: '#171717' }}>Filmi</span>
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, #007cf0, #7928ca, #ff0080, #f9cb28)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Guess
          </span>
        </div>

        <div style={{ color: '#4d4d4d', fontSize: 32, marginTop: 20, display: 'flex', letterSpacing: -0.5 }}>
          Guess the Indian cinema star before your friends.
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 44 }}>
          {['🎬 Bollywood', '🌟 South Stars', '🏆 Classic Films'].map(label => (
            <div
              key={label}
              style={{
                background: '#ffffff',
                border: '1px solid #ebebeb',
                borderRadius: 999,
                padding: '10px 24px',
                color: '#171717',
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
