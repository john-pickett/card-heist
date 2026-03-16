/**
 * Tests for the Two-Tap Tico crew bonus logic from handleSneakInEnd (App.tsx).
 *
 * Tico is a passive crew member. When active on a heist, the Act One timing
 * bonus is multiplied by 1.5× (applied after bonus-cut, if any). Has no
 * effect when timingBonus === 0 (timeout or too slow). Does not consume any
 * inventory item.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { useCrewStore } from '../crewStore';
import { useInventoryStore } from '../inventoryStore';

// Mirrors the Tico block inside handleSneakInEnd in App.tsx.
function applyTicoBonus(timingBonus: number): number {
  if (timingBonus > 0 && useCrewStore.getState().activeHeistCrew.includes('tico')) {
    return Math.round(timingBonus * 1.5);
  }
  return timingBonus;
}

// Matches the elapsedSec → timingBonus table in App.tsx handleSneakInEnd.
function computeTimingBonus(elapsedSec: number): number {
  return (
    elapsedSec <= 15  ? 500 :
    elapsedSec <= 30  ? 400 :
    elapsedSec <= 60  ? 250 :
    elapsedSec <= 90  ? 150 :
    elapsedSec <= 120 ? 100 : 0
  );
}

describe('Two-Tap Tico crew bonus', () => {
  beforeEach(() => {
    useCrewStore.setState({ activeHeistCrew: [], unlockedIds: [], consecutiveHeists: {}, lastHeistCrew: [] });
    useInventoryStore.setState({ items: [] });
  });

  test('multiplies timingBonus by 1.5 when Tico is in activeHeistCrew and bonus > 0', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    expect(applyTicoBonus(400)).toBe(600);
  });

  test('does not apply when Tico is not in activeHeistCrew', () => {
    useCrewStore.setState({ activeHeistCrew: [] });
    expect(applyTicoBonus(400)).toBe(400);
  });

  test('does not apply when activeHeistCrew contains other crew but not Tico', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'bishop'] });
    expect(applyTicoBonus(400)).toBe(400);
  });

  test('does not apply when timingBonus is 0 (timeout)', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    expect(applyTicoBonus(0)).toBe(0);
  });

  test('each timing tier is multiplied correctly', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    const tiers: Array<[number, number, number]> = [
      [10,  500, 750],
      [20,  400, 600],
      [45,  250, 375],
      [75,  150, 225],
      [100, 100, 150],
    ];
    for (const [elapsedSec, base, expected] of tiers) {
      expect(computeTimingBonus(elapsedSec)).toBe(base);
      expect(applyTicoBonus(base)).toBe(expected);
    }
  });

  test('stacks correctly with bonus-cut — bonus-cut first (×2), Tico second (×1.5)', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    // Simulate: base 400 → bonus-cut doubles to 800 → Tico ×1.5 = 1200
    const afterBonusCut = computeTimingBonus(20) * 2; // 800
    expect(applyTicoBonus(afterBonusCut)).toBe(1200);
  });

  test('stacks correctly with bonus-cut across all tiers', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    const tiers: Array<[number, number, number]> = [
      [10,  500 * 2, 1500],
      [20,  400 * 2, 1200],
      [45,  250 * 2,  750],
      [75,  150 * 2,  450],
      [100, 100 * 2,  300],
    ];
    for (const [, afterBonusCut, expected] of tiers) {
      expect(applyTicoBonus(afterBonusCut)).toBe(expected);
    }
  });

  test('does not consume any inventory items when Tico applies', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    useInventoryStore.setState({
      items: [
        { itemId: 'false-alarm', quantity: 2 },
        { itemId: 'inside-tip', quantity: 1 },
      ],
    });
    applyTicoBonus(400);
    expect(useInventoryStore.getState().items).toEqual([
      { itemId: 'false-alarm', quantity: 2 },
      { itemId: 'inside-tip', quantity: 1 },
    ]);
  });

  test('applies when Tico is active alongside other crew members', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'tico', 'bishop'] });
    expect(applyTicoBonus(400)).toBe(600);
  });

  test('bonus of 0 stays 0 even if Tico is active (too slow, no bonus earned)', () => {
    useCrewStore.setState({ activeHeistCrew: ['tico'] });
    // Player finished but got 0 bonus (> 120s elapsed)
    expect(applyTicoBonus(computeTimingBonus(130))).toBe(0);
  });
});
