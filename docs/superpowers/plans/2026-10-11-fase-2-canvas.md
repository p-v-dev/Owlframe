# Fase 2 Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a minimal editable React Flow canvas for the existing Contexto view.

**Architecture:** A Zustand store owns one `DiagramDocument` and ephemeral selection/error fields. `App` derives React Flow nodes and edges directly from the Contexto view and calls store actions, which delegate persisted changes to core document operations.

**Tech Stack:** React 19, TypeScript, @xyflow/react, Zustand, Vitest, Testing Library.

## Global Constraints

- Do not add dependencies.
- `DiagramDocument` is the sole persisted source of nodes, edges and positions.
- Only `view-contexto` is rendered; views, groups, palette, properties, theme, saving and export are out of scope.
- IDs for UI-created nodes and edges use `crypto.randomUUID()`.
- Selection and feedback are ephemeral Zustand state.

---

## File Structure

- Create `src/renderer/src/editor-store.ts`: Zustand document and ephemeral editor actions.
- Create `src/renderer/src/editor-store.test.ts`: unit tests for persisted and ephemeral store behavior.
- Modify `src/renderer/src/App.tsx`: React Flow canvas, custom node and controls.
- Modify `src/renderer/src/App.test.tsx`: UI interaction coverage.
- Modify `ROADMAP.md`: check only delivered Phase 2 entries.

### Task 1: Add the editor store

**Files:**
- Create: `src/renderer/src/editor-store.ts`
- Create: `src/renderer/src/editor-store.test.ts`

**Interfaces:**
- Produces: `useEditorStore`, with `document`, `selectedNodeIds`, `selectedEdgeIds`, `message`, `addService`, `moveNode`, `connect`, `removeSelection`, `setSelection`, and `clearMessage`.

- [ ] **Step 1: Write the failing test**

```ts
it('adds uniquely identified services and persists their position', () => {
  const store = useEditorStore.getState()
  store.addService()
  const node = useEditorStore.getState().document.views[0].nodes[0]
  expect(node.id).toBeTruthy()
  store.moveNode(node.id, { x: 120, y: 80 })
  expect(useEditorStore.getState().document.views[0].nodes[0].position).toEqual({ x: 120, y: 80 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/renderer/src/editor-store.test.ts`

Expected: FAIL because `editor-store` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export const useEditorStore = create<EditorState>((set, get) => ({
  document: createEmptyDocument('untitled', 'Untitled diagram'),
  selectedNodeIds: [], selectedEdgeIds: [], message: '',
  addService: () => { /* addNode with crypto.randomUUID() */ },
  moveNode: (id, position) => set(({ document }) => ({
    document: updateNode(document, 'view-contexto', id, { position })
  }))
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/renderer/src/editor-store.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/editor-store.ts src/renderer/src/editor-store.test.ts
```

### Task 2: Render and edit Contexto

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/App.test.tsx`

**Interfaces:**
- Consumes: `useEditorStore` actions and the Contexto document view.
- Produces: an accessible Add service action, custom service nodes and visible operation feedback.

- [ ] **Step 1: Write the failing test**

```tsx
it('adds a service from the empty canvas', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Add service' }))
  expect(screen.getByText('Service 1')).toBeTruthy()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/renderer/src/App.test.tsx`

Expected: FAIL because the action does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={{ service: ServiceNode }}
  onNodeDragStop={(_, node) => moveNode(node.id, node.position)}
  onConnect={({ source, target }) => connect(source, target)}
  onSelectionChange={({ nodes, edges }) => setSelection(nodes.map(({ id }) => id), edges.map(({ id }) => id))}
  fitView
>
  <Controls />
  {!nodes.length && <Panel position="top-center">Add a service to start diagramming.</Panel>}
</ReactFlow>
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test -- src/renderer/src/App.test.tsx src/renderer/src/editor-store.test.ts`

Expected: PASS, including empty state, Add service, Delete selection and invalid-connection feedback.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/App.test.tsx
```

### Task 3: Update the roadmap and verify

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Mark implemented scope only**

Check React Flow integration, default node, node add/move/select/delete, edge create/select/delete, pan/zoom/fit view, Zustand synchronization, ephemeral UI state and invalid-operation/empty-state feedback. Leave rename, altitude rail and semantic zoom unchecked.

- [ ] **Step 2: Verify project checks**

Run: `npm run check && npm run build`

Expected: both commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add ROADMAP.md
```
