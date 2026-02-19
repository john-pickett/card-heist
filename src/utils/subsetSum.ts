import { GameCard } from '../types/game';

// Returns all possible point values for a GameCard.
// Ace = [1, 11]; Queen (resolved) = [10]; number cards and activated Jacks/Kings = face value.
export function getCardValueOptions(gc: GameCard): number[] {
  const rank = gc.card.rank;
  if (rank === 'A') return [1, 11];
  if (rank === 'Q' && gc.resolved && gc.resolvedValue !== undefined) return [gc.resolvedValue];
  if (rank === 'J' || rank === 'Q' || rank === 'K') return [0]; // unresolved face cards — caller should filter these out
  const n = parseInt(rank, 10);
  return [n];
}

// Try all Ace combinations to find one assignment that makes the subset sum to `target`.
// Returns array of chosen values (one per card in `cards` order), or null if impossible.
// `cards` should all be resolved=true.
export function resolveAces(cards: GameCard[], target: number): number[] | null {
  const values: number[] = new Array(cards.length).fill(0);

  function backtrack(index: number, running: number): boolean {
    if (index === cards.length) {
      return running === target;
    }
    const options = getCardValueOptions(cards[index]);
    for (const v of options) {
      const next = running + v;
      if (next > target) continue; // pruning: all values positive
      values[index] = v;
      if (backtrack(index + 1, next)) return true;
    }
    return false;
  }

  return backtrack(0, 0) ? values : null;
}

// Pick Ace values (1 or 11 each) so that the total sum of `cards` is as close to `target` as possible.
// Returns the best achievable total. Non-Ace cards use their fixed value.
export function bestAceResolution(cards: GameCard[], target: number): number {
  let baseSum = 0;
  let aceCount = 0;
  for (const gc of cards) {
    const rank = gc.card.rank;
    if (rank === 'A') {
      aceCount++;
    } else if (rank === 'Q' && gc.resolved && gc.resolvedValue !== undefined) {
      baseSum += gc.resolvedValue;
    } else {
      const n = parseInt(rank, 10);
      if (!isNaN(n)) baseSum += n;
    }
  }
  // Try all 2^aceCount combinations (max 4 Aces = 16 combinations)
  let bestSum = baseSum + aceCount; // baseline: all Aces = 1
  let bestDist = Math.abs(bestSum - target);
  for (let mask = 1; mask < (1 << aceCount); mask++) {
    let sum = baseSum;
    for (let i = 0; i < aceCount; i++) {
      sum += (mask >> i) & 1 ? 11 : 1;
    }
    const dist = Math.abs(sum - target);
    if (dist < bestDist) {
      bestDist = dist;
      bestSum = sum;
    }
  }
  return bestSum;
}

// Does ANY non-empty subset of `cards` sum to `target`?
// Used for blocked-column detection. Includes all Ace value combinations.
export function hasValidSubsetSum(cards: GameCard[], target: number): boolean {
  // Only consider resolved cards (unresolved face cards can still be activated — not blocked)
  const resolved = cards.filter(gc => gc.resolved);

  function backtrack(index: number, running: number, count: number): boolean {
    if (count > 0 && running === target) return true;
    if (index === resolved.length) return false;
    if (running > target) return false; // pruning

    const gc = resolved[index];
    const options = getCardValueOptions(gc);

    // Include this card
    for (const v of options) {
      const next = running + v;
      if (next <= target) {
        if (backtrack(index + 1, next, count + 1)) return true;
      }
    }

    // Exclude this card
    return backtrack(index + 1, running, count);
  }

  return backtrack(0, 0, 0);
}
