import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';
import {
  EscapeCard,
  EscapeState,
  EscapeActions,
  MeldValidation,
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

  // Run: all same suit, consecutive indices in RANK_ORDER
  if (cards.every(c => c.suit === cards[0].suit)) {
    const indices = cards.map(c => RANK_ORDER.indexOf(c.rank)).sort((a, b) => a - b);
    const consecutive = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
    if (consecutive) return { valid: true, type: 'run' };
    return { valid: false, reason: 'Suit cards must be in sequence (A is low)' };
  }
  return { valid: false, reason: 'Not a valid set or run' };
}

function findPoliceMeld(hand: EscapeCard[]): EscapeCard[] | null {
  // 1. Scan for set (group by rank, any group >= 3)
  const byRank = new Map<Rank, EscapeCard[]>();
  for (const ec of hand) {
    const group = byRank.get(ec.card.rank) ?? [];
    group.push(ec);
    byRank.set(ec.card.rank, group);
  }
  for (const group of byRank.values()) {
    if (group.length >= 3) return group.slice(0, 3);
  }

  // 2. Scan for run (group by suit, sort by RANK_ORDER index, sliding window for 3+ consecutive)
  const bySuit = new Map<string, EscapeCard[]>();
  for (const ec of hand) {
    const group = bySuit.get(ec.card.suit) ?? [];
    group.push(ec);
    bySuit.set(ec.card.suit, group);
  }
  for (const group of bySuit.values()) {
    if (group.length < 3) continue;
    const sorted = [...group].sort(
      (a, b) => RANK_ORDER.indexOf(a.card.rank) - RANK_ORDER.indexOf(b.card.rank)
    );
    // Sliding window: look for 3 consecutive
    for (let i = 0; i <= sorted.length - 3; i++) {
      const window = sorted.slice(i, i + 3);
      const idxs = window.map(ec => RANK_ORDER.indexOf(ec.card.rank));
      const consecutive = idxs[1] === idxs[0] + 1 && idxs[2] === idxs[1] + 1;
      if (consecutive) return window;
    }
  }

  return null;
}

function discardLowest(hand: EscapeCard[]): { worst: EscapeCard; rest: EscapeCard[] } {
  function cardValue(rank: Rank): number {
    if (rank === 'A') return 1;
    if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
    return parseInt(rank, 10);
  }
  let worstIdx = 0;
  let worstVal = cardValue(hand[0].card.rank);
  for (let i = 1; i < hand.length; i++) {
    const v = cardValue(hand[i].card.rank);
    if (v < worstVal) { worstVal = v; worstIdx = i; }
  }
  const worst = hand[worstIdx];
  const rest = hand.filter((_, i) => i !== worstIdx);
  return { worst, rest };
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
  playerPosition: 3,
  policePosition: 6,
  selectedIds: [],
  errorMessage: null,
  policeMessage: null,
  policeLastPlay: null,
  outOfPlay: [],
  infoMessage: null,
  lastMeldType: null,
};

export const useEscapeStore = create<EscapeState & EscapeActions>((set, get) => ({
  ...INITIAL_STATE,

  initGame: () => {
    instanceCounter = 0;
    const cards = toEscapeCards(shuffleDeck(createDeck()));
    const playerHand = cards.slice(0, 8);
    const policeHand = cards.slice(8, 15);
    const deck = cards.slice(15);
    set({
      ...INITIAL_STATE,
      deck,
      playerHand,
      policeHand,
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
    const { selectedIds, playerHand, deck, playerPosition, phase, outOfPlay } = get();
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
    const newPosition = playerPosition - 1;

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
        phase: 'won',
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
        phase: 'police_thinking',
      });
    }
  },

  discard: () => {
    const { selectedIds, playerHand, deck, phase, outOfPlay } = get();
    if (phase !== 'player_turn') return;
    if (selectedIds.length === 0) return;

    const discarded = playerHand.filter(ec => selectedIds.includes(ec.instanceId));
    const remaining = playerHand.filter(ec => !selectedIds.includes(ec.instanceId));
    const drawCount = selectedIds.length;
    const newOutOfPlayBeforeDraw = [...outOfPlay, ...discarded];
    const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, remaining, drawCount, newOutOfPlayBeforeDraw);

    set({
      playerHand: newHand,
      deck: newDeck,
      outOfPlay: newOutOfPlay,
      selectedIds: [],
      errorMessage: null,
      infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
      phase: 'police_thinking',
    });
  },

  runPoliceTurn: () => {
    const { policeHand, deck, policePosition, playerPosition, outOfPlay } = get();

    const meld = findPoliceMeld(policeHand);
    if (meld) {
      const meldIds = new Set(meld.map(ec => ec.instanceId));
      const remaining = policeHand.filter(ec => !meldIds.has(ec.instanceId));
      const newOutOfPlayBeforeDraw = [...outOfPlay, ...meld];
      const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, remaining, meld.length, newOutOfPlayBeforeDraw);
      const newPolicePos = policePosition - 1;
      const policeMsg = `Police lay down a meld!${reshuffled ? ' (deck reshuffled)' : ''}`;

      if (newPolicePos <= playerPosition) {
        set({
          policeHand: newHand,
          deck: newDeck,
          outOfPlay: newOutOfPlay,
          policePosition: newPolicePos,
          policeMessage: policeMsg,
          policeLastPlay: meld,
          phase: 'lost',
        });
      } else {
        set({
          policeHand: newHand,
          deck: newDeck,
          outOfPlay: newOutOfPlay,
          policePosition: newPolicePos,
          policeMessage: policeMsg,
          policeLastPlay: meld,
          phase: 'police_reveal',
        });
      }
    } else {
      const { worst, rest } = discardLowest(policeHand);
      const newOutOfPlayBeforeDraw = [...outOfPlay, worst];
      const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, rest, 1, newOutOfPlayBeforeDraw);
      const policeMsg = `Police discard ${worst.card.rank} and draw.${reshuffled ? ' (deck reshuffled)' : ''}`;
      set({
        policeHand: newHand,
        deck: newDeck,
        outOfPlay: newOutOfPlay,
        policeMessage: policeMsg,
        policeLastPlay: [worst],
        phase: 'police_reveal',
      });
    }
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
}));
