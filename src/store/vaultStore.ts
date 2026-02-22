import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';
import {
  AceValue,
  PendingAce,
  ReckoningActions,
  ReckoningPhase,
  ReckoningState,
  Vault,
  VaultCard,
  VaultTarget,
} from '../types/vault';

function cardValue(rank: Rank, aceValue?: AceValue): number {
  if (rank === 'A') return aceValue ?? 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

function computeSum(cards: VaultCard[]): number {
  return cards.reduce((total, vc) => total + cardValue(vc.card.rank, vc.aceValue), 0);
}

function vaultScore(vault: Vault): number {
  if (vault.isBusted) return 0;
  if (vault.sum === vault.target) return vault.sum * 2;
  return vault.sum;
}

function isTerminal(vault: Vault): boolean {
  return vault.isBusted || vault.isStood;
}

const FIXED_TARGETS: VaultTarget[] = [13, 18, 21];

function makeVaults(): Vault[] {
  return [0, 1, 2].map((i) => ({
    id: i as 0 | 1 | 2,
    target: FIXED_TARGETS[i],
    cards: [],
    sum: 0,
    isStood: false,
    isBusted: false,
    targetRevealed: true,
  }));
}

let instanceCounter = 0;
function nextInstanceId(): string {
  return `rec-${++instanceCounter}`;
}

type ReckoningStore = ReckoningState & ReckoningActions;

export const useReckoningStore = create<ReckoningStore>((set, get) => ({
  phase: 'idle' as ReckoningPhase,
  deck: [],
  currentCard: null,
  currentInstanceId: null,
  vaults: makeVaults(),
  pendingAce: null,
  finalScore: null,
  exactHits: 0,
  busts: 0,
  aceOnes: 0,
  aceElevens: 0,
  preBuffPhase: null,
  switchSource: null,

  initGame: () => {
    const shuffled = shuffleDeck(createDeck());
    set({
      phase: 'dealing',
      deck: shuffled,
      currentCard: null,
      currentInstanceId: null,
      vaults: makeVaults(),
      pendingAce: null,
      finalScore: null,
      exactHits: 0,
      busts: 0,
      aceOnes: 0,
      aceElevens: 0,
      preBuffPhase: null,
      switchSource: null,
    });
  },

  flipCard: () => {
    const { deck, phase } = get();
    if (phase !== 'dealing' || deck.length === 0) return;

    const [card, ...rest] = deck;
    const instanceId = nextInstanceId();
    set({
      deck: rest,
      currentCard: card,
      currentInstanceId: instanceId,
      phase: 'assigning',
    });
  },

  assignCard: (vaultId: 0 | 1 | 2) => {
    const { currentCard, currentInstanceId, vaults, phase, exactHits, busts } = get();
    if (phase !== 'assigning' || !currentCard || !currentInstanceId) return;

    const vault = vaults[vaultId];
    if (vault.isBusted || vault.isStood) return;

    if (currentCard.rank === 'A') {
      const pending: PendingAce = {
        card: currentCard,
        instanceId: currentInstanceId,
        targetVaultId: vaultId,
      };
      set({ pendingAce: pending, phase: 'ace' });
      return;
    }

    const vaultCard: VaultCard = {
      card: currentCard,
      instanceId: currentInstanceId,
    };

    const newCards = [...vault.cards, vaultCard];
    const newSum = computeSum(newCards);
    const isBusted = newSum > vault.target;
    const isExactHit = !isBusted && newSum === vault.target;

    const updatedVault: Vault = {
      ...vault,
      cards: newCards,
      sum: newSum,
      isBusted,
      isStood: vault.isStood || isExactHit,
    };

    const newVaults = vaults.map((v) => (v.id === vaultId ? updatedVault : v));
    set({
      vaults: newVaults,
      currentCard: null,
      currentInstanceId: null,
      phase: 'dealing',
      exactHits: isExactHit ? exactHits + 1 : exactHits,
      busts: isBusted ? busts + 1 : busts,
    });

    checkGameEnd(get, set, newVaults);
  },

  chooseAceValue: (value: AceValue) => {
    const { pendingAce, vaults, exactHits, busts, aceOnes, aceElevens } = get();
    if (!pendingAce) return;

    const { card, instanceId, targetVaultId } = pendingAce;
    const vault = vaults[targetVaultId];

    const vaultCard: VaultCard = {
      card,
      instanceId,
      aceValue: value,
    };

    const newCards = [...vault.cards, vaultCard];
    const newSum = computeSum(newCards);
    const isBusted = newSum > vault.target;
    const isExactHit = !isBusted && newSum === vault.target;

    const updatedVault: Vault = {
      ...vault,
      cards: newCards,
      sum: newSum,
      isBusted,
      isStood: vault.isStood || isExactHit,
    };

    const newVaults = vaults.map((v) => (v.id === targetVaultId ? updatedVault : v));
    set({
      vaults: newVaults,
      currentCard: null,
      currentInstanceId: null,
      pendingAce: null,
      phase: 'dealing',
      exactHits: isExactHit ? exactHits + 1 : exactHits,
      busts: isBusted ? busts + 1 : busts,
      aceOnes: value === 1 ? aceOnes + 1 : aceOnes,
      aceElevens: value === 11 ? aceElevens + 1 : aceElevens,
    });

    checkGameEnd(get, set, newVaults);
  },

  standVault: (vaultId: 0 | 1 | 2) => {
    const { vaults } = get();
    const vault = vaults[vaultId];
    if (vault.isBusted || vault.isStood) return;

    const updatedVault: Vault = { ...vault, isStood: true };
    const newVaults = vaults.map((v) => (v.id === vaultId ? updatedVault : v));
    set({ vaults: newVaults });

    checkGameEnd(get, set, newVaults);
  },

  activateInsideSwitch: () => {
    const { phase } = get();
    if (phase !== 'dealing' && phase !== 'assigning') return;
    set({ preBuffPhase: phase, phase: 'switch' });
  },

  cancelInsideSwitch: () => {
    const { preBuffPhase } = get();
    set({ phase: preBuffPhase ?? 'dealing', preBuffPhase: null, switchSource: null });
  },

  completeSwitchMove: (fromVaultId: 0 | 1 | 2, instanceId: string, toVaultId: 0 | 1 | 2) => {
    const { phase, vaults, preBuffPhase, exactHits, busts } = get();
    if (phase !== 'switch') return;
    if (fromVaultId === toVaultId) return;

    const fromVault = vaults[fromVaultId];
    const toVault = vaults[toVaultId];

    if (fromVault.isStood) return;
    if (toVault.isBusted || toVault.isStood) return;

    const movingCardEntry = fromVault.cards.find((vc) => vc.instanceId === instanceId);
    if (!movingCardEntry) return;

    const newFromCards = fromVault.cards.filter((vc) => vc.instanceId !== instanceId);
    const newFromSum = computeSum(newFromCards);
    const newFromBusted = newFromSum > fromVault.target;
    const newFromExactHit = !newFromBusted && newFromSum === fromVault.target;

    const newToCards = [...toVault.cards, movingCardEntry];
    const newToSum = computeSum(newToCards);
    const toIsBusted = newToSum > toVault.target;
    const toIsExactHit = !toIsBusted && newToSum === toVault.target;

    const updatedFromVault: Vault = {
      ...fromVault,
      cards: newFromCards,
      sum: newFromSum,
      isBusted: newFromBusted,
      isStood: newFromExactHit,
    };

    const updatedToVault: Vault = {
      ...toVault,
      cards: newToCards,
      sum: newToSum,
      isBusted: toIsBusted,
      isStood: toIsExactHit,
    };

    const newVaults = vaults.map((v) => {
      if (v.id === fromVaultId) return updatedFromVault;
      if (v.id === toVaultId) return updatedToVault;
      return v;
    });

    set({
      vaults: newVaults,
      phase: preBuffPhase ?? 'dealing',
      preBuffPhase: null,
      switchSource: null,
      exactHits: toIsExactHit ? exactHits + 1 : exactHits,
      busts: toIsBusted ? busts + 1 : busts,
    });

    checkGameEnd(get, set, newVaults);
  },

  activateBurnEvidence: () => {
    const { phase } = get();
    if (phase !== 'dealing' && phase !== 'assigning') return;
    set({ preBuffPhase: phase, phase: 'burn' });
  },

  cancelBurnEvidence: () => {
    const { preBuffPhase } = get();
    set({ phase: preBuffPhase ?? 'dealing', preBuffPhase: null });
  },

  burnVaultCard: (vaultId: 0 | 1 | 2, instanceId: string) => {
    const { phase, vaults, preBuffPhase } = get();
    if (phase !== 'burn') return;

    const vault = vaults[vaultId];
    const found = vault.cards.some((vc) => vc.instanceId === instanceId);
    if (!found) return;

    const newCards = vault.cards.filter((vc) => vc.instanceId !== instanceId);
    const newSum = computeSum(newCards);
    const newBusted = newSum > vault.target;
    const newExactHit = !newBusted && newSum === vault.target;

    const updatedVault: Vault = {
      ...vault,
      cards: newCards,
      sum: newSum,
      isBusted: newBusted,
      isStood: newExactHit,
    };

    const newVaults = vaults.map((v) => (v.id === vaultId ? updatedVault : v));

    set({
      vaults: newVaults,
      phase: preBuffPhase ?? 'dealing',
      preBuffPhase: null,
    });

    checkGameEnd(get, set, newVaults);
  },

  burnCurrentCard: () => {
    const { phase, currentCard } = get();
    if (phase !== 'burn') return;
    if (currentCard === null) return;
    set({ currentCard: null, currentInstanceId: null, phase: 'dealing', preBuffPhase: null });
  },
}));

function checkGameEnd(
  get: () => ReckoningStore,
  set: (partial: Partial<ReckoningStore>) => void,
  vaults: Vault[]
) {
  const { deck } = get();
  const allTerminal = vaults.every(isTerminal);
  const deckEmpty = deck.length === 0;

  if (allTerminal || deckEmpty) {
    const finalScore = vaults.reduce((sum, v) => sum + vaultScore(v), 0);
    set({ phase: 'done', finalScore });
  }
}
