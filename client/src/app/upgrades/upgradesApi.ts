import type { PurchaseUpgradeResponse, UpgradesResponse } from '@game/shared';

import { apiRequest } from '../apiClient';

/** Returns the player's upgrade levels and current coin balance. */
export function getUpgrades(): Promise<UpgradesResponse> {
  return apiRequest<UpgradesResponse>('/api/v1/upgrades');
}

/** Buys the next level of an upgrade; the server owns the price and balance. */
export function purchaseUpgrade(upgradeId: string): Promise<PurchaseUpgradeResponse> {
  return apiRequest<PurchaseUpgradeResponse>(
    `/api/v1/upgrades/${encodeURIComponent(upgradeId)}/purchase`,
    { method: 'POST' },
  );
}