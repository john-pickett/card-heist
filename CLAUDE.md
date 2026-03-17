# Card Heist — Project Guide

## Overview

Card Heist is a React Native + Expo card game where players execute a 3-act heist:
- **Act 1 (Sneak In):** Place cards from a hand into 4 areas to match target sums before a timer expires
- **Act 2 (Crack the Vaults):** Flip cards one at a time and assign them to 4 vaults, trying to hit exact targets (blackjack-style)
- **Act 3 (Escape):** Meld sets/runs to race up an escape path before police catch you

Players earn gold, spend it on perks (single-use buffs) and crew members (passive bonuses) in a hideout hub.

## Tech Stack

- React Native 0.83 + Expo 55
- TypeScript 5.9
- Zustand 5 (state management, persisted via AsyncStorage)
- React Native Paper 5 (UI components)
- Jest 29 + ts-jest (testing)

## Directory Structure

```
src/
├── types/          # TypeScript interfaces for game state (card, vault, sneakin, escape)
├── store/          # Zustand stores + __tests__/
├── screens/        # One file per screen
├── components/     # Reusable components, organized in subdirectories (vault/, etc.)
├── data/           # Static data: deck, crew, marketItems, balances
├── utils/          # Pure utility functions (subsetSum, escapeSimulation)
├── hooks/          # Custom hooks (useCardSound)
├── constants/      # Game balance constants (escapeBalance, tutorials)
└── theme.ts        # Design tokens (colors, spacing, font sizes, radii)
```

## Architecture

### State Management (Zustand)

Each game act has its own store. All stores follow the same pattern:

```typescript
// 1. Define state interface
interface StoreState {
  phase: SomePhase;
  // ...
}

// 2. Create store (with persistence where needed)
export const useMyStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // initial state + actions
      initGame: () => set({ phase: 'idle', ... }),
      doAction: () => {
        const { phase } = get();
        // validate, then set
        set({ phase: 'next' });
      },
    }),
    { name: 'solitaire:key-v1', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

**Stores:**
- `vaultStore` (`useReckoningStore`) — Act 2 state, vaults, cards, buff phases
- `sneakInStore` (`useSneakInStore`) — Act 1 state, hand, areas, timer
- `escapeStore` (`useEscapeStore`) — Act 3 state, positions, turns, melds
- `inventoryStore` — Perk items (itemId + quantity), persisted
- `historyStore` — Heist records, lifetime gold, premium tier unlocks, persisted
- `crewStore` — Unlocked crew, streak tracking, active heist crew, persisted
- `settingsStore` — Sound, intro flags, hideout/relax unlocks, persisted

### Navigation

Navigation lives in `App.tsx` as a state machine with a `screen` prop. No React Navigation library — just conditional rendering with `useState`. Game flow:

```
home → act1 → act1bridge → act2 → act2bridge → act3 → gameover → home
                         ↗
             (hideout, market, history, settings off home)
```

### Screens

- `HomeScreen` — Start heist, access hideout
- `SneakInScreen` — Act 1 gameplay
- `Act1BridgeScreen` — Score/timing bonus display between acts
- `VaultScreen` — Act 2 gameplay
- `Act2BridgeScreen` — Vault breakdown, gold calculation
- `EscapeScreen` — Act 3 gameplay
- `GameOverScreen` — Final summary, heist record
- `HideoutScreen` — Hub: crew, market, history, settings, relax games
- `MarketScreen` — Buy perks and unlock premium tiers
- `HideoutCrewScreen` — Purchase/manage crew members
- `HistoryScreen` — Past heist records and lifetime stats
- `DevelopmentScreen` — Dev tools to launch individual acts, reset data

## Key Game Mechanics

### Act 1 — Sneak In
- Player has 10 cards in hand; 4 areas with numeric targets (4–20)
- Drag cards to areas; solved when cards in area sum to target
- 2 failed combos allowed per area before soft lock
- Timer starts at 2 minutes; `false-alarm` perk adds 60s
- Score: time remaining bonus (0–500) × crew multipliers

### Act 2 — Crack the Vaults
- Deck flips one card at a time; player assigns to one of 4 vaults
- Vaults bust if sum exceeds target; stand to lock a vault
- Aces can be 1 or 11 (prompt appears in `ace` phase)
- `fuzzy-math` perk: ±3 grace zone for "exact" scoring
- `offshore-account` perk: adds 4th vault with target 42
- `all-in` perk: doubles all vault targets and values
- Score: sum of vault melds × 10, exact hits = 2×

### Act 3 — Escape
- Player and police start on a 7-step path; player at 6, police at 7, exit at 1
- Player melts cards (sets of same rank, or runs of consecutive ranks) to advance
- Police auto-advance; alert level rises on discards and triggers extra police moves
- `fingers` crew: guarantees a valid meld exists when drawing
- `jinx` crew: 80% gold payout on loss (default: 33%)

### Buff Phases (Act 2)
Multi-step buff actions use a phase system:
1. Player activates buff (e.g., `activateInsideSwitch()`)
2. Phase changes to `'switch'` (or `'burn'`, `'double-agent'`)
3. `preBuffPhase` saves the phase to return to when done
4. On complete or cancel, phase restores from `preBuffPhase`
5. Inventory item removed **after** successful action, not on activation

### Gold Economy
- Earn gold completing heists (varies by act scores)
- Spend on perks (single-use, consumed from inventory) and crew (permanent unlocks)
- Premium market tiers unlock at 2,000 and 5,000 lifetime gold
- `__DEV__` mode: all prices set to 1 gold

### Crew Streak System
- Crew can be used max 2 consecutive heists
- 3rd consecutive use forces a rest (skips next heist)
- Tracked in `consecutiveHeists` map in crewStore

## Coding Conventions

### TypeScript
- Strict mode enabled; no `any` except in legacy areas
- Types defined in `src/types/` — import from there, not inline
- Phase unions as string literals: `type MyPhase = 'idle' | 'active' | 'done'`
- Card instances tracked by `instanceId` (uuid) to distinguish identical cards

### Component Structure
```tsx
// Props interface at top
interface Props {
  onComplete: (result: Result) => void;
}

export default function MyScreen({ onComplete }: Props) {
  // Zustand selectors inline — one selector per value to minimize re-renders
  const phase = useMyStore(s => s.phase);
  const doAction = useMyStore(s => s.doAction);

  // Local state (animations, UI flags) with useState
  // Side effects with useEffect
  // Render
}
```

### Store Actions
- Action names: verb + noun (`activateInsideSwitch`, `completeSwitchMove`, `burnVaultCard`)
- Always validate preconditions at the start of an action before `set()`
- Use `get()` to read current state within an action
- `initGame()` fully resets all state — call before starting an act

### Styling
- Always use `theme.ts` tokens — never hardcode colors, spacing, or font sizes
- `StyleSheet.create()` for static styles
- Inline styles only for dynamic values (e.g., `{ opacity: animated }`)
- Color palette: green primary (`#2d6a4f`), gold accent (`#f4d03f`), white text

### Naming
- Types/interfaces: PascalCase (`VaultCard`, `ReckoningPhase`)
- Functions/variables: camelCase (`cardValue`, `computeSum`)
- Constants: UPPER_SNAKE_CASE (`TOTAL_TIME_MS`, `ESCAPE_PATH_LENGTH`)
- Files: camelCase for stores/utils, PascalCase for components/screens

## Persistence

AsyncStorage keys (all stores use `createJSONStorage(() => AsyncStorage)`):
- `solitaire:inventory-v1` — inventory items
- `solitaire:history-v1` — heist records + gold stats
- `solitaire:crew-v1` — crew unlocks & streaks
- `solitaire:settings-v1` — settings flags
- `card-heist:tutorials` — tutorial seen flags

Never read/write AsyncStorage directly — go through stores.

## Testing Requirements

When writing new code, always write unit tests before marking the task complete:
- Store actions → `src/store/__tests__/*.test.ts`
- Utilities → `src/utils/__tests__/*.test.ts`
- Components → `src/components/__tests__/*.test.tsx`

### Test Pattern

```typescript
import { useReckoningStore } from '../vaultStore';

function resetStore(overrides = {}) {
  useReckoningStore.setState({
    phase: 'dealing',
    vaults: [...],
    // full default state
    ...overrides,
  });
}

describe('vaultStore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetStore();
  });

  test('assigns card to vault', () => {
    resetStore({ currentCard: mockCard, phase: 'assigning' });
    useReckoningStore.getState().assignCard('vault-1');
    expect(useReckoningStore.getState().vaults[0].cards).toHaveLength(1);
  });
});
```

Use `resetStore()` to fully initialize state before each test — never rely on previous test state.

### Test Commands

- `npx jest --no-coverage` — run all tests
- `npx jest <name> --no-coverage` — run a specific test file

Run tests after writing code and fix any failures before finishing.

## Best Practices

1. **Buff consumption:** Remove inventory item after action completes, not on activation. Cancel = no consumption.
2. **Buff phases:** Use `preBuffPhase` to save current phase before entering a buff mode so it can be restored on cancel/complete.
3. **Auto-draw timing:** `setTimeout(flipCard, 300)` after assigning a card triggers the next flip — buff phases interrupt this, so check `prevPhaseRef` in VaultScreen.
4. **`checkGameEnd`** fires after every state-changing action: all vaults terminal OR deck empty → `phase = 'done'`.
5. **PanResponder + stale closures:** Use `useRef` to hold store selectors or callbacks passed into PanResponder handlers to avoid stale closure bugs.
6. **`instanceId`** on every card: required for switch/burn operations to target specific card instances (not just rank/suit).
7. **No direct AsyncStorage calls** in components or screens — route through stores.
8. **`__DEV__` guards:** Market/crew prices are set to 1 in dev mode — don't remove or the store data won't be real.
9. **Solution guarantee:** Act 1 `initGame()` algorithmically ensures at least one valid solution exists for the generated puzzle.
