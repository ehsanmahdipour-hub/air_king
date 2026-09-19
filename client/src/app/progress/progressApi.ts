import type { CompleteLevelResponse, ProgressResponse } from '@game/shared';

import { apiRequest } from '../apiClient';

/** Fetches the authenticated player's persisted progression. */
export function getProgress(): Promise<ProgressResponse> {
  return apiRequest<ProgressResponse>('/api/v1/progress');
}

/**
 * Submits a completed level. Only the gameplay score is sent; the server owns
 * bonuses, coins and progression.
 */
export function completeLevel(levelId: string, score: number): Promise<CompleteLevelResponse> {
  return apiRequest<CompleteLevelResponse>(
    `/api/v1/progress/levels/${encodeURIComponent(levelId)}/complete`,
    { method: 'POST', body: JSON.stringify({ score }) },
  );
}