import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Rank } from '../types/card';
import {
  AREA_LABELS,
  AreaId,
  CardSource,
  InsideTipHint,
  SneakInActions,
  SneakInArea,
  SneakInCard,
  SneakInPhase,
  SneakInSolutionEntry,
  SneakInState,
} from '../types/sneakin';

let instanceCounter = 0;
function nextId(): string {
  return `si-${++instanceCounter}`;
}

function rankValue(rank: Rank): number {
  return parseInt(rank, 10);
}

function checkSolved(cards: SneakInCard[], target: number): boolean {
  if (cards.length < 2 || cards.length > 3) return false;
  return cards.reduce((s, sc) => s + rankValue(sc.card.rank as Rank), 0) === target;
}

function combosOfSize(indices: number[], size: 2 | 3): number[][] {
  const out: number[][] = [];
  if (size === 2) {
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        out.push([indices[i], indices[j]]);
      }
    }
    return out;
  }

  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      for (let k = j + 1; k < indices.length; k++) {
        out.push([indices[i], indices[j], indices[k]]);
      }
    }
  }
  return out;
}

// Generate 4 strictly ascending targets in [4, 20].
// Each subsequent area must have a larger target.
function generateTargets(): number[] {
  const targets: number[] = [];
  let min = 4;
  for (let i = 0; i < 4; i++) {
    // Leave room: area at index i needs target > previous,
    // and areas i+1..3 each need at least 1 more than this one.
    const slotsRemaining = 3 - i;
    const max = 20 - slotsRemaining;
    const val = min + Math.floor(Math.random() * (max - min + 1));
    targets.push(val);
    min = val + 1;
  }
  return targets;
}

// Returns an array of 4 card-value arrays (one per area) or null if unsolvable.
function findSolution(values: number[], targets: number[]): number[][] | null {
  const allIndices = values.map((_, i) => i);

  function search(areaId: number, remaining: number[]): number[][] | null {
    if (areaId === 4) return [];
    const target = targets[areaId];

    for (const groupSize of [2, 3] as const) {
      if (remaining.length < groupSize) continue;
      const combos = combosOfSize(remaining, groupSize);
      for (const combo of combos) {
        const sum = combo.reduce((s, idx) => s + values[idx], 0);
        if (sum !== target) continue;
        const nextRemaining = remaining.filter(i => !combo.includes(i));
        const rest = search(areaId + 1, nextRemaining);
        if (rest !== null) return [combo.map(idx => values[idx]), ...rest];
      }
    }
    return null;
  }

  return search(0, allIndices);
}

function buildRandomHand(): SneakInCard[] {
  const numericDeck = shuffleDeck(
    createDeck().filter(c => {
      const n = parseInt(c.rank, 10);
      return !isNaN(n) && n >= 2 && n <= 10;
    }),
  );

  return numericDeck.slice(0, 10).map(card => ({ card, instanceId: nextId() }));
}

// Build a game that guarantees at least one valid solution where each area
// is solved with 2 or 3 cards (using any subset of the 10-card hand).
function buildGame(): { targets: number[]; hand: SneakInCard[]; solution: SneakInSolutionEntry[] } {
  while (true) {
    const targets = generateTargets();
    const hand = buildRandomHand();
    const values = hand.map(c => parseInt(c.card.rank, 10));
    const solutionIndices = findSolution(values, targets);
    if (!solutionIndices) continue;
    const solution: SneakInSolutionEntry[] = solutionIndices.map((cards, i) => ({
      areaName: AREA_LABELS[i],
      cards,
      target: targets[i],
    }));
    return { targets, hand, solution };
  }
}

function makeAreas(targets: number[]): SneakInArea[] {
  return ([0, 1, 2, 3] as AreaId[]).map(i => ({
    id: i,
    target: targets[i],
    cards: [],
    isSolved: false,
    isUnlocked: i === 0,
    failedCombos: [],
  }));
}

type SneakInStore = SneakInState & SneakInActions;

export const useSneakInStore = create<SneakInStore>((set, get) => ({
  phase: 'idle' as SneakInPhase,
  hand: [],
  areas: makeAreas([4, 8, 13, 18]),
  selectedCard: null,
  selectedSource: null,
  startTime: null,
  endTime: null,
  totalMoves: 0,
  solution: null,
  timeBonusMs: 0,
  insideTipHint: null,

  initGame: () => {
    const { targets, hand, solution } = buildGame();
    set({
      phase: 'idle',
      hand,
      areas: makeAreas(targets),
      selectedCard: null,
      selectedSource: null,
      startTime: null,
      endTime: null,
      totalMoves: 0,
      solution,
      timeBonusMs: 0,
      insideTipHint: null,
    });
  },

  moveCard: (card: SneakInCard, from: CardSource, to: CardSource) => {
    if (from === to) return;

    const { hand, areas, phase, startTime, totalMoves } = get();
    const newHand = [...hand];
    const newAreas = areas.map(a => ({ ...a, cards: [...a.cards] }));

    let movingCard: SneakInCard | null = null;

    if (from === 'hand') {
      const idx = newHand.findIndex(c => c.instanceId === card.instanceId);
      if (idx === -1) return;
      [movingCard] = newHand.splice(idx, 1);
    } else {
      const src = newAreas[from as number];
      const idx = src.cards.findIndex(c => c.instanceId === card.instanceId);
      if (idx === -1) return;
      [movingCard] = src.cards.splice(idx, 1);
      src.isSolved = checkSolved(src.cards, src.target);
    }

    if (!movingCard) return;

    if (to === 'hand') {
      newHand.push(movingCard);
    } else {
      const target = newAreas[to as number];
      if (!target.isUnlocked || target.cards.length >= 3) {
        // Invalid drop: restore to original source.
        if (from === 'hand') {
          newHand.push(movingCard);
        } else {
          const src = newAreas[from as number];
          src.cards.push(movingCard);
          src.isSolved = checkSolved(src.cards, src.target);
        }
        return;
      }

      target.cards.push(movingCard);
      target.isSolved = checkSolved(target.cards, target.target);

      // Unlock the next area the moment this one is solved (monotonic — never re-locks).
      if (target.isSolved && to < 3) {
        newAreas[to + 1].isUnlocked = true;
      }
    }

    const now = Date.now();
    const allSolved = newAreas.every(a => a.isSolved);
    const movedToArea = to !== 'hand';
    const newPhase: SneakInPhase = allSolved
      ? 'done'
      : movedToArea && phase === 'idle'
      ? 'playing'
      : phase;

    set({
      hand: newHand,
      areas: newAreas,
      selectedCard: null,
      selectedSource: null,
      startTime: movedToArea ? startTime ?? now : startTime,
      phase: newPhase,
      totalMoves: totalMoves + 1,
      ...(allSolved ? { endTime: now } : {}),
    });
  },

  // Tap a card anywhere to lift it. The card is removed from its source
  // immediately. If another card was already lifted, that one is returned
  // to its original location first.
  selectCard: (card: SneakInCard, source: CardSource) => {
    const { selectedCard, selectedSource, hand, areas } = get();

    // Tap same card again → deselect (return it)
    if (selectedCard?.instanceId === card.instanceId) {
      get().deselect();
      return;
    }

    const newHand = [...hand];
    const newAreas = areas.map(a => ({ ...a, cards: [...a.cards] }));

    // Return the previously lifted card to its original source
    if (selectedCard && selectedSource !== null) {
      if (selectedSource === 'hand') {
        newHand.push(selectedCard);
      } else {
        const src = newAreas[selectedSource as number];
        src.cards.push(selectedCard);
        src.isSolved = checkSolved(src.cards, src.target);
      }
    }

    // Remove the newly tapped card from its source
    if (source === 'hand') {
      const idx = newHand.findIndex(c => c.instanceId === card.instanceId);
      if (idx !== -1) newHand.splice(idx, 1);
    } else {
      const src = newAreas[source as number];
      const idx = src.cards.findIndex(c => c.instanceId === card.instanceId);
      if (idx !== -1) src.cards.splice(idx, 1);
      src.isSolved = checkSolved(src.cards, src.target);
    }

    set({ hand: newHand, areas: newAreas, selectedCard: card, selectedSource: source });
  },

  // Return the lifted card to wherever it came from.
  deselect: () => {
    const { selectedCard, selectedSource, hand, areas } = get();
    if (!selectedCard || selectedSource === null) return;

    const newHand = [...hand];
    const newAreas = areas.map(a => ({ ...a, cards: [...a.cards] }));

    if (selectedSource === 'hand') {
      newHand.push(selectedCard);
    } else {
      const area = newAreas[selectedSource as number];
      area.cards.push(selectedCard);
      area.isSolved = checkSolved(area.cards, area.target);
    }

    set({ hand: newHand, areas: newAreas, selectedCard: null, selectedSource: null });
  },

  // Place the lifted card onto an area. Starts the timer on the first placement.
  // Unlocks the next area if this one just became solved.
  placeOnArea: (areaId: AreaId) => {
    const { selectedCard, areas, startTime, phase, totalMoves } = get();
    if (!selectedCard) return;

    const area = areas[areaId];
    if (!area.isUnlocked || area.cards.length >= 3) return;

    const now = Date.now();
    const newAreas = areas.map(a => ({ ...a, cards: [...a.cards] }));
    const target = newAreas[areaId];
    target.cards.push(selectedCard);
    target.isSolved = checkSolved(target.cards, target.target);

    // Unlock the next area the moment this one is solved (monotonic — never re-locks)
    if (target.isSolved && areaId < 3) {
      newAreas[areaId + 1].isUnlocked = true;
    }

    const allSolved = newAreas.every(a => a.isSolved);
    const newPhase: SneakInPhase = allSolved
      ? 'done'
      : phase === 'idle'
      ? 'playing'
      : phase;

    set({
      areas: newAreas,
      selectedCard: null,
      selectedSource: null,
      startTime: startTime ?? now,
      phase: newPhase,
      totalMoves: totalMoves + 1,
      ...(allSolved ? { endTime: now } : {}),
    });
  },

  // Move the lifted card to hand (instead of returning it to its source).
  returnToHand: () => {
    const { selectedCard, hand, totalMoves } = get();
    if (!selectedCard) return;
    set({ hand: [...hand, selectedCard], selectedCard: null, selectedSource: null, totalMoves: totalMoves + 1 });
  },

  returnAreaToHand: (areaId: AreaId) => {
    const { phase, areas, hand } = get();
    if (phase !== 'playing' && phase !== 'idle') return;
    const area = areas[areaId];
    if (!area.isUnlocked || area.cards.length === 0) return;

    const returningCards = [...area.cards];
    const newAreas = areas.map(a => {
      if (a.id !== areaId) return a;
      const updatedFailed =
        returningCards.length >= 2
          ? [returningCards]
          : a.failedCombos;
      return { ...a, cards: [], isSolved: false, failedCombos: updatedFailed };
    });

    set({ areas: newAreas, hand: [...hand, ...returningCards] });
  },

  returnAllToHand: () => {
    const { phase, areas, hand } = get();
    if (phase !== 'playing' && phase !== 'idle') return;

    const allReturning: SneakInCard[] = [];
    const newAreas = areas.map(a => {
      if (!a.isUnlocked || a.cards.length === 0) return a;
      const returningCards = [...a.cards];
      allReturning.push(...returningCards);
      const updatedFailed =
        returningCards.length >= 2
          ? [returningCards]
          : a.failedCombos;
      return { ...a, cards: [], isSolved: false, failedCombos: updatedFailed };
    });

    if (allReturning.length === 0) return;
    set({ areas: newAreas, hand: [...hand, ...allReturning] });
  },

  // Called when the countdown expires (accounts for any time bonus from False Alarm).
  timeoutGame: () => {
    const { startTime, timeBonusMs } = get();
    const totalMs = 120_000 + timeBonusMs;
    set({ phase: 'timeout', endTime: startTime ? startTime + totalMs : Date.now() });
  },

  activateFalseAlarm: () => {
    const { phase, timeBonusMs } = get();
    if (phase !== 'idle' && phase !== 'playing') return;
    set({ timeBonusMs: timeBonusMs + 60_000 });
  },

  activateInsideTip: (areaId: AreaId) => {
    const { solution, hand, phase } = get();
    if (!solution || phase === 'done' || phase === 'timeout') return;
    const entry = solution[areaId];
    if (!entry) return;
    for (const rankVal of entry.cards) {
      const match = hand.find(sc => parseInt(sc.card.rank, 10) === rankVal);
      if (match) {
        set({ insideTipHint: { areaId, card: match } as InsideTipHint });
        return;
      }
    }
    // No match in hand — leave hint unchanged
  },

  clearInsideTipHint: () => {
    set({ insideTipHint: null });
  },
}));
