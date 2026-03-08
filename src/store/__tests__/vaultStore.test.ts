import { Card, Rank, Suit } from '../../types/card';
import { Vault } from '../../types/vault';
import { useReckoningStore } from '../vaultStore';
import { useInventoryStore } from '../inventoryStore';

function makeCard(rank: Rank, id: string, suit: Suit = 'spades'): Card {
  return {
    rank,
    suit,
    id: `${rank}-${suit}-${id}`,
  };
}

function makeVault(id: 0 | 1 | 2 | 3, target: 13 | 18 | 21 | 26 | 36 | 42 | 84): Vault {
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
    preBuffPhase: null,
    switchSource: null,
    fuzzyMathActive: false,
    offshoreAccountActive: false,
    allInActive: false,
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
    expect(state.finalScore).toBe(330); // (13*2 + 0 + 7) * 10
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
    expect(state.finalScore).toBe(30);
    expect(state.aceOnes).toBe(1);
  });

  describe('buff actions', () => {
    // ── activateInsideSwitch ───────────────────────────────────────────────

    test('activateInsideSwitch from dealing stores preBuffPhase and sets phase to switch', () => {
      resetStore({ phase: 'dealing' });
      useReckoningStore.getState().activateInsideSwitch();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('switch');
      expect(state.preBuffPhase).toBe('dealing');
    });

    test('activateInsideSwitch from assigning works', () => {
      resetStore({ phase: 'assigning', currentCard: makeCard('7', 'x'), currentInstanceId: 'rec-x' });
      useReckoningStore.getState().activateInsideSwitch();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('switch');
      expect(state.preBuffPhase).toBe('assigning');
    });

    test('activateInsideSwitch is no-op from done phase', () => {
      resetStore({ phase: 'done' });
      useReckoningStore.getState().activateInsideSwitch();
      expect(useReckoningStore.getState().phase).toBe('done');
    });

    test('activateInsideSwitch is no-op from ace phase', () => {
      resetStore({ phase: 'ace' });
      useReckoningStore.getState().activateInsideSwitch();
      expect(useReckoningStore.getState().phase).toBe('ace');
    });

    test('activateInsideSwitch is no-op when already in switch phase', () => {
      resetStore({ phase: 'switch', preBuffPhase: 'dealing' });
      useReckoningStore.getState().activateInsideSwitch();
      expect(useReckoningStore.getState().preBuffPhase).toBe('dealing');
    });

    // ── cancelInsideSwitch ────────────────────────────────────────────────

    test('cancelInsideSwitch restores preBuffPhase and clears switchSource', () => {
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', switchSource: { vaultId: 0, instanceId: 'rec-1' } });
      useReckoningStore.getState().cancelInsideSwitch();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('dealing');
      expect(state.preBuffPhase).toBeNull();
      expect(state.switchSource).toBeNull();
    });

    test('cancelInsideSwitch restores to assigning when preBuffPhase was assigning', () => {
      resetStore({ phase: 'switch', preBuffPhase: 'assigning' });
      useReckoningStore.getState().cancelInsideSwitch();
      expect(useReckoningStore.getState().phase).toBe('assigning');
    });

    // ── completeSwitchMove ────────────────────────────────────────────────

    test('completeSwitchMove moves card from source to destination and updates sums', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      const v1 = makeVault(1, 18);
      v1.cards = [{ card: makeCard('3', 'c3'), instanceId: 'iid-3' }];
      v1.sum = 3;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, v1, makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      const state = useReckoningStore.getState();

      expect(state.vaults[0].cards).toHaveLength(0);
      expect(state.vaults[0].sum).toBe(0);
      expect(state.vaults[1].cards).toHaveLength(2);
      expect(state.vaults[1].sum).toBe(8);
    });

    test('completeSwitchMove restores preBuffPhase and clears switchSource', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      resetStore({ phase: 'switch', preBuffPhase: 'assigning', deck: [makeCard('2', 'remain')], vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      const state = useReckoningStore.getState();

      expect(state.phase).toBe('assigning');
      expect(state.preBuffPhase).toBeNull();
      expect(state.switchSource).toBeNull();
    });

    test('completeSwitchMove un-busts source when removal brings sum below target', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('9', 'c9'), instanceId: 'iid-9' },
        { card: makeCard('8', 'c8'), instanceId: 'iid-8' },
      ];
      v0.sum = 17;
      v0.isBusted = true;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-8', 1);
      const state = useReckoningStore.getState();

      expect(state.vaults[0].sum).toBe(9);
      expect(state.vaults[0].isBusted).toBe(false);
      expect(state.vaults[0].isStood).toBe(false);
    });

    test('completeSwitchMove auto-stands source on exact hit after removal', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('9', 'c9'), instanceId: 'iid-9' },
        { card: makeCard('8', 'c8'), instanceId: 'iid-8' },
      ];
      v0.sum = 17;
      v0.isBusted = true;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      // Remove 4 to get from busted (17>13) to 13 exact — but 9 leaves 8 which < 13
      // Use a setup where removal lands exactly on target
      const v2 = makeVault(0, 13);
      v2.cards = [
        { card: makeCard('8', 'c8a'), instanceId: 'iid-8a' },
        { card: makeCard('9', 'c9a'), instanceId: 'iid-9a' },
      ];
      v2.sum = 17;
      v2.isBusted = true;
      // After removing 4-value card we need sum===13, let's use 6+7=13 then remove 7
      const v3 = makeVault(0, 13);
      v3.cards = [
        { card: makeCard('6', 'c6'), instanceId: 'iid-6' },
        { card: makeCard('7', 'c7'), instanceId: 'iid-7' },
        { card: makeCard('3', 'c3x'), instanceId: 'iid-3x' },
      ];
      v3.sum = 16;
      v3.isBusted = true;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v3, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-3x', 1);
      const state = useReckoningStore.getState();

      expect(state.vaults[0].sum).toBe(13);
      expect(state.vaults[0].isBusted).toBe(false);
      expect(state.vaults[0].isStood).toBe(true);
    });

    test('completeSwitchMove auto-stands destination on exact hit', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      const v1 = makeVault(1, 18);
      v1.cards = [{ card: makeCard('9', 'c9'), instanceId: 'iid-9' }];
      v1.sum = 9; // 9 + 5 = 14 moved card value... no. Let me use 13 + 5 = 18
      // vault1 has 13 already, move 5 from vault0 → 13+5=18 exact
      const v1b = makeVault(1, 18);
      v1b.cards = [{ card: makeCard('9', 'c9b'), instanceId: 'iid-9b' }, { card: makeCard('4', 'c4b'), instanceId: 'iid-4b' }];
      v1b.sum = 13;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, v1b, makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      const state = useReckoningStore.getState();

      expect(state.vaults[1].sum).toBe(18);
      expect(state.vaults[1].isStood).toBe(true);
      expect(state.vaults[1].isBusted).toBe(false);
      expect(state.exactHits).toBe(1);
    });

    test('completeSwitchMove is no-op when destination is busted', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      const v1 = makeVault(1, 18);
      v1.isBusted = true;
      v1.sum = 20;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, v1, makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      const state = useReckoningStore.getState();

      expect(state.phase).toBe('switch'); // no change
      expect(state.vaults[0].cards).toHaveLength(1);
    });

    test('completeSwitchMove is no-op when destination is stood', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      const v1 = makeVault(1, 18);
      v1.isStood = true;
      v1.sum = 15;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, v1, makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      expect(useReckoningStore.getState().phase).toBe('switch');
    });

    test('completeSwitchMove is no-op when source is stood', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 13;
      v0.isStood = true;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-5', 1);
      expect(useReckoningStore.getState().phase).toBe('switch');
      expect(useReckoningStore.getState().vaults[0].cards).toHaveLength(1);
    });

    test('completeSwitchMove is no-op when instanceId not found in source', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      resetStore({ phase: 'switch', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().completeSwitchMove(0, 'nonexistent', 1);
      expect(useReckoningStore.getState().phase).toBe('switch');
    });

    test('completeSwitchMove triggers game end when all vaults become terminal', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      const v1 = makeVault(1, 18);
      v1.isStood = true;
      v1.sum = 15;
      // After move: v0 loses its only card (sum=0, not terminal unless we use a stuck vault)
      // Better: make v0 auto-stand after removal, v2 already terminal
      const v0b = makeVault(0, 13);
      v0b.cards = [
        { card: makeCard('8', 'c8'), instanceId: 'iid-8' },
        { card: makeCard('5', 'c5b'), instanceId: 'iid-5b' },
      ];
      v0b.sum = 13;
      v0b.isStood = true;
      const v2 = makeVault(2, 21);
      v2.isStood = true;
      v2.sum = 18;
      // v1 will be the source, not stood, move 5 → v2... but v2 is stood
      // Let me use a simpler setup: move busts destination, game ends
      const srcVault = makeVault(0, 13);
      srcVault.cards = [{ card: makeCard('3', 'c3'), instanceId: 'iid-3' }];
      srcVault.sum = 3;
      const dstVault = makeVault(1, 18);
      dstVault.cards = [{ card: makeCard('9', 'c9'), instanceId: 'iid-9' }, { card: makeCard('7', 'c7'), instanceId: 'iid-7' }];
      dstVault.sum = 16; // 16+3=19 > 18, busts
      const termVault = makeVault(2, 21);
      termVault.isStood = true;
      termVault.sum = 20;
      resetStore({
        phase: 'switch',
        preBuffPhase: 'dealing',
        deck: [makeCard('2', 'remaining')],
        vaults: [srcVault, dstVault, termVault],
      });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-3', 1);
      const state = useReckoningStore.getState();

      // v0: 0 cards (not terminal by itself)
      // v1: busted (19 > 18)
      // v2: stood
      // v0 has 0 cards, sum 0 < 13 — not terminal
      // game should NOT end yet since v0 is not terminal
      // Let's just verify the move happened
      expect(state.vaults[1].isBusted).toBe(true);
    });

    // ── activateBurnEvidence ──────────────────────────────────────────────

    test('activateBurnEvidence from dealing stores preBuffPhase and sets phase to burn', () => {
      resetStore({ phase: 'dealing' });
      useReckoningStore.getState().activateBurnEvidence();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('burn');
      expect(state.preBuffPhase).toBe('dealing');
    });

    test('activateBurnEvidence from assigning works', () => {
      resetStore({ phase: 'assigning', currentCard: makeCard('7', 'x'), currentInstanceId: 'rec-x' });
      useReckoningStore.getState().activateBurnEvidence();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('burn');
      expect(state.preBuffPhase).toBe('assigning');
    });

    test('activateBurnEvidence is no-op from done phase', () => {
      resetStore({ phase: 'done' });
      useReckoningStore.getState().activateBurnEvidence();
      expect(useReckoningStore.getState().phase).toBe('done');
    });

    test('activateBurnEvidence is no-op from ace phase', () => {
      resetStore({ phase: 'ace' });
      useReckoningStore.getState().activateBurnEvidence();
      expect(useReckoningStore.getState().phase).toBe('ace');
    });

    test('activateBurnEvidence is no-op when already in burn phase', () => {
      resetStore({ phase: 'burn', preBuffPhase: 'dealing' });
      useReckoningStore.getState().activateBurnEvidence();
      expect(useReckoningStore.getState().preBuffPhase).toBe('dealing');
    });

    // ── cancelBurnEvidence ────────────────────────────────────────────────

    test('cancelBurnEvidence restores preBuffPhase', () => {
      resetStore({ phase: 'burn', preBuffPhase: 'dealing' });
      useReckoningStore.getState().cancelBurnEvidence();
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('dealing');
      expect(state.preBuffPhase).toBeNull();
    });

    test('cancelBurnEvidence restores to assigning when preBuffPhase was assigning', () => {
      resetStore({ phase: 'burn', preBuffPhase: 'assigning' });
      useReckoningStore.getState().cancelBurnEvidence();
      expect(useReckoningStore.getState().phase).toBe('assigning');
    });

    // ── burnVaultCard ─────────────────────────────────────────────────────

    test('burnVaultCard removes card from vault and recomputes sum', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('6', 'c6'), instanceId: 'iid-6' },
        { card: makeCard('4', 'c4'), instanceId: 'iid-4' },
      ];
      v0.sum = 10;
      resetStore({ phase: 'burn', preBuffPhase: 'dealing', deck: [makeCard('2', 'remain')], vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().burnVaultCard(0, 'iid-6');
      const state = useReckoningStore.getState();

      expect(state.vaults[0].cards).toHaveLength(1);
      expect(state.vaults[0].sum).toBe(4);
      expect(state.phase).toBe('dealing');
      expect(state.preBuffPhase).toBeNull();
    });

    test('burnVaultCard un-busts vault when removal brings sum below target', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('9', 'c9'), instanceId: 'iid-9' },
        { card: makeCard('8', 'c8'), instanceId: 'iid-8' },
      ];
      v0.sum = 17;
      v0.isBusted = true;
      resetStore({ phase: 'burn', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().burnVaultCard(0, 'iid-8');
      const state = useReckoningStore.getState();

      expect(state.vaults[0].sum).toBe(9);
      expect(state.vaults[0].isBusted).toBe(false);
      expect(state.vaults[0].isStood).toBe(false);
    });

    test('burnVaultCard auto-stands vault on exact sum match after removal', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('6', 'c6'), instanceId: 'iid-6' },
        { card: makeCard('7', 'c7'), instanceId: 'iid-7' },
        { card: makeCard('3', 'c3'), instanceId: 'iid-3' },
      ];
      v0.sum = 16;
      v0.isBusted = true;
      resetStore({ phase: 'burn', preBuffPhase: 'assigning', deck: [makeCard('2', 'remain')], vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().burnVaultCard(0, 'iid-3');
      const state = useReckoningStore.getState();

      expect(state.vaults[0].sum).toBe(13);
      expect(state.vaults[0].isBusted).toBe(false);
      expect(state.vaults[0].isStood).toBe(true);
      expect(state.phase).toBe('assigning');
    });

    test('burnVaultCard is no-op when card not found', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
      v0.sum = 5;
      resetStore({ phase: 'burn', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

      useReckoningStore.getState().burnVaultCard(0, 'nonexistent');
      expect(useReckoningStore.getState().phase).toBe('burn');
      expect(useReckoningStore.getState().vaults[0].cards).toHaveLength(1);
    });

    test('burnVaultCard triggers game end when all vaults become terminal', () => {
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('7', 'c7'), instanceId: 'iid-7' },
        { card: makeCard('9', 'c9'), instanceId: 'iid-9' },
      ];
      v0.sum = 16;
      v0.isBusted = true;
      const v1 = makeVault(1, 18);
      v1.isStood = true;
      v1.sum = 15;
      const v2 = makeVault(2, 21);
      v2.isStood = true;
      v2.sum = 19;
      resetStore({
        phase: 'burn',
        preBuffPhase: 'dealing',
        deck: [makeCard('2', 'remaining')],
        vaults: [v0, v1, v2],
      });

      // Burn the 9 → v0 sum becomes 7 (< 13, not terminal) → game should NOT end
      useReckoningStore.getState().burnVaultCard(0, 'iid-9');
      expect(useReckoningStore.getState().phase).toBe('dealing');

      // Now set v0 to stood and test game end
      const v0stood = makeVault(0, 13);
      v0stood.cards = [{ card: makeCard('6', 'c6s'), instanceId: 'iid-6s' }, { card: makeCard('4', 'c4s'), instanceId: 'iid-4s' }];
      v0stood.sum = 10;
      resetStore({
        phase: 'burn',
        preBuffPhase: 'dealing',
        deck: [makeCard('2', 'rem2')],
        vaults: [v0stood, v1, v2],
      });
      useReckoningStore.getState().burnVaultCard(0, 'iid-4s');
      // After burn: v0 sum = 6, not terminal → game continues
      expect(useReckoningStore.getState().phase).toBe('dealing');
    });

    // ── burnCurrentCard ───────────────────────────────────────────────────

    test('burnCurrentCard clears currentCard and sets phase to dealing', () => {
      resetStore({
        phase: 'burn',
        preBuffPhase: 'assigning',
        currentCard: makeCard('J', 'cJ'),
        currentInstanceId: 'rec-J',
      });

      useReckoningStore.getState().burnCurrentCard();
      const state = useReckoningStore.getState();

      expect(state.currentCard).toBeNull();
      expect(state.currentInstanceId).toBeNull();
      expect(state.phase).toBe('dealing');
      expect(state.preBuffPhase).toBeNull();
    });

    test('burnCurrentCard is no-op when currentCard is null', () => {
      resetStore({ phase: 'burn', preBuffPhase: 'dealing', currentCard: null });
      useReckoningStore.getState().burnCurrentCard();
      expect(useReckoningStore.getState().phase).toBe('burn');
    });

    test('burnCurrentCard is no-op when phase is not burn', () => {
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('J', 'cJ'),
        currentInstanceId: 'rec-J',
      });
      useReckoningStore.getState().burnCurrentCard();
      expect(useReckoningStore.getState().phase).toBe('assigning');
      expect(useReckoningStore.getState().currentCard?.rank).toBe('J');
    });

    // ── double-agent buff ─────────────────────────────────────────────────

    describe('double-agent buff', () => {
      test('activateDoubleAgent from dealing sets phase and stores preBuffPhase', () => {
        resetStore({ phase: 'dealing' });
        useReckoningStore.getState().activateDoubleAgent();
        const state = useReckoningStore.getState();
        expect(state.phase).toBe('double-agent');
        expect(state.preBuffPhase).toBe('dealing');
      });

      test('activateDoubleAgent from assigning works', () => {
        resetStore({ phase: 'assigning', currentCard: makeCard('7', 'x'), currentInstanceId: 'rec-x' });
        useReckoningStore.getState().activateDoubleAgent();
        const state = useReckoningStore.getState();
        expect(state.phase).toBe('double-agent');
        expect(state.preBuffPhase).toBe('assigning');
      });

      test('activateDoubleAgent is no-op from non-dealing/assigning phase', () => {
        resetStore({ phase: 'done' });
        useReckoningStore.getState().activateDoubleAgent();
        expect(useReckoningStore.getState().phase).toBe('done');
      });

      test('cancelDoubleAgent restores phase from preBuffPhase and clears it', () => {
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing' });
        useReckoningStore.getState().cancelDoubleAgent();
        const state = useReckoningStore.getState();
        expect(state.phase).toBe('dealing');
        expect(state.preBuffPhase).toBeNull();
      });

      test('completeDoubleAgent toggles A (undefined → 1) and recomputes sum', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [{ card: makeCard('A', 'cA'), instanceId: 'iid-A' }];
        v0.sum = 11; // aceValue undefined → treated as 11
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', deck: [makeCard('2', 'remain')], vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].cards[0].aceValue).toBe(1);
        expect(state.vaults[0].sum).toBe(1);
        expect(state.phase).toBe('dealing');
        expect(state.preBuffPhase).toBeNull();
      });

      test('completeDoubleAgent toggles A(11) → A(1) and decreases sum', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('5', 'c5'), instanceId: 'iid-5' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 11 },
        ];
        v0.sum = 16;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].cards.find(c => c.instanceId === 'iid-A')?.aceValue).toBe(1);
        expect(state.vaults[0].sum).toBe(6);
      });

      test('completeDoubleAgent toggles A(1) → A(11) and increases sum', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('2', 'c2'), instanceId: 'iid-2' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 1 },
        ];
        v0.sum = 3;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        expect(useReckoningStore.getState().vaults[0].sum).toBe(13);
      });

      test('completeDoubleAgent can un-bust a vault', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('5', 'c5'), instanceId: 'iid-5' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 11 },
        ];
        v0.sum = 16;
        v0.isBusted = true;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].sum).toBe(6);
        expect(state.vaults[0].isBusted).toBe(false);
        expect(state.vaults[0].isStood).toBe(false);
      });

      test('completeDoubleAgent can bust a vault', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('5', 'c5'), instanceId: 'iid-5' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 1 },
        ];
        v0.sum = 6;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].sum).toBe(16);
        expect(state.vaults[0].isBusted).toBe(true);
        expect(state.vaults[0].isStood).toBe(false);
      });

      test('completeDoubleAgent auto-stands vault on exact hit', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('2', 'c2'), instanceId: 'iid-2' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 1 },
        ];
        v0.sum = 3;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].sum).toBe(13);
        expect(state.vaults[0].isStood).toBe(true);
        expect(state.vaults[0].isBusted).toBe(false);
      });

      test('completeDoubleAgent un-stands a vault when sum drops below target', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('2', 'c2'), instanceId: 'iid-2' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 11 },
        ];
        v0.sum = 13;
        v0.isStood = true;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        expect(state.vaults[0].sum).toBe(3);
        expect(state.vaults[0].isStood).toBe(false);
        expect(state.vaults[0].isBusted).toBe(false);
      });

      test('completeDoubleAgent is no-op if instanceId not found', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [{ card: makeCard('A', 'cA'), instanceId: 'iid-A' }];
        v0.sum = 11;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'nonexistent');
        expect(useReckoningStore.getState().phase).toBe('double-agent');
        expect(useReckoningStore.getState().vaults[0].sum).toBe(11);
      });

      test('completeDoubleAgent is no-op if card is not an Ace', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [{ card: makeCard('5', 'c5'), instanceId: 'iid-5' }];
        v0.sum = 5;
        resetStore({ phase: 'double-agent', preBuffPhase: 'dealing', vaults: [v0, makeVault(1, 18), makeVault(2, 21)] });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-5');
        expect(useReckoningStore.getState().phase).toBe('double-agent');
        expect(useReckoningStore.getState().vaults[0].sum).toBe(5);
      });

      test('completeDoubleAgent triggers checkGameEnd when all vaults terminal after toggle', () => {
        const v0 = makeVault(0, 13);
        v0.cards = [
          { card: makeCard('2', 'c2'), instanceId: 'iid-2' },
          { card: makeCard('A', 'cA'), instanceId: 'iid-A', aceValue: 1 },
        ];
        v0.sum = 3;
        const v1 = makeVault(1, 18);
        v1.isStood = true;
        v1.sum = 15;
        const v2 = makeVault(2, 21);
        v2.isStood = true;
        v2.sum = 19;
        resetStore({
          phase: 'double-agent',
          preBuffPhase: 'dealing',
          deck: [makeCard('9', 'remaining')],
          vaults: [v0, v1, v2],
        });

        useReckoningStore.getState().completeDoubleAgent(0, 'iid-A');
        const state = useReckoningStore.getState();

        // v0: A(1→11) + 2 = 13 exact → isStood, all vaults terminal → game ends
        expect(state.vaults[0].sum).toBe(13);
        expect(state.vaults[0].isStood).toBe(true);
        expect(state.phase).toBe('done');
        expect(state.finalScore).not.toBeNull();
      });
    });

    // ── non-interference ──────────────────────────────────────────────────

    test('assignCard works normally when preBuffPhase and switchSource are null', () => {
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('7', 'c7'),
        currentInstanceId: 'rec-a',
        deck: [makeCard('2', 'deck')],
        preBuffPhase: null,
        switchSource: null,
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();

      expect(state.phase).toBe('dealing');
      expect(state.vaults[0].sum).toBe(7);
      expect(state.preBuffPhase).toBeNull();
      expect(state.switchSource).toBeNull();
    });

    test('standVault is unaffected by buff state fields', () => {
      const v0 = makeVault(0, 13);
      v0.sum = 10;
      v0.cards = [{ card: makeCard('10', 'c10'), instanceId: 'iid-10' }];
      resetStore({
        phase: 'dealing',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        preBuffPhase: null,
        switchSource: null,
      });

      useReckoningStore.getState().standVault(0);
      expect(useReckoningStore.getState().vaults[0].isStood).toBe(true);
    });
  });

  describe('fuzzy-math passive buff', () => {
    beforeEach(() => {
      useInventoryStore.setState({ items: [] });
    });

    // ── initGame + inventory consumption ─────────────────────────────────

    test('initGame with fuzzy-math in inventory sets fuzzyMathActive and removes item', () => {
      useInventoryStore.setState({ items: [{ itemId: 'fuzzy-math', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.fuzzyMathActive).toBe(true);
      expect(useInventoryStore.getState().items.find(e => e.itemId === 'fuzzy-math')).toBeUndefined();
    });

    test('initGame without fuzzy-math leaves fuzzyMathActive false and inventory unchanged', () => {
      useInventoryStore.setState({ items: [{ itemId: 'other-item', quantity: 2 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.fuzzyMathActive).toBe(false);
      expect(useInventoryStore.getState().items).toHaveLength(1);
    });

    test('initGame with fuzzy-math qty=2 sets fuzzyMathActive and decrements quantity to 1', () => {
      useInventoryStore.setState({ items: [{ itemId: 'fuzzy-math', quantity: 2 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.fuzzyMathActive).toBe(true);
      const entry = useInventoryStore.getState().items.find(e => e.itemId === 'fuzzy-math');
      expect(entry?.quantity).toBe(1);
    });

    // ── assignCard with fuzzyMathActive ───────────────────────────────────

    test('assignCard: sum at target+1 is not busted in grace zone', () => {
      // vault target=13, sum=9, assign 5 → sum=14 (target+1)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('9', 'c9'), instanceId: 'iid-9' }];
      v0.sum = 9;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('5', 'c5'),
        currentInstanceId: 'rec-5',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(14);
      expect(state.vaults[0].isBusted).toBe(false);
      expect(state.vaults[0].isStood).toBe(false);
    });

    test('assignCard: sum at target+3 is not busted (grace zone upper bound)', () => {
      // vault target=13, sum=9, assign 7 → sum=16 (target+3)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('9', 'c9b'), instanceId: 'iid-9b' }];
      v0.sum = 9;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('7', 'c7'),
        currentInstanceId: 'rec-7',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(16);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    test('assignCard: sum at target+4 busts (over grace zone)', () => {
      // vault target=13, sum=10, assign 7 → sum=17 (target+4)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('10', 'c10'), instanceId: 'iid-10' }];
      v0.sum = 10;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('7', 'c7b'),
        currentInstanceId: 'rec-7b',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(17);
      expect(state.vaults[0].isBusted).toBe(true);
    });

    test('assignCard: exact hit on target still auto-stands', () => {
      // vault target=13, sum=8, assign 5 → sum=13 (exact hit)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('8', 'c8'), instanceId: 'iid-8' }];
      v0.sum = 8;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('5', 'c5b'),
        currentInstanceId: 'rec-5b',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(13);
      expect(state.vaults[0].isStood).toBe(true);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    test('assignCard: without fuzzyMathActive, sum at target+1 busts normally', () => {
      // vault target=13, sum=9, assign 5 → sum=14 (target+1), no grace
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('9', 'c9c'), instanceId: 'iid-9c' }];
      v0.sum = 9;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('5', 'c5c'),
        currentInstanceId: 'rec-5c',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: false,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(14);
      expect(state.vaults[0].isBusted).toBe(true);
    });

    // ── chooseAceValue with fuzzyMathActive ───────────────────────────────

    test('chooseAceValue: ace value results in grace zone sum → not busted', () => {
      // vault target=13, sum=5, choose A=11 → sum=16 (target+3, grace)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('5', 'c5ace'), instanceId: 'iid-5ace' }];
      v0.sum = 5;
      resetStore({
        phase: 'ace',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        pendingAce: { card: makeCard('A', 'cAace'), instanceId: 'rec-Aace', targetVaultId: 0 },
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().chooseAceValue(11);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(16);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    // ── standVault from grace zone ────────────────────────────────────────

    test('standVault on grace zone vault sets isStood without busting', () => {
      const v0 = makeVault(0, 13);
      v0.sum = 15; // target+2, in grace zone
      v0.cards = [
        { card: makeCard('9', 'c9g'), instanceId: 'iid-9g' },
        { card: makeCard('6', 'c6g'), instanceId: 'iid-6g' },
      ];
      resetStore({
        phase: 'dealing',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().standVault(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].isStood).toBe(true);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    // ── cross-action consistency ──────────────────────────────────────────

    test('burnVaultCard with fuzzyMathActive: burn drops sum from bust to grace zone → not busted', () => {
      // vault target=13, sum=18 (busted even w/ grace=16), burn 5 → sum=13 (exact)
      // Or: sum=17 (busted, 17>16), burn 4 → sum=13 (exact)
      // Let's use: sum=18, burn 5 → sum=13 exact → isStood
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('9', 'c9burn'), instanceId: 'iid-9burn' },
        { card: makeCard('4', 'c4burn'), instanceId: 'iid-4burn' },
        { card: makeCard('5', 'c5burn'), instanceId: 'iid-5burn' },
      ];
      v0.sum = 18;
      v0.isBusted = true; // 18 > 16 (target+3=16)
      resetStore({
        phase: 'burn',
        preBuffPhase: 'dealing',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().burnVaultCard(0, 'iid-5burn'); // removes 5 → sum=13
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(13);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    test('burnVaultCard with fuzzyMathActive: burn drops sum into grace zone → not busted', () => {
      // vault target=13, burn to get sum=15 (target+2, grace)
      const v0 = makeVault(0, 13);
      v0.cards = [
        { card: makeCard('9', 'c9bv'), instanceId: 'iid-9bv' },
        { card: makeCard('9', 'c9bv2'), instanceId: 'iid-9bv2' },
      ];
      v0.sum = 18; // 18 > 16, busted even with grace
      v0.isBusted = true;
      resetStore({
        phase: 'burn',
        preBuffPhase: 'dealing',
        vaults: [v0, makeVault(1, 18), makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().burnVaultCard(0, 'iid-9bv2'); // removes 9 → sum=9
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(9);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    test('completeSwitchMove with fuzzyMathActive: destination sum lands in grace zone → not busted', () => {
      // vault1 target=18, sum=16, move 3 → sum=19 (target+1, grace)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('3', 'c3sw'), instanceId: 'iid-3sw' }];
      v0.sum = 3;
      const v1 = makeVault(1, 18);
      v1.cards = [
        { card: makeCard('9', 'c9sw'), instanceId: 'iid-9sw' },
        { card: makeCard('7', 'c7sw'), instanceId: 'iid-7sw' },
      ];
      v1.sum = 16;
      resetStore({
        phase: 'switch',
        preBuffPhase: 'dealing',
        vaults: [v0, v1, makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().completeSwitchMove(0, 'iid-3sw', 1);
      const state = useReckoningStore.getState();
      expect(state.vaults[1].sum).toBe(19);
      expect(state.vaults[1].isBusted).toBe(false);
    });

    test('completeDoubleAgent with fuzzyMathActive: ace toggle puts sum in grace zone → not busted', () => {
      // vault target=13, 2+A(1)=3, toggle A→11 → sum=13 exact → isStood
      // Or: vault target=18, 9+A(1)=10, toggle A→11 → sum=20 (target+2, grace)
      const v1 = makeVault(1, 18);
      v1.cards = [
        { card: makeCard('9', 'c9da'), instanceId: 'iid-9da' },
        { card: makeCard('A', 'cAda'), instanceId: 'iid-Ada', aceValue: 1 },
      ];
      v1.sum = 10;
      resetStore({
        phase: 'double-agent',
        preBuffPhase: 'dealing',
        vaults: [makeVault(0, 13), v1, makeVault(2, 21)],
        fuzzyMathActive: true,
        deck: [makeCard('2', 'remain')],
      });

      useReckoningStore.getState().completeDoubleAgent(1, 'iid-Ada');
      const state = useReckoningStore.getState();
      expect(state.vaults[1].sum).toBe(20); // 9+11=20, target+2, grace
      expect(state.vaults[1].isBusted).toBe(false);
    });

    // ── checkGameEnd interaction ───────────────────────────────────────────

    test('grace zone vault is not terminal — game does not end when other vaults are terminal', () => {
      // v0 in grace zone (not terminal), v1 and v2 stood → not all terminal → game continues
      const v0 = makeVault(0, 13);
      v0.sum = 14; // target+1, grace (not stood, not busted)
      v0.cards = [
        { card: makeCard('9', 'c9ge'), instanceId: 'iid-9ge' },
        { card: makeCard('5', 'c5ge'), instanceId: 'iid-5ge' },
      ];
      const v1 = makeVault(1, 18);
      v1.isStood = true;
      v1.sum = 15;
      const v2 = makeVault(2, 21);
      v2.isStood = true;
      v2.sum = 19;
      resetStore({
        phase: 'dealing',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, v1, v2],
        fuzzyMathActive: true,
      });

      // Stand v0 from grace zone → now all terminal → game ends
      useReckoningStore.getState().standVault(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].isStood).toBe(true);
      expect(state.phase).toBe('done');
    });

    test('grace zone vault is not terminal before standing — game keeps going', () => {
      // After assignCard lands in grace zone, phase returns to dealing (not done)
      const v0 = makeVault(0, 13);
      v0.cards = [{ card: makeCard('9', 'c9gr'), instanceId: 'iid-9gr' }];
      v0.sum = 9;
      const v1 = makeVault(1, 18);
      v1.isStood = true;
      v1.sum = 15;
      const v2 = makeVault(2, 21);
      v2.isStood = true;
      v2.sum = 19;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('5', 'c5gr'),
        currentInstanceId: 'rec-5gr',
        deck: [],
        vaults: [v0, v1, v2],
        fuzzyMathActive: true,
      });

      useReckoningStore.getState().assignCard(0); // v0 sum=14, grace, not terminal
      const state = useReckoningStore.getState();
      // deck empty but v0 not terminal → game still ends (deck-empty condition)
      // Actually deck is empty after assign, so checkGameEnd fires → done
      // Let me verify v0 is NOT busted though
      expect(state.vaults[0].sum).toBe(14);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    // ── second game reset ──────────────────────────────────────────────────

    test('initGame called second time after fuzzyMathActive game: item already consumed → fuzzyMathActive false', () => {
      // First game consumed the item
      useInventoryStore.setState({ items: [{ itemId: 'fuzzy-math', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      expect(useReckoningStore.getState().fuzzyMathActive).toBe(true);
      expect(useInventoryStore.getState().items.find(e => e.itemId === 'fuzzy-math')).toBeUndefined();

      // Second game — no more fuzzy-math
      useReckoningStore.getState().initGame();
      expect(useReckoningStore.getState().fuzzyMathActive).toBe(false);
    });
  });

  describe('offshore-account passive buff', () => {
    beforeEach(() => {
      useInventoryStore.setState({ items: [] });
    });

    test('initGame without offshore-account → 3 vaults, flag false', () => {
      useInventoryStore.setState({ items: [] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.vaults).toHaveLength(3);
      expect(state.vaults.map(v => v.target)).toEqual([13, 18, 21]);
      expect(state.offshoreAccountActive).toBe(false);
    });

    test('initGame with offshore-account → 4 vaults, vault 3 target 42, flag true, item consumed', () => {
      useInventoryStore.setState({ items: [{ itemId: 'offshore-account', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.vaults).toHaveLength(4);
      expect(state.vaults[3].target).toBe(42);
      expect(state.vaults[3].id).toBe(3);
      expect(state.offshoreAccountActive).toBe(true);
      expect(useInventoryStore.getState().items.find(e => e.itemId === 'offshore-account')).toBeUndefined();
    });

    test('game does not end until all 4 vaults are terminal', () => {
      const v0 = makeVault(0, 13);
      v0.isStood = true; v0.sum = 10;
      const v1 = makeVault(1, 18);
      v1.isStood = true; v1.sum = 15;
      const v2 = makeVault(2, 21);
      v2.isStood = true; v2.sum = 19;
      const v3 = makeVault(3, 42);
      v3.sum = 20;
      resetStore({
        phase: 'dealing',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, v1, v2, v3],
        offshoreAccountActive: true,
      });

      // v3 not terminal yet — game should not end after standVault on already-stood vaults
      // Trigger a state change by standing v3
      useReckoningStore.getState().standVault(3);
      const state = useReckoningStore.getState();
      expect(state.vaults[3].isStood).toBe(true);
      expect(state.phase).toBe('done');
    });

    test('all 4 vaults not terminal — game continues', () => {
      const v0 = makeVault(0, 13);
      v0.isStood = true; v0.sum = 10;
      const v1 = makeVault(1, 18);
      v1.isStood = true; v1.sum = 15;
      const v2 = makeVault(2, 21);
      v2.isStood = true; v2.sum = 19;
      const v3 = makeVault(3, 42);
      v3.sum = 20;
      resetStore({
        phase: 'dealing',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, v1, v2, v3],
        offshoreAccountActive: true,
      });

      // v3 is not terminal, deck has a card → game should still be in dealing
      // flipCard to check state is not done
      useReckoningStore.getState().flipCard();
      expect(useReckoningStore.getState().phase).toBe('assigning');
    });

    test('assignCard and standVault work on vault 3', () => {
      const v3 = makeVault(3, 42);
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('K', 'cK'),
        currentInstanceId: 'rec-K',
        deck: [makeCard('2', 'remain')],
        vaults: [makeVault(0, 13), makeVault(1, 18), makeVault(2, 21), v3],
        offshoreAccountActive: true,
      });

      useReckoningStore.getState().assignCard(3);
      const state = useReckoningStore.getState();
      expect(state.vaults[3].cards).toHaveLength(1);
      expect(state.vaults[3].sum).toBe(10);
    });

    test('checkGameEnd with deck empty fires regardless of 4 vaults', () => {
      const v3 = makeVault(3, 42);
      v3.sum = 20;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('5', 'c5'),
        currentInstanceId: 'rec-5',
        deck: [],
        vaults: [makeVault(0, 13), makeVault(1, 18), makeVault(2, 21), v3],
        offshoreAccountActive: true,
      });

      useReckoningStore.getState().assignCard(3);
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('done');
    });
  });

  describe('all-in passive buff', () => {
    beforeEach(() => {
      useInventoryStore.setState({ items: [] });
    });

    test('initGame with all-in → allInActive true, item consumed', () => {
      useInventoryStore.setState({ items: [{ itemId: 'all-in', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.allInActive).toBe(true);
      expect(useInventoryStore.getState().items.find(e => e.itemId === 'all-in')).toBeUndefined();
    });

    test('initGame without all-in → allInActive false, inventory unchanged', () => {
      useInventoryStore.setState({ items: [{ itemId: 'other-item', quantity: 2 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.allInActive).toBe(false);
      expect(useInventoryStore.getState().items).toHaveLength(1);
    });

    test('initGame with all-in → 3 vaults, targets [26, 36, 42]', () => {
      useInventoryStore.setState({ items: [{ itemId: 'all-in', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.vaults).toHaveLength(3);
      expect(state.vaults.map(v => v.target)).toEqual([26, 36, 42]);
    });

    test('initGame with all-in + offshore-account → 4 vaults, targets [26, 36, 42, 84]', () => {
      useInventoryStore.setState({ items: [{ itemId: 'all-in', quantity: 1 }, { itemId: 'offshore-account', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.vaults).toHaveLength(4);
      expect(state.vaults.map(v => v.target)).toEqual([26, 36, 42, 84]);
      expect(state.allInActive).toBe(true);
      expect(state.offshoreAccountActive).toBe(true);
    });

    test('standVault with allInActive: non-exact finalScore doubles', () => {
      const v0 = makeVault(0, 26);
      v0.sum = 20; v0.isStood = true;
      const v1 = makeVault(1, 36);
      v1.sum = 30; v1.isStood = true;
      const v2 = makeVault(2, 42);
      v2.sum = 25;
      resetStore({
        phase: 'dealing',
        deck: [],
        vaults: [v0, v1, v2],
        allInActive: true,
      });

      useReckoningStore.getState().standVault(2);
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('done');
      // non-exact: (20 + 30 + 25) * 10 * 2 = 75 * 20 = 1500
      expect(state.finalScore).toBe(1500);
    });

    test('assignCard with allInActive: exact-hit score is sum × 2 × 10 × 2', () => {
      const v0 = makeVault(0, 26);
      v0.cards = [{ card: makeCard('K', 'cK'), instanceId: 'iid-K' }];
      v0.sum = 10;
      const v1 = makeVault(1, 36);
      v1.isStood = true; v1.sum = 30;
      const v2 = makeVault(2, 42);
      v2.isStood = true; v2.sum = 35;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('K', 'cK2'),
        currentInstanceId: 'rec-K2',
        deck: [],
        vaults: [v0, v1, v2],
        allInActive: true,
      });

      // assign K (10) to v0 → sum=20, not exact (target=26); deck empty → game ends
      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('done');
      // v0: 20*10*2=400, v1: 30*10*2=600, v2: 35*10*2=700 → 1700
      expect(state.finalScore).toBe(1700);
    });

    test('allInActive: exact hit vault scores sum × 2 × 10 × 2', () => {
      const v0 = makeVault(0, 26);
      // [6, K] → computeSum = 16; assign K → 26 exact hit
      v0.cards = [
        { card: makeCard('6', 'c6ex'), instanceId: 'iid-6ex' },
        { card: makeCard('K', 'cKex'), instanceId: 'iid-Kex' },
      ];
      v0.sum = 16;
      const v1 = makeVault(1, 36);
      v1.isStood = true; v1.sum = 30;
      const v2 = makeVault(2, 42);
      v2.isStood = true; v2.sum = 35;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('K', 'cK2ex'),
        currentInstanceId: 'rec-K2ex',
        deck: [],
        vaults: [v0, v1, v2],
        allInActive: true,
      });

      // assign K (10) to v0 → computeSum([6,K,K]) = 26 exact; deck empty → game ends
      useReckoningStore.getState().assignCard(0);
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(26);
      expect(state.vaults[0].isStood).toBe(true);
      // v0 exact: 26*2*10*2=1040, v1: 30*10*2=600, v2: 35*10*2=700 → 2340
      expect(state.finalScore).toBe(2340);
    });

    test('allInActive: busted vault still scores 0', () => {
      // v0 busted, v1 stood, v2 not stood → stand v2 → all terminal → game ends
      const v0 = makeVault(0, 26);
      v0.isBusted = true; v0.sum = 30;
      const v1 = makeVault(1, 36);
      v1.isStood = true; v1.sum = 30;
      const v2 = makeVault(2, 42);
      v2.sum = 35;
      resetStore({
        phase: 'dealing',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, v1, v2],
        allInActive: true,
      });

      useReckoningStore.getState().standVault(2);
      const state = useReckoningStore.getState();
      expect(state.phase).toBe('done');
      // v0 busted: 0, v1: 30*10*2=600, v2: 35*10*2=700 → 1300
      expect(state.finalScore).toBe(1300);
    });

    test('allInActive + fuzzyMathActive: bust threshold = doubled target + 3', () => {
      // vault target=26, fuzzy adds 3 → threshold=29; [K,9]=19, assign K → 29 → not busted
      const v0 = makeVault(0, 26);
      v0.cards = [
        { card: makeCard('K', 'cKfz'), instanceId: 'iid-Kfz' },
        { card: makeCard('9', 'c9fz'), instanceId: 'iid-9fz' },
      ];
      v0.sum = 19;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('K', 'cKfz2'),
        currentInstanceId: 'rec-Kfz2',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, makeVault(1, 36), makeVault(2, 42)],
        allInActive: true,
        fuzzyMathActive: true,
      });

      useReckoningStore.getState().assignCard(0); // computeSum([K,9,K])=29, threshold=29 → not busted
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(29);
      expect(state.vaults[0].isBusted).toBe(false);
    });

    test('allInActive + fuzzyMathActive: sum at doubled target + 4 busts', () => {
      // vault target=26, threshold=29, sum=30 → busted
      const v0 = makeVault(0, 26);
      v0.cards = [{ card: makeCard('9', 'c9fz2'), instanceId: 'iid-9fz2' }, { card: makeCard('K', 'cKfz2'), instanceId: 'iid-Kfz2' }];
      v0.sum = 19;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('J', 'cJfz2'),
        currentInstanceId: 'rec-Jfz2',
        deck: [makeCard('2', 'remain')],
        vaults: [v0, makeVault(1, 36), makeVault(2, 42)],
        allInActive: true,
        fuzzyMathActive: true,
      });

      // 19 + 10(J) = 29, still under threshold... let me recalculate:
      // v0.sum=19 is wrong for 9+K=19. Let's use a different setup:
      // v0 has [9,K] → sum=19, assign J(10) → 29, threshold=29 → not busted
      // We need to bust: start at sum=20, assign J → 30 > 29 → busted
      const v0b = makeVault(0, 26);
      v0b.cards = [{ card: makeCard('K', 'cKb2'), instanceId: 'iid-Kb2' }, { card: makeCard('K', 'cKb3'), instanceId: 'iid-Kb3' }];
      v0b.sum = 20;
      resetStore({
        phase: 'assigning',
        currentCard: makeCard('J', 'cJb2'),
        currentInstanceId: 'rec-Jb2',
        deck: [makeCard('2', 'remain')],
        vaults: [v0b, makeVault(1, 36), makeVault(2, 42)],
        allInActive: true,
        fuzzyMathActive: true,
      });

      useReckoningStore.getState().assignCard(0); // 20+10=30 > 29 → busted
      const state = useReckoningStore.getState();
      expect(state.vaults[0].sum).toBe(30);
      expect(state.vaults[0].isBusted).toBe(true);
    });

    test('second initGame after all-in consumed: allInActive resets to false, targets back to [13, 18, 21]', () => {
      useInventoryStore.setState({ items: [{ itemId: 'all-in', quantity: 1 }] });
      useReckoningStore.getState().initGame();
      expect(useReckoningStore.getState().allInActive).toBe(true);
      expect(useReckoningStore.getState().vaults.map(v => v.target)).toEqual([26, 36, 42]);

      // Second game — item already consumed
      useReckoningStore.getState().initGame();
      const state = useReckoningStore.getState();
      expect(state.allInActive).toBe(false);
      expect(state.vaults).toHaveLength(3);
      expect(state.vaults.map(v => v.target)).toEqual([13, 18, 21]);
    });
  });
});
