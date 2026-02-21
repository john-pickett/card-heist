import { Card } from './card';

export type VaultTarget = 13 | 18 | 21;
export type AceValue = 1 | 11;

export interface VaultCard {
  card: Card;
  instanceId: string;
  aceValue?: AceValue;
}

export interface Vault {
  id: 0 | 1 | 2;
  target: VaultTarget;
  cards: VaultCard[];
  sum: number;
  isStood: boolean;
  isBusted: boolean;
  targetRevealed: boolean;
}

export type ReckoningPhase = 'idle' | 'dealing' | 'assigning' | 'ace' | 'done';

export interface PendingAce {
  card: Card;
  instanceId: string;
  targetVaultId: 0 | 1 | 2;
}

export interface ReckoningState {
  phase: ReckoningPhase;
  deck: Card[];
  currentCard: Card | null;
  currentInstanceId: string | null;
  vaults: Vault[];
  pendingAce: PendingAce | null;
  finalScore: number | null;
  exactHits: number;
  busts: number;
  aceOnes: number;
  aceElevens: number;
}

export interface ReckoningActions {
  initGame: () => void;
  flipCard: () => void;
  assignCard: (vaultId: 0 | 1 | 2) => void;
  chooseAceValue: (value: AceValue) => void;
  standVault: (vaultId: 0 | 1 | 2) => void;
}
