interface Palette {
  body: string;
  wing: string;
  accent: string;
  cockpit: string;
}

const PALETTES: Record<string, Palette> = {
  starter: { body: '#8fd3ff', wing: '#2f6fb0', accent: '#7fd1ff', cockpit: '#0d2233' },
  interceptor: { body: '#ffd166', wing: '#c98a1b', accent: '#fff0c2', cockpit: '#3a2a08' },
  gunship: { body: '#ffb45e', wing: '#a8641c', accent: '#ffe0a3', cockpit: '#3a2410' },
  fortress: { body: '#9aa4b2', wing: '#4b5563', accent: '#cbd5e1', cockpit: '#1f2937' },
  phantom: { body: '#c084fc', wing: '#6d28d9', accent: '#e9d5ff', cockpit: '#2a0f3a' },
  raptor: { body: '#7ee7c7', wing: '#0f766e', accent: '#c9fff0', cockpit: '#08302b' },
};

function Engine({ x, y, color = '#ff9a3c' }: { x: number; y: number; color?: string }) {
  return (
    <>
      <rect x={x - 7} y={y} width={14} height={10} rx={3} fill={color} />
      <rect x={x - 4} y={y + 2} width={8} height={7} rx={3} fill="#ffe066" />
    </>
  );
}

/** Distinct silhouettes so each aircraft reads as a different machine. */
function Model({ id, palette }: { id: string; palette: Palette }) {
  const { body, wing, accent, cockpit } = palette;

  switch (id) {
    case 'interceptor':
      return (
        <>
          {/* Forward-swept narrow wings + canards */}
          <polygon points="16,70 104,44 96,60 30,84" fill={wing} />
          <polygon points="40,44 80,44 60,56" fill={wing} opacity="0.9" />
          {/* Slim fuselage */}
          <polygon points="60,6 52,104 68,104" fill={body} />
          <polygon points="60,14 56,96 64,96" fill={accent} opacity="0.6" />
          {/* Cockpit */}
          <ellipse cx="60" cy="34" rx="5" ry="9" fill={cockpit} />
          <ellipse cx="59" cy="31" rx="1.8" ry="3" fill="#fff" opacity="0.85" />
          <Engine x={60} y={100} />
        </>
      );

    case 'gunship':
      return (
        <>
          {/* Wide blunt hull */}
          <rect x="22" y="30" width="76" height="46" rx="10" fill={body} />
          <rect x="30" y="36" width="60" height="30" rx="8" fill={accent} opacity="0.5" />
          {/* Side weapon pods */}
          <rect x="8" y="44" width="18" height="16" rx="4" fill={wing} />
          <rect x="94" y="44" width="18" height="16" rx="4" fill={wing} />
          <rect x="14" y="66" width="8" height="14" fill={wing} />
          <rect x="98" y="66" width="8" height="14" fill={wing} />
          {/* Nose + cockpit */}
          <polygon points="60,18 44,32 76,32" fill={body} />
          <ellipse cx="60" cy="42" rx="8" ry="6" fill={cockpit} />
          <Engine x={44} y={74} />
          <Engine x={76} y={74} />
        </>
      );

    case 'fortress':
      return (
        <>
          {/* Massive hexagonal hull with armor plates */}
          <polygon points="60,10 96,30 96,80 60,102 24,80 24,30" fill={body} />
          <polygon points="60,20 84,36 84,74 60,90 36,74 36,36" fill={accent} opacity="0.35" />
          {/* Stubby wide wings */}
          <rect x="2" y="46" width="26" height="22" rx="5" fill={wing} />
          <rect x="92" y="46" width="26" height="22" rx="5" fill={wing} />
          <rect x="2" y="72" width="18" height="10" rx="4" fill={wing} opacity="0.85" />
          <rect x="100" y="72" width="18" height="10" rx="4" fill={wing} opacity="0.85" />
          {/* Cockpit + heavy engines */}
          <ellipse cx="60" cy="34" rx="9" ry="8" fill={cockpit} />
          <Engine x={42} y={92} />
          <Engine x={78} y={92} />
        </>
      );

    case 'phantom':
      return (
        <>
          {/* Needle fuselage with swept thin wings */}
          <polygon points="60,4 55,96 65,96" fill={body} />
          <polygon points="60,10 57,90 63,90" fill={accent} opacity="0.65" />
          <polygon points="14,84 60,50 60,66" fill={wing} />
          <polygon points="106,84 60,50 60,66" fill={wing} />
          {/* Twin tails */}
          <polygon points="46,72 54,72 50,96" fill={wing} opacity="0.85" />
          <polygon points="74,72 66,72 70,96" fill={wing} opacity="0.85" />
          {/* Cockpit */}
          <ellipse cx="60" cy="28" rx="4.5" ry="8" fill={cockpit} />
          <ellipse cx="59" cy="25" rx="1.6" ry="3" fill="#fff" opacity="0.85" />
          <Engine x={52} y={96} color="#a855f7" />
          <Engine x={68} y={96} color="#a855f7" />
        </>
      );

    case 'raptor':
      return (
        <>
          {/* X-wing blades */}
          <polygon points="60,42 12,20 24,38 60,58" fill={wing} />
          <polygon points="60,42 108,20 96,38 60,58" fill={wing} />
          <polygon points="60,64 20,92 34,74 60,74" fill={wing} />
          <polygon points="60,64 100,92 86,74 60,74" fill={wing} />
          {/* Armored fuselage + railgun nose */}
          <polygon points="60,4 48,98 72,98" fill={body} />
          <rect x="57" y="0" width="6" height="22" rx="2" fill={accent} />
          <ellipse cx="60" cy="40" rx="7" ry="10" fill={cockpit} />
          <ellipse cx="58" cy="36" rx="2.2" ry="4" fill="#fff" opacity="0.85" />
          <Engine x={60} y={98} color="#22d3ee" />
        </>
      );

    default:
      return (
        <>
          {/* Balanced delta */}
          <polygon points="8,94 112,94 60,42" fill={wing} />
          <polygon points="28,88 92,88 60,52" fill={body} opacity="0.5" />
          <polygon points="60,8 43,102 77,102" fill={body} />
          <polygon points="60,14 53,96 67,96" fill={accent} opacity="0.6" />
          <rect x="4" y="90" width="16" height="6" rx="2" fill={accent} />
          <rect x="100" y="90" width="16" height="6" rx="2" fill={accent} />
          <ellipse cx="60" cy="42" rx="7" ry="11" fill={cockpit} />
          <ellipse cx="58" cy="38" rx="2.4" ry="4" fill="#fff" opacity="0.85" />
          <Engine x={60} y={100} />
        </>
      );
  }
}

/**
 * Vector aircraft preview used in the hangar/shop. Each aircraft has a distinct
 * silhouette, so the roster reads as different machines rather than recolors.
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
      <Model id={aircraftId} palette={palette} />
    </svg>
  );
}