/**
 * Enemy definitions. `behavior` selects the movement strategy in the
 * simulation; only `straight` exists in the prototype. New enemies are added as
 * data entries, and new behaviors as additional strategy implementations.
 */
export type EnemyBehavior = 'straight';

export interface EnemyConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  /** Downward travel speed in units per second. */
  speed: number;
  radius: number;
  /** Damage dealt to the player on contact. */
  contactDamage: number;
  /** Score awarded when destroyed by the player. */
  scoreValue: number;
  behavior: EnemyBehavior;
}

export const BASIC_FIGHTER: EnemyConfig = {
  id: 'basic-fighter',
  displayName: 'Fighter',
  maxHealth: 20,
  speed: 150,
  radius: 16,
  contactDamage: 20,
  scoreValue: 100,
  behavior: 'straight',
};

export const ENEMIES: Record<string, EnemyConfig> = {
  [BASIC_FIGHTER.id]: BASIC_FIGHTER,
};

export function getEnemy(id: string): EnemyConfig {
  const enemy = ENEMIES[id];
  if (!enemy) {
    throw new Error(`Unknown enemy id: ${id}`);
  }
  return enemy;
}
