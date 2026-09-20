/**
 * AIR KINGS logo: a winged crown insignia. Inline SVG so it stays crisp at any
 * size and adds no asset weight.
 */
export function AirKingsLogo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="AIR KINGS logo">
      <defs>
        <linearGradient id="airkings-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="55%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#c97a1e" />
        </linearGradient>
        <linearGradient id="airkings-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6f3ff" />
          <stop offset="100%" stopColor="#3fa9ff" />
        </linearGradient>
      </defs>

      {/* Wings */}
      <polygon points="2,40 22,30 22,40 2,50" fill="url(#airkings-cyan)" />
      <polygon points="62,40 42,30 42,40 62,50" fill="url(#airkings-cyan)" />

      {/* Shield */}
      <polygon
        points="32,4 52,12 52,34 32,56 12,34 12,12"
        fill="url(#airkings-gold)"
        stroke="#7a4a12"
        strokeWidth="1.5"
      />
      <polygon points="32,10 46,16 46,32 32,48 18,32 18,16" fill="#0a1020" opacity="0.55" />

      {/* Crown */}
      <polygon points="22,22 27,30 32,20 37,30 42,22 42,34 22,34" fill="url(#airkings-gold)" />
      {/* Delta wing emblem */}
      <polygon points="32,26 40,38 32,34 24,38" fill="#7fd1ff" />
      <circle cx="32" cy="22" r="2.2" fill="#fff6d8" />
    </svg>
  );
}