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
}

export type CardSource = 'hand' | AreaId;

export type SneakInPhase = 'idle' | 'playing' | 'done';

export interface SneakInState {
  phase: SneakInPhase;
  hand: SneakInCard[];
  areas: SneakInArea[];
  selectedCard: SneakInCard | null;
  selectedSource: CardSource | null;
  startTime: number | null;
  endTime: number | null;
}

export interface SneakInActions {
  initGame: () => void;
  selectCard: (card: SneakInCard, source: CardSource) => void;
  deselect: () => void;
  placeOnArea: (areaId: AreaId) => void;
  returnToHand: () => void;
}
