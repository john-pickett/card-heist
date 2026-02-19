import { Card } from './card';

export interface GameCard {
  instanceId: string;     // assigned once in initGame: `${card.id}-${shuffleIndex}` — never changes
  card: Card;
  resolved: boolean;      // false = unactivated face card (J/Q/K); true = all others + activated cards
  resolvedValue?: number; // only set on Queens after delegation choice: 10
}

export type ColumnId = 'Mon' | 'Tue' | 'Wed' | 'Thu';

export interface GameColumn {
  id: ColumnId;
  budget: number;
  cards: GameCard[];
  cleared: boolean;
  blocked: boolean;       // recalculated after every mutation; stored so components don't run subset-sum
}

export type GamePhase = 'idle' | 'playing' | 'hotfix' | 'queen' | 'won' | 'lost';

export interface PendingQueen {
  instanceId: string;
  sourceColumnId: ColumnId;
}

export interface GameState {
  phase: GamePhase;
  columns: GameColumn[];
  drawPile: GameCard[];   // all 52 cards get instanceId at initGame time; draw pile is just the tail
  selectedInstanceIds: string[];
  activeColumnId: ColumnId | null;
  hotfixUsed: boolean;
  pendingQueen: PendingQueen | null;
  startTime: number | null;
  endTime: number | null;
  score: number | null;
  totalDelta: number;   // cumulative (actualSum − target) across all confirmed plays; goal = 0
}
