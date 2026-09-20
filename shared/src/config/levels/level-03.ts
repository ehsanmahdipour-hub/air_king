import { ENVIRONMENTS } from './environments';
import type { LevelConfig } from './types';

export const LEVEL_03: LevelConfig = {
  id: 'level-03',
  levelNumber: 3,
  name: 'Dusk Defenses',
  difficulty: 'normal',
  environment: ENVIRONMENTS.dusk,
  arena: { width: 960, height: 600 },
  scrollSpeed: 255,
  startDelaySeconds: 1.2,
  completionMode: 'clear-waves',
  playerStart: { x: 480, y: 500 },
  waves: [
    {
      id: 'w1',
      label: 'Advance guard',
      startDelay: 0.6,
      groups: [{ enemyTypeId: 'fighter', count: 5, formation: 'line', interval: 0.35, startDelay: 0 }],
    },
    {
      id: 'w2',
      label: 'Turret line',
      startDelay: 1.6,
      groups: [
        { enemyTypeId: 'turret', count: 2, formation: 'line', interval: 1.2, startDelay: 0 },
        { enemyTypeId: 'fighter', count: 4, formation: 'v', interval: 0.3, startDelay: 0.9 },
      ],
    },
    {
      id: 'w3',
      label: 'Bomber and turret',
      startDelay: 1.8,
      groups: [
        { enemyTypeId: 'bomber', count: 2, formation: 'line', interval: 0.8, startDelay: 0 },
        { enemyTypeId: 'turret', count: 2, formation: 'column', interval: 1.1, startDelay: 1 },
      ],
    },
  ],
  obstacleSections: [
    { enemyTypeId: 'mine', count: 4, formation: 'random', interval: 0.9, startDelay: 3.5 },
  ],
  boss: { bossId: 'dreadnought', spawnDelaySeconds: 1.5 },
  reward: { completionBonus: 1000 },
};