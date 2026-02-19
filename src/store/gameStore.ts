import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { GameCard, GameColumn, GameState, ColumnId, PendingQueen } from '../types/game';
import { bestAceResolution } from '../utils/subsetSum';

const COLUMN_IDS: ColumnId[] = ['Mon', 'Tue', 'Wed', 'Thu'];
const INITIAL_BUDGET = 15;
const CARDS_PER_COLUMN = 3;

function makeFaceResolved(rank: string): boolean {
  return rank !== 'J' && rank !== 'Q' && rank !== 'K';
}

function buildGameCard(card: ReturnType<typeof createDeck>[number], index: number): GameCard {
  return {
    instanceId: `${card.id}-${index}`,
    card,
    resolved: makeFaceResolved(card.rank),
  };
}

// With the new rules any subset is valid, so columns are never blocked.
function recomputeBlocked(columns: GameColumn[]): GameColumn[] {
  return columns.map(col => ({ ...col, blocked: false }));
}

function computeScore(
  drawPileLength: number,
  columns: GameColumn[],
  startTime: number,
  endTime: number
): number {
  const totalRemainingCards = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const cardsCleared = 52 - drawPileLength - totalRemainingCards;
  const elapsedMs = endTime - startTime;
  return cardsCleared * 10 - Math.floor(elapsedMs / 1000);
}

interface GameActions {
  initGame: () => void;
  clearSelection: () => void;
  toggleCardSelection: (instanceId: string, columnId: ColumnId) => void;
  confirmSelection: () => void;
  activateFaceCard: (instanceId: string, columnId: ColumnId) => void;
  resolveQueenKeep: () => void;
  resolveQueenMove: (targetId: ColumnId) => void;
  activateHotfix: () => void;
  cancelHotfix: () => void;
  applyHotfix: (instanceId: string, columnId: ColumnId) => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  phase: 'idle',
  columns: [],
  drawPile: [],
  selectedInstanceIds: [],
  activeColumnId: null,
  hotfixUsed: false,
  pendingQueen: null,
  startTime: null,
  endTime: null,
  score: null,
  totalDelta: 0,

  initGame() {
    const rawDeck = shuffleDeck(createDeck());
    const gameCards: GameCard[] = rawDeck.map((card, i) => buildGameCard(card, i));

    const columns: GameColumn[] = COLUMN_IDS.map((id, colIndex) => {
      const cards = gameCards.slice(colIndex * CARDS_PER_COLUMN, (colIndex + 1) * CARDS_PER_COLUMN);
      return { id, budget: INITIAL_BUDGET, cards, cleared: false, blocked: false };
    });

    const drawPile = gameCards.slice(COLUMN_IDS.length * CARDS_PER_COLUMN);

    set({
      phase: 'idle',
      columns,
      drawPile,
      selectedInstanceIds: [],
      activeColumnId: null,
      hotfixUsed: false,
      pendingQueen: null,
      startTime: null,
      endTime: null,
      score: null,
      totalDelta: 0,
    });
  },

  clearSelection() {
    set({ selectedInstanceIds: [], activeColumnId: null });
  },

  toggleCardSelection(instanceId, columnId) {
    const { phase, selectedInstanceIds, activeColumnId, startTime } = get();
    if (phase !== 'idle' && phase !== 'playing') return;

    const now = Date.now();
    const newStart = phase === 'idle' && startTime === null ? now : startTime;

    // Switching columns resets to just the newly tapped card
    if (activeColumnId !== null && activeColumnId !== columnId) {
      set({ phase: 'playing', selectedInstanceIds: [instanceId], activeColumnId: columnId, startTime: newStart });
      return;
    }

    const already = selectedInstanceIds.includes(instanceId);
    const next = already
      ? selectedInstanceIds.filter(id => id !== instanceId)
      : [...selectedInstanceIds, instanceId];

    set({
      phase: 'playing',
      selectedInstanceIds: next,
      activeColumnId: next.length === 0 ? null : columnId,
      startTime: newStart,
    });
  },

  confirmSelection() {
    const { columns, selectedInstanceIds, activeColumnId, drawPile, startTime, totalDelta } = get();
    if (!activeColumnId || selectedInstanceIds.length === 0) return;

    const col = columns.find(c => c.id === activeColumnId);
    if (!col) return;

    const selectedCards = col.cards.filter(gc => selectedInstanceIds.includes(gc.instanceId));
    if (selectedCards.length === 0) return;

    // Compute actual sum using best Ace resolution (minimises distance from target)
    const actualSum = bestAceResolution(selectedCards, col.budget);
    const playDelta = actualSum - col.budget;
    const newTotalDelta = totalDelta + playDelta;

    const remaining = col.cards.filter(gc => !selectedInstanceIds.includes(gc.instanceId));
    const cleared = remaining.length === 0;

    const updatedCol: GameColumn = { ...col, cards: remaining, cleared, blocked: false };
    const updatedColumns = columns.map(c => c.id === activeColumnId ? updatedCol : c);

    const now = Date.now();
    const allCleared = updatedColumns.every(c => c.cleared);

    if (allCleared) {
      const finalScore = computeScore(drawPile.length, updatedColumns, startTime ?? now, now);
      set({
        columns: updatedColumns,
        selectedInstanceIds: [],
        activeColumnId: null,
        phase: 'won',
        endTime: now,
        score: finalScore,
        totalDelta: newTotalDelta,
      });
    } else {
      set({
        columns: updatedColumns,
        selectedInstanceIds: [],
        activeColumnId: null,
        phase: 'playing',
        totalDelta: newTotalDelta,
      });
    }
  },

  activateFaceCard(instanceId, columnId) {
    const { phase, columns, drawPile, startTime } = get();
    if (phase !== 'idle' && phase !== 'playing') return;

    const now = Date.now();
    const newStart = phase === 'idle' && startTime === null ? now : startTime;

    const col = columns.find(c => c.id === columnId);
    if (!col) return;

    const gc = col.cards.find(c => c.instanceId === instanceId);
    if (!gc || gc.resolved) return;

    const rank = gc.card.rank;

    if (rank === 'J') {
      const drawn = drawPile.length > 0 ? [drawPile[0]] : [];
      const newDrawPile = drawPile.slice(drawn.length);
      const newCards = col.cards.filter(c => c.instanceId !== instanceId).concat(drawn);
      const updatedColumns = columns.map(c => c.id === columnId ? { ...c, cards: newCards } : c);
      set({ columns: updatedColumns, drawPile: newDrawPile, phase: 'playing', startTime: newStart, selectedInstanceIds: [], activeColumnId: null });
    } else if (rank === 'Q') {
      const pending: PendingQueen = { instanceId, sourceColumnId: columnId };
      set({ pendingQueen: pending, phase: 'queen', startTime: newStart });
    } else if (rank === 'K') {
      const drawn = drawPile.slice(0, 2);
      const newDrawPile = drawPile.slice(drawn.length);
      const newCards = col.cards.filter(c => c.instanceId !== instanceId).concat(drawn);
      const updatedColumns = columns.map(c =>
        c.id === columnId ? { ...c, cards: newCards, budget: c.budget + 5 } : c
      );
      set({ columns: updatedColumns, drawPile: newDrawPile, phase: 'playing', startTime: newStart, selectedInstanceIds: [], activeColumnId: null });
    }
  },

  resolveQueenKeep() {
    const { pendingQueen, columns } = get();
    if (!pendingQueen) return;

    const { instanceId, sourceColumnId } = pendingQueen;
    const updatedColumns = columns.map(col => {
      if (col.id !== sourceColumnId) return col;
      const newCards = col.cards.map(gc =>
        gc.instanceId === instanceId ? { ...gc, resolved: true, resolvedValue: 10 } : gc
      );
      return { ...col, cards: newCards, budget: col.budget + 10 };
    });

    set({ columns: updatedColumns, pendingQueen: null, phase: 'playing', selectedInstanceIds: [], activeColumnId: null });
  },

  resolveQueenMove(targetId) {
    const { pendingQueen, columns } = get();
    if (!pendingQueen) return;

    const { instanceId, sourceColumnId } = pendingQueen;

    let queenCard: GameCard | undefined;
    let updatedColumns = columns.map(col => {
      if (col.id !== sourceColumnId) return col;
      const found = col.cards.find(gc => gc.instanceId === instanceId);
      queenCard = found ? { ...found, resolved: true, resolvedValue: 10 } : undefined;
      return { ...col, cards: col.cards.filter(gc => gc.instanceId !== instanceId) };
    });

    if (!queenCard) return;

    const movedQueen = queenCard;
    updatedColumns = updatedColumns.map(col => {
      if (col.id !== targetId) return col;
      return { ...col, cards: [...col.cards, movedQueen], budget: col.budget + 10 };
    });

    set({ columns: updatedColumns, pendingQueen: null, phase: 'playing', selectedInstanceIds: [], activeColumnId: null });
  },

  activateHotfix() {
    if (get().phase !== 'playing') return;
    set({ phase: 'hotfix' });
  },

  cancelHotfix() {
    set({ phase: 'playing' });
  },

  applyHotfix(instanceId, columnId) {
    const { columns, drawPile } = get();

    const col = columns.find(c => c.id === columnId);
    if (!col) return;

    const replacement = drawPile.length > 0 ? [drawPile[0]] : [];
    const newDrawPile = drawPile.slice(replacement.length);
    const newCards = col.cards.filter(gc => gc.instanceId !== instanceId).concat(replacement);

    const updatedColumns = columns.map(c => c.id === columnId ? { ...c, cards: newCards } : c);

    set({
      columns: updatedColumns,
      drawPile: newDrawPile,
      hotfixUsed: true,
      phase: 'playing',
      selectedInstanceIds: [],
      activeColumnId: null,
    });
  },
}));
