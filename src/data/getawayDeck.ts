import { Card, Rank, Suit } from '../types/card';
import { createDeck, shuffleDeck } from './deck';

// ─── Scoring constants (edit these to tune rewards) ──────────────────────────

export const GETAWAY_REWARDS = {
  BASE_REWARD: 100,
  COST_PER_EXTRA_CELL: 5,      // −5 per cell visited beyond the minimum path (7 cells)
  COST_PER_BACKTRACK: 10,      // −10 per backtrack used
  BONUS_NO_BACKTRACKS: 25,     // +25 bonus for a clean, no-backtrack run
  BONUS_PER_FACE_ON_PATH: 10,  // +10 per face card / Ace on the winning route
  MIN_CELLS_FOR_PATH: 7,       // 6 steps = 7 cells from (0,0) to (3,3)
} as const;

// ─── Movement lookup tables ───────────────────────────────────────────────────

// [rowDelta, colDelta] for each suit
export const SUIT_DIRECTION: Record<Suit, [number, number]> = {
  spades:   [0,  +1],  // right
  hearts:   [+1,  0],  // down
  diamonds: [0,  -1],  // left
  clubs:    [-1,  0],  // up
};

// null = player's choice (face cards: 1/2/3 steps in suit direction; Ace: any direction, 1 step)
export const RANK_STEPS: Record<Rank, number | null> = {
  '2': 1, '3': 1, '4': 1,
  '5': 2, '6': 2, '7': 2,
  '8': 3, '9': 3, '10': 3,
  'J': null, 'Q': null, 'K': null,
  'A':  null,
};

// ─── Predicates ───────────────────────────────────────────────────────────────

export function isFaceCard(rank: Rank): boolean {
  return rank === 'J' || rank === 'Q' || rank === 'K';
}

export function isWildcard(rank: Rank): boolean {
  return rank === 'A';
}

export function isChoiceCard(card: Card): boolean {
  return isFaceCard(card.rank) || isWildcard(card.rank);
}

// ─── Grid types ───────────────────────────────────────────────────────────────

export interface GridCell {
  card: Card;
  isFlipped: boolean;
  isInActivePath: boolean;  // false when the cell has been backtracked past
}

// null at (3,3) = exit marker (no card to follow)
export type GetawayGrid = (GridCell | null)[][];

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function computeGetawayReward(
  cellsVisited: number,
  backtracks: number,
  faceCardsOnWinningPath: number,
): number {
  const extraCells = Math.max(0, cellsVisited - GETAWAY_REWARDS.MIN_CELLS_FOR_PATH);
  let score =
    GETAWAY_REWARDS.BASE_REWARD
    - extraCells * GETAWAY_REWARDS.COST_PER_EXTRA_CELL
    - backtracks * GETAWAY_REWARDS.COST_PER_BACKTRACK
    + faceCardsOnWinningPath * GETAWAY_REWARDS.BONUS_PER_FACE_ON_PATH;
  if (backtracks === 0) score += GETAWAY_REWARDS.BONUS_NO_BACKTRACKS;
  return Math.max(0, score);
}

// ─── Grid generation ──────────────────────────────────────────────────────────

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r <= 3 && c >= 0 && c <= 3;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// DFS to verify at least one solution exists
function hasSolution(grid: GetawayGrid): boolean {
  const visited = new Set<string>();
  visited.add(cellKey(0, 0));

  function dfs(r: number, c: number): boolean {
    if (r === 3 && c === 3) return true;

    const cell = grid[r][c];
    if (!cell) return r === 3 && c === 3; // exit

    const { card } = cell;
    const steps = RANK_STEPS[card.rank];

    let targets: [number, number][] = [];

    if (isWildcard(card.rank)) {
      // Ace: 1 step in any direction
      targets = (Object.values(SUIT_DIRECTION) as [number, number][]).map(
        ([dr, dc]) => [r + dr, c + dc] as [number, number]
      );
    } else if (isFaceCard(card.rank)) {
      // Face card: 1/2/3 steps in suit direction
      const [dr, dc] = SUIT_DIRECTION[card.suit];
      targets = [1, 2, 3].map(s => [r + dr * s, c + dc * s] as [number, number]);
    } else if (steps !== null) {
      const [dr, dc] = SUIT_DIRECTION[card.suit];
      targets = [[r + dr * steps, c + dc * steps]];
    }

    for (const [nr, nc] of targets) {
      if (!inBounds(nr, nc)) continue;
      const key = cellKey(nr, nc);
      if (visited.has(key)) continue;
      visited.add(key);
      if (dfs(nr, nc)) return true;
      visited.delete(key);
    }
    return false;
  }

  return dfs(0, 0);
}

function attemptBuild(): GetawayGrid | null {
  const deck = shuffleDeck(createDeck());
  const usedIds = new Set<string>();

  // Step 1: random 6-step solution path (right + down only)
  const moves = shuffleArray<'R' | 'D'>(['R', 'R', 'R', 'D', 'D', 'D']);
  const path: [number, number][] = [[0, 0]];
  let [pr, pc] = [0, 0];
  for (const move of moves) {
    if (move === 'R') pc++;
    else pr++;
    path.push([pr, pc]);
  }
  // path[6] === [3,3]

  // Step 2: assign cards to path cells 0–5 (not the exit)
  const pathCards: Card[] = [];
  for (let i = 0; i < 6; i++) {
    const neededSuit: Suit = moves[i] === 'R' ? 'spades' : 'hearts';
    const roll = Math.random();

    // Try preferred type, then fall back
    const tryFind = (suitFilter: Suit, rankFilter: (r: Rank) => boolean): Card | undefined =>
      deck.find(c => c.suit === suitFilter && rankFilter(c.rank) && !usedIds.has(c.id));

    let card: Card | undefined;

    if (roll < 0.25) {
      // 25%: face card in needed suit
      card = tryFind(neededSuit, r => isFaceCard(r));
    } else if (roll < 0.35) {
      // 10%: Ace in needed suit
      card = tryFind(neededSuit, r => r === 'A');
    }

    // 65% (or fallback): 1-step number card in needed suit
    if (!card) {
      card = tryFind(neededSuit, r => r === '2' || r === '3' || r === '4');
    }
    // Last-resort fallback: any face card from any suit
    if (!card) {
      card = deck.find(c => isFaceCard(c.rank) && !usedIds.has(c.id));
    }
    if (!card) return null; // extremely unlikely — retry

    pathCards.push(card);
    usedIds.add(card.id);
  }

  // Step 3: fill remaining 10 non-path, non-exit cells
  const remainingCards = deck.filter(c => !usedIds.has(c.id)).slice(0, 10);

  // Step 4: assemble grid
  const grid: GetawayGrid = Array.from({ length: 4 }, () => Array(4).fill(null));
  const pathSet = new Set(path.map(([r, c]) => cellKey(r, c)));

  for (let i = 0; i < 6; i++) {
    const [r, c] = path[i];
    grid[r][c] = {
      card: pathCards[i],
      isFlipped: i === 0,
      isInActivePath: i === 0,
    };
  }
  // Exit stays null (already null from initialization)

  const nonPathCells: [number, number][] = [];
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 3; c++) {
      if (!pathSet.has(cellKey(r, c))) {
        nonPathCells.push([r, c]);
      }
    }
  }
  const shuffledFill = shuffleArray(nonPathCells);
  shuffledFill.forEach(([r, c], idx) => {
    if (idx < remainingCards.length) {
      grid[r][c] = {
        card: remainingCards[idx],
        isFlipped: false,
        isInActivePath: false,
      };
    }
  });

  return grid;
}

export function buildGetawayGrid(): GetawayGrid {
  for (let attempt = 0; attempt < 10; attempt++) {
    const grid = attemptBuild();
    if (grid && hasSolution(grid)) return grid;
    if (__DEV__) console.warn(`[GetawayGame] Grid attempt ${attempt + 1} invalid, retrying…`);
  }
  // Fallback: last attempt even if DFS check fails (should never happen)
  return attemptBuild() ?? buildGetawayGrid();
}
