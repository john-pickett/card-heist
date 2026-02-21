import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { HeistRecord } from '../types/history';

interface HistoryStore {
  records: HeistRecord[];
  lifetimeGold: number;
  spentGold: number;
  recordHeist: (record: HeistRecord) => void;
  spendGold: (amount: number) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create(
  persist<HistoryStore>(
    (set, get) => ({
      records: [],
      lifetimeGold: 0,
      spentGold: 0,
      recordHeist: (record) => set({
        records: [...get().records, record],
        lifetimeGold: get().lifetimeGold + record.totalGold,
      }),
      spendGold: (amount) => set({ spentGold: get().spentGold + amount }),
      clearHistory: () => set({ records: [], lifetimeGold: 0, spentGold: 0 }),
    }),
    {
      name: 'solitaire:history-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export interface OverallStats {
  totalHeists: number;
  wins: number;
  losses: number;
  winRate: number;
  highestGold: number;
  lowestWinGold: number | null;
  totalGold: number;
  currentStreak: number;
  bestStreak: number;
  firstDate: string | null;
  lastDate: string | null;
  totalPlayMs: number;
}

export interface Act1Stats {
  bestMs: number | null;
  worstMs: number | null;
  avgMs: number | null;
  totalTimeouts: number;
  tierExcellent: number;
  tierSuperb: number;
  tierGreat: number;
  tierSolid: number;
  tierNotBad: number;
  tierTimeout: number;
  totalMoves: number;
}

export interface Act2Stats {
  highestScore: number | null;
  lowestScore: number | null;
  avgScore: number | null;
  totalExactHits: number;
  totalBusts: number;
  totalAceOnes: number;
  totalAceElevens: number;
}

export interface Act3Stats {
  plays: number;
  wins: number;
  winRate: number;
  totalPlayerMelds: number;
  totalPlayerSets: number;
  totalPlayerRuns: number;
  totalPlayerCardsDrawn: number;
  totalPoliceMelds: number;
  totalPoliceCardsDrawn: number;
  totalTurns: number;
  avgTurns: number | null;
  mostMelds: number;
  mostCardsDrawn: number;
}

export interface HeistStats {
  overall: OverallStats;
  act1: Act1Stats;
  act2: Act2Stats;
  act3: Act3Stats;
}

export function computeStats(records: HeistRecord[]): HeistStats {
  const n = records.length;

  // Overall
  const wins = records.filter(r => r.won).length;
  const losses = n - wins;
  const winGolds = records.filter(r => r.won).map(r => r.totalGold);
  const highestGold = n > 0 ? Math.max(...records.map(r => r.totalGold)) : 0;
  const lowestWinGold = winGolds.length > 0 ? Math.min(...winGolds) : null;
  const totalGold = winGolds.reduce((s, g) => s + g, 0);

  let currentStreak = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (records[i].won) currentStreak++;
    else break;
  }
  let bestStreak = 0, temp = 0;
  for (const r of records) {
    if (r.won) { temp++; bestStreak = Math.max(bestStreak, temp); }
    else temp = 0;
  }

  const overall: OverallStats = {
    totalHeists: n,
    wins,
    losses,
    winRate: n > 0 ? wins / n : 0,
    highestGold,
    lowestWinGold,
    totalGold,
    currentStreak,
    bestStreak,
    firstDate: n > 0 ? records[0].date : null,
    lastDate: n > 0 ? records[n - 1].date : null,
    totalPlayMs: records.reduce((s, r) => s + r.durationMs, 0),
  };

  // Act 1
  const timedMsArr = records.map(r => r.act1.elapsedMs).filter((v): v is number => v !== null);
  const act1: Act1Stats = {
    bestMs: timedMsArr.length > 0 ? Math.min(...timedMsArr) : null,
    worstMs: timedMsArr.length > 0 ? Math.max(...timedMsArr) : null,
    avgMs: timedMsArr.length > 0 ? timedMsArr.reduce((s, v) => s + v, 0) / timedMsArr.length : null,
    totalTimeouts: records.filter(r => r.act1.timedOut).length,
    tierExcellent: records.filter(r => r.act1.elapsedMs !== null && r.act1.elapsedMs <= 15000).length,
    tierSuperb:    records.filter(r => r.act1.elapsedMs !== null && r.act1.elapsedMs > 15000 && r.act1.elapsedMs <= 30000).length,
    tierGreat:     records.filter(r => r.act1.elapsedMs !== null && r.act1.elapsedMs > 30000 && r.act1.elapsedMs <= 60000).length,
    tierSolid:     records.filter(r => r.act1.elapsedMs !== null && r.act1.elapsedMs > 60000 && r.act1.elapsedMs <= 90000).length,
    tierNotBad:    records.filter(r => r.act1.elapsedMs !== null && r.act1.elapsedMs > 90000).length,
    tierTimeout:   records.filter(r => r.act1.timedOut === true).length,
    totalMoves: records.reduce((s, r) => s + r.act1.totalMoves, 0),
  };

  // Act 2
  const act2Scores = records.map(r => r.act2.score);
  const act2: Act2Stats = {
    highestScore: n > 0 ? Math.max(...act2Scores) : null,
    lowestScore: n > 0 ? Math.min(...act2Scores) : null,
    avgScore: n > 0 ? act2Scores.reduce((s, v) => s + v, 0) / n : null,
    totalExactHits: records.reduce((s, r) => s + r.act2.exactHits, 0),
    totalBusts: records.reduce((s, r) => s + r.act2.busts, 0),
    totalAceOnes: records.reduce((s, r) => s + r.act2.aceOnes, 0),
    totalAceElevens: records.reduce((s, r) => s + r.act2.aceElevens, 0),
  };

  // Act 3
  const act3Records = records.map(r => r.act3).filter((r): r is NonNullable<typeof r> => r !== null);
  const act3Plays = act3Records.length;
  const act3Wins = act3Records.filter(r => r.won).length;
  const turnsArr = act3Records.map(r => r.turnsPlayed);
  const act3: Act3Stats = {
    plays: act3Plays,
    wins: act3Wins,
    winRate: act3Plays > 0 ? act3Wins / act3Plays : 0,
    totalPlayerMelds: act3Records.reduce((s, r) => s + r.playerMelds, 0),
    totalPlayerSets: act3Records.reduce((s, r) => s + r.playerSets, 0),
    totalPlayerRuns: act3Records.reduce((s, r) => s + r.playerRuns, 0),
    totalPlayerCardsDrawn: act3Records.reduce((s, r) => s + r.playerCardsDrawn, 0),
    totalPoliceMelds: act3Records.reduce((s, r) => s + r.policeMelds, 0),
    totalPoliceCardsDrawn: act3Records.reduce((s, r) => s + r.policeCardsDrawn, 0),
    totalTurns: turnsArr.reduce((s, v) => s + v, 0),
    avgTurns: act3Plays > 0 ? turnsArr.reduce((s, v) => s + v, 0) / act3Plays : null,
    mostMelds: act3Plays > 0 ? Math.max(...act3Records.map(r => r.playerMelds)) : 0,
    mostCardsDrawn: act3Plays > 0 ? Math.max(...act3Records.map(r => r.playerCardsDrawn)) : 0,
  };

  return { overall, act1, act2, act3 };
}
