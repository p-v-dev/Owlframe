# Task 6 Evidence: Validate Examples And Update Documentation

## Status

Implemented Task 6. The task commit includes the existing `ROADMAP.md` updates as requested.

## Deliverables

- `examples/web-architecture.owlframe`: schema v1 document with Contexto, Sistema, Servicos, and Fluxo views. The Sistema view contains a client, gateway, service, database, three edges, and a VPC group.
- `examples/microservices.owlframe`: schema v1 document with all four altitude views. The Servicos view contains a gateway, three services, queue, database, Kubernetes Cluster group, and seven edges.
- `src/core/validation.test.ts`: reads both examples from disk, parses their JSON, and asserts `validateDocument(...).ok === true`.
- `README.md`: concise `Exportacao` section for SVG/PNG output, PNG scale, and transparent/theme backgrounds.
- `ROADMAP.md`: preserves the current Fase 2 and Fase 4 updates, marks the Fase 4 examples task, marks the completed Fase 5 export items, and leaves Fase 6 onward unchanged.

## TDD Evidence

1. Added the parameterized disk-backed validation test before creating either example.
2. RED command:

   ```text
   npm test -- src/core/validation.test.ts
   ```

3. RED result: 15 existing tests passed and the two new tests failed with the expected missing-file errors:

   ```text
   ENOENT: no such file or directory, open '...\\examples\\web-architecture.owlframe'
   ENOENT: no such file or directory, open '...\\examples\\microservices.owlframe'
   ```

4. Added the two valid schema v1 documents and no production code.
5. GREEN command:

   ```text
   npm test -- src/core/validation.test.ts
   ```

6. GREEN result: 1 test file passed, 17 tests passed.

## Verification

```text
npm test
Test Files  8 passed (8)
Tests       55 passed (55)
```

```text
npm run typecheck
typecheck:node  tsc --noEmit -p tsconfig.node.json --composite false
typecheck:web   tsc --noEmit -p tsconfig.web.json --composite false
Exit status: 0
```

```text
npx prettier --check README.md ROADMAP.md src/core/validation.test.ts
npx prettier --parser json --check examples/web-architecture.owlframe examples/microservices.owlframe
npx eslint src/core/validation.test.ts
All scoped checks passed.
```

```text
git diff --check
Exit status: 0
```

```text
node -e "...assert required view, node, edge, and group counts..."
Exit status: 0
```

## Required Check Status

```text
npm run check
```

The command remains blocked at `prettier --check .` by 40 pre-existing unrelated files. The failures include repository configuration, prior design and plan documents, `package.json`, core files other than `validation.test.ts`, main/preload files, renderer files, and `sdd/task-3-report.md`. The Task 6 tracked files are absent from that failure list; the two new `.owlframe` files need an explicit JSON parser because their custom extension is not recognized by Prettier's default inference.

## Self-Review

- Confirmed both examples have exactly one view for each required altitude and retain empty default arrays and default viewports outside their populated view.
- Confirmed all group references and edge endpoints resolve within their view, and the examples satisfy the requested node and edge counts.
- Confirmed the test exercises the files from disk rather than validating in-memory duplicates.
- Confirmed the ROADMAP change includes the user-provided current checklist updates and does not alter Fase 6 or later.
- Confirmed uncommitted `sdd/task-1-report.md`, `sdd/task-3-report.md`, `sdd/task-4-report.md`, and `sdd/task-5-report.md` are unrelated and excluded from the Task 6 commit.

## Concern

Repository-wide formatting is not clean because of the 40 unrelated files above. No Task 6 behavior, type checking, scoped formatting, or tests are failing.

## P1 Review Fix: Preserve SVG Icons

### Root Cause

`ServiceNode` resolved `node.style.icon` through the local `simple-icons` catalog, but `createDiagramSvg` emitted only each node rectangle and label. SVG and PNG exports therefore omitted configured technology icons.

### Change

- Extracted the existing five-icon UI catalog to `src/renderer/src/tech-icons.ts`.
- Reused that catalog in both `App.tsx` and `diagram-export.ts`; no network request or dependency was added.
- SVG export emits the supported Simple Icons path and shifts the node label to preserve both renderings. Unknown icon keys retain the existing label-only output.

### TDD Evidence

1. Added `preserves a supported node icon path and label in SVG output` before changing the exporter.
2. RED command:

   ```text
   npm test -- src/renderer/src/diagram-export.test.ts
   ```

3. RED result: 4 tests passed and the new test failed as expected because the SVG did not contain `siDocker.path`.
4. Added the shared local catalog and minimal SVG path rendering.
5. GREEN command:

   ```text
   npm test -- src/renderer/src/diagram-export.test.ts
   ```

6. GREEN result: 1 test file passed, 5 tests passed.

### Verification

```text
npm test -- src/renderer/src/diagram-export.test.ts
Test Files  1 passed (1)
Tests       5 passed (5)
```

```text
npm run typecheck
typecheck:node  tsc --noEmit -p tsconfig.node.json --composite false
typecheck:web   tsc --noEmit -p tsconfig.web.json --composite false
Exit status: 0
```

```text
npx prettier --check src/renderer/src/diagram-export.ts src/renderer/src/diagram-export.test.ts src/renderer/src/tech-icons.ts
All scoped formatting checks passed.
```

`App.tsx` retains its pre-existing `react-hooks/set-state-in-effect` lint error at line 75. The icon catalog extraction does not touch that effect.

## Final Review Fixes

### Root Causes

- Groups were rendered as an `aria-hidden`, pointer-suppressed decoration. The editor store also attempted group updates using `selectedNodeIds`, so a group could never become an editable selection.
- React Flow edges were reduced to IDs and endpoints, discarding the persisted `style` and optional `label` fields.
- SVG export emitted edge geometry but not the persisted label.
- `App` copied the active view viewport into local state in a synchronous effect, which triggered `react-hooks/set-state-in-effect`.

### Changes

- Added separate ephemeral group selection. Clickable group buttons open a contextual group panel with editable title and color, assign the currently selected nodes, and delete the selected group. The group layer is no longer hidden from assistive technology or pointer-suppressed.
- Kept persisted edge metadata when mapping to React Flow. Dashed edges use `strokeDasharray: '6 4'`; labels are passed through to React Flow.
- SVG/PNG exports render escaped edge labels at each edge midpoint while retaining dashed styling.
- Replaced the viewport synchronization effect with a document-ID-tagged transient viewport value. A replacement document renders its persisted viewport immediately, while in-progress canvas movement remains local until `onMoveEnd` persists it.
- `ROADMAP.md` was not changed: the existing completed group, edge-style, and export checklist items are accurate after these fixes.

### TDD Evidence

1. Added the group editing/assignment/deletion and React Flow edge mapping regressions to `App.test.tsx`, plus an escaped edge-label assertion to `diagram-export.test.ts`.
2. RED commands:

   ```text
   npm test -- src/renderer/src/App.test.tsx
   npm test -- src/renderer/src/diagram-export.test.ts
   ```

3. RED results: group controls were absent, React Flow received only edge IDs/endpoints, and SVG output omitted `API &lt;sync&gt;`.
4. Implemented the focused store, renderer, export, and viewport changes.
5. GREEN results: focused App/store tests passed 20/20; export tests passed 5/5.

### Final Verification

```text
npm test
Test Files  8 passed (8)
Tests       58 passed (58)
```

```text
npm run typecheck
Exit status: 0
```

```text
npm run lint
Exit status: 0; 941 pre-existing Prettier CRLF warnings, 0 errors.
```

```text
npx prettier --check src/renderer/src/App.tsx src/renderer/src/App.test.tsx src/renderer/src/editor-store.ts src/renderer/src/diagram-export.ts src/renderer/src/diagram-export.test.ts src/renderer/src/assets/main.css
All changed source and test files use Prettier code style.
```
