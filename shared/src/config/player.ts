import { BASIC_CANNON } from './weapons';

/**
 * Player aircraft definition. Attributes are data so future aircraft can be
 * added without touching the simulation. Only the starter aircraft exists now.
 */
export interface PlayerConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  /** Movement speed in units per second. */
  speed: number;
  /** Collision radius, also used as the mouse dead-zone. */
  radius: number;
  /** Seconds of invulnerability after taking a contact hit. */
  invulnerabilitySeconds: number;
  weaponId: string;
}

export const STARTER_AIRCRAFT: PlayerConfig = {
  id: 'starter',
  displayName: 'Starter Aircraft',
  maxHealth: 100,
  speed: 360,
  radius: 16,
  invulnerabilitySeconds: 0.75,
  weaponId: BASIC_CANNON.id,
};
