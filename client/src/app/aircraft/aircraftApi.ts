import type { AircraftResponse, PurchaseAircraftResponse } from '@game/shared';

import { apiRequest } from '../apiClient';

/** Returns ownership/equipped state for every aircraft plus the profile. */
export function getAircraft(): Promise<AircraftResponse> {
  return apiRequest<AircraftResponse>('/api/v1/aircraft');
}

/** Buys an aircraft; the server owns the price and balance. */
export function purchaseAircraft(aircraftId: string): Promise<PurchaseAircraftResponse> {
  return apiRequest<PurchaseAircraftResponse>(
    `/api/v1/aircraft/${encodeURIComponent(aircraftId)}/purchase`,
    { method: 'POST' },
  );
}

/** Equips an owned aircraft. */
export function equipAircraft(aircraftId: string): Promise<PurchaseAircraftResponse> {
  return apiRequest<PurchaseAircraftResponse>(
    `/api/v1/aircraft/${encodeURIComponent(aircraftId)}/equip`,
    { method: 'POST' },
  );
}