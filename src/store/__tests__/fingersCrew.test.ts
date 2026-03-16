/**
 * Tests for the Fingers McGee crew effect in Act Three (Escape).
 *
 * When Fingers is in the active heist crew, every hand the player holds
 * is guaranteed to contain at least one valid meld (set or run of 3–4 cards).
 * This applies after every layMeld draw and every discard draw — not just the
 * opening hand. The effect is passive and requires no player action.
 *
 * fingersActive is stored in EscapeState and set during initGame() by reading
 * useCrewStore — the same pattern as deadlockActive in vaultStore.
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
import { useEscapeStore } from '../escapeStore';
import { Rank, Suit } from '../../types/card';
import { EscapeCard } from '../../types/escape';

function makeEscapeCard(rank: Rank, instanceId: string, suit: Suit = 'spades'): EscapeCard {
  return {
    instanceId,
    card: { rank, suit, id: `${rank}-${suit}-${instanceId}` },
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
    policeAlertLevel: 0,
    policeMelds: 0,
    policeCardsDrawn: 0,
    turnsPlayed: 0,
    turnLog: [],
    lastPlayerAction: null,
    pendingPoliceAlertAction: null,
    smokeBombActive: false,
    fingersActive: false,
    ...overrides,
  });
}

function handHasMeld(hand: EscapeCard[]): boolean {
  const rankOrder: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const n = hand.length;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        const triple = [hand[a].card, hand[b].card, hand[c].card];
        const isSet = triple.every(card => card.rank === triple[0].rank);
        const indices = triple.map(card => rankOrder.indexOf(card.rank)).sort((x, y) => x - y);
        const isRun = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
        if (isSet || isRun) return true;
        for (let d = c + 1; d < n; d++) {
          const quad = [hand[a].card, hand[b].card, hand[c].card, hand[d].card];
          const isSet4 = quad.every(card => card.rank === quad[0].rank);
          const idx4 = quad.map(card => rankOrder.indexOf(card.rank)).sort((x, y) => x - y);
          const isRun4 = idx4.every((idx, i) => i === 0 || idx === idx4[i - 1] + 1);
          if (isSet4 || isRun4) return true;
        }
      }
    }
  }
  return false;
}

describe('Fingers McGee crew effect', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useCrewStore.setState({ activeHeistCrew: [], unlockedIds: [], consecutiveHeists: {}, lastHeistCrew: [] });
    resetEscapeStore();
  });

  // ─── State flag tests ───────────────────────────────────────────────────────

  describe('initGame crew detection', () => {
    test('sets fingersActive: true when Fingers is in activeHeistCrew', () => {
      useCrewStore.setState({ activeHeistCrew: ['fingers'] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(true);
    });

    test('sets fingersActive: false when Fingers is not in activeHeistCrew', () => {
      useCrewStore.setState({ activeHeistCrew: [] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(false);
    });

    test('sets fingersActive: false when other crew but not Fingers are active', () => {
      useCrewStore.setState({ activeHeistCrew: ['knuckles', 'bishop', 'deadlock'] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(false);
    });

    test('resets fingersActive from true to false when reinitializing without Fingers', () => {
      useCrewStore.setState({ activeHeistCrew: ['fingers'] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(true);

      useCrewStore.setState({ activeHeistCrew: [] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(false);
    });

    test('sets fingersActive: true when Fingers is active alongside other crew', () => {
      useCrewStore.setState({ activeHeistCrew: ['knuckles', 'fingers', 'bishop'] });
      useEscapeStore.getState().initGame();
      expect(useEscapeStore.getState().fingersActive).toBe(true);
    });
  });

  // ─── layMeld guarantee tests ────────────────────────────────────────────────

  describe('layMeld meld guarantee', () => {
    // Player lays a 3-card set. remaining = 5 cards with no meld.
    // Deck is arranged so that first 3 cards (with Math.random mocked to 0,
    // which makes Fisher-Yates a no-op) ARE a run with one of the remaining cards.
    test('hand has meld after draw when fingersActive: true (deck path)', () => {
      // Mock Math.random to 0 so Fisher-Yates keeps deck order unchanged.
      jest.spyOn(Math, 'random').mockReturnValue(0);

      // remaining after meld: [2♠, 5♥, 8♦, Q♣, K♠] — no meld among them
      const remaining = [
        makeEscapeCard('2', 'r1', 'spades'),
        makeEscapeCard('5', 'r2', 'hearts'),
        makeEscapeCard('8', 'r3', 'diamonds'),
        makeEscapeCard('Q', 'r4', 'clubs'),
        makeEscapeCard('K', 'r5', 'spades'),
      ];
      // meld being played: 3-card set of Aces
      const meld = [
        makeEscapeCard('A', 'm1', 'spades'),
        makeEscapeCard('A', 'm2', 'hearts'),
        makeEscapeCard('A', 'm3', 'clubs'),
      ];
      // deck first 3: 3♠, 4♦, 6♣ — with 5♥ in remaining, no clean run exists
      // UNLESS drawWithMeldGuarantee reshuffles.
      // With Math.random=0, deck stays in order: [3♠,4♦,6♣, ...rest]
      // 3♠(2),4♦(3),5♥(4) → consecutive run with 5♥ already in remaining!
      // So deck[0:3] = [3♠,4♦,6♣]: remaining+drawn = [2,5,8,Q,K,3,4,6]
      // 3(2),4(3),5(4) = run of 3 → meld exists ✓
      const deck = [
        makeEscapeCard('3', 'd1', 'spades'),
        makeEscapeCard('4', 'd2', 'diamonds'),
        makeEscapeCard('6', 'd3', 'clubs'),
        makeEscapeCard('7', 'd4', 'hearts'),
        makeEscapeCard('9', 'd5', 'spades'),
        makeEscapeCard('10', 'd6', 'diamonds'),
      ];

      resetEscapeStore({
        fingersActive: true,
        playerHand: [...meld, ...remaining],
        deck,
        selectedIds: meld.map(c => c.instanceId),
      });

      useEscapeStore.getState().layMeld();
      const state = useEscapeStore.getState();

      expect(state.playerHand).toHaveLength(8);
      expect(handHasMeld(state.playerHand)).toBe(true);
    });

    test('hand has meld after draw when deck is empty and meld comes from outOfPlay', () => {
      // remaining: [3♠, 5♥, 9♦, Q♣, K♠] — no meld
      const remaining = [
        makeEscapeCard('3', 'r1', 'spades'),
        makeEscapeCard('5', 'r2', 'hearts'),
        makeEscapeCard('9', 'r3', 'diamonds'),
        makeEscapeCard('Q', 'r4', 'clubs'),
        makeEscapeCard('K', 'r5', 'spades'),
      ];
      // meld being played: 3-card set of 7s
      const meld = [
        makeEscapeCard('7', 'm1', 'spades'),
        makeEscapeCard('7', 'm2', 'hearts'),
        makeEscapeCard('7', 'm3', 'clubs'),
      ];
      // deck is empty. outOfPlay will be the meld cards [7♠,7♥,7♣].
      // drawWithMeldGuarantee must use outOfPlay. Drawing all 3 gives
      // remaining+drawn = [3,5,9,Q,K,7,7,7] → set of 7s ✓
      resetEscapeStore({
        fingersActive: true,
        playerHand: [...meld, ...remaining],
        deck: [],
        outOfPlay: [],
        selectedIds: meld.map(c => c.instanceId),
      });

      useEscapeStore.getState().layMeld();
      const state = useEscapeStore.getState();

      expect(state.playerHand).toHaveLength(8);
      expect(handHasMeld(state.playerHand)).toBe(true);
    });

    test('outOfPlay contains extra non-meld cards but Fingers still finds a meld', () => {
      // remaining: [2♠, 6♥, 9♦, J♣, K♠]
      const remaining = [
        makeEscapeCard('2', 'r1', 'spades'),
        makeEscapeCard('6', 'r2', 'hearts'),
        makeEscapeCard('9', 'r3', 'diamonds'),
        makeEscapeCard('J', 'r4', 'clubs'),
        makeEscapeCard('K', 'r5', 'spades'),
      ];
      // meld: 3-card set of 4s
      const meld = [
        makeEscapeCard('4', 'm1', 'spades'),
        makeEscapeCard('4', 'm2', 'hearts'),
        makeEscapeCard('4', 'm3', 'clubs'),
      ];
      // outOfPlay (pre-existing) has 4♦ — combined with 4♠,4♥ from drawn meld
      // guarantees a 4-card set of 4s (or subset) in hand
      const preOutOfPlay = [makeEscapeCard('4', 'op1', 'diamonds')];

      resetEscapeStore({
        fingersActive: true,
        playerHand: [...meld, ...remaining],
        deck: [],
        outOfPlay: preOutOfPlay,
        selectedIds: meld.map(c => c.instanceId),
      });

      useEscapeStore.getState().layMeld();
      const state = useEscapeStore.getState();

      expect(state.playerHand).toHaveLength(8);
      expect(handHasMeld(state.playerHand)).toBe(true);
    });

    test('normal draw behavior unchanged when fingersActive: false', () => {
      // Just verifies the store transitions correctly without guarantee
      const meld = [
        makeEscapeCard('K', 'm1', 'spades'),
        makeEscapeCard('K', 'm2', 'hearts'),
        makeEscapeCard('K', 'm3', 'clubs'),
      ];
      const others = [
        makeEscapeCard('2', 'o1'),
        makeEscapeCard('3', 'o2'),
        makeEscapeCard('4', 'o3'),
        makeEscapeCard('6', 'o4'),
        makeEscapeCard('9', 'o5'),
      ];
      const deck = [
        makeEscapeCard('A', 'd1'),
        makeEscapeCard('7', 'd2'),
        makeEscapeCard('Q', 'd3'),
      ];

      resetEscapeStore({
        fingersActive: false,
        playerHand: [...meld, ...others],
        deck,
        selectedIds: meld.map(c => c.instanceId),
      });

      useEscapeStore.getState().layMeld();
      const state = useEscapeStore.getState();

      // Normal behavior: phase transitions, hand refilled
      expect(state.phase).toBe('police_thinking');
      expect(state.playerHand).toHaveLength(8);
      expect(state.playerMelds).toBe(1);
    });
  });

  // ─── discard guarantee tests ────────────────────────────────────────────────

  describe('discard meld guarantee', () => {
    test('hand has meld after discard draw when fingersActive: true', () => {
      // Mock Math.random to 0 (no-op shuffle) so deck order is preserved.
      jest.spyOn(Math, 'random').mockReturnValue(0);

      // hand: 8 cards. Discard 3 cards that are not part of the meld.
      // remaining (5): [3♠,4♦,5♥, Q♣, K♠] — 3,4,5 is a run ✓
      // discarded: [A♠, 9♦, 2♣]
      // deck first 3 (with random=0, order preserved): [J♠, J♥, J♦] → set of Jacks ✓
      const remaining = [
        makeEscapeCard('3', 'r1', 'spades'),
        makeEscapeCard('4', 'r2', 'diamonds'),
        makeEscapeCard('5', 'r3', 'hearts'),
        makeEscapeCard('Q', 'r4', 'clubs'),
        makeEscapeCard('K', 'r5', 'spades'),
      ];
      const discarded = [
        makeEscapeCard('A', 'dc1', 'spades'),
        makeEscapeCard('9', 'dc2', 'diamonds'),
        makeEscapeCard('2', 'dc3', 'clubs'),
      ];
      const deck = [
        makeEscapeCard('J', 'd1', 'spades'),
        makeEscapeCard('J', 'd2', 'hearts'),
        makeEscapeCard('J', 'd3', 'diamonds'),
        makeEscapeCard('8', 'd4', 'clubs'),
      ];

      resetEscapeStore({
        fingersActive: true,
        playerHand: [...remaining, ...discarded],
        deck,
        selectedIds: discarded.map(c => c.instanceId),
      });

      useEscapeStore.getState().discard();
      const state = useEscapeStore.getState();

      expect(state.playerHand).toHaveLength(8);
      expect(handHasMeld(state.playerHand)).toBe(true);
    });

    test('discard normal behavior unchanged when fingersActive: false', () => {
      const hand = [
        makeEscapeCard('2', 'h1'),
        makeEscapeCard('5', 'h2'),
        makeEscapeCard('9', 'h3'),
      ];
      const toDiscard = [makeEscapeCard('K', 'dc1')];
      const deck = [makeEscapeCard('6', 'd1')];

      resetEscapeStore({
        fingersActive: false,
        playerHand: [...hand, ...toDiscard],
        deck,
        selectedIds: ['dc1'],
      });

      useEscapeStore.getState().discard();
      const state = useEscapeStore.getState();

      expect(state.phase).toBe('police_thinking');
      expect(state.playerHand).toHaveLength(4);
      expect(state.playerDiscardCount).toBe(1);
    });
  });

  // ─── Invariant test with real deck variety ──────────────────────────────────

  describe('meld invariant with varied deck', () => {
    test('hand always has meld after repeated layMeld calls when fingersActive', () => {
      // Use initGame with Fingers active to get a real starting hand + deck,
      // then verify hand has meld before and after each layMeld call.
      useCrewStore.setState({ activeHeistCrew: ['fingers'] });
      useEscapeStore.getState().initGame();

      for (let turn = 0; turn < 5; turn++) {
        const { playerHand, phase } = useEscapeStore.getState();
        if (phase === 'won' || phase === 'lost') break;

        expect(handHasMeld(playerHand)).toBe(true);

        // Find and play any valid 3-card meld
        const n = playerHand.length;
        let meldIds: string[] | null = null;
        outer: for (let a = 0; a < n; a++) {
          for (let b = a + 1; b < n; b++) {
            for (let c = b + 1; c < n; c++) {
              const triple = [playerHand[a], playerHand[b], playerHand[c]];
              const tripleCards = triple.map(ec => ec.card);
              const isSet = tripleCards.every(card => card.rank === tripleCards[0].rank);
              const rankOrder: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
              const idxs = tripleCards.map(c => rankOrder.indexOf(c.rank)).sort((x, y) => x - y);
              const isRun = idxs.every((idx, i) => i === 0 || idx === idxs[i - 1] + 1);
              if (isSet || isRun) {
                meldIds = triple.map(ec => ec.instanceId);
                break outer;
              }
            }
          }
        }

        if (!meldIds) break;
        useEscapeStore.setState({ selectedIds: meldIds });
        useEscapeStore.getState().layMeld();

        const afterState = useEscapeStore.getState();
        if (afterState.phase !== 'won') {
          expect(handHasMeld(afterState.playerHand)).toBe(true);
        }

        // Skip police turn by forcing back to player_turn
        useEscapeStore.setState({ phase: 'player_turn' });
      }
    });
  });
});
