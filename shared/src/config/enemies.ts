import type { ProjectileSpec } from './weapons';

/**
 * Enemy definitions. A discriminated union on `behavior` keeps each enemy's
 * data type-safe: behaviors receive exactly the fields they need. Adding an
 * enemy is a new config entry; adding a behavior is one small module plus a
 * registry entry, never a change to the enemy engine.
 */
export type EnemyBehavior = 'fighter' | 'bomber' | 'mine' | 'turret' | 'diver';

export interface EnemyBaseConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  /** Downward travel speed in units per second (also turret descent speed). */
  speed: number;
  radius: number;
  /** Damage dealt to the player on contact. */
  contactDamage: number;
  /** Score awarded when destroyed by the player. */
  scoreValue: number;
  behavior: EnemyBehavior;
}

export interface FighterConfig extends EnemyBaseConfig {
  behavior: 'fighter';
  /** Horizontal seek speed toward the player in units per second. */
  horizontalSeekSpeed: number;
  fireDelay: number;
  fireInterval: number;
  projectile: ProjectileSpec;
}

export interface BomberConfig extends EnemyBaseConfig {
  behavior: 'bomber';
  fireDelay: number;
  fireInterval: number;
  projectile: ProjectileSpec;
}

export interface MineConfig extends EnemyBaseConfig {
  behavior: 'mine';
}

export interface DiverConfig extends EnemyBaseConfig {
  behavior: 'diver';
  /** Speed used while diving at the player. */
  diveSpeed: number;
  /** Horizontal distance at which the diver commits to a dive. */
  diveRange: number;
}

export interface TurretConfig extends EnemyBaseConfig {
  behavior: 'turret';
  /** Vertical position where the turret stops and starts firing. */
  anchorY: number;
  fireDelay: number;
  fireInterval: number;
  projectile: ProjectileSpec;
}

export type EnemyConfig = FighterConfig | BomberConfig | MineConfig | TurretConfig | DiverConfig;

export const FIGHTER: FighterConfig = {
  id: 'fighter',
  displayName: 'Fighter',
  behavior: 'fighter',
  maxHealth: 20,
  speed: 170,
  radius: 16,
  contactDamage: 20,
  scoreValue: 100,
  horizontalSeekSpeed: 90,
  fireDelay: 0.9,
  fireInterval: 1.6,
  projectile: { damage: 8, speed: 320, radius: 5, lifeSeconds: 3, count: 1, spreadDegrees: 0 },
};

export const BOMBER: BomberConfig = {
  id: 'bomber',
  displayName: 'Bomber',
  behavior: 'bomber',
  maxHealth: 70,
  speed: 80,
  radius: 24,
  contactDamage: 30,
  scoreValue: 250,
  fireDelay: 1,
  fireInterval: 2.2,
  projectile: { damage: 12, speed: 240, radius: 7, lifeSeconds: 3.5, count: 3, spreadDegrees: 40 },
};

export const MINE: MineConfig = {
  id: 'mine',
  displayName: 'Mine',
  behavior: 'mine',
  maxHealth: 30,
  speed: 240,
  radius: 18,
  contactDamage: 35,
  scoreValue: 50,
};

export const DIVER: DiverConfig = {
  id: 'diver',
  displayName: 'Diver',
  behavior: 'diver',
  maxHealth: 16,
  speed: 130,
  radius: 15,
  contactDamage: 30,
  scoreValue: 140,
  diveSpeed: 420,
  diveRange: 150,
};

export const TURRET: TurretConfig = {
  id: 'turret',
  displayName: 'Turret',
  behavior: 'turret',
  maxHealth: 55,
  speed: 140,
  radius: 20,
  contactDamage: 25,
  scoreValue: 180,
  anchorY: 130,
  fireDelay: 0.8,
  fireInterval: 1.5,
  projectile: { damage: 10, speed: 300, radius: 6, lifeSeconds: 4, count: 1, spreadDegrees: 0 },
};

export const ENEMIES: Record<string, EnemyConfig> = {
  [FIGHTER.id]: FIGHTER,
  [BOMBER.id]: BOMBER,
  [MINE.id]: MINE,
  [TURRET.id]: TURRET,
  [DIVER.id]: DIVER,
};

export function getEnemy(id: string): EnemyConfig {
  const enemy = ENEMIES[id];
  if (!enemy) {
    throw new Error(`Unknown enemy id: ${id}`);
  }
  return enemy;
}
