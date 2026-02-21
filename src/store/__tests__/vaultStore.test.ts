import { Card, Rank, Suit } from '../../types/card';
import { Vault } from '../../types/vault';
import { useReckoningStore } from '../vaultStore';

function makeCard(rank: Rank, id: string, suit: Suit = 'spades'): Card {
  return {
    rank,
    suit,
    id: `${rank}-${suit}-${id}`,
  };
}

function makeVault(id: 0 | 1 | 2, target: 13 | 18 | 21): Vault {
  return {
    id,
    target,
    cards: [],
    sum: 0,
    isStood: false,
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
    vaults: [makeVault(0, 13), makeVault(1, 18), makeVault(2, 21)],
    pendingAce: null,
    finalScore: null,
    exactHits: 0,
    busts: 0,
    aceOnes: 0,
    aceElevens: 0,
    ...overrides,
  });
}

describe('vaultStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetStore();
  });

  test('initGame resets counters and creates a fresh dealing state', () => {
    useReckoningStore.setState({
      phase: 'done',
      deck: [makeCard('9', 'seed')],
      currentCard: makeCard('K', 'current'),
      currentInstanceId: 'rec-999',
      pendingAce: { card: makeCard('A', 'pending'), instanceId: 'rec-998', targetVaultId: 1 },
      finalScore: 123,
      exactHits: 2,
      busts: 1,
      aceOnes: 3,
      aceElevens: 4,
    });

    useReckoningStore.getState().initGame();
    const state = useReckoningStore.getState();

    expect(state.phase).toBe('dealing');
    expect(state.deck).toHaveLength(52);
    expect(state.currentCard).toBeNull();
    expect(state.currentInstanceId).toBeNull();
    expect(state.pendingAce).toBeNull();
    expect(state.finalScore).toBeNull();
    expect(state.exactHits).toBe(0);
    expect(state.busts).toBe(0);
    expect(state.aceOnes).toBe(0);
    expect(state.aceElevens).toBe(0);
    expect(state.vaults.map(v => v.target)).toEqual([13, 18, 21]);
    expect(state.vaults.every(v => v.cards.length === 0 && !v.isBusted && !v.isStood)).toBe(true);
  });

  test('flipCard only works while dealing and deck has cards', () => {
    const c1 = makeCard('6', 'd1');
    resetStore({ phase: 'dealing', deck: [c1] });

    useReckoningStore.getState().flipCard();
    let state = useReckoningStore.getState();
    expect(state.phase).toBe('assigning');
    expect(state.currentCard).toEqual(c1);
    expect(state.currentInstanceId).not.toBeNull();
    expect(state.deck).toHaveLength(0);

    const firstId = state.currentInstanceId;
    useReckoningStore.getState().flipCard();
    state = useReckoningStore.getState();
    expect(state.currentInstanceId).toBe(firstId);
    expect(state.currentCard).toEqual(c1);
  });

  test('assignCard with non-ace updates sum and returns to dealing', () => {
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('7', 'c7'),
      currentInstanceId: 'rec-a',
      deck: [makeCard('2', 'deck')],
    });

    useReckoningStore.getState().assignCard(0);
    const state = useReckoningStore.getState();
    const v0 = state.vaults[0];

    expect(state.phase).toBe('dealing');
    expect(state.currentCard).toBeNull();
    expect(state.currentInstanceId).toBeNull();
    expect(v0.sum).toBe(7);
    expect(v0.cards.map(c => c.instanceId)).toEqual(['rec-a']);
    expect(v0.isBusted).toBe(false);
    expect(v0.isStood).toBe(false);
    expect(state.exactHits).toBe(0);
    expect(state.busts).toBe(0);
  });

  test('assignCard transitions to ace phase for aces and chooseAceValue resolves with counters', () => {
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('A', 'ace'),
      currentInstanceId: 'rec-ace',
      deck: [makeCard('9', 'remaining')],
    });

    useReckoningStore.getState().assignCard(1);
    let state = useReckoningStore.getState();
    expect(state.phase).toBe('ace');
    expect(state.pendingAce?.targetVaultId).toBe(1);
    expect(state.currentCard?.rank).toBe('A');

    useReckoningStore.getState().chooseAceValue(11);
    state = useReckoningStore.getState();
    expect(state.phase).toBe('dealing');
    expect(state.pendingAce).toBeNull();
    expect(state.currentCard).toBeNull();
    expect(state.currentInstanceId).toBeNull();
    expect(state.vaults[1].sum).toBe(11);
    expect(state.vaults[1].cards[0].aceValue).toBe(11);
    expect(state.aceElevens).toBe(1);
    expect(state.aceOnes).toBe(0);
  });

  test('assignCard exact-hit auto-stands vault and tracks exactHits', () => {
    const v0 = makeVault(0, 13);
    v0.cards = [{ card: makeCard('8', 'seed'), instanceId: 'seed' }];
    v0.sum = 8;
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('5', 'finisher'),
      currentInstanceId: 'rec-hit',
      vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
    });

    useReckoningStore.getState().assignCard(0);
    const state = useReckoningStore.getState();
    expect(state.vaults[0].sum).toBe(13);
    expect(state.vaults[0].isStood).toBe(true);
    expect(state.vaults[0].isBusted).toBe(false);
    expect(state.exactHits).toBe(1);
  });

  test('assignCard busts vault and increments bust counter', () => {
    const v0 = makeVault(0, 13);
    v0.cards = [{ card: makeCard('10', 'seed'), instanceId: 'seed' }];
    v0.sum = 10;
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('5', 'bust'),
      currentInstanceId: 'rec-bust',
      vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
    });

    useReckoningStore.getState().assignCard(0);
    const state = useReckoningStore.getState();
    expect(state.vaults[0].sum).toBe(15);
    expect(state.vaults[0].isBusted).toBe(true);
    expect(state.vaults[0].isStood).toBe(false);
    expect(state.busts).toBe(1);
  });

  test('assignCard does nothing when target vault is terminal', () => {
    const busted = makeVault(0, 13);
    busted.isBusted = true;
    busted.sum = 20;
    resetStore({
      phase: 'assigning',
      currentCard: makeCard('4', 'ignored'),
      currentInstanceId: 'rec-ignore',
      vaults: [busted, makeVault(1, 18), makeVault(2, 21)],
    });

    useReckoningStore.getState().assignCard(0);
    const state = useReckoningStore.getState();
    expect(state.phase).toBe('assigning');
    expect(state.currentCard?.rank).toBe('4');
    expect(state.vaults[0].sum).toBe(20);
    expect(state.exactHits).toBe(0);
    expect(state.busts).toBe(0);
  });

  test('standVault can end the game and compute finalScore with exact-hit bonus and bust zeroing', () => {
    const v0 = makeVault(0, 13);
    v0.sum = 13;
    v0.isStood = true;
    const v1 = makeVault(1, 18);
    v1.sum = 19;
    v1.isBusted = true;
    const v2 = makeVault(2, 21);
    v2.sum = 7;

    resetStore({
      phase: 'dealing',
      deck: [makeCard('9', 'left')], // game should end from all-terminal, not deck-empty
      vaults: [v0, v1, v2],
    });

    useReckoningStore.getState().standVault(2);
    const state = useReckoningStore.getState();

    expect(state.vaults[2].isStood).toBe(true);
    expect(state.phase).toBe('done');
    expect(state.finalScore).toBe(33); // 13*2 + 0 + 7
  });

  test('deck-empty condition ends game after chooseAceValue', () => {
    const v0 = makeVault(0, 13);
    v0.sum = 2;
    v0.cards = [{ card: makeCard('2', 'seed'), instanceId: 'seed' }];
    resetStore({
      phase: 'ace',
      deck: [],
      vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
      pendingAce: { card: makeCard('A', 'pending'), instanceId: 'rec-pending', targetVaultId: 0 },
    });

    useReckoningStore.getState().chooseAceValue(1);
    const state = useReckoningStore.getState();

    expect(state.vaults[0].sum).toBe(3);
    expect(state.phase).toBe('done');
    expect(state.finalScore).toBe(3);
    expect(state.aceOnes).toBe(1);
  });
});
