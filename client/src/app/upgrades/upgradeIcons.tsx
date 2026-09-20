import type { UpgradeId } from '@game/shared';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Shape({ id }: { id: UpgradeId }) {
  switch (id) {
    case 'weapon-damage':
      return (
        <>
          <path {...STROKE} d="M4 20 12 12" />
          <path {...STROKE} d="M9 7l8 8" />
          <circle {...STROKE} cx="17" cy="7" r="3" />
          <path {...STROKE} d="M6 6l2 2M4 10l2 1" />
        </>
      );
    case 'weapon-fire-rate':
      return (
        <>
          <path {...STROKE} d="M3 12h11" />
          <path {...STROKE} d="M3 7h8M3 17h8" opacity="0.6" />
          <path {...STROKE} d="M15 8l5 4-5 4z" />
        </>
      );
    case 'weapon-projectile-count':
      return (
        <>
          <path {...STROKE} d="M4 18 12 6" />
          <path {...STROKE} d="M12 18 20 6" />
          <path {...STROKE} d="M8 18 16 6" opacity="0.6" />
        </>
      );
    case 'weapon-projectile-speed':
      return (
        <>
          <path {...STROKE} d="M3 12h13" />
          <path {...STROKE} d="M12 8l5 4-5 4z" />
          <path {...STROKE} d="M3 7l4 2M3 17l4-2" opacity="0.6" />
        </>
      );
    case 'aircraft-health':
      return (
        <>
          <path {...STROKE} d="M12 20s-7-4.6-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.4 12 20 12 20z" />
          <path {...STROKE} d="M12 11v4M10 13h4" />
        </>
      );
    case 'aircraft-armor':
      return (
        <>
          <path {...STROKE} d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
          <path {...STROKE} d="M12 8v6" opacity="0.6" />
        </>
      );
    case 'aircraft-speed':
      return (
        <>
          <path {...STROKE} d="M4 8h9M4 12h6M4 16h9" />
          <path {...STROKE} d="M15 7l5 5-5 5z" />
        </>
      );
    case 'aircraft-fire-power':
      return (
        <>
          <path {...STROKE} d="M12 3l2.4 5.4L20 9.6l-4.4 3.6L17 19l-5-3-5 3 1.4-5.8L4 9.6l5.6-1.2z" />
        </>
      );
    default:
      return <circle {...STROKE} cx="12" cy="12" r="7" />;
  }
}

/** Consistent line icon per upgrade type. */
export function UpgradeIcon({ id, size = 26 }: { id: UpgradeId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <Shape id={id} />
    </svg>
  );
}