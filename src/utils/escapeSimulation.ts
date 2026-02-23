import { Rank, Suit } from '../types/card';
import {
  ESCAPE_POLICE_ALERT_THRESHOLD,
  ESCAPE_POLICE_START_POSITION,
  ESCAPE_PLAYER_START_POSITION,
  ESCAPE_POLICE_AUTO_MOVE_CHANCE_BY_PLAYER_TURN,
} from '../constants/escapeBalance';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SimCard {
  rank: Rank;
  suit: Suit;
}

export interface GameResult {
  won: boolean;
  turns: number;
  playerMelds: number;
  policeMelds: number;
  terminatedByLimit: boolean;
}

export interface SimulationResult {
  n: number;
  wins: number;
  losses: number;
  escapePct: number;
  capturePct: number;
  marginOfError: number;
  ciLow: number;
  ciHigh: number;
  avgTurns: number;
  avgPlayerMelds: number;
  avgPoliceMelds: number;
  infiniteLoopGuards: number;
}

export interface GameConfig {
  playerStart?: number;            // default from escapeBalance
  policeStart?: number;            // default from escapeBalance
  alertThreshold?: number;         // default from escapeBalance (noise alerts police after N player actions)
  policeAutoAdvanceEvery?: number; // legacy override; if set, uses deterministic auto-advance cadence
  policeAutoMoveChanceByTurn?: number[]; // current Act 3 baseline chance schedule by player turn
  policeMeldAdvance?: number;      // legacy simulator option; ignored unless useLegacyPoliceAi=true
  useLegacyPoliceAi?: boolean;     // legacy simulator mode (police hand/meld/discard model)
}

export interface SweepEntry {
  label: string;
  config: GameConfig;
  result: SimulationResult;
}

// ─── Layer 1: Helpers ────────────────────────────────────────────────────────

const RANK_ORDER: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export function rankIndex(r: Rank): number {
  return RANK_ORDER.indexOf(r);
}

function cardValue(r: Rank): number {
  if (r === 'A') return 1;
  if (r === 'J' || r === 'Q' || r === 'K') return 10;
  return parseInt(r, 10);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export function createSimDeck(): SimCard[] {
  const deck: SimCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANK_ORDER) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

// ─── Layer 2: Draw ───────────────────────────────────────────────────────────

interface DrawResult {
  newHand: SimCard[];
  newDeck: SimCard[];
  newOutOfPlay: SimCard[];
}

export function drawCards(
  deck: SimCard[],
  hand: SimCard[],
  count: number,
  outOfPlay: SimCard[]
): DrawResult {
  if (deck.length >= count) {
    return {
      newHand: [...hand, ...deck.slice(0, count)],
      newDeck: deck.slice(count),
      newOutOfPlay: outOfPlay,
    };
  }

  const fromDeck = [...deck];
  const needed = count - fromDeck.length;
  const reshuffledPool = shuffleArray(outOfPlay);
  const fromReshuffle = reshuffledPool.slice(0, needed);
  const remainingDeck = reshuffledPool.slice(needed);

  return {
    newHand: [...hand, ...fromDeck, ...fromReshuffle],
    newDeck: remainingDeck,
    newOutOfPlay: [],
  };
}

// ─── Layer 3: Police AI ──────────────────────────────────────────────────────

interface MeldPlay {
  cards: SimCard[];
  advance: number;
}

export function findPoliceMeld(hand: SimCard[]): SimCard[] | null {
  // 1. Group by rank; if any group >= 3 → 3-card set
  const byRank = new Map<Rank, SimCard[]>();
  for (const card of hand) {
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }
  for (const group of byRank.values()) {
    if (group.length >= 3) return group.slice(0, 3);
  }

  // 2. Group by suit, sort by rank index; sliding window of 3 consecutive
  const bySuit = new Map<Suit, SimCard[]>();
  for (const card of hand) {
    const group = bySuit.get(card.suit) ?? [];
    group.push(card);
    bySuit.set(card.suit, group);
  }
  for (const group of bySuit.values()) {
    if (group.length < 3) continue;
    const sorted = [...group].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));
    for (let i = 0; i <= sorted.length - 3; i++) {
      const window = sorted.slice(i, i + 3);
      const idxs = window.map(c => rankIndex(c.rank));
      if (idxs[1] === idxs[0] + 1 && idxs[2] === idxs[1] + 1) return window;
    }
  }

  return null;
}

function policeDiscardLowest(hand: SimCard[]): SimCard {
  let worstIdx = 0;
  let worstVal = cardValue(hand[0].rank);
  for (let i = 1; i < hand.length; i++) {
    const v = cardValue(hand[i].rank);
    if (v < worstVal) { worstVal = v; worstIdx = i; }
  }
  return hand[worstIdx];
}

// ─── Layer 4: Player optimal strategy ───────────────────────────────────────

export function findPlayerMeld(hand: SimCard[]): MeldPlay | null {
  // 1. Group by rank
  const byRank = new Map<Rank, SimCard[]>();
  for (const card of hand) {
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }

  // 4-card set → advance 2
  for (const group of byRank.values()) {
    if (group.length >= 4) return { cards: group.slice(0, 4), advance: 2 };
  }

  // Any-suit runs: deduplicate by rank, sort, then prefer a 4-card run (advance 2)
  const deduped = new Map<Rank, SimCard>();
  for (const card of hand) {
    if (!deduped.has(card.rank)) deduped.set(card.rank, card);
  }
  const sorted = [...deduped.values()].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));

  for (let i = 0; i <= sorted.length - 4; i++) {
    const window = sorted.slice(i, i + 4);
    const idxs = window.map(c => rankIndex(c.rank));
    if (
      idxs[1] === idxs[0] + 1 &&
      idxs[2] === idxs[1] + 1 &&
      idxs[3] === idxs[2] + 1
    ) {
      return { cards: window, advance: 2 };
    }
  }

  // 3-card set → advance 1
  for (const group of byRank.values()) {
    if (group.length >= 3) return { cards: group.slice(0, 3), advance: 1 };
  }

  // 3-card run → advance 1
  for (let i = 0; i <= sorted.length - 3; i++) {
    const window = sorted.slice(i, i + 3);
    const idxs = window.map(c => rankIndex(c.rank));
    if (idxs[1] === idxs[0] + 1 && idxs[2] === idxs[1] + 1) {
      return { cards: window, advance: 1 };
    }
  }

  return null;
}

function chooseBestDiscard(hand: SimCard[]): SimCard {
  let worstScore = Infinity;
  let worstCard = hand[0];

  for (const card of hand) {
    const rankMates = hand.filter(c => c !== card && c.rank === card.rank).length;
    const cardIdx = rankIndex(card.rank);
    const suitNeighbors = hand.filter(
      c => c !== card && c.suit === card.suit &&
        (rankIndex(c.rank) === cardIdx - 1 || rankIndex(c.rank) === cardIdx + 1)
    ).length;
    const score = -(rankMates + suitNeighbors);
    if (score < worstScore) { worstScore = score; worstCard = card; }
  }

  return worstCard;
}

function getPoliceAutoMoveChancePctForTurn(turns: number, chances: number[]): number {
  if (turns <= 0 || chances.length === 0) return 0;
  const idx = Math.min(turns - 1, chances.length - 1);
  return chances[idx] ?? 0;
}

// ─── Layer 5: Run one game ───────────────────────────────────────────────────

const MAX_TURNS = 500;

export function runOneGame(config: GameConfig = {}): GameResult {
  const {
    playerStart = ESCAPE_PLAYER_START_POSITION,
    policeStart = ESCAPE_POLICE_START_POSITION,
    alertThreshold = ESCAPE_POLICE_ALERT_THRESHOLD,
    policeAutoAdvanceEvery,
    policeAutoMoveChanceByTurn = [...ESCAPE_POLICE_AUTO_MOVE_CHANCE_BY_PLAYER_TURN],
    policeMeldAdvance = 1,
    useLegacyPoliceAi = false,
  } = config;

  let shuffled: SimCard[];
  let playerHand: SimCard[];
  do {
    shuffled = shuffleArray(createSimDeck());
    playerHand = shuffled.slice(0, 8);
  } while (!findPlayerMeld(playerHand));

  let policeHand: SimCard[] = useLegacyPoliceAi ? shuffled.slice(8, 15) : [];
  let deck: SimCard[] = useLegacyPoliceAi ? shuffled.slice(15) : shuffled.slice(8);
  let outOfPlay: SimCard[] = [];

  let playerPosition = playerStart;
  let policePosition = policeStart;
  let playerDiscardCount = 0;
  let policeAlertLevel = 0;
  let resetAlertAfterPoliceTurn = false;
  let turns = 0;
  let playerMelds = 0;
  let policeMelds = 0;

  for (let t = 0; t < MAX_TURNS; t++) {
    turns = t + 1;

    // ── Player turn ──
    const play = findPlayerMeld(playerHand);
    if (play) {
      const meldSet = new Set(play.cards);
      const remaining = playerHand.filter(c => !meldSet.has(c));
      const newOutOfPlay = [...outOfPlay, ...play.cards];
      const drawn = drawCards(deck, remaining, play.cards.length, newOutOfPlay);
      playerHand = drawn.newHand;
      deck = drawn.newDeck;
      outOfPlay = drawn.newOutOfPlay;
      playerPosition -= play.advance;
      playerMelds++;
      if (playerPosition <= 1) {
        return { won: true, turns, playerMelds, policeMelds, terminatedByLimit: false };
      }

      policeAlertLevel = Math.min(alertThreshold, policeAlertLevel + 1);
      if (policeAlertLevel >= alertThreshold) {
        policePosition--;
        resetAlertAfterPoliceTurn = true;
        if (policePosition <= playerPosition) {
          return { won: false, turns, playerMelds, policeMelds, terminatedByLimit: false };
        }
      }
    } else {
      const discard = chooseBestDiscard(playerHand);
      const remaining = playerHand.filter(c => c !== discard);
      const newOutOfPlay = [...outOfPlay, discard];
      const drawn = drawCards(deck, remaining, 1, newOutOfPlay);
      playerHand = drawn.newHand;
      deck = drawn.newDeck;
      outOfPlay = drawn.newOutOfPlay;
      playerDiscardCount++;

      policeAlertLevel = Math.min(alertThreshold, policeAlertLevel + 1);
      if (policeAlertLevel >= alertThreshold) {
        policePosition--;
        resetAlertAfterPoliceTurn = true;
        if (policePosition <= playerPosition) {
          return { won: false, turns, playerMelds, policeMelds, terminatedByLimit: false };
        }
      }
    }

    // ── Police turn ──
    if (useLegacyPoliceAi) {
      const meld = findPoliceMeld(policeHand);
      if (meld) {
        const meldSet = new Set(meld);
        const remaining = policeHand.filter(c => !meldSet.has(c));
        const newOutOfPlay = [...outOfPlay, ...meld];
        const drawn = drawCards(deck, remaining, meld.length, newOutOfPlay);
        policeHand = drawn.newHand;
        deck = drawn.newDeck;
        outOfPlay = drawn.newOutOfPlay;
        policePosition -= policeMeldAdvance;
        policeMelds++;
        if (policePosition <= playerPosition) {
          return { won: false, turns, playerMelds, policeMelds, terminatedByLimit: false };
        }
      } else {
        const worst = policeDiscardLowest(policeHand);
        const remaining = policeHand.filter(c => c !== worst);
        const newOutOfPlay = [...outOfPlay, worst];
        const drawn = drawCards(deck, remaining, 1, newOutOfPlay);
        policeHand = drawn.newHand;
        deck = drawn.newDeck;
        outOfPlay = drawn.newOutOfPlay;
      }
    }

    // Current Act 3 baseline: escalating chance to auto-advance after each player turn.
    // Optional deterministic cadence remains available for simulator sweeps.
    const shouldAutoAdvance =
      typeof policeAutoAdvanceEvery === 'number'
        ? policeAutoAdvanceEvery > 0 && turns % policeAutoAdvanceEvery === 0
        : Math.random() < getPoliceAutoMoveChancePctForTurn(turns, policeAutoMoveChanceByTurn) / 100;

    if (shouldAutoAdvance) {
      policePosition--;
      if (policePosition <= playerPosition) {
        return { won: false, turns, playerMelds, policeMelds, terminatedByLimit: false };
      }
    }

    if (resetAlertAfterPoliceTurn) {
      policeAlertLevel = 0;
      resetAlertAfterPoliceTurn = false;
    }
  }

  return { won: false, turns, playerMelds, policeMelds, terminatedByLimit: true };
}

// ─── Layer 6: Run simulation ─────────────────────────────────────────────────

export function runSimulation(n: number, config?: GameConfig): SimulationResult {
  let wins = 0;
  let totalTurns = 0;
  let totalPlayerMelds = 0;
  let totalPoliceMelds = 0;
  let infiniteLoopGuards = 0;

  for (let i = 0; i < n; i++) {
    const result = runOneGame(config);
    if (result.won) wins++;
    totalTurns += result.turns;
    totalPlayerMelds += result.playerMelds;
    totalPoliceMelds += result.policeMelds;
    if (result.terminatedByLimit) infiniteLoopGuards++;
  }

  const escapePct = wins / n;
  const marginOfError = 1.96 * Math.sqrt((escapePct * (1 - escapePct)) / n);
  const ciLow = Math.max(0, escapePct - marginOfError);
  const ciHigh = Math.min(1, escapePct + marginOfError);

  return {
    n,
    wins,
    losses: n - wins,
    escapePct,
    capturePct: 1 - escapePct,
    marginOfError,
    ciLow,
    ciHigh,
    avgTurns: totalTurns / n,
    avgPlayerMelds: totalPlayerMelds / n,
    avgPoliceMelds: totalPoliceMelds / n,
    infiniteLoopGuards,
  };
}

// ─── Layer 7: Parameter sweep ─────────────────────────────────────────────────

const SWEEP_CONFIGS: Array<{ label: string; config: GameConfig }> = [
  { label: 'Baseline',        config: {} },
  { label: 'Alert @1',        config: { alertThreshold: 1 } },
  { label: 'No Auto',         config: { policeAutoMoveChanceByTurn: [0] } },
  { label: 'Timer ×2',        config: { policeAutoAdvanceEvery: 2 } },
  { label: 'Legacy Police',   config: { useLegacyPoliceAi: true, policeAutoAdvanceEvery: 1 } },
  { label: 'Baseline +P5',    config: { playerStart: 5 } },
  { label: 'Timer ×2 +P5',    config: { policeAutoAdvanceEvery: 2, playerStart: 5 } },
  { label: 'Combo',           config: { alertThreshold: 1, policeAutoAdvanceEvery: 2 } },
];

export function runSweep(n: number): SweepEntry[] {
  return SWEEP_CONFIGS.map(({ label, config }) => ({
    label,
    config,
    result: runSimulation(n, config),
  }));
}
