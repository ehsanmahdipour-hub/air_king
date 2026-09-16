import { ENVIRONMENTS } from './environments';
import type { LevelConfig } from './types';

const SCROLL_SPEED = 260;
const SURVIVAL_SECONDS = 30;

export const LEVEL_05: LevelConfig = {
  id: 'level-05',
  levelNumber: 5,
  name: 'Deep Space Endurance',
  difficulty: 'expert',
  environment: ENVIRONMENTS.deepSpace,
  arena: { width: 960, height: 600 },
  scrollSpeed: SCROLL_SPEED,
  startDelaySeconds: 1.3,
  completionMode: 'reach-distance',
  lengthUnits: SCROLL_SPEED * SURVIVAL_SECONDS,
  loopWaves: true,
  playerStart: { x: 480, y: 500 },
  waves: [
    {
      id: 'w1',
      label: 'Endless fighters',
      startDelay: 0.5,
      groups: [{ enemyTypeId: 'fighter', count: 5, formation: 'v', interval: 0.3, startDelay: 0 }],
    },
    {
      id: 'w2',
      label: 'Bomber wave',
      startDelay: 1.2,
      groups: [
        { enemyTypeId: 'bomber', count: 2, formation: 'line', interval: 0.7, startDelay: 0 },
      ],
    },
    {
      id: 'w3',
      label: 'Turret line',
      startDelay: 1.2,
      groups: [
        { enemyTypeId: 'turret', count: 2, formation: 'line', interval: 1, startDelay: 0 },
        { enemyTypeId: 'fighter', count: 5, formation: 'line', interval: 0.28, startDelay: 0.8 },
      ],
    },
  ],
  obstacleSections: [
    { enemyTypeId: 'mine', count: 3, formation: 'random', interval: 1.1, startDelay: 2 },
    { enemyTypeId: 'mine', count: 4, formation: 'line', interval: 0.7, startDelay: 8 },
  ],
  reward: { completionBonus: 2500 },
};