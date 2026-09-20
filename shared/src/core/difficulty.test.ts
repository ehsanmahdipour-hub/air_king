import { describe, expect, it } from 'vitest';

import { BOMBER, MINE, TURRET } from '../config/enemies';
import { applyDifficulty, resolveDifficulty, type ResolvedDifficulty } from './difficulty';

const NEUTRAL: ResolvedDifficulty = {
  enemyHealth: 1,
  enemyDamage: 1,
  enemySpeed: 1,
  projectileSpeed: 1,
  fireInterval: 1,
  spawnRate: 1,
  playerDamage: 1,
};

describe('resolveDifficulty', () => {
  it('is neutral for normal difficulty on a normal level', () => {
    expect(resolveDifficulty('normal', 'normal')).toEqual(NEUTRAL);
  });

  it('makes easy gentler and hard harsher', () => {
    const easy = resolveDifficulty('normal', 'easy');
    const hard = resolveDifficulty('normal', 'hard');

    expect(easy.enemyDamage).toBeLessThan(1);
    expect(easy.spawnRate).toBeLessThan(1);
    expect(easy.playerDamage).toBeGreaterThan(1);

    expect(hard.enemyDamage).toBeGreaterThan(1);
    expect(hard.fireInterval).toBeLessThan(1);
    expect(hard.spawnRate).toBeGreaterThan(1);
  });

  it('combines the level tier with the player difficulty', () => {
    expect(resolveDifficulty('expert', 'hard').enemySpeed).toBeGreaterThan(
      resolveDifficulty('hard', 'hard').enemySpeed,
    );
  });
});

describe('applyDifficulty', () => {
  it('scales health, damage, speed, fire cadence and projectiles', () => {
    const scaled = applyDifficulty(BOMBER, {
      ...NEUTRAL,
      enemyHealth: 2,
      enemyDamage: 1.5,
      enemySpeed: 2,
      fireInterval: 0.5,
      projectileSpeed: 1.5,
    });

    expect(scaled.behavior).toBe('bomber');
    if (scaled.behavior !== 'bomber') {
      throw new Error('expected a bomber');
    }
    expect(scaled.maxHealth).toBe(BOMBER.maxHealth * 2);
    expect(scaled.contactDamage).toBe(BOMBER.contactDamage * 1.5);
    expect(scaled.speed).toBe(BOMBER.speed * 2);
    expect(scaled.fireInterval).toBe(BOMBER.fireInterval * 0.5);
    expect(scaled.projectile.speed).toBe(BOMBER.projectile.speed * 1.5);
    expect(scaled.projectile.damage).toBe(BOMBER.projectile.damage * 1.5);
  });

  it('keeps the original config unchanged', () => {
    const originalSpeed = TURRET.speed;
    applyDifficulty(TURRET, { ...NEUTRAL, enemySpeed: 3 });
    expect(TURRET.speed).toBe(originalSpeed);
  });

  it('scales only common stats for unarmed enemies', () => {
    const scaled = applyDifficulty(MINE, NEUTRAL);
    expect(scaled.speed).toBe(MINE.speed);
    expect('projectile' in scaled).toBe(false);
  });
});