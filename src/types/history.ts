export interface Act1Record {
  elapsedMs: number | null; // null = timeout
  timedOut: boolean;
  timingBonus: number; // 0, 10, or 20
  totalMoves: number;
}

export interface Act2Record {
  score: number;
  exactHits: number;
  busts: number;
  aceOnes: number;
  aceElevens: number;
}

export interface Act3Record {
  won: boolean;
  playerMelds: number;
  playerSets: number;
  playerRuns: number;
  playerCardsDrawn: number;
  policeMelds: number;
  policeCardsDrawn: number;
  turnsPlayed: number;
}

export interface HeistRecord {
  id: string;
  date: string; // ISO date string
  won: boolean;
  totalGold: number;
  act1: Act1Record;
  act2: Act2Record;
  act3: Act3Record | null; // null if lost before act 3
  durationMs: number;
}
