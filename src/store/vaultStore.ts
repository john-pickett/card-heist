import { create } from 'zustand';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';
import { useInventoryStore } from './inventoryStore';
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

function effectiveTarget(target: number, fuzzyMathActive: boolean): number {
  return target + (fuzzyMathActive ? 3 : 0);
}

function vaultScore(vault: Vault, allInActive: boolean): number {
  if (vault.isBusted) return 0;
  const multiplier = allInActive ? 2 : 1;
  if (vault.sum === vault.target) return vault.sum * 2 * 10 * multiplier;
  return vault.sum * 10 * multiplier;
}

function isTerminal(vault: Vault): boolean {
  return vault.isBusted || vault.isStood;
}

function makeVaults(includeOffshore = false, allIn = false): Vault[] {
  const targets: VaultTarget[] = allIn ? [26, 36, 42] : [13, 18, 21];
  const base = [0, 1, 2].map((i) => ({
    id: i as 0 | 1 | 2 | 3,
    target: targets[i],
    cards: [],
    sum: 0,
    isStood: false,
    isBusted: false,
    targetRevealed: true,
  }));
  if (!includeOffshore) return base;
  const offshoreTarget: VaultTarget = allIn ? 84 : 42;
  return [...base, { id: 3 as const, target: offshoreTarget, cards: [], sum: 0, isStood: false, isBusted: false, targetRevealed: true }];
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
  fuzzyMathActive: false,
  offshoreAccountActive: false,
  allInActive: false,

  initGame: (activePerkIds: string[] = []) => {
    const inventoryItems = useInventoryStore.getState().items;
    const owns = (id: string) => inventoryItems.some((e) => e.itemId === id);
    const isActive = (id: string) => activePerkIds.includes(id);

    const hasFuzzyMath = owns('fuzzy-math') && isActive('fuzzy-math');
    if (hasFuzzyMath) {
      useInventoryStore.getState().removeItem('fuzzy-math');
    }
    const hasOffshore = owns('offshore-account') && isActive('offshore-account');
    if (hasOffshore) {
      useInventoryStore.getState().removeItem('offshore-account');
    }
    const hasAllIn = owns('all-in') && isActive('all-in');
    if (hasAllIn) {
      useInventoryStore.getState().removeItem('all-in');
    }
    const shuffled = shuffleDeck(createDeck());
    set({
      phase: 'dealing',
      deck: shuffled,
      currentCard: null,
      currentInstanceId: null,
      vaults: makeVaults(hasOffshore, hasAllIn),
      pendingAce: null,
      finalScore: null,
      exactHits: 0,
      busts: 0,
      aceOnes: 0,
      aceElevens: 0,
      preBuffPhase: null,
      switchSource: null,
      fuzzyMathActive: hasFuzzyMath,
      offshoreAccountActive: hasOffshore,
      allInActive: hasAllIn,
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

  assignCard: (vaultId: 0 | 1 | 2 | 3) => {
    const { currentCard, currentInstanceId, vaults, phase, exactHits, busts, fuzzyMathActive } = get();
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
    const threshold = effectiveTarget(vault.target, fuzzyMathActive);
    const isBusted = newSum > threshold;
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
    const { pendingAce, vaults, exactHits, busts, aceOnes, aceElevens, fuzzyMathActive } = get();
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
    const threshold = effectiveTarget(vault.target, fuzzyMathActive);
    const isBusted = newSum > threshold;
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

  standVault: (vaultId: 0 | 1 | 2 | 3) => {
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

  completeSwitchMove: (fromVaultId: 0 | 1 | 2 | 3, instanceId: string, toVaultId: 0 | 1 | 2 | 3) => {
    const { phase, vaults, preBuffPhase, exactHits, busts, fuzzyMathActive } = get();
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
    const fromThreshold = effectiveTarget(fromVault.target, fuzzyMathActive);
    const newFromBusted = newFromSum > fromThreshold;
    const newFromExactHit = !newFromBusted && newFromSum === fromVault.target;

    const newToCards = [...toVault.cards, movingCardEntry];
    const newToSum = computeSum(newToCards);
    const toThreshold = effectiveTarget(toVault.target, fuzzyMathActive);
    const toIsBusted = newToSum > toThreshold;
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

  burnVaultCard: (vaultId: 0 | 1 | 2 | 3, instanceId: string) => {
    const { phase, vaults, preBuffPhase, fuzzyMathActive } = get();
    if (phase !== 'burn') return;

    const vault = vaults[vaultId];
    const found = vault.cards.some((vc) => vc.instanceId === instanceId);
    if (!found) return;

    const newCards = vault.cards.filter((vc) => vc.instanceId !== instanceId);
    const newSum = computeSum(newCards);
    const threshold = effectiveTarget(vault.target, fuzzyMathActive);
    const newBusted = newSum > threshold;
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

  activateDoubleAgent: () => {
    const { phase } = get();
    if (phase !== 'dealing' && phase !== 'assigning') return;
    set({ phase: 'double-agent', preBuffPhase: phase });
  },

  cancelDoubleAgent: () => {
    const { preBuffPhase } = get();
    if (!preBuffPhase) return;
    set({ phase: preBuffPhase, preBuffPhase: null });
  },

  completeDoubleAgent: (vaultId: 0 | 1 | 2 | 3, instanceId: string) => {
    const { vaults, preBuffPhase, fuzzyMathActive } = get();
    const vault = vaults[vaultId];
    const cardIdx = vault.cards.findIndex((vc) => vc.instanceId === instanceId);
    if (cardIdx === -1) return;
    const vc = vault.cards[cardIdx];
    if (vc.card.rank !== 'A') return;

    const current = vc.aceValue ?? 11;
    const next: AceValue = current === 11 ? 1 : 11;

    const newCards = vault.cards.map((c, i) =>
      i === cardIdx ? { ...c, aceValue: next } : c
    );
    const newSum = computeSum(newCards);
    const threshold = effectiveTarget(vault.target, fuzzyMathActive);
    const isBusted = newSum > threshold;
    const isStood = !isBusted && newSum === vault.target;

    const newVaults = vaults.map((v) =>
      v.id === vaultId ? { ...v, cards: newCards, sum: newSum, isBusted, isStood } : v
    );

    set({ vaults: newVaults, phase: preBuffPhase!, preBuffPhase: null });
    checkGameEnd(get, set, newVaults);
  },
}));

function checkGameEnd(
  get: () => ReckoningStore,
  set: (partial: Partial<ReckoningStore>) => void,
  vaults: Vault[]
) {
  const { deck, allInActive } = get();
  const allTerminal = vaults.every(isTerminal);
  const deckEmpty = deck.length === 0;

  if (allTerminal || deckEmpty) {
    const finalScore = vaults.reduce((sum, v) => sum + vaultScore(v, allInActive), 0);
    set({ phase: 'done', finalScore });
  }
}
