import { createDeck, shuffleDeck } from '../deck';

describe('deck', () => {
  test('createDeck builds 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);

    const ids = deck.map(card => card.id);
    expect(new Set(ids).size).toBe(52);
  });

  test('shuffleDeck preserves all cards without mutating input', () => {
    const deck = createDeck();
    const before = deck.map(card => card.id);

    const shuffled = shuffleDeck(deck);
    const after = shuffled.map(card => card.id);

    expect(deck.map(card => card.id)).toEqual(before);
    expect([...after].sort()).toEqual([...before].sort());
    expect(shuffled).not.toBe(deck);
  });
});
