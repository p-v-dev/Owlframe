# MVP Completo do Owlframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalizar as pendências de edição, vistas, grupos, identidade Atlas e exportação do MVP local-first.

**Architecture:** `core/` manterá o documento de quatro vistas como única fonte persistível. O store seleciona a vista ativa e aplica operações puras; o renderer adapta a vista ao React Flow. O exportador independente gera SVG a partir do documento e rasteriza esse SVG no navegador para PNG.

**Tech Stack:** Electron, React 19, TypeScript, Zustand, @xyflow/react, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Não implementar Fases 6 ou posteriores do roadmap.
- `src/core/` não pode importar React Flow, Electron ou APIs do DOM.
- Não adicionar dependências: SVG e PNG usam APIs nativas do navegador.
- Todas as fontes, ícones e exportações devem funcionar sem rede.
- Signal Copper (`#C85F30`) é exclusivo para foco, alerta e ação primária.
- Manter foco visível, contraste adequado e `prefers-reduced-motion`.

---

## File Structure

- `src/core/document.ts`: vistas iniciais e tipos persistíveis.
- `src/core/document.test.ts`: forma e independência das vistas iniciais.
- `src/core/operations.ts`: atualização pura do viewport de uma vista.
- `src/core/operations.test.ts`: atualização isolada de viewport.
- `src/renderer/src/editor-store.ts`: vista ativa, grupos, viewport e ações de edição.
- `src/renderer/src/editor-store.test.ts`: troca de vista, grupo e mutações isoladas.
- `src/renderer/src/diagram-export.ts`: SVG determinístico e conversão SVG para PNG.
- `src/renderer/src/diagram-export.test.ts`: conteúdo, limites e fundo da exportação.
- `src/renderer/src/App.tsx`: régua, paleta, canvas, grupos, propriedades e controles de exportação.
- `src/renderer/src/App.test.tsx`: controles e semântica pública da interface.
- `src/renderer/src/assets/main.css`: fontes locais, tema Atlas, régua e regras responsivas.
- `src/renderer/src/assets/InstrumentSans.ttf` e `src/renderer/src/assets/IBMPlexMono-Regular.woff2`: fontes locais.
- `examples/web-architecture.owlframe` e `examples/microservices.owlframe`: documentos reais de validação.
- `README.md` e `ROADMAP.md`: uso de exportação e itens concluídos.

### Task 1: Criar As Vistas Iniciais Do Documento

**Files:**
- Modify: `src/core/document.ts:68-83`
- Modify: `src/core/document.test.ts`
- Modify: `src/core/operations.ts`
- Modify: `src/core/operations.test.ts`

**Interfaces:**
- Produces: `createEmptyDocument(id, name)` com quatro `DiagramView` independentes, na ordem `contexto`, `sistema`, `servicos`, `fluxo`, e `updateView(document, viewId, patch)`.
- Consumes: `DiagramView` e `DiagramAltitude` existentes.

- [ ] **Step 1: Write the failing test**

```ts
it('creates the four named altitude views with independent canvas state', () => {
  const document = createEmptyDocument('demo', 'Demo')
  expect(document.views.map(({ id, name, altitude }) => ({ id, name, altitude }))).toEqual([
    { id: 'view-contexto', name: 'Contexto', altitude: 'contexto' },
    { id: 'view-sistema', name: 'Sistema', altitude: 'sistema' },
    { id: 'view-servicos', name: 'Serviços', altitude: 'servicos' },
    { id: 'view-fluxo', name: 'Fluxo', altitude: 'fluxo' }
  ])
  expect(document.views[0].nodes).not.toBe(document.views[1].nodes)
})

it('updates only the requested view viewport', () => {
  const document = createEmptyDocument('demo', 'Demo')
  const updated = updateView(document, 'view-sistema', { viewport: { x: 10, y: 20, zoom: 0.8 } })
  expect(updated.views[1].viewport).toEqual({ x: 10, y: 20, zoom: 0.8 })
  expect(updated.views[0].viewport).toEqual({ x: 0, y: 0, zoom: 1 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/core/document.test.ts`

Expected: FAIL because only `Contexto` exists.

- [ ] **Step 3: Write minimal implementation**

Replace the one-element `views` literal with the four fixed view descriptors, each with fresh `nodes`, `edges`, `groups` arrays and `{ x: 0, y: 0, zoom: 1 }`. Add and export `updateView(document, viewId, patch)` in `operations.ts`; implement it through the existing `changeView` helper as `{ ...view, ...patch, id: view.id }`. Do not generate IDs or add UI-only fields.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/core/document.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/core/document.ts src/core/document.test.ts src/core/operations.ts src/core/operations.test.ts
git commit -m "feat: initialize altitude views"
```

### Task 2: Tornar O Store Orientado A Vista E Grupo

**Files:**
- Modify: `src/renderer/src/editor-store.ts:1-202`
- Modify: `src/renderer/src/editor-store.test.ts`

**Interfaces:**
- Consumes: `addGroup`, `removeGroup`, `updateGroup`, `updateNode` e `updateView` do core.
- Produces: `activeViewId`, `setActiveView(viewId)`, `addGroup()`, `updateSelectedGroup(patch)`, `removeGroups(ids)`, `setViewport(viewport)` e ações existentes aplicadas somente à vista ativa.

- [ ] **Step 1: Write the failing tests**

```ts
it('keeps edits isolated in the active view', () => {
  useEditorStore.getState().addService()
  useEditorStore.getState().setActiveView('view-sistema')
  expect(useEditorStore.getState().activeViewId).toBe('view-sistema')
  expect(useEditorStore.getState().getActiveView().nodes).toEqual([])
})

it('removes a group without deleting its member node', () => {
  useEditorStore.getState().addGroup()
  const group = useEditorStore.getState().getActiveView().groups[0]
  useEditorStore.getState().addService()
  const node = useEditorStore.getState().getActiveView().nodes[0]
  useEditorStore.getState().assignNodeToGroup(node.id, group.id)
  useEditorStore.getState().removeGroups([group.id])
  expect(useEditorStore.getState().getActiveView().nodes[0].groupId).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/src/editor-store.test.ts`

Expected: FAIL because the active-view and group actions do not exist.

- [ ] **Step 3: Write minimal implementation**

Replace the module `viewId` constant and `getView` helper with `getActiveView(document, activeViewId)`. Add `activeViewId: 'view-contexto'`, validate `setActiveView` against `document.views`, clear selection on a successful switch, and use `get().activeViewId` in every operation. `addGroup()` creates `Group N` at `{ x: 48, y: 48 }`, size `360 x 240`, Moss color `#8DA59A`; `assignNodeToGroup` calls `updateNode`; group removal calls `removeGroup`. `setViewport` calls `updateView(document, activeViewId, { viewport })`, marks dirty, and never changes selection.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/src/editor-store.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/editor-store.ts src/renderer/src/editor-store.test.ts
git commit -m "feat: manage views and groups in editor"
```

### Task 3: Adicionar A Régua, Grupos E Zoom Semântico Ao Canvas

**Files:**
- Modify: `src/renderer/src/App.tsx:1-245`
- Modify: `src/renderer/src/App.test.tsx`
- Modify: `src/renderer/src/assets/main.css`

**Interfaces:**
- Consumes: `activeViewId`, `getActiveView`, grupo e viewport actions do Task 2.
- Produces: régua `aria-label="Altitude views"`, ações `Add group` e propriedades de grupo, viewport persistido por vista.

- [ ] **Step 1: Write the failing renderer tests**

```tsx
it('switches the active altitude view from the ruler', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Sistema' }))
  expect(useEditorStore.getState().activeViewId).toBe('view-sistema')
})

it('adds a visual group from the component palette', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Add group' }))
  expect(useEditorStore.getState().getActiveView().groups).toHaveLength(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/src/App.test.tsx`

Expected: FAIL because the ruler and group control are absent.

- [ ] **Step 3: Write minimal implementation**

Render `state.getActiveView()` instead of searching `view-contexto`. Place a narrow `<nav aria-label="Altitude views">` before the component palette; render one button per document view, label it by `view.name`, and call `setActiveView(view.id)`. Add an inline SVG contour in the nav with distinct paths keyed by altitude (`contexto` sparse, `servicos` dense, `fluxo` directional). Render groups as absolute background rectangles behind React Flow nodes and offer `Add group` from the palette. Use `onMoveEnd` to call `setViewport`; set `defaultViewport` from the active view and key ReactFlow by `activeViewId`. Derive a `compact` boolean from zoom below `0.65`; pass it to nodes so icon and secondary text are hidden while label and handles remain. Keep Delete behavior for nodes and edges.

- [ ] **Step 4: Apply the Atlas and responsive CSS**

Add local `@font-face` rules for Instrument Sans and IBM Plex Mono. Assign Instrument Sans to the application and IBM Plex Mono to technical labels. Style the vertical ruler separately from the palette, use CSS media queries to move both controls above the canvas below `768px`, and retain the existing reduced-motion override. All interactive controls receive an explicit `:focus-visible` outline in Signal Copper.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/renderer/src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/renderer/src/App.tsx src/renderer/src/App.test.tsx src/renderer/src/assets/main.css src/renderer/src/assets/InstrumentSans.ttf src/renderer/src/assets/IBMPlexMono-Regular.woff2
git commit -m "feat: add altitude canvas navigation"
```

### Task 4: Criar O Exportador SVG E PNG Sem Dependências

**Files:**
- Create: `src/renderer/src/diagram-export.ts`
- Create: `src/renderer/src/diagram-export.test.ts`

**Interfaces:**
- Consumes: `DiagramView` e as cores Atlas.
- Produces: `createDiagramSvg(view, options): string` e `createPngBlob(svg, scale): Promise<Blob>`.

- [ ] **Step 1: Write the failing tests**

```ts
it('creates a bounded SVG containing group, node, label and edge', () => {
  const svg = createDiagramSvg(view, { background: 'transparent' })
  expect(svg).toContain('<svg')
  expect(svg).toContain('Service 1')
  expect(svg).toContain('marker-end')
  expect(svg).toContain('fill="none"')
})

it('uses Survey when the selected background is themed', () => {
  expect(createDiagramSvg(view, { background: 'theme' })).toContain('#E8ECE7')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/src/diagram-export.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal SVG implementation**

Calculate bounds from every group rectangle and every node using a fixed node size of `176 x 56`, then add a `32` pixel padding. Escape `&`, `<`, `>`, `"`, and `'` in labels. Emit a `<defs>` arrow marker, group `<rect>` and `<text>`, straight edge `<line marker-end="url(#arrow)">`, node `<rect>` and `<text>`, and a full-size background `<rect>` only for `background: 'theme'`. Return a standalone UTF-8 SVG string with `viewBox`, `width`, and `height`; empty views export a `64 x 64` canvas.

- [ ] **Step 4: Write PNG conversion**

Implement `createPngBlob` by creating an `Image` from a Blob URL, drawing it onto an in-memory canvas at `scale` (allowed values `1`, `2`, `3`), resolving `canvas.toBlob` as `image/png`, and always revoking the Blob URL. Reject when the image fails or `toBlob` returns null.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/renderer/src/diagram-export.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/renderer/src/diagram-export.ts src/renderer/src/diagram-export.test.ts
git commit -m "feat: generate diagram exports"
```

### Task 5: Expor Controles De Exportação No Editor

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/App.test.tsx`

**Interfaces:**
- Consumes: `createDiagramSvg` and `createPngBlob` from `diagram-export.ts`.
- Produces: botões `Export SVG` e `Export PNG`, seletor de escala e seletor de fundo.

- [ ] **Step 1: Write the failing test**

```tsx
it('offers PNG and SVG export controls', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Export SVG' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Export PNG' })).toBeTruthy()
  expect(screen.getByLabelText('Export background')).toBeTruthy()
  expect(screen.getByLabelText('PNG scale')).toBeTruthy()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/src/App.test.tsx`

Expected: FAIL because the controls do not exist.

- [ ] **Step 3: Write minimal implementation**

Keep export options as component-local state: background defaults to `theme`, scale defaults to `2`. For SVG, create a `Blob([createDiagramSvg(view, { background })], { type: 'image/svg+xml' })`; for PNG, pass the same SVG to `createPngBlob`. Trigger a download through a temporary `<a>` with filename derived from `document.metadata.name`, replacing non-alphanumeric runs with `-`, and extension `.svg` or `.png`. Revoke each Object URL after click. Do not place the canvas DOM or editor controls in the output.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/App.tsx src/renderer/src/App.test.tsx
git commit -m "feat: add export controls"
```

### Task 6: Validar Com Exemplos E Atualizar A Documentação

**Files:**
- Create: `examples/web-architecture.owlframe`
- Create: `examples/microservices.owlframe`
- Modify: `README.md`
- Modify: `ROADMAP.md`

**Interfaces:**
- Consumes: versão de schema e formato `DiagramDocument` atuais.
- Produces: dois projetos Owlframe válidos e documentação de uso de exportação.

- [ ] **Step 1: Write the failing validation test**

Add a test in `src/core/validation.test.ts` that reads both example files with `readFile`, parses JSON and asserts `validateDocument(JSON.parse(contents)).ok` is `true`. Use `new URL('../../../examples/web-architecture.owlframe', import.meta.url)` and `new URL('../../../examples/microservices.owlframe', import.meta.url)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/core/validation.test.ts`

Expected: FAIL because the files do not exist.

- [ ] **Step 3: Add the two valid examples**

Create a web document containing client, gateway, service and database with three edges and a `VPC` group. Create a microservices document containing gateway, three services, queue and database, grouped into `Kubernetes Cluster`, with at least six edges. Use all four required views in each document; unused views have empty arrays and default viewports. Use only allowed node kinds, edge styles, color strings and unique IDs.

- [ ] **Step 4: Document and close the roadmap items**

In the README, add a concise `Exportação` section explaining SVG, PNG, scale and background. In the roadmap, check only the completed items from Fases 2, 4 and 5; do not check any Phase 6+ item.

- [ ] **Step 5: Run validation and full verification**

Run: `npm run check`

Expected: PASS with formatting, lint, typecheck and all tests green.

- [ ] **Step 6: Commit**

```powershell
git add examples src/core/validation.test.ts README.md ROADMAP.md
git commit -m "docs: complete MVP roadmap"
```
