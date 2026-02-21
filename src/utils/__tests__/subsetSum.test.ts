import { GameCard } from '../../types/game';
import { Rank, Suit } from '../../types/card';
import {
  bestAceResolution,
  getCardValueOptions,
  hasValidSubsetSum,
  resolveAces,
} from '../subsetSum';

function gameCard(rank: Rank, id: string, resolved = true, resolvedValue?: number): GameCard {
  const suit: Suit = 'spades';
  return {
    instanceId: id,
    card: { rank, suit, id: `${id}-${rank}-${suit}` },
    resolved,
    resolvedValue,
  };
}

describe('subsetSum utils', () => {
  test('getCardValueOptions handles aces and face cards', () => {
    expect(getCardValueOptions(gameCard('A', 'ace'))).toEqual([1, 11]);
    expect(getCardValueOptions(gameCard('Q', 'queen', true, 10))).toEqual([10]);
    expect(getCardValueOptions(gameCard('J', 'jack', false))).toEqual([0]);
    expect(getCardValueOptions(gameCard('7', 'seven'))).toEqual([7]);
  });

  test('resolveAces finds a valid ace assignment for target', () => {
    const cards = [gameCard('A', 'a1'), gameCard('A', 'a2')];
    expect(resolveAces(cards, 12)).toEqual([1, 11]);
    expect(resolveAces(cards, 5)).toBeNull();
  });

  test('bestAceResolution returns nearest total to target', () => {
    const cards = [gameCard('A', 'a1'), gameCard('A', 'a2'), gameCard('9', 'n1')];
    expect(bestAceResolution(cards, 20)).toBe(21);
  });

  test('hasValidSubsetSum ignores unresolved faces and checks non-empty subsets', () => {
    const cards = [
      gameCard('J', 'j1', false),
      gameCard('A', 'a1'),
      gameCard('9', 'n1'),
      gameCard('Q', 'q1', true, 10),
    ];

    expect(hasValidSubsetSum(cards, 10)).toBe(true);
    expect(hasValidSubsetSum(cards, 19)).toBe(true);
    expect(hasValidSubsetSum(cards, 2)).toBe(false);
  });
});
