interface Palette {
  body: string;
  wing: string;
  accent: string;
  cockpit: string;
}

const PALETTES: Record<string, Palette> = {
  starter: { body: '#8fd3ff', wing: '#2f6fb0', accent: '#7fd1ff', cockpit: '#0d2233' },
  interceptor: { body: '#ffd166', wing: '#c98a1b', accent: '#fff0c2', cockpit: '#3a2a08' },
  fortress: { body: '#9aa4b2', wing: '#4b5563', accent: '#cbd5e1', cockpit: '#1f2937' },
  gunship: { body: '#ffb45e', wing: '#a8641c', accent: '#ffe0a3', cockpit: '#3a2410' },
  phantom: { body: '#c084fc', wing: '#6d28d9', accent: '#e9d5ff', cockpit: '#2a0f3a' },
  raptor: { body: '#7ee7c7', wing: '#0f766e', accent: '#c9fff0', cockpit: '#08302b' },
};

/**
 * Vector aircraft preview used in the hangar/shop. Kept as inline SVG so it is
 * scalable, tiny and independent of the Phaser sprites.
 */
export function AircraftArt({ aircraftId, size = 132 }: { aircraftId: string; size?: number }) {
  const palette = PALETTES[aircraftId] ?? PALETTES.starter;
  const glowId = `aircraft-glow-${aircraftId}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`${aircraftId} aircraft`}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="78%" r="65%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${glowId})`} />

      {/* Swept wings */}
      <polygon points="8,94 112,94 60,42" fill={palette.wing} />
      <polygon points="28,88 92,88 60,52" fill={palette.body} opacity="0.5" />

      {/* Fuselage */}
      <polygon points="60,8 43,102 77,102" fill={palette.body} />
      <polygon points="60,14 53,96 67,96" fill={palette.accent} opacity="0.6" />

      {/* Wing tips */}
      <rect x="4" y="90" width="16" height="6" rx="2" fill={palette.accent} />
      <rect x="100" y="90" width="16" height="6" rx="2" fill={palette.accent} />

      {/* Cockpit */}
      <ellipse cx="60" cy="42" rx="7" ry="11" fill={palette.cockpit} />
      <ellipse cx="58" cy="38" rx="2.4" ry="4" fill="#ffffff" opacity="0.85" />

      {/* Engine */}
      <rect x="52" y="100" width="16" height="10" rx="3" fill="#ff9a3c" />
      <rect x="55" y="102" width="10" height="7" rx="3" fill="#ffe066" />
    </svg>
  );
}