import { ENVIRONMENTS } from './environments';
import type { LevelConfig } from './types';

export const LEVEL_01: LevelConfig = {
  id: 'level-01',
  levelNumber: 1,
  name: 'First Contact',
  difficulty: 'easy',
  environment: ENVIRONMENTS.deepSpace,
  arena: { width: 960, height: 600 },
  scrollSpeed: 240,
  startDelaySeconds: 1.2,
  completionMode: 'clear-waves',
  playerStart: { x: 480, y: 500 },
  waves: [
    {
      id: 'w1',
      label: 'Scout line',
      startDelay: 0.6,
      groups: [{ enemyTypeId: 'fighter', count: 4, formation: 'line', interval: 0.4, startDelay: 0 }],
    },
    {
      id: 'w2',
      label: 'V formation',
      startDelay: 1.4,
      groups: [{ enemyTypeId: 'fighter', count: 5, formation: 'v', interval: 0.35, startDelay: 0 }],
    },
    {
      id: 'w3',
      label: 'Scattered raid',
      startDelay: 1.6,
      groups: [
        { enemyTypeId: 'fighter', count: 6, formation: 'random', interval: 0.3, startDelay: 0 },
      ],
    },
  ],
  obstacleSections: [
    { enemyTypeId: 'mine', count: 3, formation: 'random', interval: 0.8, startDelay: 2.5 },
  ],
  reward: { completionBonus: 500 },
};