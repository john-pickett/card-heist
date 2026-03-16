# Card Heist — Project Standards

## Testing Requirements

When writing new code, always write unit tests before marking the task complete:
- Store actions → `src/store/__tests__/*.test.ts`
- Utilities → `src/utils/__tests__/*.test.ts`
- Components → `src/components/__tests__/*.test.tsx`

For store tests, use `resetStore()` to fully initialize state before each test.

Run `npx jest --no-coverage` after writing code and fix any failures before finishing.

## Test Commands

- `npx jest --no-coverage` — run all tests
- `npx jest <name> --no-coverage` — run a specific test file
