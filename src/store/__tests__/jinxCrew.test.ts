/**
 * Tests for the Jinx crew payout effect.
 *
 * When Jinx is in the active heist crew and the player is caught in Act Three,
 * they keep 80% of their total potential score instead of the default 33%.
 * If the player escapes, Jinx has no effect (100% is kept regardless).
 *
 * The payout calculation lives in App.tsx (two spots: renderHomeTab and
 * recordCurrentHeist). This test file mirrors that logic — the same pattern
 * used by bishopCrew.test.ts.
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

// Mirrors the payout calculation from App.tsx (both renderHomeTab and recordCurrentHeist).
function applyJinxPayout(totalScore: number, won: boolean): number {
  const jinxActive = !won && useCrewStore.getState().activeHeistCrew.includes('jinx');
  if (won) return totalScore;
  return Math.round(totalScore * (jinxActive ? 0.80 : 0.33));
}

// Mirrors the jinxApplied flag calculation.
function isJinxApplied(won: boolean): boolean {
  return !won && useCrewStore.getState().activeHeistCrew.includes('jinx');
}

describe('Jinx crew payout effect', () => {
  beforeEach(() => {
    useCrewStore.setState({ activeHeistCrew: [], unlockedIds: [], consecutiveHeists: {}, lastHeistCrew: [] });
  });

  test('returns 80% of totalScore when Jinx is active and caught', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    expect(applyJinxPayout(1000, false)).toBe(800);
  });

  test('returns 33% of totalScore when Jinx is not in activeHeistCrew and caught', () => {
    useCrewStore.setState({ activeHeistCrew: [] });
    expect(applyJinxPayout(1000, false)).toBe(330);
  });

  test('returns 100% of totalScore when won, regardless of Jinx', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    expect(applyJinxPayout(1000, true)).toBe(1000);
  });

  test('returns 33% when other crew (not Jinx) are active and caught', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'bishop', 'deadlock'] });
    expect(applyJinxPayout(1000, false)).toBe(330);
  });

  test('returns 80% when Jinx is active alongside other crew and caught', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'jinx', 'bishop'] });
    expect(applyJinxPayout(1000, false)).toBe(800);
  });

  test('rounds the 80% result correctly', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    // 333 * 0.80 = 266.4 → rounds to 266
    expect(applyJinxPayout(333, false)).toBe(266);
  });

  test('rounds the 33% result correctly', () => {
    useCrewStore.setState({ activeHeistCrew: [] });
    // 100 * 0.33 = 33 exactly
    expect(applyJinxPayout(100, false)).toBe(33);
  });

  test('jinxApplied is false when won (Jinx has no effect on successful escape)', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    expect(isJinxApplied(true)).toBe(false);
  });

  test('jinxApplied is true when Jinx active and caught', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    expect(isJinxApplied(false)).toBe(true);
  });

  test('jinxApplied is false when caught but Jinx not in crew', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles'] });
    expect(isJinxApplied(false)).toBe(false);
  });

  test('80% payout is strictly greater than 33% payout for same score', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    const withJinx = applyJinxPayout(500, false);

    useCrewStore.setState({ activeHeistCrew: [] });
    const withoutJinx = applyJinxPayout(500, false);

    expect(withJinx).toBeGreaterThan(withoutJinx);
  });

  test('Jinx payout is still less than full payout when escaped', () => {
    useCrewStore.setState({ activeHeistCrew: ['jinx'] });
    const caught = applyJinxPayout(1000, false);   // 80% = 800
    const escaped = applyJinxPayout(1000, true);   // 100% = 1000
    expect(caught).toBeLessThan(escaped);
  });
});
