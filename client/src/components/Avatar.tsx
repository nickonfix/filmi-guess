'use client';

interface Props {
  name: string;
  avatar?: string;
  /** Pixel size of the round avatar. */
  size?: number;
  /** Dim it (e.g. disconnected players). */
  muted?: boolean;
  className?: string;
}

/**
 * Round player avatar. Shows the uploaded profile picture when present,
 * otherwise falls back to the first initial on the monochrome gradient.
 */
export default function Avatar({ name, avatar, size = 32, muted = false, className = '' }: Props) {
  const dims = { width: size, height: size };
  const initial = name?.[0]?.toUpperCase() ?? '?';

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        style={dims}
        referrerPolicy="no-referrer"
        className={`flex-shrink-0 rounded-full object-cover ${muted ? 'opacity-60 grayscale' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...dims, fontSize: Math.round(size * 0.42) }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${
        muted ? 'bg-hairline-strong text-canvas' : 'bg-gradient-to-br from-ink to-hairline-strong text-on-primary'
      } ${className}`}
    >
      {initial}
    </div>
  );
}
