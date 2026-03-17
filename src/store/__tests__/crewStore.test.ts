import { useCrewStore, isCrewAvailable } from '../crewStore';
import { CrewMemberId } from '../../types/crew';

const TICO: CrewMemberId    = 'tico';
const BISHOP: CrewMemberId  = 'bishop';
const JINX: CrewMemberId    = 'jinx';

function resetStore(overrides: Partial<{
  unlockedIds: CrewMemberId[];
  consecutiveHeists: Record<string, number>;
  restHeistsRemaining: Record<string, number>;
  activeHeistCrew: CrewMemberId[];
  lastHeistCrew: CrewMemberId[];
}> = {}) {
  useCrewStore.setState({
    unlockedIds:         [TICO, BISHOP, JINX],
    consecutiveHeists:   {},
    restHeistsRemaining: {},
    activeHeistCrew:     [],
    lastHeistCrew:       [],
    ...overrides,
  });
}

describe('crewStore — recordHeistEnd', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetStore();
  });

  // ─── streak accumulation ────────────────────────────────────────────────

  test('increments streak to 1 after first use', () => {
    resetStore({ activeHeistCrew: [TICO] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(1);
  });

  test('increments streak to 2 after second consecutive use', () => {
    resetStore({ activeHeistCrew: [TICO], consecutiveHeists: { tico: 1 } });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(2);
  });

  test('sets restHeistsRemaining to 2 when streak hits 2', () => {
    resetStore({ activeHeistCrew: [TICO], consecutiveHeists: { tico: 1 } });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().restHeistsRemaining[TICO]).toBe(2);
  });

  test('crew not on the heist are unaffected when streak is 0', () => {
    resetStore({ activeHeistCrew: [TICO] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[BISHOP]).toBe(0);
    expect(useCrewStore.getState().restHeistsRemaining[BISHOP]).toBeUndefined();
  });

  // ─── voluntary skip (not resting) ───────────────────────────────────────

  test('voluntary skip when streak=1 resets streak to 0', () => {
    resetStore({ activeHeistCrew: [], consecutiveHeists: { tico: 1 } });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(0);
    expect(useCrewStore.getState().restHeistsRemaining[TICO] ?? 0).toBe(0);
  });

  test('voluntary skip when streak=0 keeps streak at 0', () => {
    resetStore({ activeHeistCrew: [] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(0);
  });

  // ─── mandatory rest heists ───────────────────────────────────────────────

  test('first mandatory rest heist decrements restRemaining 2→1 and streak stays 2', () => {
    resetStore({
      activeHeistCrew: [],
      consecutiveHeists:   { tico: 2 },
      restHeistsRemaining: { tico: 2 },
    });
    useCrewStore.getState().recordHeistEnd();
    const state = useCrewStore.getState();
    expect(state.restHeistsRemaining[TICO]).toBe(1);
    expect(state.consecutiveHeists[TICO]).toBe(2);  // still resting
  });

  test('first rest heist still makes crew unavailable', () => {
    resetStore({
      activeHeistCrew: [],
      consecutiveHeists:   { tico: 2 },
      restHeistsRemaining: { tico: 2 },
    });
    useCrewStore.getState().recordHeistEnd();
    const { consecutiveHeists } = useCrewStore.getState();
    expect(isCrewAvailable(TICO, [TICO], consecutiveHeists)).toBe(false);
  });

  test('second mandatory rest heist resets streak to 0 and clears restRemaining', () => {
    resetStore({
      activeHeistCrew: [],
      consecutiveHeists:   { tico: 2 },
      restHeistsRemaining: { tico: 1 },
    });
    useCrewStore.getState().recordHeistEnd();
    const state = useCrewStore.getState();
    expect(state.restHeistsRemaining[TICO]).toBe(0);
    expect(state.consecutiveHeists[TICO]).toBe(0);
  });

  test('crew is available after completing 2 rest heists', () => {
    resetStore({
      activeHeistCrew: [],
      consecutiveHeists:   { tico: 2 },
      restHeistsRemaining: { tico: 1 },
    });
    useCrewStore.getState().recordHeistEnd();
    const { consecutiveHeists } = useCrewStore.getState();
    expect(isCrewAvailable(TICO, [TICO], consecutiveHeists)).toBe(true);
  });

  // ─── full cycle end-to-end ───────────────────────────────────────────────

  test('full cycle: use×2 → rest×2 → available again', () => {
    resetStore();

    // Heist 1: use Tico (streak: 0→1)
    resetStore({ activeHeistCrew: [TICO] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(1);

    // Heist 2: use Tico (streak: 1→2, restRemaining: 2)
    useCrewStore.setState({ activeHeistCrew: [TICO] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(2);
    expect(useCrewStore.getState().restHeistsRemaining[TICO]).toBe(2);
    expect(isCrewAvailable(TICO, [TICO], useCrewStore.getState().consecutiveHeists)).toBe(false);

    // Heist 3: Tico not taken — 1st rest heist (restRemaining: 2→1)
    useCrewStore.setState({ activeHeistCrew: [] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().restHeistsRemaining[TICO]).toBe(1);
    expect(isCrewAvailable(TICO, [TICO], useCrewStore.getState().consecutiveHeists)).toBe(false);

    // Heist 4: Tico not taken — 2nd rest heist (streak resets to 0)
    useCrewStore.setState({ activeHeistCrew: [] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(0);
    expect(useCrewStore.getState().restHeistsRemaining[TICO]).toBe(0);
    expect(isCrewAvailable(TICO, [TICO], useCrewStore.getState().consecutiveHeists)).toBe(true);
  });

  test('full cycle: use×1 → voluntary skip → available immediately', () => {
    // Heist 1: use Tico
    resetStore({ activeHeistCrew: [TICO] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(1);

    // Heist 2: skip Tico voluntarily (streak: 1→0, no rest needed)
    useCrewStore.setState({ activeHeistCrew: [] });
    useCrewStore.getState().recordHeistEnd();
    expect(useCrewStore.getState().consecutiveHeists[TICO]).toBe(0);
    expect(useCrewStore.getState().restHeistsRemaining[TICO] ?? 0).toBe(0);
    expect(isCrewAvailable(TICO, [TICO], useCrewStore.getState().consecutiveHeists)).toBe(true);
  });

  // ─── multiple crew members ───────────────────────────────────────────────

  test('streaks are tracked independently for each crew member', () => {
    resetStore({ activeHeistCrew: [TICO, BISHOP] });
    useCrewStore.getState().recordHeistEnd();

    useCrewStore.setState({ activeHeistCrew: [TICO] });  // Bishop not taken
    useCrewStore.getState().recordHeistEnd();

    const state = useCrewStore.getState();
    expect(state.consecutiveHeists[TICO]).toBe(2);
    expect(state.consecutiveHeists[BISHOP]).toBe(0); // Bishop's streak reset (voluntary skip)
  });

  test('clears activeHeistCrew and sets lastHeistCrew after recordHeistEnd', () => {
    resetStore({ activeHeistCrew: [TICO, BISHOP] });
    useCrewStore.getState().recordHeistEnd();
    const state = useCrewStore.getState();
    expect(state.activeHeistCrew).toEqual([]);
    expect(state.lastHeistCrew).toEqual([TICO, BISHOP]);
  });
});

// ─── isCrewAvailable ────────────────────────────────────────────────────────

describe('isCrewAvailable', () => {
  test('returns false for unlocked crew that is not in unlockedIds', () => {
    expect(isCrewAvailable(TICO, [], {})).toBe(false);
  });

  test('returns true when unlocked and streak=0', () => {
    expect(isCrewAvailable(TICO, [TICO], {})).toBe(true);
  });

  test('returns true when unlocked and streak=1', () => {
    expect(isCrewAvailable(TICO, [TICO], { tico: 1 })).toBe(true);
  });

  test('returns false when streak=2 (must rest)', () => {
    expect(isCrewAvailable(TICO, [TICO], { tico: 2 })).toBe(false);
  });

  test('returns false for crew not in unlockedIds even if streak=0', () => {
    expect(isCrewAvailable(BISHOP, [TICO], {})).toBe(false);
  });
});
