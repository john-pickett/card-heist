import { Rank, Suit } from '../../types/card';
import { EscapeCard } from '../../types/escape';
import { useEscapeStore } from '../escapeStore';

function makeEscapeCard(rank: Rank, instanceId: string, suit: Suit = 'spades'): EscapeCard {
  return {
    instanceId,
    card: {
      rank,
      suit,
      id: `${rank}-${suit}-${instanceId}`,
    },
  };
}

function resetEscapeStore(overrides: Partial<ReturnType<typeof useEscapeStore.getState>> = {}): void {
  useEscapeStore.setState({
    phase: 'player_turn',
    deck: [],
    playerHand: [],
    policeHand: [],
    playerPosition: 4,
    policePosition: 6,
    selectedIds: [],
    errorMessage: null,
    policeMessage: null,
    outOfPlay: [],
    infoMessage: null,
    lastMeldType: null,
    playerMelds: 0,
    playerSets: 0,
    playerRuns: 0,
    playerCardsDrawn: 0,
    playerDiscardCount: 0,
    policeMelds: 0,
    policeCardsDrawn: 0,
    turnsPlayed: 0,
    turnLog: [],
    lastPlayerAction: null,
    ...overrides,
  });
}

describe('escapeStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetEscapeStore();
  });

  test('layMeld rejects invalid selection size', () => {
    const c3 = makeEscapeCard('3', 'p3');
    const c4 = makeEscapeCard('4', 'p4');
    resetEscapeStore({
      playerHand: [c3, c4],
      selectedIds: ['p3', 'p4'],
    });

    useEscapeStore.getState().layMeld();
    const state = useEscapeStore.getState();

    expect(state.errorMessage).toBe('Select 3 or 4 cards to meld');
    expect(state.phase).toBe('player_turn');
  });

  test('layMeld with 4-card set advances two spaces and can win', () => {
    const selected = [
      makeEscapeCard('8', 's1', 'spades'),
      makeEscapeCard('8', 's2', 'hearts'),
      makeEscapeCard('8', 's3', 'clubs'),
      makeEscapeCard('8', 's4', 'diamonds'),
    ];
    const others = [
      makeEscapeCard('2', 'o1'),
      makeEscapeCard('3', 'o2'),
      makeEscapeCard('4', 'o3'),
      makeEscapeCard('5', 'o4'),
    ];
    const draw = [
      makeEscapeCard('6', 'd1'),
      makeEscapeCard('7', 'd2'),
      makeEscapeCard('9', 'd3'),
      makeEscapeCard('10', 'd4'),
    ];

    resetEscapeStore({
      playerPosition: 3,
      playerHand: [...selected, ...others],
      deck: draw,
      selectedIds: selected.map(c => c.instanceId),
    });

    useEscapeStore.getState().layMeld();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('won');
    expect(state.playerPosition).toBe(1);
    expect(state.playerSets).toBe(1);
    expect(state.playerMelds).toBe(1);
    expect(state.playerCardsDrawn).toBe(4);
    expect(state.turnsPlayed).toBe(1);
    expect(state.lastMeldType).toBe('set');
    expect(state.playerHand).toHaveLength(8);
  });

  test('layMeld with 4-card run advances two spaces', () => {
    const selected = [
      makeEscapeCard('5', 'r1', 'spades'),
      makeEscapeCard('6', 'r2', 'hearts'),
      makeEscapeCard('7', 'r3', 'clubs'),
      makeEscapeCard('8', 'r4', 'diamonds'),
    ];
    const others = [
      makeEscapeCard('2', 'o1'),
      makeEscapeCard('3', 'o2'),
      makeEscapeCard('9', 'o3'),
      makeEscapeCard('K', 'o4'),
    ];
    const draw = [
      makeEscapeCard('A', 'd1'),
      makeEscapeCard('4', 'd2'),
      makeEscapeCard('10', 'd3'),
      makeEscapeCard('J', 'd4'),
    ];

    resetEscapeStore({
      playerPosition: 4,
      playerHand: [...selected, ...others],
      deck: draw,
      selectedIds: selected.map(c => c.instanceId),
    });

    useEscapeStore.getState().layMeld();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('police_thinking');
    expect(state.playerPosition).toBe(2);
    expect(state.playerRuns).toBe(1);
    expect(state.playerMelds).toBe(1);
    expect(state.lastMeldType).toBe('run');
  });

  test('discard advances police and transitions to police_thinking', () => {
    const p1 = makeEscapeCard('2', 'p1');
    const p2 = makeEscapeCard('9', 'p2');
    const draw1 = makeEscapeCard('5', 'd1');

    resetEscapeStore({
      playerPosition: 3,
      policePosition: 4,
      playerDiscardCount: 0,
      playerHand: [p1, p2],
      selectedIds: ['p1'],
      deck: [draw1],
    });

    useEscapeStore.getState().discard();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('police_thinking');
    expect(state.policePosition).toBe(3);
    expect(state.playerDiscardCount).toBe(1);
    expect(state.playerCardsDrawn).toBe(1);
    expect(state.turnsPlayed).toBe(1);
  });

  test('runPoliceTurn advances police 1 step and returns control to player when not caught', () => {
    resetEscapeStore({
      policePosition: 5,
      playerPosition: 2,
      turnsPlayed: 3,
      lastPlayerAction: 'Laid a match (set, 1 step)',
      lastMeldType: 'set',
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('player_turn');
    expect(state.policePosition).toBe(4);
    expect(state.policeMessage).toBeNull();
    expect(state.lastPlayerAction).toBeNull();
    expect(state.lastMeldType).toBeNull();
  });

  test('runPoliceTurn clamps police position to player position on catch and waits for continue', () => {
    resetEscapeStore({
      policePosition: 4,
      playerPosition: 3,
      turnsPlayed: 2,
      lastPlayerAction: 'Discarded 1 card',
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('awaiting_continue');
    expect(state.policePosition).toBe(3);
    expect(state.policeMessage).toBe("Police closed in — they've caught you!");
    expect(state.turnLog.at(-1)?.policePos).toBe(3);
  });

  test('runPoliceTurn records turn log entry', () => {
    resetEscapeStore({
      policePosition: 5,
      playerPosition: 2,
      turnsPlayed: 3,
      lastPlayerAction: 'Discarded 2 cards',
      turnLog: [],
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.turnLog).toHaveLength(1);
    expect(state.turnLog[0].turn).toBe(3);
    expect(state.turnLog[0].playerAction).toBe('Discarded 2 cards');
    expect(state.turnLog[0].policePos).toBe(4);
  });

  test('runPoliceTurn keeps only last 3 log entries', () => {
    const existingLog = [
      { turn: 1, playerAction: 'A', policeAction: 'B', playerPos: 4, policePos: 6 },
      { turn: 2, playerAction: 'C', policeAction: 'D', playerPos: 3, policePos: 5 },
      { turn: 3, playerAction: 'E', policeAction: 'F', playerPos: 3, policePos: 4 },
    ];
    resetEscapeStore({
      policePosition: 4,
      playerPosition: 2,
      turnsPlayed: 4,
      lastPlayerAction: 'Discarded 1 card',
      turnLog: existingLog,
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.turnLog).toHaveLength(3);
    expect(state.turnLog[0].turn).toBe(2);
    expect(state.turnLog[2].turn).toBe(4);
  });

  test('endPoliceTurn sets lost when police catch player', () => {
    resetEscapeStore({
      phase: 'awaiting_continue',
      policePosition: 2,
      playerPosition: 3,
    });

    useEscapeStore.getState().endPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('lost');
  });

  test('endPoliceTurn returns control to player when not caught', () => {
    resetEscapeStore({
      phase: 'awaiting_continue',
      policePosition: 5,
      playerPosition: 3,
      policeMessage: 'Police closed in — now at step 5',
      lastMeldType: 'run',
    });

    useEscapeStore.getState().endPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('player_turn');
    expect(state.policeMessage).toBeNull();
    expect(state.lastMeldType).toBeNull();
  });

  describe('activateFalseTrail', () => {
    test('moves police back one step', () => {
      resetEscapeStore({ policePosition: 4, playerPosition: 2, phase: 'player_turn' });

      useEscapeStore.getState().activateFalseTrail();
      const state = useEscapeStore.getState();

      expect(state.policePosition).toBe(5);
      expect(state.phase).toBe('player_turn');
    });

    test('caps at position 6', () => {
      resetEscapeStore({ policePosition: 6, phase: 'player_turn' });

      useEscapeStore.getState().activateFalseTrail();
      const state = useEscapeStore.getState();

      expect(state.policePosition).toBe(6);
    });

    test('does nothing outside player_turn', () => {
      resetEscapeStore({ policePosition: 4, phase: 'police_thinking' });

      useEscapeStore.getState().activateFalseTrail();
      const state = useEscapeStore.getState();

      expect(state.policePosition).toBe(4);
    });

    test('does not trigger win or loss', () => {
      resetEscapeStore({ policePosition: 3, playerPosition: 2, phase: 'player_turn' });

      useEscapeStore.getState().activateFalseTrail();
      const state = useEscapeStore.getState();

      expect(state.policePosition).toBe(4);
      expect(state.phase).toBe('player_turn');
    });
  });
});
