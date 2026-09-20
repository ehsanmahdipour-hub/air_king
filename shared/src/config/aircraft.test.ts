import { describe, expect, it } from 'vitest';

import {
  AIRCRAFT,
  DEFAULT_AIRCRAFT_ID,
  INTERCEPTOR,
  STARTER_AIRCRAFT,
  assertAircraftConfigs,
  canPurchaseAircraft,
} from './aircraft';

describe('aircraft catalog', () => {
  it('is structurally valid', () => {
    expect(() => assertAircraftConfigs()).not.toThrow();
  });

  it('starts with a default and at least two purchasable aircraft', () => {
    expect(AIRCRAFT.length).toBeGreaterThanOrEqual(3);
    const defaultAircraft = AIRCRAFT.find((aircraft) => aircraft.id === DEFAULT_AIRCRAFT_ID);
    expect(defaultAircraft?.unlock.kind).toBe('default');

    const purchasable = AIRCRAFT.filter((aircraft) => aircraft.unlock.kind === 'purchase');
    expect(purchasable.length).toBeGreaterThanOrEqual(2);
    expect(purchasable.every((aircraft) => aircraft.price > 0)).toBe(true);
  });

  it('rejects malformed definitions', () => {
    expect(() => assertAircraftConfigs([STARTER_AIRCRAFT, STARTER_AIRCRAFT])).toThrow(/Duplicate/);
    expect(() => assertAircraftConfigs([INTERCEPTOR])).toThrow(/missing/);
    expect(() => assertAircraftConfigs([{ ...STARTER_AIRCRAFT, price: -1 }, INTERCEPTOR])).toThrow(
      /negative price/,
    );
  });

  it('orders the roster by price with a distinct role per aircraft', () => {
    const prices = AIRCRAFT.map((aircraft) => aircraft.price);
    for (let index = 1; index < prices.length; index += 1) {
      expect(prices[index]!).toBeGreaterThan(prices[index - 1]!);
    }

    const roles = new Set(AIRCRAFT.map((aircraft) => aircraft.role));
    expect(roles.size).toBe(AIRCRAFT.length);
  });

  it('gives each aircraft a clear specialty', () => {
    const byId = new Map(AIRCRAFT.map((aircraft) => [aircraft.id, aircraft]));
    const maxOf = (pick: (aircraft: (typeof AIRCRAFT)[number]) => number) =>
      AIRCRAFT.reduce((best, aircraft) => (pick(aircraft) > pick(best) ? aircraft : best));

    expect(maxOf((aircraft) => aircraft.firePower).id).toBe('raptor');
    expect(maxOf((aircraft) => aircraft.speed).id).toBe('phantom');
    expect(maxOf((aircraft) => aircraft.maxHealth).id).toBe('fortress');
    expect(maxOf((aircraft) => aircraft.armor).id).toBe('fortress');
    expect(byId.get('raptor')!.price).toBeGreaterThan(byId.get('phantom')!.price);
  });
});

describe('canPurchaseAircraft', () => {
  it('allows buying an affordable, unowned aircraft', () => {
    expect(canPurchaseAircraft(INTERCEPTOR, [], INTERCEPTOR.price)).toEqual({ ok: true });
  });

  it('rejects the default aircraft', () => {
    expect(canPurchaseAircraft(STARTER_AIRCRAFT, [], 1_000_000)).toEqual({
      ok: false,
      reason: 'not_purchasable',
    });
  });

  it('rejects an already-owned aircraft', () => {
    expect(canPurchaseAircraft(INTERCEPTOR, [INTERCEPTOR.id], INTERCEPTOR.price)).toEqual({
      ok: false,
      reason: 'already_owned',
    });
  });

  it('rejects when coins are insufficient', () => {
    expect(canPurchaseAircraft(INTERCEPTOR, [], INTERCEPTOR.price - 1)).toEqual({
      ok: false,
      reason: 'insufficient_coins',
    });
  });

  it('rejects an unavailable aircraft', () => {
    const unavailable = { ...INTERCEPTOR, availability: 'coming-soon' as const };
    expect(canPurchaseAircraft(unavailable, [], 1_000_000)).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });
});