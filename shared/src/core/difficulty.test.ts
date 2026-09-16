import { describe, expect, it } from 'vitest';

import { BOMBER, FIGHTER, MINE, TURRET } from '../config/enemies';
import { DIFFICULTY_PRESETS } from '../config/levels';
import { applyDifficulty } from './difficulty';

const NORMAL = DIFFICULTY_PRESETS.normal;

describe('applyDifficulty', () => {
  it('does not change health at any difficulty', () => {
    const easy = applyDifficulty(FIGHTER, DIFFICULTY_PRESETS.easy);
    const expert = applyDifficulty(FIGHTER, DIFFICULTY_PRESETS.expert);

    expect(easy.maxHealth).toBe(FIGHTER.maxHealth);
    expect(expert.maxHealth).toBe(FIGHTER.maxHealth);
  });

  it('scales enemy speed, fire cadence and projectile speed', () => {
    const scaled = applyDifficulty(BOMBER, { enemySpeedMultiplier: 2, fireIntervalMultiplier: 0.5, projectileSpeedMultiplier: 1.5 });

    expect(scaled.behavior).toBe('bomber');
    if (scaled.behavior !== 'bomber') {
      throw new Error('expected a bomber');
    }
    expect(scaled.speed).toBe(BOMBER.speed * 2);
    expect(scaled.fireInterval).toBe(BOMBER.fireInterval * 0.5);
    expect(scaled.projectile.speed).toBe(BOMBER.projectile.speed * 1.5);
    expect(scaled.projectile.damage).toBe(BOMBER.projectile.damage);
  });

  it('keeps the original config unchanged', () => {
    const originalSpeed = TURRET.speed;
    applyDifficulty(TURRET, { enemySpeedMultiplier: 3, fireIntervalMultiplier: 0.5, projectileSpeedMultiplier: 2 });
    expect(TURRET.speed).toBe(originalSpeed);
  });

  it('scales only speed for unarmed enemies', () => {
    const scaled = applyDifficulty(MINE, NORMAL);
    expect(scaled).toEqual(MINE);
    expect('projectile' in scaled).toBe(false);
  });
});