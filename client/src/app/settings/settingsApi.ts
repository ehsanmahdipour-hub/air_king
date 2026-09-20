import type { GameSettings } from '@game/shared';

import { apiRequest } from '../apiClient';

export function getSettings(): Promise<{ settings: GameSettings }> {
  return apiRequest<{ settings: GameSettings }>('/api/v1/settings');
}

export function updateSettings(settings: GameSettings): Promise<{ settings: GameSettings }> {
  return apiRequest<{ settings: GameSettings }>('/api/v1/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}