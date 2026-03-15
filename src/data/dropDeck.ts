import { Card, Rank, Suit } from '../types/card';
import { createDeck, shuffleDeck } from './deck';

export type DropRule = 'low-voltage' | 'high-tension' | 'color-wire' | 'suit-lock';

export const RULE_CYCLE: DropRule[] = ['low-voltage', 'high-tension', 'color-wire', 'suit-lock'];

export const RULE_OPPOSITES: Record<DropRule, DropRule> = {
  'low-voltage': 'high-tension',
  'high-tension': 'low-voltage',
  'color-wire': 'suit-lock',
  'suit-lock': 'color-wire',
};

export const RULE_LABELS: Record<DropRule, { name: string; safe: string; volatile: string }> = {
  'low-voltage':  { name: 'Low Voltage',  safe: 'Evens',      volatile: 'Odds'   },
  'high-tension': { name: 'High Tension', safe: 'Odds',       volatile: 'Evens'  },
  'color-wire':   { name: 'Color Wire',   safe: 'Red (♥♦)',   volatile: 'Black (♠♣)' },
  'suit-lock':    { name: 'Suit Lock',    safe: 'Matching last safe suit', volatile: 'Other suits' },
};

export const DROP_REWARDS = {
  BASE_CLEAR: 500,
  PER_FUSE: 100,
  PER_ESCALATION: 75,
  ZERO_MISTAKES: 200,
  FREEZE_ON_LAST: 50,
} as const;

export function isTrigger(rank: Rank): boolean {
  return rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A';
}

function rankNumericValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
}

export function isSafeCard(card: Card, rule: DropRule, lastSafeCard: Card | null): boolean {
  switch (rule) {
    case 'low-voltage':
      return rankNumericValue(card.rank) % 2 === 0;
    case 'high-tension':
      return rankNumericValue(card.rank) % 2 !== 0;
    case 'color-wire':
      return card.suit === 'hearts' || card.suit === 'diamonds';
    case 'suit-lock':
      return lastSafeCard !== null && card.suit === lastSafeCard.suit;
  }
}

export function buildDropDeck(): Card[] {
  return shuffleDeck(createDeck());
}

export function computeDropReward(params: {
  victory: boolean;
  fusesRemaining: number;
  escalationsCompleted: number;
  mistakes: number;
  freezeActiveOnLast: boolean;
}): number {
  if (!params.victory) return 0;
  let gold = DROP_REWARDS.BASE_CLEAR;
  gold += params.fusesRemaining * DROP_REWARDS.PER_FUSE;
  gold += params.escalationsCompleted * DROP_REWARDS.PER_ESCALATION;
  if (params.mistakes === 0) gold += DROP_REWARDS.ZERO_MISTAKES;
  if (params.freezeActiveOnLast) gold += DROP_REWARDS.FREEZE_ON_LAST;
  return gold;
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades':   return '♠';
    case 'hearts':   return '♥';
    case 'diamonds': return '♦';
    case 'clubs':    return '♣';
  }
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
