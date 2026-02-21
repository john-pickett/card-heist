import { Rank, Suit } from '../../types/card';
import { AreaId, SneakInArea, SneakInCard } from '../../types/sneakin';
import { useSneakInStore } from '../sneakInStore';

function makeCard(rank: Rank, id: string, suit: Suit = 'spades'): SneakInCard {
  return {
    instanceId: id,
    card: {
      rank,
      suit,
      id: `${rank}-${suit}-${id}`,
    },
  };
}

function makeArea(id: AreaId, target: number, isUnlocked: boolean): SneakInArea {
  return {
    id,
    target,
    cards: [],
    isSolved: false,
    isUnlocked,
    failedCombos: [],
  };
}

function resetSneakInStore(hand: SneakInCard[], areas: SneakInArea[]): void {
  useSneakInStore.setState({
    phase: 'idle',
    hand,
    areas,
    selectedCard: null,
    selectedSource: null,
    startTime: null,
    endTime: null,
    totalMoves: 0,
    solution: null,
  });
}

describe('sneakInStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetSneakInStore([], [
      makeArea(0, 8, true),
      makeArea(1, 10, false),
      makeArea(2, 12, false),
      makeArea(3, 14, false),
    ]);
  });

  test('moveCard starts timer, transitions to playing, and unlocks next area when solved', () => {
    const c4 = makeCard('4', 'c4');
    const c6 = makeCard('6', 'c6');
    resetSneakInStore(
      [c4, c6],
      [
        makeArea(0, 10, true),
        makeArea(1, 12, false),
        makeArea(2, 14, false),
        makeArea(3, 16, false),
      ]
    );

    jest.spyOn(Date, 'now').mockReturnValue(1000);
    useSneakInStore.getState().moveCard(c4, 'hand', 0);
    useSneakInStore.getState().moveCard(c6, 'hand', 0);

    const state = useSneakInStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.startTime).toBe(1000);
    expect(state.totalMoves).toBe(2);
    expect(state.areas[0].isSolved).toBe(true);
    expect(state.areas[1].isUnlocked).toBe(true);
  });

  test('moveCard to locked area is rejected without state mutation', () => {
    const c5 = makeCard('5', 'c5');
    resetSneakInStore(
      [c5],
      [
        makeArea(0, 10, true),
        makeArea(1, 12, false),
        makeArea(2, 14, false),
        makeArea(3, 16, false),
      ]
    );

    useSneakInStore.getState().moveCard(c5, 'hand', 1);
    const state = useSneakInStore.getState();

    expect(state.hand.map(c => c.instanceId)).toEqual(['c5']);
    expect(state.areas[1].cards).toHaveLength(0);
    expect(state.totalMoves).toBe(0);
    expect(state.phase).toBe('idle');
    expect(state.startTime).toBeNull();
  });

  test('placeOnArea can complete the game and sets endTime', () => {
    const winning = makeCard('5', 'win');
    const areas = [
      makeArea(0, 6, true),
      makeArea(1, 7, true),
      makeArea(2, 9, true),
      makeArea(3, 8, true),
    ];
    areas[0].cards = [makeCard('2', 'a0a'), makeCard('4', 'a0b')];
    areas[0].isSolved = true;
    areas[1].cards = [makeCard('3', 'a1a'), makeCard('4', 'a1b')];
    areas[1].isSolved = true;
    areas[2].cards = [makeCard('4', 'a2a'), makeCard('5', 'a2b')];
    areas[2].isSolved = true;
    areas[3].cards = [makeCard('3', 'a3a')];

    resetSneakInStore([], areas);
    useSneakInStore.setState({
      selectedCard: winning,
      selectedSource: 'hand',
      phase: 'playing',
      startTime: 111,
      totalMoves: 5,
    });

    jest.spyOn(Date, 'now').mockReturnValue(222);
    useSneakInStore.getState().placeOnArea(3);

    const state = useSneakInStore.getState();
    expect(state.phase).toBe('done');
    expect(state.endTime).toBe(222);
    expect(state.totalMoves).toBe(6);
    expect(state.areas[3].isSolved).toBe(true);
    expect(state.selectedCard).toBeNull();
  });

  test('returnAreaToHand clears area and records failed combos of size >= 2', () => {
    const c3 = makeCard('3', 'c3');
    const c5 = makeCard('5', 'c5');
    const c8 = makeCard('8', 'c8');
    const areas = [
      makeArea(0, 8, true),
      makeArea(1, 12, true),
      makeArea(2, 14, false),
      makeArea(3, 16, false),
    ];
    areas[0].cards = [c3, c5];
    areas[0].isSolved = true;
    areas[1].cards = [c8];

    resetSneakInStore([], areas);
    useSneakInStore.setState({ phase: 'playing' });

    useSneakInStore.getState().returnAreaToHand(0);
    useSneakInStore.getState().returnAreaToHand(1);
    const state = useSneakInStore.getState();

    expect(state.hand.map(c => c.instanceId).sort()).toEqual(['c3', 'c5', 'c8']);
    expect(state.areas[0].cards).toHaveLength(0);
    expect(state.areas[0].failedCombos).toHaveLength(1);
    expect(state.areas[1].failedCombos).toHaveLength(0);
  });

  test('selectCard swaps lifted cards and deselect returns lifted card', () => {
    const h1 = makeCard('2', 'h1');
    const h2 = makeCard('9', 'h2');
    resetSneakInStore(
      [h1, h2],
      [
        makeArea(0, 10, true),
        makeArea(1, 12, false),
        makeArea(2, 14, false),
        makeArea(3, 16, false),
      ]
    );

    useSneakInStore.getState().selectCard(h1, 'hand');
    let state = useSneakInStore.getState();
    expect(state.selectedCard?.instanceId).toBe('h1');
    expect(state.hand.map(c => c.instanceId)).toEqual(['h2']);

    useSneakInStore.getState().selectCard(h2, 'hand');
    state = useSneakInStore.getState();
    expect(state.selectedCard?.instanceId).toBe('h2');
    expect(state.hand.map(c => c.instanceId).sort()).toEqual(['h1']);

    useSneakInStore.getState().deselect();
    state = useSneakInStore.getState();
    expect(state.selectedCard).toBeNull();
    expect(state.hand.map(c => c.instanceId).sort()).toEqual(['h1', 'h2']);
  });
});
