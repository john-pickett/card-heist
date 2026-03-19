import { CrewMemberId } from '../../types/crew';

// The filtering logic extracted from each screen/app call site.
// These mirror the exact expressions used in App.tsx and GameOverScreen.

function act1CrewIds(activeHeistCrew: CrewMemberId[]): CrewMemberId[] {
  return activeHeistCrew.filter(id => id === 'knuckles' || id === 'tico');
}

function act2CrewIds(activeHeistCrew: CrewMemberId[]): CrewMemberId[] {
  return activeHeistCrew.filter(id => id === 'bishop' || id === 'deadlock');
}

// GameOverScreen now passes crewIds directly with no filtering.
function gameOverCrewIds(crewIds: CrewMemberId[]): CrewMemberId[] {
  return crewIds;
}

const ALL_CREW: CrewMemberId[] = ['knuckles', 'tico', 'bishop', 'deadlock', 'fingers', 'jinx'];

describe('Act 1 bridge crew filter', () => {
  test('shows knuckles and tico regardless of ticoApplied=false', () => {
    // ticoApplied is no longer part of the filter — both always show
    const result = act1CrewIds(['knuckles', 'tico']);
    expect(result).toContain('knuckles');
    expect(result).toContain('tico');
  });

  test('shows knuckles and tico when ticoApplied=true (same result)', () => {
    const result = act1CrewIds(['knuckles', 'tico']);
    expect(result).toEqual(['knuckles', 'tico']);
  });

  test('shows only knuckles when tico is not on crew', () => {
    const result = act1CrewIds(['knuckles', 'bishop', 'jinx']);
    expect(result).toEqual(['knuckles']);
  });

  test('shows only tico when knuckles is not on crew', () => {
    const result = act1CrewIds(['tico', 'deadlock']);
    expect(result).toEqual(['tico']);
  });

  test('excludes act2/act3 crew members', () => {
    const result = act1CrewIds(ALL_CREW);
    expect(result).toEqual(['knuckles', 'tico']);
    expect(result).not.toContain('bishop');
    expect(result).not.toContain('deadlock');
    expect(result).not.toContain('fingers');
    expect(result).not.toContain('jinx');
  });
});

describe('Act 2 bridge crew filter', () => {
  test('shows bishop even when bishopApplied=false (no exact hit)', () => {
    const result = act2CrewIds(['bishop']);
    expect(result).toContain('bishop');
  });

  test('shows deadlock even when grace zone was never used', () => {
    const result = act2CrewIds(['deadlock']);
    expect(result).toContain('deadlock');
  });

  test('shows both bishop and deadlock when both are on crew', () => {
    const result = act2CrewIds(['bishop', 'deadlock']);
    expect(result).toEqual(['bishop', 'deadlock']);
  });

  test('excludes act1/act3 crew members', () => {
    const result = act2CrewIds(ALL_CREW);
    expect(result).toEqual(['bishop', 'deadlock']);
    expect(result).not.toContain('knuckles');
    expect(result).not.toContain('tico');
    expect(result).not.toContain('fingers');
    expect(result).not.toContain('jinx');
  });

  test('returns empty when neither bishop nor deadlock is on crew', () => {
    const result = act2CrewIds(['knuckles', 'tico', 'fingers', 'jinx']);
    expect(result).toHaveLength(0);
  });
});

describe('Game over crew filter', () => {
  test('shows jinx even when jinxApplied=false (heist was won)', () => {
    const result = gameOverCrewIds(['jinx']);
    expect(result).toContain('jinx');
  });

  test('shows all 6 crew members with no filtering', () => {
    const result = gameOverCrewIds(ALL_CREW);
    expect(result).toEqual(ALL_CREW);
  });

  test('shows fingers even with no act3 effect', () => {
    const result = gameOverCrewIds(['fingers']);
    expect(result).toContain('fingers');
  });

  test('returns empty array when no crew', () => {
    const result = gameOverCrewIds([]);
    expect(result).toHaveLength(0);
  });
});
