# Task 3 Evidence: Altitude Canvas Navigation

## Scope

- Added `Altitude views` navigation before the component palette. Each view button sets the store's active view and uses an altitude-specific SVG contour.
- Rendered the active view through `getActiveView`, keyed React Flow by `activeViewId`, restored its `defaultViewport`, and persisted `onMoveEnd` viewport changes.
- Added a transformed, non-interactive group layer behind the canvas, an `Add group` palette action, and semantic zoom below `0.65` that keeps node labels and handles while removing icons and type detail.
- Added local Instrument Sans and IBM Plex Mono assets and font faces, responsive controls below 768px, Signal Copper keyboard focus, and retained reduced-motion behavior.

## TDD Evidence

1. Added renderer tests for selecting `Sistema` and adding a group before changing production code.
2. Ran `npm test -- src/renderer/src/App.test.tsx` before implementation.
3. Result: 7 passed, 2 failed because buttons named `Sistema` and `Add group` did not exist.
4. Implemented the minimum required controls and canvas behavior.
5. The first green run revealed a pre-existing test-state reset omission after view switching; added `activeViewId: 'view-contexto'` to the shared test setup.

## Verification

| Command | Result |
| --- | --- |
| `npm test -- src/renderer/src/App.test.tsx` | PASS: 1 file, 9 tests |
| `npm run typecheck` | PASS: node and web TypeScript checks |
| `git diff --check` | PASS: no whitespace errors |

## Self-Review

- Confirmed view navigation derives labels from document views and calls `setActiveView`.
- Confirmed groups are behind React Flow content and follow the saved canvas viewport.
- Confirmed existing node and edge deletion handlers remain unchanged.
- Confirmed only Task 3 implementation files and the two required font assets will be staged; this evidence report remains uncommitted as requested by the task's scoped-commit instruction.
