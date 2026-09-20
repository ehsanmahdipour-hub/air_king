import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, movementControlSchema, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns defaults for empty input', () => {
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates the legacy keyboard movement value to wasd', () => {
    expect(parseSettings({ movement: 'keyboard' }).movement).toBe('wasd');
  });

  it('keeps arrow-key movement', () => {
    expect(parseSettings({ movement: 'arrows' }).movement).toBe('arrows');
  });

  it('merges partial settings over defaults', () => {
    expect(parseSettings({ musicEnabled: false })).toEqual({
      ...DEFAULT_SETTINGS,
      musicEnabled: false,
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(parseSettings({ masterVolume: 5 }).masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
  });

  it('defaults difficulty to normal and accepts easy/hard', () => {
    expect(parseSettings({}).difficulty).toBe('normal');
    expect(parseSettings({ difficulty: 'hard' }).difficulty).toBe('hard');
    expect(parseSettings({ difficulty: 'easy' }).difficulty).toBe('easy');
  });

  it('falls back to normal difficulty for invalid values', () => {
    expect(parseSettings({ difficulty: 'insane' }).difficulty).toBe('normal');
  });
});

describe('movement options', () => {
  it('accepts wasd, arrows and mouse, and rejects the legacy keyboard value', () => {
    for (const option of ['wasd', 'arrows', 'mouse']) {
      expect(movementControlSchema.safeParse(option).success).toBe(true);
    }
    expect(movementControlSchema.safeParse('keyboard').success).toBe(false);
  });
});