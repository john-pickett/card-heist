import { Rank, Suit } from '../../types/card';
import { GameCard, GameColumn } from '../../types/game';
import { useGameStore } from '../gameStore';

function makeGameCard(
  rank: Rank,
  instanceId: string,
  options?: { resolved?: boolean; resolvedValue?: number; suit?: Suit }
): GameCard {
  const resolved = options?.resolved ?? !['J', 'Q', 'K'].includes(rank);
  const suit = options?.suit ?? 'spades';

  return {
    instanceId,
    card: {
      rank,
      suit,
      id: `${rank}-${suit}-${instanceId}`,
    },
    resolved,
    resolvedValue: options?.resolvedValue,
  };
}

function resetStore(columns: GameColumn[] = [], drawPile: GameCard[] = []): void {
  useGameStore.setState({
    phase: 'idle',
    columns,
    drawPile,
    selectedInstanceIds: [],
    activeColumnId: null,
    hotfixUsed: false,
    pendingQueen: null,
    startTime: null,
    endTime: null,
    score: null,
    totalDelta: 0,
  });
}

describe('gameStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetStore();
  });

  test('initGame creates 4 columns and 40-card draw pile', () => {
    useGameStore.getState().initGame();
    const state = useGameStore.getState();

    expect(state.columns).toHaveLength(4);
    expect(state.columns.every(col => col.cards.length === 3)).toBe(true);
    expect(state.drawPile).toHaveLength(40);
  });

  test('confirmSelection updates column cards, phase, and totalDelta', () => {
    const ace = makeGameCard('A', 'ace-1');
    const five = makeGameCard('5', 'five-1');
    const other = makeGameCard('4', 'other-1');

    resetStore(
      [
        { id: 'Mon', budget: 15, cards: [ace, five], cleared: false, blocked: false },
        { id: 'Tue', budget: 15, cards: [other], cleared: false, blocked: false },
        { id: 'Wed', budget: 15, cards: [other], cleared: false, blocked: false },
        { id: 'Thu', budget: 15, cards: [other], cleared: false, blocked: false },
      ],
      []
    );

    useGameStore.setState({
      phase: 'playing',
      activeColumnId: 'Mon',
      selectedInstanceIds: ['ace-1', 'five-1'],
    });

    useGameStore.getState().confirmSelection();
    const state = useGameStore.getState();
    const mon = state.columns.find(c => c.id === 'Mon');

    expect(mon?.cards).toHaveLength(0);
    expect(mon?.cleared).toBe(true);
    expect(state.phase).toBe('playing');
    expect(state.totalDelta).toBe(1);
    expect(state.selectedInstanceIds).toEqual([]);
    expect(state.activeColumnId).toBeNull();
  });

  test('activateFaceCard for Jack replaces the jack with one draw card', () => {
    const jack = makeGameCard('J', 'jack-1', { resolved: false });
    const two = makeGameCard('2', 'two-1');
    const draw = makeGameCard('9', 'draw-1');

    resetStore(
      [
        { id: 'Mon', budget: 15, cards: [jack, two], cleared: false, blocked: false },
        { id: 'Tue', budget: 15, cards: [], cleared: false, blocked: false },
        { id: 'Wed', budget: 15, cards: [], cleared: false, blocked: false },
        { id: 'Thu', budget: 15, cards: [], cleared: false, blocked: false },
      ],
      [draw]
    );

    useGameStore.getState().activateFaceCard('jack-1', 'Mon');
    const state = useGameStore.getState();
    const mon = state.columns.find(c => c.id === 'Mon');

    expect(mon?.cards.map(c => c.instanceId)).toEqual(['two-1', 'draw-1']);
    expect(state.drawPile).toHaveLength(0);
    expect(state.phase).toBe('playing');
  });

  test('queen flow supports keep and move outcomes', () => {
    const queen = makeGameCard('Q', 'queen-1', { resolved: false });
    const target = makeGameCard('3', 'three-1');

    resetStore([
      { id: 'Mon', budget: 15, cards: [queen], cleared: false, blocked: false },
      { id: 'Tue', budget: 15, cards: [target], cleared: false, blocked: false },
      { id: 'Wed', budget: 15, cards: [], cleared: false, blocked: false },
      { id: 'Thu', budget: 15, cards: [], cleared: false, blocked: false },
    ]);

    useGameStore.getState().activateFaceCard('queen-1', 'Mon');
    expect(useGameStore.getState().phase).toBe('queen');

    useGameStore.getState().resolveQueenMove('Tue');
    let state = useGameStore.getState();
    let mon = state.columns.find(c => c.id === 'Mon');
    let tue = state.columns.find(c => c.id === 'Tue');

    expect(mon?.cards).toHaveLength(0);
    expect(tue?.cards.map(c => c.instanceId)).toEqual(['three-1', 'queen-1']);
    expect(tue?.budget).toBe(25);

    resetStore([
      { id: 'Mon', budget: 15, cards: [queen], cleared: false, blocked: false },
      { id: 'Tue', budget: 15, cards: [target], cleared: false, blocked: false },
      { id: 'Wed', budget: 15, cards: [], cleared: false, blocked: false },
      { id: 'Thu', budget: 15, cards: [], cleared: false, blocked: false },
    ]);

    useGameStore.getState().activateFaceCard('queen-1', 'Mon');
    useGameStore.getState().resolveQueenKeep();
    state = useGameStore.getState();
    mon = state.columns.find(c => c.id === 'Mon');

    expect(mon?.cards[0].resolved).toBe(true);
    expect(mon?.cards[0].resolvedValue).toBe(10);
    expect(mon?.budget).toBe(25);
    expect(state.pendingQueen).toBeNull();
    expect(state.phase).toBe('playing');
  });
});
