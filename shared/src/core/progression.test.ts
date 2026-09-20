import { describe, expect, it } from 'vitest';

import { LEVELS, getNextLevelId } from '../config/levels';
import { isLevelUnlocked } from './progression';

describe('isLevelUnlocked', () => {
  it('always unlocks the first level', () => {
    expect(isLevelUnlocked(LEVELS[0].id, [])).toBe(true);
  });

  it('locks a level until the previous one is completed', () => {
    const [first, second] = LEVELS;

    expect(isLevelUnlocked(second.id, [])).toBe(false);
    expect(isLevelUnlocked(second.id, [first.id])).toBe(true);
  });

  it('does not unlock a later level without its direct predecessor', () => {
    const [first, , third] = LEVELS;
    expect(isLevelUnlocked(third.id, [first.id])).toBe(false);
  });

  it('throws for an unknown level id', () => {
    expect(() => isLevelUnlocked('does-not-exist', [])).toThrow();
  });
});

describe('getNextLevelId', () => {
  it('returns the next level in campaign order', () => {
    expect(getNextLevelId(LEVELS[0].id)).toBe(LEVELS[1].id);
  });

  it('returns null for the last level', () => {
    expect(getNextLevelId(LEVELS[LEVELS.length - 1].id)).toBeNull();
  });

  it('unlocks the full 50-level chain once every earlier level is completed', () => {
    const last = LEVELS[LEVELS.length - 1];
    const completed = LEVELS.slice(0, LEVELS.length - 1).map((level) => level.id);
    expect(isLevelUnlocked(last.id, completed)).toBe(true);
  });
});