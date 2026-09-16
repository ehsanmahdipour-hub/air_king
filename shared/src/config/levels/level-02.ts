import { ENVIRONMENTS } from './environments';
import type { LevelConfig } from './types';

export const LEVEL_02: LevelConfig = {
  id: 'level-02',
  levelNumber: 2,
  name: 'Nebula Patrol',
  difficulty: 'normal',
  environment: ENVIRONMENTS.nebula,
  arena: { width: 960, height: 600 },
  scrollSpeed: 250,
  startDelaySeconds: 1.2,
  completionMode: 'clear-waves',
  playerStart: { x: 480, y: 500 },
  waves: [
    {
      id: 'w1',
      label: 'Twin line',
      startDelay: 0.6,
      groups: [
        { enemyTypeId: 'fighter', count: 4, formation: 'line', interval: 0.35, startDelay: 0 },
        { enemyTypeId: 'fighter', count: 4, formation: 'v', interval: 0.35, startDelay: 0.6 },
      ],
    },
    {
      id: 'w2',
      label: 'Scatter',
      startDelay: 1.5,
      groups: [
        { enemyTypeId: 'fighter', count: 7, formation: 'random', interval: 0.28, startDelay: 0 },
      ],
    },
    {
      id: 'w3',
      label: 'Bomber escort',
      startDelay: 1.6,
      groups: [
        { enemyTypeId: 'bomber', count: 1, formation: 'column', interval: 0.5, startDelay: 0 },
        { enemyTypeId: 'fighter', count: 5, formation: 'v', interval: 0.3, startDelay: 0.8 },
      ],
    },
  ],
  obstacleSections: [
    { enemyTypeId: 'mine', count: 4, formation: 'column', interval: 0.7, startDelay: 3 },
  ],
  reward: { completionBonus: 750 },
};