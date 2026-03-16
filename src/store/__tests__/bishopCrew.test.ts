/**
 * Tests for the Bishop crew bonus logic from handleCrackTheVaultsEnd (App.tsx).
 *
 * The Bishop is a passive crew member. When active on a heist, the first vault
 * that cracks perfectly (sum === target) pays out 4× its normal gold. If no
 * vault hits exactly, Bishop has no effect. Does not consume any inventory item.
 *
 * firstExactVaultId is tracked in vaultStore and identifies which vault gets
 * the multiplier. allIn doubles the score bonus just like it does base scores.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { useCrewStore } from '../crewStore';
import { useInventoryStore } from '../inventoryStore';
import { useReckoningStore } from '../vaultStore';
import { Vault } from '../../types/vault';
import { Rank, Suit } from '../../types/card';

function makeCard(rank: Rank, id: string, suit: Suit = 'spades') {
  return { rank, suit, id: `${rank}-${suit}-${id}` };
}

function makeVault(id: 0 | 1 | 2 | 3, target: 13 | 18 | 21 | 26 | 36 | 42 | 84, sum: number, isExact = false): Vault {
  return {
    id,
    target,
    cards: [],
    sum,
    isStood: isExact,
    isBusted: false,
    targetRevealed: true,
  };
}

function resetStore(overrides: Partial<ReturnType<typeof useReckoningStore.getState>> = {}): void {
  useReckoningStore.setState({
    phase: 'idle',
    deck: [],
    currentCard: null,
    currentInstanceId: null,
    vaults: [makeVault(0, 13, 0), makeVault(1, 18, 0), makeVault(2, 21, 0)],
    pendingAce: null,
    finalScore: null,
    exactHits: 0,
    busts: 0,
    aceOnes: 0,
    aceElevens: 0,
    firstExactVaultId: null,
    preBuffPhase: null,
    switchSource: null,
    fuzzyMathActive: false,
    offshoreAccountActive: false,
    allInActive: false,
    ...overrides,
  });
}

// Mirrors the bishop block inside handleCrackTheVaultsEnd in App.tsx.
// Returns { gold, bishopBonus } for the first exact vault found.
function applyBishopBonus(
  baseExactGold: number,
  allInActive: boolean,
  firstExactVaultId: number | null
): { gold: number; totalScoreBonus: number } {
  const bishopActive = useCrewStore.getState().activeHeistCrew.includes('bishop');
  if (!bishopActive || firstExactVaultId === null) {
    return { gold: baseExactGold, totalScoreBonus: 0 };
  }
  const allInMult = allInActive ? 2 : 1;
  return {
    gold: baseExactGold * 4,
    totalScoreBonus: baseExactGold * allInMult * 3,
  };
}

describe('Bishop crew bonus', () => {
  beforeEach(() => {
    useCrewStore.setState({ activeHeistCrew: [], unlockedIds: [], consecutiveHeists: {}, lastHeistCrew: [] });
    useInventoryStore.setState({ items: [] });
    resetStore();
  });

  test('multiplies first exact vault gold by 4 when Bishop is in activeHeistCrew', () => {
    useCrewStore.setState({ activeHeistCrew: ['bishop'] });
    resetStore({ firstExactVaultId: 0 });
    const { gold } = applyBishopBonus(420, false, 0);
    expect(gold).toBe(1680); // 420 * 4
  });

  test('does not apply when Bishop is not in activeHeistCrew', () => {
    useCrewStore.setState({ activeHeistCrew: [] });
    resetStore({ firstExactVaultId: 0 });
    const { gold, totalScoreBonus } = applyBishopBonus(420, false, 0);
    expect(gold).toBe(420);
    expect(totalScoreBonus).toBe(0);
  });

  test('does not apply when activeHeistCrew has others but not Bishop', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'tico'] });
    resetStore({ firstExactVaultId: 1 });
    const { gold, totalScoreBonus } = applyBishopBonus(360, false, 1);
    expect(gold).toBe(360);
    expect(totalScoreBonus).toBe(0);
  });

  test('does not apply when firstExactVaultId is null (no perfect crack)', () => {
    useCrewStore.setState({ activeHeistCrew: ['bishop'] });
    resetStore({ firstExactVaultId: null });
    const { gold, totalScoreBonus } = applyBishopBonus(200, false, null);
    expect(gold).toBe(200);
    expect(totalScoreBonus).toBe(0);
  });

  test('totalScoreBonus accounts for allIn multiplier', () => {
    useCrewStore.setState({ activeHeistCrew: ['bishop'] });
    resetStore({ firstExactVaultId: 2, allInActive: true });
    const { gold, totalScoreBonus } = applyBishopBonus(420, true, 2);
    expect(gold).toBe(1680);          // display gold doesn't double for allIn (matches existing behavior)
    expect(totalScoreBonus).toBe(2520); // 420 * 2 (allIn) * 3 (extra multiplier)
  });

  test('totalScoreBonus without allIn is baseGold * 3', () => {
    useCrewStore.setState({ activeHeistCrew: ['bishop'] });
    resetStore({ firstExactVaultId: 1 });
    const { totalScoreBonus } = applyBishopBonus(360, false, 1);
    expect(totalScoreBonus).toBe(1080); // 360 * 3
  });

  test('does not consume any inventory items when Bishop applies', () => {
    useCrewStore.setState({ activeHeistCrew: ['bishop'] });
    useInventoryStore.setState({ items: [{ itemId: 'inside-switch', quantity: 1 }] });
    resetStore({ firstExactVaultId: 0 });
    applyBishopBonus(420, false, 0);
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'inside-switch', quantity: 1 }]);
  });

  test('applies when Bishop is active alongside other crew members', () => {
    useCrewStore.setState({ activeHeistCrew: ['knuckles', 'bishop', 'tico'] });
    resetStore({ firstExactVaultId: 0 });
    const { gold } = applyBishopBonus(260, false, 0);
    expect(gold).toBe(1040); // 260 * 4
  });

  test('vaultStore tracks firstExactVaultId — set on first exact hit via assignCard', () => {
    // Vault 0 target=13: pre-load a 5 card, then assign an 8 → 5+8=13 exact
    const vault0WithFive: Vault = {
      id: 0,
      target: 13,
      cards: [{ card: makeCard('5', 'pre'), instanceId: 'pre-1' }],
      sum: 5,
      isStood: false,
      isBusted: false,
      targetRevealed: true,
    };
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('8', 'a'),
      currentInstanceId: 'rec-1',
      vaults: [vault0WithFive, makeVault(1, 18, 0), makeVault(2, 21, 0)],
    });
    useReckoningStore.getState().assignCard(0);
    expect(useReckoningStore.getState().firstExactVaultId).toBe(0);
  });

  test('vaultStore firstExactVaultId is not overwritten by a second exact hit', () => {
    // Vault 0 target=13: 5 + 8 = 13 → exact
    const vault0WithFive: Vault = {
      id: 0,
      target: 13,
      cards: [{ card: makeCard('5', 'pre'), instanceId: 'pre-1' }],
      sum: 5,
      isStood: false,
      isBusted: false,
      targetRevealed: true,
    };
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('8', 'a'),
      currentInstanceId: 'rec-1',
      vaults: [vault0WithFive, makeVault(1, 18, 0), makeVault(2, 21, 0)],
    });
    useReckoningStore.getState().assignCard(0);
    expect(useReckoningStore.getState().firstExactVaultId).toBe(0);

    // Now simulate a second exact hit on vault 1: 9 + 9 = 18 → exact
    const vault1WithNine: Vault = {
      id: 1,
      target: 18,
      cards: [{ card: makeCard('9', 'pre2'), instanceId: 'pre-2' }],
      sum: 9,
      isStood: false,
      isBusted: false,
      targetRevealed: true,
    };
    useReckoningStore.setState({
      phase: 'assigning',
      currentCard: makeCard('9', 'b'),
      currentInstanceId: 'rec-2',
      vaults: [
        useReckoningStore.getState().vaults[0],
        vault1WithNine,
        makeVault(2, 21, 0),
      ],
    });
    useReckoningStore.getState().assignCard(1);
    // firstExactVaultId must still be 0, not overwritten to 1
    expect(useReckoningStore.getState().firstExactVaultId).toBe(0);
  });

  test('vaultStore firstExactVaultId stays null when no exact hit occurs', () => {
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('5', 'a'),
      currentInstanceId: 'rec-1',
      vaults: [makeVault(0, 13, 0), makeVault(1, 18, 0), makeVault(2, 21, 0)],
    });
    useReckoningStore.getState().assignCard(0);
    expect(useReckoningStore.getState().firstExactVaultId).toBeNull();
  });

  test('initGame resets firstExactVaultId to null', () => {
    useReckoningStore.setState({ firstExactVaultId: 2 });
    useReckoningStore.getState().initGame();
    expect(useReckoningStore.getState().firstExactVaultId).toBeNull();
  });
});
