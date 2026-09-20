import { BASIC_CANNON, DOUBLE_SHOT, RAILGUN, SPREAD_SHOT } from './weapons';

/**
 * Aircraft definitions. All stats are data so the simulation stays
 * aircraft-agnostic: the equipped aircraft's config is resolved into a loadout
 * and applied to the one gameplay implementation.
 */
export type AircraftAvailability = 'available' | 'coming-soon';

export interface AircraftUnlock {
  kind: 'default' | 'purchase';
  /** Reserved for progress-gated aircraft in a later phase. */
  levelNumber?: number;
}

export interface AircraftAbility {
  id: string;
  displayName: string;
  description: string;
}

export interface AircraftConfig {
  id: string;
  displayName: string;
  /** Short role label shown in the hangar, e.g. Scout, Tank, Premium. */
  role: string;
  description: string;
  maxHealth: number;
  armor: number;
  speed: number;
  /** Base weapon damage multiplier. */
  firePower: number;
  /** Base weapon fire-rate multiplier. */
  fireRate: number;
  radius: number;
  invulnerabilitySeconds: number;
  weaponId: string;
  /** Placeholder for a future special ability. */
  ability?: AircraftAbility;
  /** Purchase price in coins; 0 for the default aircraft. */
  price: number;
  unlock: AircraftUnlock;
  availability: AircraftAvailability;
}

export const STARTER_AIRCRAFT: AircraftConfig = {
  id: 'starter',
  displayName: 'Starter Aircraft',
  role: 'Balanced',
  description: 'A reliable all-rounder that is easy to fly.',
  maxHealth: 100,
  armor: 0,
  speed: 360,
  firePower: 1,
  fireRate: 1,
  radius: 16,
  invulnerabilitySeconds: 0.75,
  weaponId: BASIC_CANNON.id,
  price: 0,
  unlock: { kind: 'default' },
  availability: 'available',
};

export const INTERCEPTOR: AircraftConfig = {
  id: 'interceptor',
  displayName: 'Interceptor',
  role: 'Scout',
  description: 'Fast and agile with twin cannons; light armor.',
  maxHealth: 85,
  armor: 0,
  speed: 470,
  firePower: 1.1,
  fireRate: 1.2,
  radius: 14,
  invulnerabilitySeconds: 0.7,
  weaponId: DOUBLE_SHOT.id,
  price: 800,
  unlock: { kind: 'purchase' },
  availability: 'available',
};

export const GUNSHIP: AircraftConfig = {
  id: 'gunship',
  displayName: 'Gunship',
  role: 'Heavy',
  description: 'Heavy firepower with a wide spread; slower to turn.',
  maxHealth: 125,
  armor: 3,
  speed: 330,
  firePower: 1.3,
  fireRate: 0.95,
  radius: 19,
  invulnerabilitySeconds: 0.8,
  weaponId: SPREAD_SHOT.id,
  price: 1_500,
  unlock: { kind: 'purchase' },
  availability: 'available',
};

export const FORTRESS: AircraftConfig = {
  id: 'fortress',
  displayName: 'Fortress',
  role: 'Tank',
  description: 'A flying bunker: heavy armor and high health, but slow.',
  maxHealth: 200,
  armor: 7,
  speed: 300,
  firePower: 1,
  fireRate: 0.85,
  radius: 20,
  invulnerabilitySeconds: 0.9,
  weaponId: BASIC_CANNON.id,
  price: 2_400,
  unlock: { kind: 'purchase' },
  availability: 'available',
};

export const PHANTOM: AircraftConfig = {
  id: 'phantom',
  displayName: 'Phantom',
  role: 'Elite',
  description: 'Blistering speed and twin cannons; a glass cannon.',
  maxHealth: 95,
  armor: 2,
  speed: 500,
  firePower: 1.35,
  fireRate: 1.35,
  radius: 13,
  invulnerabilitySeconds: 0.65,
  weaponId: DOUBLE_SHOT.id,
  price: 3_600,
  unlock: { kind: 'purchase' },
  availability: 'available',
};

export const RAPTOR: AircraftConfig = {
  id: 'raptor',
  displayName: 'Raptor',
  role: 'Premium',
  description: 'The flagship: armored hull mounting a hard-hitting railgun.',
  maxHealth: 150,
  armor: 4,
  speed: 430,
  firePower: 1.7,
  fireRate: 1.15,
  radius: 16,
  invulnerabilitySeconds: 0.8,
  weaponId: RAILGUN.id,
  price: 5_200,
  unlock: { kind: 'purchase' },
  availability: 'available',
};

/** Ordered from cheapest to most capable so progression reads clearly. */
export const AIRCRAFT: AircraftConfig[] = [
  STARTER_AIRCRAFT,
  INTERCEPTOR,
  GUNSHIP,
  FORTRESS,
  PHANTOM,
  RAPTOR,
];

export const DEFAULT_AIRCRAFT_ID = STARTER_AIRCRAFT.id;

const AIRCRAFT_BY_ID: Record<string, AircraftConfig> = Object.fromEntries(
  AIRCRAFT.map((aircraft) => [aircraft.id, aircraft]),
);

export function getAircraft(id: string): AircraftConfig {
  const aircraft = AIRCRAFT_BY_ID[id];
  if (!aircraft) {
    throw new Error(`Unknown aircraft id: ${id}`);
  }
  return aircraft;
}

export function isAircraftId(id: string): boolean {
  return id in AIRCRAFT_BY_ID;
}

export type AircraftPurchaseReason =
  | 'unavailable'
  | 'not_purchasable'
  | 'already_owned'
  | 'insufficient_coins';

export type AircraftPurchaseCheck =
  | { ok: true }
  | { ok: false; reason: AircraftPurchaseReason };

/**
 * Pure purchase eligibility check shared by the client (button state/preview)
 * and the server (authoritative validation). The server still owns the balance.
 */
export function canPurchaseAircraft(
  aircraft: AircraftConfig,
  ownedAircraftIds: readonly string[],
  coins: number,
): AircraftPurchaseCheck {
  if (aircraft.availability !== 'available') {
    return { ok: false, reason: 'unavailable' };
  }
  if (aircraft.unlock.kind !== 'purchase') {
    return { ok: false, reason: 'not_purchasable' };
  }
  if (ownedAircraftIds.includes(aircraft.id)) {
    return { ok: false, reason: 'already_owned' };
  }
  if (coins < aircraft.price) {
    return { ok: false, reason: 'insufficient_coins' };
  }
  return { ok: true };
}

/** Validates the shape of every aircraft definition at module load. */
export function assertAircraftConfigs(aircraft: AircraftConfig[] = AIRCRAFT): void {
  const ids = new Set<string>();

  for (const entry of aircraft) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate aircraft id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (entry.maxHealth <= 0 || entry.speed <= 0 || entry.radius <= 0) {
      throw new Error(`Aircraft "${entry.id}" has non-positive base stats`);
    }
    if (entry.price < 0) {
      throw new Error(`Aircraft "${entry.id}" has a negative price`);
    }
  }

  if (!ids.has(DEFAULT_AIRCRAFT_ID)) {
    throw new Error(`Default aircraft "${DEFAULT_AIRCRAFT_ID}" is missing`);
  }
}

assertAircraftConfigs();