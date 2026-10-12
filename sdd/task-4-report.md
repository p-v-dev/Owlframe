# Task 4 Report: Dependency-Free Diagram Exports

## Status

Implemented and committed as `3771687 feat: generate diagram exports`.

## Changed Files

- `src/renderer/src/diagram-export.ts`
  - Added `createDiagramSvg(view, { background })`.
  - Bounds include groups and fixed `176x56` nodes, with `32px` padding; empty views export as `64x64`.
  - Produces a self-contained SVG with dimensions, `viewBox`, arrow marker definitions, groups, nodes, directed edges, XML-escaped labels, and the optional Survey `#E8ECE7` background.
  - Added `createPngBlob(svg, scale)`, using Blob URL, `Image`, and canvas; it supports scales 1, 2, and 3, emits `image/png`, revokes URLs on handled completion paths, and rejects image/canvas/null-blob failures.
- `src/renderer/src/diagram-export.test.ts`
  - Added four tests for bounded SVG content, both background modes, scaled PNG output and URL cleanup, and null PNG blob rejection/cleanup.
- `sdd/task-4-report.md`
  - Added as the Task 4 evidence report.

## TDD Evidence

The test file was written before the implementation module existed. The initial command was:

```text
npm test -- src/renderer/src/diagram-export.test.ts
```

It failed as expected with:

```text
Failed to resolve import "./diagram-export" from "src/renderer/src/diagram-export.test.ts". Does the file exist?
```

After adding the implementation, the focused test was rerun successfully.

## Exact Verification Commands And Results

```text
npm test -- src/renderer/src/diagram-export.test.ts
```

Result:

```text
Test Files  1 passed (1)
Tests       4 passed (4)
```

```text
npm run typecheck
```

Result: exited successfully after both commands completed:

```text
npm run typecheck:node
tsc --noEmit -p tsconfig.node.json --composite false

npm run typecheck:web
tsc --noEmit -p tsconfig.web.json --composite false
```

Additional checks:

```text
npm run format:check
npm run lint
```

These repository-wide checks remain blocked by pre-existing formatting warnings and an existing `react-hooks/set-state-in-effect` error at `src/renderer/src/App.tsx:80`. They are not caused by the Task 4 files.

## Self-Review

- Confirmed SVG bounds union groups and fixed-size nodes before padding.
- Confirmed labels escape `&`, `<`, `>`, `"`, and `'`.
- Confirmed transparent exports emit no background rectangle and themed exports emit `#E8ECE7`.
- Confirmed valid edges use `marker-end="url(#arrow)"` and `fill="none"`.
- Confirmed PNG conversion uses no new dependency, scales the canvas, requests `image/png`, revokes its Blob URL after success or handled failure, and rejects a null canvas blob.
- Confirmed `git show --name-status 3771687` lists only the three files above.

## App.tsx Note

`App.tsx` did not change for Task 4. It is not included in commit `3771687`; the commit contains only the exporter, its test file, and this report. The reference to `App.tsx` arose only because the repository-wide lint command reported its pre-existing line-80 React hook error during verification. The Task 4 brief required only export files, and no application UI file was modified for this task.

## Commit

`3771687 feat: generate diagram exports`
