import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';
import {
  EscapeCard,
  EscapeState,
  EscapeActions,
  MeldValidation,
  TurnLogEntry,
} from '../types/escape';

const RANK_ORDER: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

let instanceCounter = 0;

function toEscapeCards(cards: Card[]): EscapeCard[] {
  return cards.map(card => ({ card, instanceId: `ec-${++instanceCounter}` }));
}

function validateMeld(cards: Card[]): MeldValidation {
  if (cards.length < 3 || cards.length > 4)
    return { valid: false, reason: 'Select 3 or 4 cards to meld' };

  // Set: all same rank
  if (cards.every(c => c.rank === cards[0].rank))
    return { valid: true, type: 'set' };

  // Run: consecutive ranks (any suit)
  const indices = cards.map(c => RANK_ORDER.indexOf(c.rank)).sort((a, b) => a - b);
  const consecutive = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
  if (consecutive) return { valid: true, type: 'run' };
  return { valid: false, reason: 'Not a valid set or run' };
}

// Draw `count` cards from deck, reshuffling outOfPlay if deck runs short
function drawCardsWithReshuffle(
  deck: EscapeCard[],
  hand: EscapeCard[],
  count: number,
  outOfPlay: EscapeCard[]
): { newHand: EscapeCard[]; newDeck: EscapeCard[]; newOutOfPlay: EscapeCard[]; reshuffled: boolean } {
  if (deck.length >= count) {
    return {
      newHand: [...hand, ...deck.slice(0, count)],
      newDeck: deck.slice(count),
      newOutOfPlay: outOfPlay,
      reshuffled: false,
    };
  }

  // Take all remaining from deck, then reshuffle outOfPlay
  const fromDeck = [...deck];
  const needed = count - fromDeck.length;

  // Fisher-Yates shuffle on EscapeCard[]
  const reshuffledPool = [...outOfPlay];
  for (let i = reshuffledPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [reshuffledPool[i], reshuffledPool[j]] = [reshuffledPool[j], reshuffledPool[i]];
  }

  const fromReshuffle = reshuffledPool.slice(0, needed);
  const remainingDeck = reshuffledPool.slice(needed);

  return {
    newHand: [...hand, ...fromDeck, ...fromReshuffle],
    newDeck: remainingDeck,
    newOutOfPlay: [],
    reshuffled: true,
  };
}

const INITIAL_STATE: EscapeState = {
  phase: 'player_turn',
  deck: [],
  playerHand: [],
  policeHand: [],
  playerPosition: 4,
  policePosition: 6,
  selectedIds: [],
  errorMessage: null,
  policeMessage: null,
  outOfPlay: [],
  infoMessage: null,
  lastMeldType: null,
  playerMelds: 0,
  playerSets: 0,
  playerRuns: 0,
  playerCardsDrawn: 0,
  playerDiscardCount: 0,
  policeMelds: 0,
  policeCardsDrawn: 0,
  turnsPlayed: 0,
  turnLog: [],
  lastPlayerAction: null,
};

export const useEscapeStore = create<EscapeState & EscapeActions>((set, get) => ({
  ...INITIAL_STATE,

  initGame: () => {
    instanceCounter = 0;
    const cards = toEscapeCards(shuffleDeck(createDeck()));
    const playerHand = cards.slice(0, 8);
    const deck = cards.slice(8);
    set({
      ...INITIAL_STATE,
      deck,
      playerHand,
      policeHand: [],
    });
  },

  toggleSelect: (instanceId: string) => {
    const { selectedIds, phase } = get();
    if (phase !== 'player_turn') return;
    if (selectedIds.includes(instanceId)) {
      set({ selectedIds: selectedIds.filter(id => id !== instanceId) });
    } else {
      set({ selectedIds: [...selectedIds, instanceId] });
    }
  },

  layMeld: () => {
    const { selectedIds, playerHand, deck, playerPosition, phase, outOfPlay, playerMelds, playerSets, playerRuns, playerCardsDrawn, turnsPlayed } = get();
    if (phase !== 'player_turn') return;

    const selectedCards = playerHand.filter(ec => selectedIds.includes(ec.instanceId));
    const result = validateMeld(selectedCards.map(ec => ec.card));

    if (!result.valid) {
      set({ errorMessage: result.reason });
      return;
    }

    const remaining = playerHand.filter(ec => !selectedIds.includes(ec.instanceId));
    const drawCount = 8 - remaining.length;
    const newOutOfPlayBeforeDraw = [...outOfPlay, ...selectedCards];
    const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, remaining, drawCount, newOutOfPlayBeforeDraw);
    const advance = selectedCards.length === 4 ? 2 : 1;
    const newPosition = playerPosition - advance;
    const actionStr = `Laid a match (${result.type}, ${advance} step${advance > 1 ? 's' : ''})`;

    const meldCounters = {
      playerMelds: playerMelds + 1,
      playerSets: result.type === 'set' ? playerSets + 1 : playerSets,
      playerRuns: result.type === 'run' ? playerRuns + 1 : playerRuns,
      playerCardsDrawn: playerCardsDrawn + drawCount,
      turnsPlayed: turnsPlayed + 1,
    };

    if (newPosition <= 1) {
      set({
        playerHand: newHand,
        deck: newDeck,
        outOfPlay: newOutOfPlay,
        playerPosition: 1,
        selectedIds: [],
        errorMessage: null,
        infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
        lastMeldType: result.type,
        lastPlayerAction: actionStr,
        phase: 'won',
        ...meldCounters,
      });
    } else {
      set({
        playerHand: newHand,
        deck: newDeck,
        outOfPlay: newOutOfPlay,
        playerPosition: newPosition,
        selectedIds: [],
        errorMessage: null,
        infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
        lastMeldType: result.type,
        lastPlayerAction: actionStr,
        phase: 'police_thinking',
        ...meldCounters,
      });
    }
  },

  discard: () => {
    const { selectedIds, playerHand, deck, phase, outOfPlay, playerCardsDrawn, playerDiscardCount, policePosition, playerPosition, turnsPlayed } = get();
    if (phase !== 'player_turn') return;
    if (selectedIds.length === 0) return;

    const discarded = playerHand.filter(ec => selectedIds.includes(ec.instanceId));
    const remaining = playerHand.filter(ec => !selectedIds.includes(ec.instanceId));
    const drawCount = selectedIds.length;
    const newOutOfPlayBeforeDraw = [...outOfPlay, ...discarded];
    const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, remaining, drawCount, newOutOfPlayBeforeDraw);

    const newDiscardCount = playerDiscardCount + 1;
    const policeAdvance = true;
    const newPolicePos = Math.max(playerPosition, policePosition - 1);
    const actionStr = `Discarded ${selectedIds.length} card${selectedIds.length > 1 ? 's' : ''}${policeAdvance ? ' — police alerted' : ''}`;

    set({
      playerHand: newHand,
      deck: newDeck,
      outOfPlay: newOutOfPlay,
      selectedIds: [],
      errorMessage: null,
      infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
      policePosition: newPolicePos,
      lastPlayerAction: actionStr,
      phase: 'police_thinking',
      playerDiscardCount: newDiscardCount,
      playerCardsDrawn: playerCardsDrawn + drawCount,
      turnsPlayed: turnsPlayed + 1,
    });
  },

  runPoliceTurn: () => {
    const { policePosition, playerPosition, turnsPlayed, turnLog, lastPlayerAction } = get();
    const nextPolicePos = policePosition - 1;
    const caught = nextPolicePos <= playerPosition;
    const newPolicePos = caught ? playerPosition : nextPolicePos;
    const policeAction = caught
      ? "Police closed in — they've caught you!"
      : `Police closed in — now at step ${newPolicePos}`;

    const entry: TurnLogEntry = {
      turn: turnsPlayed,
      playerAction: lastPlayerAction ?? '—',
      policeAction,
      playerPos: playerPosition,
      policePos: newPolicePos,
    };
    const newLog = [...turnLog, entry].slice(-3);

    if (caught) {
      set({
        policePosition: newPolicePos,
        policeMessage: policeAction,
        turnLog: newLog,
        lastPlayerAction: null,
        phase: 'awaiting_continue',
      });
      return;
    }

    set({
      policePosition: newPolicePos,
      policeMessage: null,
      turnLog: newLog,
      lastPlayerAction: null,
      lastMeldType: null,
      phase: 'player_turn',
    });
  },

  endPoliceTurn: () => {
    const { policePosition, playerPosition } = get();
    if (policePosition <= playerPosition) {
      set({ phase: 'lost' });
    } else {
      set({
        phase: 'player_turn',
        policeMessage: null,
        lastMeldType: null,
      });
    }
  },

  clearError: () => set({ errorMessage: null }),
  clearInfo: () => set({ infoMessage: null }),

  activateFalseTrail: () => {
    const { phase, policePosition } = get();
    if (phase !== 'player_turn') return;
    set({ policePosition: Math.min(6, policePosition + 1) });
  },
}));
