/**
 * Tests for the bonus-cut item logic from handleSneakInEnd (App.tsx).
 *
 * bonus-cut is a passive item consumed at the end of Act One.
 * When the player has bonus-cut in their inventory and the timing bonus > 0,
 * the bonus is doubled and one bonus-cut is consumed.
 * If timingBonus === 0 (timed out or too slow), the item is NOT consumed.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { useInventoryStore } from '../inventoryStore';

// Mirrors the bonus-cut block inside handleSneakInEnd in App.tsx.
// Call this after computing timingBonus the same way App.tsx does.
function applyBonusCut(timingBonus: number): number {
  const inv = useInventoryStore.getState();
  if (timingBonus > 0 && inv.items.some(e => e.itemId === 'bonus-cut')) {
    timingBonus *= 2;
    inv.removeItem('bonus-cut');
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

describe('bonus-cut item', () => {
  beforeEach(() => {
    useInventoryStore.setState({ items: [] });
  });

  test('doubles timingBonus when bonus-cut is in inventory and bonus > 0', () => {
    useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 1 }] });
    const result = applyBonusCut(computeTimingBonus(20)); // 400 → 800
    expect(result).toBe(800);
  });

  test('does not double timingBonus when bonus-cut is not in inventory', () => {
    const result = applyBonusCut(computeTimingBonus(20)); // 400, no item
    expect(result).toBe(400);
  });

  test('does not double when timingBonus is 0 (timeout / too slow)', () => {
    useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 1 }] });
    const result = applyBonusCut(0); // timed out → stays 0
    expect(result).toBe(0);
  });

  test('does not consume bonus-cut when timingBonus is 0', () => {
    useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 1 }] });
    applyBonusCut(0);
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'bonus-cut', quantity: 1 }]);
  });

  test('consumes exactly one bonus-cut when applied', () => {
    useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 1 }] });
    applyBonusCut(computeTimingBonus(10)); // 500 → consumed
    expect(useInventoryStore.getState().items).toEqual([]);
  });

  test('decrements quantity by 1 when player owns multiple bonus-cut', () => {
    useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 3 }] });
    applyBonusCut(computeTimingBonus(10)); // applies once
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'bonus-cut', quantity: 2 }]);
  });

  test('each bonus tier doubles correctly', () => {
    const tiers: Array<[number, number, number]> = [
      [10,  500, 1000],
      [20,  400,  800],
      [45,  250,  500],
      [75,  150,  300],
      [100, 100,  200],
    ];

    for (const [elapsedSec, base, doubled] of tiers) {
      useInventoryStore.setState({ items: [{ itemId: 'bonus-cut', quantity: 1 }] });
      const bonus = computeTimingBonus(elapsedSec);
      expect(bonus).toBe(base);
      expect(applyBonusCut(bonus)).toBe(doubled);
    }
  });

  test('bonus-cut does not affect other inventory items', () => {
    useInventoryStore.setState({
      items: [
        { itemId: 'bonus-cut', quantity: 1 },
        { itemId: 'false-alarm', quantity: 2 },
      ],
    });
    applyBonusCut(computeTimingBonus(10));
    expect(useInventoryStore.getState().items).toEqual([
      { itemId: 'false-alarm', quantity: 2 },
    ]);
  });
});
