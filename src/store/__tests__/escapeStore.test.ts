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
    policeLastPlay: null,
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

  test('discard on every second discard advances police and can lose game', () => {
    const p1 = makeEscapeCard('2', 'p1');
    const p2 = makeEscapeCard('9', 'p2');
    const draw1 = makeEscapeCard('5', 'd1');

    resetEscapeStore({
      playerPosition: 3,
      policePosition: 4,
      playerDiscardCount: 1,
      playerHand: [p1, p2],
      selectedIds: ['p1'],
      deck: [draw1],
    });

    useEscapeStore.getState().discard();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('lost');
    expect(state.policePosition).toBe(3);
    expect(state.playerDiscardCount).toBe(2);
    expect(state.playerCardsDrawn).toBe(1);
    expect(state.turnsPlayed).toBe(1);
  });

  test('runPoliceTurn uses meld when available and can catch player', () => {
    const meld = [
      makeEscapeCard('Q', 'q1', 'spades'),
      makeEscapeCard('Q', 'q2', 'hearts'),
      makeEscapeCard('Q', 'q3', 'clubs'),
    ];
    const filler = [
      makeEscapeCard('2', 'f1'),
      makeEscapeCard('4', 'f2'),
    ];
    const draw = [
      makeEscapeCard('6', 'd1'),
      makeEscapeCard('7', 'd2'),
      makeEscapeCard('8', 'd3'),
    ];

    resetEscapeStore({
      policePosition: 3,
      playerPosition: 2,
      policeHand: [...meld, ...filler],
      deck: draw,
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('lost');
    expect(state.policePosition).toBe(2);
    expect(state.policeMelds).toBe(1);
    expect(state.policeCardsDrawn).toBe(3);
    expect(state.policeLastPlay?.map(c => c.instanceId).sort()).toEqual(['q1', 'q2', 'q3']);
  });

  test('runPoliceTurn discards lowest card when no meld exists', () => {
    const hand = [
      makeEscapeCard('A', 'a1', 'spades'),
      makeEscapeCard('5', 'b1', 'hearts'),
      makeEscapeCard('9', 'c1', 'clubs'),
      makeEscapeCard('K', 'd1', 'diamonds'),
    ];
    const draw = [makeEscapeCard('2', 'draw-1')];

    resetEscapeStore({
      policeHand: hand,
      deck: draw,
    });

    useEscapeStore.getState().runPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('police_reveal');
    expect(state.policeLastPlay?.[0].instanceId).toBe('a1');
    expect(state.policeMessage).toBe('Police discard A and draw.');
    expect(state.policeCardsDrawn).toBe(1);
    expect(state.policeHand).toHaveLength(4);
  });

  test('endPoliceTurn returns control to player when not caught', () => {
    resetEscapeStore({
      phase: 'police_reveal',
      policePosition: 5,
      playerPosition: 3,
      policeMessage: 'Police lay down a meld!',
      lastMeldType: 'run',
    });

    useEscapeStore.getState().endPoliceTurn();
    const state = useEscapeStore.getState();

    expect(state.phase).toBe('player_turn');
    expect(state.policeMessage).toBeNull();
    expect(state.lastMeldType).toBeNull();
  });
});
