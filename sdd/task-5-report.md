# Task 5 Evidence: Export Controls

## Deliverables

- Commit: `4994de0 feat: add export controls`
- Committed files:
  - `src/renderer/src/App.tsx` (+51 lines)
  - `src/renderer/src/App.test.tsx` (+9 lines)
- Report file: `sdd/task-5-report.md` (this file, intentionally uncommitted)
- `ROADMAP.md` was not modified.

## Implemented Behavior

- Added `Export SVG` and `Export PNG` controls.
- Added accessible selects labelled `Export background` and `PNG scale`.
- Defaults: theme background and 2x PNG scale.
- SVG is generated exclusively from the active document view using `createDiagramSvg`; it does not serialize editor DOM.
- PNG passes that same generated SVG to `createPngBlob`.
- Download filenames use `document.metadata.name.replace(/[^a-z0-9]+/gi, '-')` with `.svg` or `.png`.
- Each download uses a temporary anchor, removes it after click, and revokes the object URL.

## TDD Evidence

1. Before modifying `App.tsx`, added `offers export actions with background and PNG scale controls` to `App.test.tsx`.
2. RED command:
   ```text
   npm test -- src/renderer/src/App.test.tsx
   ```
3. RED result: 1 test file failed; 1 test failed and 11 passed. The new test failed with:
   ```text
   Unable to find an accessible element with the role "button" and name "Export SVG"
   ```
   This was the expected failure because the controls did not yet exist.
4. Added the minimal state, helper imports, exporter calls, and controls to `App.tsx`.
5. GREEN command:
   ```text
   npm test -- src/renderer/src/App.test.tsx
   ```
6. GREEN result:
   ```text
   Test Files  1 passed (1)
   Tests       12 passed (12)
   ```

## Verification

```text
npm test -- src/renderer/src/App.test.tsx
Test Files  1 passed (1)
Tests       12 passed (12)
```

```text
npm run typecheck
typecheck:node  tsc --noEmit -p tsconfig.node.json --composite false
typecheck:web   tsc --noEmit -p tsconfig.web.json --composite false
Exit status: 0
```

```text
git diff --check
Exit status: 0 (no whitespace errors)
```

## Self-Review

- Confirmed `4994de0` contains only `App.tsx` and `App.test.tsx`.
- Confirmed the exact requested button names and select labels are asserted by the renderer test.
- Confirmed the background state is constrained to `theme | transparent`; PNG scale is constrained to `1 | 2 | 3`.
- Confirmed both export paths begin with the active-view SVG and use the supplied exporter helpers.
- Confirmed filename sanitization, temporary-anchor removal, and object-URL revocation.
- No production-code changes were made while writing this report.

## Residual Test Boundary

The jsdom renderer test verifies the required controls. Native download behavior and canvas PNG conversion are not exercised in jsdom; `diagram-export.ts` has dedicated exporter tests.
