import { Card } from './card';

export type VaultTarget = 13 | 18 | 21 | 26 | 36 | 42 | 84;
export type AceValue = 1 | 11;

export interface VaultCard {
  card: Card;
  instanceId: string;
  aceValue?: AceValue;
}

export interface Vault {
  id: 0 | 1 | 2 | 3;
  target: VaultTarget;
  cards: VaultCard[];
  sum: number;
  isStood: boolean;
  isBusted: boolean;
  targetRevealed: boolean;
}

export type ReckoningPhase = 'idle' | 'dealing' | 'assigning' | 'ace' | 'switch' | 'burn' | 'double-agent' | 'done';

export interface PendingAce {
  card: Card;
  instanceId: string;
  targetVaultId: 0 | 1 | 2 | 3;
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
  preBuffPhase: 'dealing' | 'assigning' | null;
  switchSource: { vaultId: 0 | 1 | 2 | 3; instanceId: string } | null;
  fuzzyMathActive: boolean;
  offshoreAccountActive: boolean;
  allInActive: boolean;
}

export interface ReckoningActions {
  initGame: (activePerkIds?: string[]) => void;
  flipCard: () => void;
  assignCard: (vaultId: 0 | 1 | 2 | 3) => void;
  chooseAceValue: (value: AceValue) => void;
  standVault: (vaultId: 0 | 1 | 2 | 3) => void;
  activateInsideSwitch: () => void;
  cancelInsideSwitch: () => void;
  completeSwitchMove: (fromVaultId: 0 | 1 | 2 | 3, instanceId: string, toVaultId: 0 | 1 | 2 | 3) => void;
  activateBurnEvidence: () => void;
  cancelBurnEvidence: () => void;
  burnVaultCard: (vaultId: 0 | 1 | 2 | 3, instanceId: string) => void;
  burnCurrentCard: () => void;
  activateDoubleAgent: () => void;
  cancelDoubleAgent: () => void;
  completeDoubleAgent: (vaultId: 0 | 1 | 2 | 3, instanceId: string) => void;
}
