# Fase 1 - Modelo de Documento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um modelo TypeScript puro e versionado para diagramas Owlframe com vistas de altitude, operações imutáveis e validação de arquivos.

**Architecture:** `src/core/document.ts` define o formato serializável e o documento inicial; `src/core/operations.ts` aplica mudanças imutáveis; `src/core/validation.ts` valida dados desconhecidos antes de convertê-los para o modelo. Nenhum módulo de `core` importa React, Electron, React Flow ou MCP.

**Tech Stack:** TypeScript 5, Vitest 5 e APIs JavaScript padrão.

## Global Constraints

- Não adicionar dependências.
- `src/core/` não importa Electron, React, React Flow, Zustand ou MCP.
- O documento contém `schemaVersion`, `metadata` e `views`.
- Uma vista contém `id`, `name`, `altitude`, `nodes`, `edges`, `groups` e `viewport`.
- Altitudes válidas são `contexto`, `sistema`, `servicos` e `fluxo`.
- IDs são recebidos pelas operações e preservados sem regeneração.
- A vista inicial é `Contexto`, com altitude `contexto`.

---

## File Structure

- Modify: `tsconfig.node.json` - inclui o domínio puro na verificação de tipos.
- Create: `src/core/document.ts` - tipos, constantes e fábrica do documento vazio.
- Create: `src/core/document.test.ts` - teste da estrutura inicial e serialização.
- Create: `src/core/operations.ts` - operações imutáveis de vistas, nós e arestas.
- Create: `src/core/operations.test.ts` - testes de operações e integridade de referências.
- Create: `src/core/validation.ts` - validação de dados de arquivo e mensagens de erro.
- Create: `src/core/validation.test.ts` - testes de aceitação e rejeição de documentos.

### Task 1: Definir o documento puro

**Files:**

- Modify: `tsconfig.node.json:3`
- Create: `src/core/document.ts`
- Create: `src/core/document.test.ts`

**Interfaces:**

- Produces: `DiagramDocument`, `DiagramView`, `DiagramNode`, `DiagramEdge`, `DiagramGroup`, `DiagramAltitude`, `createEmptyDocument()` e `SCHEMA_VERSION`.

- [ ] **Step 1: Write the failing test**

Create `src/core/document.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'

describe('createEmptyDocument', () => {
  it('creates a versioned document with a Contexto view', () => {
    expect(createEmptyDocument('project-1', 'Payments')).toMatchObject({
      schemaVersion: 1,
      metadata: { id: 'project-1', name: 'Payments' },
      views: [{ id: 'view-contexto', name: 'Contexto', altitude: 'contexto' }]
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/document.test.ts`

Expected: FAIL because `./document` does not exist.

- [ ] **Step 3: Write minimal implementation**

Update `tsconfig.node.json` `include` to:

```json
["electron.vite.config.*", "src/main/**/*", "src/preload/**/*", "src/core/**/*"]
```

Create `src/core/document.ts`:

```ts
export const SCHEMA_VERSION = 1

export type DiagramAltitude = 'contexto' | 'sistema' | 'servicos' | 'fluxo'
export type DiagramNodeKind = 'service' | 'database' | 'queue' | 'gateway' | 'client'
export type DiagramEdgeStyle = 'solid' | 'dashed'

export interface DiagramMetadata {
  id: string
  name: string
}

export interface DiagramPosition {
  x: number
  y: number
}
export interface DiagramViewport extends DiagramPosition {
  zoom: number
}
export interface DiagramStyle {
  color: string
  icon?: string
}

export interface DiagramNode {
  id: string
  kind: DiagramNodeKind
  label: string
  position: DiagramPosition
  style: DiagramStyle
  groupId?: string
}

export interface DiagramEdge {
  id: string
  sourceId: string
  targetId: string
  label?: string
  style: DiagramEdgeStyle
}

export interface DiagramGroup {
  id: string
  label: string
  position: DiagramPosition
  width: number
  height: number
  style: DiagramStyle
}

export interface DiagramView {
  id: string
  name: string
  altitude: DiagramAltitude
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  groups: DiagramGroup[]
  viewport: DiagramViewport
}

export interface DiagramDocument {
  schemaVersion: typeof SCHEMA_VERSION
  metadata: DiagramMetadata
  views: DiagramView[]
}

export function createEmptyDocument(id: string, name: string): DiagramDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: { id, name },
    views: [
      {
        id: 'view-contexto',
        name: 'Contexto',
        altitude: 'contexto',
        nodes: [],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    ]
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/core/document.test.ts && npm run typecheck`

Expected: PASS with one test and no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.node.json src/core/document.ts src/core/document.test.ts
```

### Task 2: Implementar operações imutáveis

**Files:**

- Create: `src/core/operations.ts`
- Create: `src/core/operations.test.ts`

**Interfaces:**

- Consumes: `DiagramDocument`, `DiagramView`, `DiagramNode` and `DiagramEdge` from `document.ts`.
- Produces: `addNode`, `updateNode`, `removeNode`, `addEdge` and `removeEdge`.

- [ ] **Step 1: Write the failing test**

Create `src/core/operations.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'
import { addEdge, addNode, removeNode } from './operations'

const node = (id: string) => ({
  id,
  kind: 'service' as const,
  label: id,
  position: { x: 0, y: 0 },
  style: { color: '#315B68' }
})

describe('diagram operations', () => {
  it('removes edges attached to a removed node', () => {
    const document = createEmptyDocument('project-1', 'Payments')
    const withNodes = addNode(
      addNode(document, 'view-contexto', node('api')),
      'view-contexto',
      node('worker')
    )
    const withEdge = addEdge(withNodes, 'view-contexto', {
      id: 'edge-api-worker',
      sourceId: 'api',
      targetId: 'worker',
      style: 'solid'
    })

    expect(removeNode(withEdge, 'view-contexto', 'api').views[0].edges).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/operations.test.ts`

Expected: FAIL because `./operations` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/operations.ts`:

```ts
import type { DiagramDocument, DiagramEdge, DiagramNode, DiagramView } from './document'

function changeView(
  document: DiagramDocument,
  viewId: string,
  change: (view: DiagramView) => DiagramView
): DiagramDocument {
  const view = document.views.find((candidate) => candidate.id === viewId)
  if (!view) throw new Error(`View not found: ${viewId}`)
  return {
    ...document,
    views: document.views.map((candidate) =>
      candidate.id === viewId ? change(candidate) : candidate
    )
  }
}

export function addNode(
  document: DiagramDocument,
  viewId: string,
  node: DiagramNode
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (view.nodes.some((candidate) => candidate.id === node.id))
      throw new Error(`Node already exists: ${node.id}`)
    if (node.groupId && !view.groups.some((group) => group.id === node.groupId))
      throw new Error(`Group not found: ${node.groupId}`)
    return { ...view, nodes: [...view.nodes, node] }
  })
}

export function updateNode(
  document: DiagramDocument,
  viewId: string,
  nodeId: string,
  patch: Partial<Omit<DiagramNode, 'id'>>
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (!view.nodes.some((node) => node.id === nodeId)) throw new Error(`Node not found: ${nodeId}`)
    return {
      ...view,
      nodes: view.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
    }
  })
}

export function removeNode(
  document: DiagramDocument,
  viewId: string,
  nodeId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => ({
    ...view,
    nodes: view.nodes.filter((node) => node.id !== nodeId),
    edges: view.edges.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId)
  }))
}

export function addEdge(
  document: DiagramDocument,
  viewId: string,
  edge: DiagramEdge
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (view.edges.some((candidate) => candidate.id === edge.id))
      throw new Error(`Edge already exists: ${edge.id}`)
    if (
      edge.sourceId === edge.targetId ||
      !view.nodes.some((node) => node.id === edge.sourceId) ||
      !view.nodes.some((node) => node.id === edge.targetId)
    )
      throw new Error('Edge endpoints must exist and differ')
    return { ...view, edges: [...view.edges, edge] }
  })
}

export function removeEdge(
  document: DiagramDocument,
  viewId: string,
  edgeId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => ({
    ...view,
    edges: view.edges.filter((edge) => edge.id !== edgeId)
  }))
}
```

- [ ] **Step 4: Expand failing coverage before committing**

Add tests that `addEdge` rejects an absent endpoint, `addNode` rejects a duplicate ID, and `updateNode` preserves the node ID. Run: `npm run test -- src/core/operations.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/operations.ts src/core/operations.test.ts
```

### Task 3: Validar documentos de arquivo

**Files:**

- Create: `src/core/validation.ts`
- Create: `src/core/validation.test.ts`

**Interfaces:**

- Consumes: `DiagramDocument`, `DiagramAltitude`, `DiagramNodeKind` and `DiagramEdgeStyle` from `document.ts`.
- Produces: `validateDocument(value: unknown): { ok: true; document: DiagramDocument } | { ok: false; error: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/core/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'
import { validateDocument } from './validation'

describe('validateDocument', () => {
  it('rejects an edge that references an unknown node', () => {
    const document = createEmptyDocument('project-1', 'Payments')
    document.views[0].edges.push({
      id: 'bad-edge',
      sourceId: 'api',
      targetId: 'worker',
      style: 'solid'
    })

    expect(validateDocument(document)).toEqual({
      ok: false,
      error: 'View view-contexto edge bad-edge references an unknown node'
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/core/validation.test.ts`

Expected: FAIL because `./validation` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/validation.ts` with `isRecord(value: unknown): value is Record<string, unknown>`, then implement `validateDocument` to return `{ ok: false, error }` for a non-object root, schema version other than `1`, missing string metadata `id` or `name`, an empty `views` array, invalid altitudes, duplicate node or edge IDs, invalid node kinds or edge styles, and unknown edge endpoints. After these checks, return `{ ok: true, document: value as DiagramDocument }`.

- [ ] **Step 4: Add complete validation tests and verify**

Add tests for a valid empty document, schema version `2`, altitude `cloud`, duplicate node IDs, and a missing edge target. Run: `npm run check`.

Expected: PASS with all core tests and existing renderer tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/validation.ts src/core/validation.test.ts
```

## Plan Self-Review

- Spec coverage: the plan models named views, all four altitudes, independent view canvases and viewports, stable IDs, nodes, groups, edges, styles, operations, defaults, validation and tests without UI dependencies.
- Placeholder scan: Task 3 validation rules are explicit; no unspecified behavior is required for Fase 1.
- Type consistency: all operation and validation names consume the exported types from `document.ts`.
