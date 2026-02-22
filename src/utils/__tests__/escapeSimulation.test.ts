import {
  createSimDeck,
  drawCards,
  findPoliceMeld,
  findPlayerMeld,
  rankIndex,
  runOneGame,
  runSimulation,
  SimCard,
} from '../escapeSimulation';

describe('escapeSimulation', () => {
  describe('createSimDeck', () => {
    it('creates 52 unique cards', () => {
      const deck = createSimDeck();
      expect(deck).toHaveLength(52);
      const keys = new Set(deck.map(c => `${c.rank}-${c.suit}`));
      expect(keys.size).toBe(52);
    });
  });

  describe('findPlayerMeld', () => {
    it('prefers 4-card set (advance=2) over 3-card set', () => {
      const hand: SimCard[] = [
        { rank: '7', suit: 'spades' },
        { rank: '7', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' },
        { rank: '7', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
        { rank: '2', suit: 'hearts' },
        { rank: '2', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
      ];
      const result = findPlayerMeld(hand);
      expect(result).not.toBeNull();
      expect(result!.advance).toBe(2);
      expect(result!.cards).toHaveLength(4);
    });

    it('detects any-suit run across two suits', () => {
      const hand: SimCard[] = [
        { rank: '4', suit: 'spades' },
        { rank: '5', suit: 'hearts' },   // different suit
        { rank: '6', suit: 'clubs' },    // different suit
        { rank: 'K', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
        { rank: 'J', suit: 'hearts' },
        { rank: '9', suit: 'spades' },
        { rank: 'A', suit: 'diamonds' },
      ];
      const result = findPlayerMeld(hand);
      expect(result).not.toBeNull();
      expect(result!.advance).toBe(1);
      expect(result!.cards.map(c => c.rank).sort()).toEqual(['4', '5', '6']);
    });

    it('prefers a 4-card run and grants advance=2', () => {
      const hand: SimCard[] = [
        { rank: '4', suit: 'spades' },
        { rank: '5', suit: 'hearts' },
        { rank: '6', suit: 'clubs' },
        { rank: '7', suit: 'diamonds' },
        { rank: 'K', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
        { rank: 'J', suit: 'hearts' },
        { rank: '9', suit: 'spades' },
      ];
      const result = findPlayerMeld(hand);
      expect(result).not.toBeNull();
      expect(result!.advance).toBe(2);
      expect(result!.cards).toHaveLength(4);
      expect(result!.cards.map(c => c.rank)).toEqual(['4', '5', '6', '7']);
    });

    it('returns null when no meld is available', () => {
      // Ranks at even indices only (gaps of 2 everywhere) — no 3 consecutive
      // Two Aces to fill 8 cards without creating a run
      const hand: SimCard[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: '3', suit: 'diamonds' },
        { rank: '5', suit: 'clubs' },
        { rank: '7', suit: 'spades' },
        { rank: '9', suit: 'hearts' },
        { rank: 'J', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
      ];
      // No rank appears ≥ 3 times; deduplicated ranks have gaps of ≥ 2 everywhere
      expect(findPlayerMeld(hand)).toBeNull();
    });
  });

  describe('findPoliceMeld', () => {
    it('requires same suit for runs', () => {
      // Three consecutive ranks but all different suits — no police meld
      const hand: SimCard[] = [
        { rank: '4', suit: 'spades' },
        { rank: '5', suit: 'hearts' },
        { rank: '6', suit: 'clubs' },
        { rank: 'K', suit: 'diamonds' },
        { rank: '2', suit: 'clubs' },
        { rank: 'J', suit: 'hearts' },
        { rank: '9', suit: 'spades' },
      ];
      expect(findPoliceMeld(hand)).toBeNull();
    });
  });

  describe('runSimulation', () => {
    it('uses current Act 3 defaults (no legacy police meld AI)', () => {
      const result = runOneGame();
      expect(result.policeMelds).toBe(0);
    });

    it('returns a valid result shape with plausible escape rate', () => {
      const result = runSimulation(100);
      expect(result.n).toBe(100);
      expect(result.wins + result.losses).toBe(100);
      expect(result.escapePct).toBeGreaterThanOrEqual(0.2);
      expect(result.escapePct).toBeLessThanOrEqual(0.95);
      expect(result.marginOfError).toBeGreaterThan(0);
      expect(result.ciLow).toBeGreaterThanOrEqual(0);
      expect(result.ciHigh).toBeLessThanOrEqual(1);
      expect(result.avgTurns).toBeGreaterThan(0);
      expect(result.avgPlayerMelds).toBeGreaterThan(0);
    });

    it('produces zero infinite-loop guards in a normal run', () => {
      const result = runSimulation(200);
      expect(result.infiniteLoopGuards).toBe(0);
    });
  });
});
