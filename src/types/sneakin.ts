import { Card } from './card';

export interface SneakInCard {
  card: Card;
  instanceId: string;
}

export type AreaId = 0 | 1 | 2 | 3;

export const AREA_LABELS: Record<number, string> = {
  0: 'Outer Door',
  1: 'Silent Alarm',
  2: 'Night Watchman',
  3: 'Vault Door',
};

export const AREA_ICONS: Record<number, string> = {
  0: '🚪',
  1: '🔔',
  2: '👁',
  3: '🏦',
};

export interface SneakInArea {
  id: AreaId;
  target: number;
  cards: SneakInCard[];
  isSolved: boolean;
  isUnlocked: boolean;
  failedCombos: SneakInCard[][];
}

export type CardSource = 'hand' | AreaId;

export type SneakInPhase = 'idle' | 'playing' | 'done' | 'timeout';

export interface SneakInSolutionEntry {
  areaName: string;
  cards: number[];
  target: number;
}

export interface SneakInState {
  phase: SneakInPhase;
  hand: SneakInCard[];
  areas: SneakInArea[];
  selectedCard: SneakInCard | null;
  selectedSource: CardSource | null;
  startTime: number | null;
  endTime: number | null;
  totalMoves: number;
  solution: SneakInSolutionEntry[] | null;
}

export interface SneakInActions {
  initGame: () => void;
  moveCard: (card: SneakInCard, from: CardSource, to: CardSource) => void;
  selectCard: (card: SneakInCard, source: CardSource) => void;
  deselect: () => void;
  placeOnArea: (areaId: AreaId) => void;
  returnToHand: () => void;
  returnAreaToHand: (areaId: AreaId) => void;
  returnAllToHand: () => void;
  timeoutGame: () => void;
}
