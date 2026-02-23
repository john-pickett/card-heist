import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';
import {
  ESCAPE_EXIT_POSITION,
  ESCAPE_POLICE_ALERT_THRESHOLD,
  ESCAPE_PATH_LENGTH,
  ESCAPE_POLICE_START_POSITION,
  ESCAPE_PLAYER_START_POSITION,
  getEscapePoliceAutoMoveChancePct,
} from '../constants/escapeBalance';
import {
  EscapeCard,
  EscapeState,
  EscapeActions,
  MeldValidation,
  TurnLogEntry,
} from '../types/escape';

const RANK_ORDER: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUIT_ORDER: Card['suit'][] = ['clubs', 'diamonds', 'hearts', 'spades'];

let instanceCounter = 0;

function toEscapeCards(cards: Card[]): EscapeCard[] {
  return cards.map(card => ({ card, instanceId: `ec-${++instanceCounter}` }));
}

function sortEscapeHand(cards: EscapeCard[]): EscapeCard[] {
  return [...cards].sort((a, b) => {
    const rankDiff = RANK_ORDER.indexOf(a.card.rank) - RANK_ORDER.indexOf(b.card.rank);
    if (rankDiff !== 0) return rankDiff;
    const suitDiff = SUIT_ORDER.indexOf(a.card.suit) - SUIT_ORDER.indexOf(b.card.suit);
    if (suitDiff !== 0) return suitDiff;
    return a.instanceId.localeCompare(b.instanceId);
  });
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

function hasAnyMeld(cards: EscapeCard[]): boolean {
  const n = cards.length;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        if (validateMeld([cards[a].card, cards[b].card, cards[c].card]).valid) return true;
        for (let d = c + 1; d < n; d++) {
          if (validateMeld([cards[a].card, cards[b].card, cards[c].card, cards[d].card]).valid) {
            return true;
          }
        }
      }
    }
  }
  return false;
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

function applyPoliceNoiseAlert(
  policeAlertLevel: number,
  policePosition: number,
  playerPosition: number,
): { nextAlertLevel: number; nextPolicePosition: number } {
  const raisedAlertLevel = Math.min(ESCAPE_POLICE_ALERT_THRESHOLD, policeAlertLevel + 1);
  if (raisedAlertLevel < ESCAPE_POLICE_ALERT_THRESHOLD) {
    return { nextAlertLevel: raisedAlertLevel, nextPolicePosition: policePosition };
  }

  return {
    nextAlertLevel: raisedAlertLevel,
    nextPolicePosition: Math.max(playerPosition, policePosition - 1),
  };
}

const INITIAL_STATE: EscapeState = {
  phase: 'player_turn',
  deck: [],
  playerHand: [],
  policeHand: [],
  playerPosition: ESCAPE_PLAYER_START_POSITION,
  policePosition: ESCAPE_POLICE_START_POSITION,
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
  policeAlertLevel: 0,
  policeMelds: 0,
  policeCardsDrawn: 0,
  turnsPlayed: 0,
  turnLog: [],
  lastPlayerAction: null,
  pendingPoliceAlertAction: null,
};

export const useEscapeStore = create<EscapeState & EscapeActions>((set, get) => ({
  ...INITIAL_STATE,

  initGame: () => {
    instanceCounter = 0;
    let cards: EscapeCard[];
    let openingHand: EscapeCard[];
    do {
      cards = toEscapeCards(shuffleDeck(createDeck()));
      openingHand = cards.slice(0, 8);
    } while (!hasAnyMeld(openingHand));
    const playerHand = sortEscapeHand(openingHand);
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
    const {
      selectedIds,
      playerHand,
      deck,
      playerPosition,
      phase,
      outOfPlay,
      playerMelds,
      playerSets,
      playerRuns,
      playerCardsDrawn,
      turnsPlayed,
      policeAlertLevel,
      policePosition,
    } = get();
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
    const sortedHand = sortEscapeHand(newHand);
    const advance = selectedCards.length === 4 ? 2 : 1;
    const newPosition = playerPosition - advance;
    const actionStr = `Laid a match (${result.type}, ${advance} step${advance > 1 ? 's' : ''})`;
    const { nextAlertLevel, nextPolicePosition } = applyPoliceNoiseAlert(
      policeAlertLevel,
      policePosition,
      newPosition <= ESCAPE_EXIT_POSITION ? ESCAPE_EXIT_POSITION : newPosition,
    );

    const meldCounters = {
      playerMelds: playerMelds + 1,
      playerSets: result.type === 'set' ? playerSets + 1 : playerSets,
      playerRuns: result.type === 'run' ? playerRuns + 1 : playerRuns,
      playerCardsDrawn: playerCardsDrawn + drawCount,
      turnsPlayed: turnsPlayed + 1,
    };

    if (newPosition <= ESCAPE_EXIT_POSITION) {
      set({
        playerHand: sortedHand,
        deck: newDeck,
        outOfPlay: newOutOfPlay,
        playerPosition: ESCAPE_EXIT_POSITION,
        selectedIds: [],
        errorMessage: null,
        infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
        lastMeldType: result.type,
        lastPlayerAction: actionStr,
        pendingPoliceAlertAction: null,
        phase: 'won',
        ...meldCounters,
      });
    } else {
      set({
        playerHand: sortedHand,
        deck: newDeck,
        outOfPlay: newOutOfPlay,
        playerPosition: newPosition,
        selectedIds: [],
        errorMessage: null,
        infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
        lastMeldType: result.type,
        lastPlayerAction: actionStr,
        policePosition: nextPolicePosition,
        policeAlertLevel: nextAlertLevel,
        pendingPoliceAlertAction: 'The police heard a noise and are investigating',
        phase: 'police_thinking',
        ...meldCounters,
      });
    }
  },

  discard: () => {
    const {
      selectedIds,
      playerHand,
      deck,
      phase,
      outOfPlay,
      playerCardsDrawn,
      playerDiscardCount,
      policePosition,
      playerPosition,
      turnsPlayed,
      policeAlertLevel,
    } = get();
    if (phase !== 'player_turn') return;
    if (selectedIds.length === 0) return;

    const discarded = playerHand.filter(ec => selectedIds.includes(ec.instanceId));
    const remaining = playerHand.filter(ec => !selectedIds.includes(ec.instanceId));
    const drawCount = selectedIds.length;
    const newOutOfPlayBeforeDraw = [...outOfPlay, ...discarded];
    const { newHand, newDeck, newOutOfPlay, reshuffled } = drawCardsWithReshuffle(deck, remaining, drawCount, newOutOfPlayBeforeDraw);
    const sortedHand = sortEscapeHand(newHand);

    const newDiscardCount = playerDiscardCount + 1;
    const actionStr = `Discarded ${selectedIds.length} card${selectedIds.length > 1 ? 's' : ''}`;
    const { nextAlertLevel, nextPolicePosition } = applyPoliceNoiseAlert(
      policeAlertLevel,
      policePosition,
      playerPosition,
    );

    set({
      playerHand: sortedHand,
      deck: newDeck,
      outOfPlay: newOutOfPlay,
      selectedIds: [],
      errorMessage: null,
      infoMessage: reshuffled ? 'Deck empty — reshuffling discards...' : null,
      policePosition: nextPolicePosition,
      policeAlertLevel: nextAlertLevel,
      pendingPoliceAlertAction: 'The police heard a noise and are investigating',
      lastPlayerAction: actionStr,
      phase: 'police_thinking',
      playerDiscardCount: newDiscardCount,
      playerCardsDrawn: playerCardsDrawn + drawCount,
      turnsPlayed: turnsPlayed + 1,
    });
  },

  runPoliceTurn: () => {
    const {
      policePosition,
      playerPosition,
      turnsPlayed,
      turnLog,
      lastPlayerAction,
      pendingPoliceAlertAction,
      policeAlertLevel,
    } = get();
    const autoMoveChancePct = getEscapePoliceAutoMoveChancePct(turnsPlayed);
    const alreadyCaught = policePosition <= playerPosition;
    const shouldAutoMove = !alreadyCaught && Math.random() < autoMoveChancePct / 100;
    const nextPolicePos = shouldAutoMove ? policePosition - 1 : policePosition;
    const caught = alreadyCaught || (shouldAutoMove && nextPolicePos <= playerPosition);
    const newPolicePos = caught ? playerPosition : nextPolicePos;
    const policeActionParts: string[] = [];

    if (pendingPoliceAlertAction) {
      policeActionParts.push(
        alreadyCaught ? `${pendingPoliceAlertAction} — they've caught you!` : pendingPoliceAlertAction,
      );
    }

    if (!alreadyCaught) {
      if (caught) {
        policeActionParts.push("Police search is getting closer — they've caught you!");
      } else if (shouldAutoMove) {
        policeActionParts.push('Police search is getting closer');
      }
    }

    const policeAction =
      policeActionParts.length > 0
        ? policeActionParts.join(' • ')
        : 'Police are investigating nearby';

    const entry: TurnLogEntry = {
      turn: turnsPlayed,
      playerAction: lastPlayerAction ?? '—',
      policeAction,
      policeEvents: policeActionParts.length > 0 ? policeActionParts : [policeAction],
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
        lastMeldType: null,
        pendingPoliceAlertAction: null,
        policeAlertLevel:
          policeAlertLevel >= ESCAPE_POLICE_ALERT_THRESHOLD ? 0 : policeAlertLevel,
        phase: 'lost',
      });
      return;
    }

    set({
      policePosition: newPolicePos,
      policeMessage: null,
      turnLog: newLog,
      lastPlayerAction: null,
      pendingPoliceAlertAction: null,
      policeAlertLevel:
        policeAlertLevel >= ESCAPE_POLICE_ALERT_THRESHOLD ? 0 : policeAlertLevel,
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
    set({ policePosition: Math.min(ESCAPE_PATH_LENGTH, policePosition + 1) });
  },
}));
