jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { HeistRecord } from '../../types/history';
import { computeStats, useHistoryStore } from '../historyStore';

function makeRecord(overrides: Partial<HeistRecord> = {}): HeistRecord {
  return {
    id: 'r1',
    date: '2026-01-01T00:00:00.000Z',
    won: true,
    totalGold: 100,
    act1: {
      elapsedMs: 14000,
      timedOut: false,
      timingBonus: 50,
      totalMoves: 10,
    },
    act2: {
      score: 30,
      exactHits: 1,
      busts: 0,
      aceOnes: 1,
      aceElevens: 0,
    },
    act3: {
      won: true,
      playerMelds: 3,
      playerSets: 1,
      playerRuns: 2,
      playerCardsDrawn: 6,
      policeMelds: 1,
      policeCardsDrawn: 3,
      turnsPlayed: 8,
    },
    durationMs: 60000,
    ...overrides,
  };
}

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ records: [], lifetimeGold: 0 });
  });

  test('recordHeist appends records and accumulates lifetimeGold', () => {
    const r1 = makeRecord({ id: 'a', totalGold: 120 });
    const r2 = makeRecord({ id: 'b', totalGold: 80, won: false });

    useHistoryStore.getState().recordHeist(r1);
    useHistoryStore.getState().recordHeist(r2);
    const state = useHistoryStore.getState();

    expect(state.records.map(r => r.id)).toEqual(['a', 'b']);
    expect(state.lifetimeGold).toBe(200);
  });

  test('clearHistory resets both records and lifetimeGold', () => {
    useHistoryStore.setState({
      records: [makeRecord({ id: 'existing' })],
      lifetimeGold: 999,
    });

    useHistoryStore.getState().clearHistory();
    const state = useHistoryStore.getState();

    expect(state.records).toEqual([]);
    expect(state.lifetimeGold).toBe(0);
  });
});

describe('computeStats', () => {
  test('returns zeroed/null-friendly stats for empty record list', () => {
    const stats = computeStats([]);

    expect(stats.overall.totalHeists).toBe(0);
    expect(stats.overall.winRate).toBe(0);
    expect(stats.overall.firstDate).toBeNull();
    expect(stats.overall.lastDate).toBeNull();
    expect(stats.overall.lowestWinGold).toBeNull();

    expect(stats.act1.bestMs).toBeNull();
    expect(stats.act1.avgMs).toBeNull();
    expect(stats.act2.highestScore).toBeNull();
    expect(stats.act2.avgScore).toBeNull();

    expect(stats.act3.plays).toBe(0);
    expect(stats.act3.avgTurns).toBeNull();
    expect(stats.act3.mostMelds).toBe(0);
  });

  test('computes overall streaks, win/loss values, and date bounds', () => {
    const records: HeistRecord[] = [
      makeRecord({ id: '1', date: '2026-01-01T00:00:00.000Z', won: true, totalGold: 50 }),
      makeRecord({ id: '2', date: '2026-01-02T00:00:00.000Z', won: true, totalGold: 75 }),
      makeRecord({ id: '3', date: '2026-01-03T00:00:00.000Z', won: false, totalGold: 0 }),
      makeRecord({ id: '4', date: '2026-01-04T00:00:00.000Z', won: true, totalGold: 120 }),
      makeRecord({ id: '5', date: '2026-01-05T00:00:00.000Z', won: true, totalGold: 90 }),
    ];

    const stats = computeStats(records);

    expect(stats.overall.totalHeists).toBe(5);
    expect(stats.overall.wins).toBe(4);
    expect(stats.overall.losses).toBe(1);
    expect(stats.overall.winRate).toBe(0.8);
    expect(stats.overall.highestGold).toBe(120);
    expect(stats.overall.lowestWinGold).toBe(50);
    expect(stats.overall.totalGold).toBe(335);
    expect(stats.overall.bestStreak).toBe(2);
    expect(stats.overall.currentStreak).toBe(2);
    expect(stats.overall.firstDate).toBe('2026-01-01T00:00:00.000Z');
    expect(stats.overall.lastDate).toBe('2026-01-05T00:00:00.000Z');
  });

  test('computes act1 timing tiers and timeout counters at boundaries', () => {
    const records: HeistRecord[] = [
      makeRecord({ id: 'e', act1: { elapsedMs: 15000, timedOut: false, timingBonus: 50, totalMoves: 1 } }),
      makeRecord({ id: 's', act1: { elapsedMs: 30000, timedOut: false, timingBonus: 40, totalMoves: 2 } }),
      makeRecord({ id: 'g', act1: { elapsedMs: 60000, timedOut: false, timingBonus: 25, totalMoves: 3 } }),
      makeRecord({ id: 'so', act1: { elapsedMs: 90000, timedOut: false, timingBonus: 15, totalMoves: 4 } }),
      makeRecord({ id: 'nb', act1: { elapsedMs: 90001, timedOut: false, timingBonus: 10, totalMoves: 5 } }),
      makeRecord({ id: 'to', act1: { elapsedMs: null, timedOut: true, timingBonus: 0, totalMoves: 6 } }),
    ];

    const stats = computeStats(records);

    expect(stats.act1.tierExcellent).toBe(1);
    expect(stats.act1.tierSuperb).toBe(1);
    expect(stats.act1.tierGreat).toBe(1);
    expect(stats.act1.tierSolid).toBe(1);
    expect(stats.act1.tierNotBad).toBe(1);
    expect(stats.act1.tierTimeout).toBe(1);
    expect(stats.act1.totalTimeouts).toBe(1);
    expect(stats.act1.totalMoves).toBe(21);
    expect(stats.act1.bestMs).toBe(15000);
    expect(stats.act1.worstMs).toBe(90001);
    expect(stats.act1.avgMs).toBeCloseTo((15000 + 30000 + 60000 + 90000 + 90001) / 5);
  });

  test('computes act2 and act3 aggregates while ignoring null act3 records', () => {
    const records: HeistRecord[] = [
      makeRecord({
        id: 'a',
        act2: { score: 20, exactHits: 1, busts: 0, aceOnes: 0, aceElevens: 1 },
        act3: { won: true, playerMelds: 2, playerSets: 1, playerRuns: 1, playerCardsDrawn: 5, policeMelds: 0, policeCardsDrawn: 2, turnsPlayed: 7 },
      }),
      makeRecord({
        id: 'b',
        act2: { score: 40, exactHits: 0, busts: 2, aceOnes: 2, aceElevens: 0 },
        act3: { won: false, playerMelds: 4, playerSets: 2, playerRuns: 2, playerCardsDrawn: 9, policeMelds: 2, policeCardsDrawn: 4, turnsPlayed: 10 },
      }),
      makeRecord({
        id: 'c',
        act2: { score: 10, exactHits: 3, busts: 1, aceOnes: 1, aceElevens: 1 },
        act3: null,
      }),
    ];

    const stats = computeStats(records);

    expect(stats.act2.highestScore).toBe(40);
    expect(stats.act2.lowestScore).toBe(10);
    expect(stats.act2.avgScore).toBeCloseTo((20 + 40 + 10) / 3);
    expect(stats.act2.totalExactHits).toBe(4);
    expect(stats.act2.totalBusts).toBe(3);
    expect(stats.act2.totalAceOnes).toBe(3);
    expect(stats.act2.totalAceElevens).toBe(2);

    expect(stats.act3.plays).toBe(2);
    expect(stats.act3.wins).toBe(1);
    expect(stats.act3.winRate).toBe(0.5);
    expect(stats.act3.totalPlayerMelds).toBe(6);
    expect(stats.act3.totalPlayerSets).toBe(3);
    expect(stats.act3.totalPlayerRuns).toBe(3);
    expect(stats.act3.totalPlayerCardsDrawn).toBe(14);
    expect(stats.act3.totalPoliceMelds).toBe(2);
    expect(stats.act3.totalPoliceCardsDrawn).toBe(6);
    expect(stats.act3.totalTurns).toBe(17);
    expect(stats.act3.avgTurns).toBe(8.5);
    expect(stats.act3.mostMelds).toBe(4);
    expect(stats.act3.mostCardsDrawn).toBe(9);
  });
});
