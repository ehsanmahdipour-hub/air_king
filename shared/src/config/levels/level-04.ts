import { ENVIRONMENTS } from './environments';
import type { LevelConfig } from './types';

export const LEVEL_04: LevelConfig = {
  id: 'level-04',
  levelNumber: 4,
  name: 'Nebula Onslaught',
  difficulty: 'hard',
  environment: ENVIRONMENTS.nebula,
  arena: { width: 960, height: 600 },
  scrollSpeed: 265,
  startDelaySeconds: 1.3,
  completionMode: 'clear-waves',
  playerStart: { x: 480, y: 500 },
  waves: [
    {
      id: 'w1',
      label: 'Fighter swarm with flak',
      startDelay: 0.5,
      groups: [
        { enemyTypeId: 'fighter', count: 6, formation: 'v', interval: 0.28, startDelay: 0 },
        { enemyTypeId: 'turret', count: 2, formation: 'column', interval: 1, startDelay: 0.8 },
      ],
    },
    {
      id: 'w2',
      label: 'Bomber wedge',
      startDelay: 1.5,
      groups: [
        { enemyTypeId: 'bomber', count: 3, formation: 'line', interval: 0.7, startDelay: 0 },
        { enemyTypeId: 'fighter', count: 4, formation: 'column', interval: 0.3, startDelay: 0.6 },
      ],
    },
    {
      id: 'w3',
      label: 'Mixed assault',
      startDelay: 1.7,
      groups: [
        { enemyTypeId: 'fighter', count: 6, formation: 'v', interval: 0.25, startDelay: 0 },
        { enemyTypeId: 'bomber', count: 2, formation: 'line', interval: 0.7, startDelay: 0.7 },
        { enemyTypeId: 'turret', count: 2, formation: 'line', interval: 1, startDelay: 1.4 },
      ],
    },
  ],
  obstacleSections: [
    { enemyTypeId: 'mine', count: 4, formation: 'line', interval: 0.6, startDelay: 3 },
    { enemyTypeId: 'mine', count: 4, formation: 'random', interval: 0.8, startDelay: 9 },
  ],
  reward: { completionBonus: 1500 },
};