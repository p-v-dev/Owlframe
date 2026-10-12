import { describe, expect, it } from 'vitest'
import {
  createEmptyDocument,
  type DiagramGroup,
  type DiagramNode,
  type DiagramView
} from './document'
import {
  addEdge,
  addGroup,
  addNode,
  addView,
  removeEdge,
  removeGroup,
  removeNode,
  removeView,
  renameView,
  updateGroup,
  updateNode,
  updateView
} from './operations'

const node = (id: string, groupId?: string): DiagramNode => ({
  id,
  kind: 'service',
  label: id,
  position: { x: 0, y: 0 },
  style: { color: '#315B68' },
  ...(groupId ? { groupId } : {})
})

const group = (id: string): DiagramGroup => ({
  id,
  label: id,
  position: { x: 0, y: 0 },
  width: 200,
  height: 100,
  style: { color: '#315B68' }
})

const view = (id: string): DiagramView => ({
  id,
  name: id,
  altitude: 'sistema',
  nodes: [],
  edges: [],
  groups: [],
  viewport: { x: 0, y: 0, zoom: 1 }
})

describe('view operations', () => {
  it('adds and renames a view without changing the input document', () => {
    const document = createEmptyDocument('project-1', 'Payments')
    const withView = addView(document, view('view-system'))

    expect(renameView(withView, 'view-system', 'System').views.at(-1)?.name).toBe('System')
    expect(document.views).toHaveLength(4)
  })

  it('rejects duplicate and missing view IDs', () => {
    const document = createEmptyDocument('project-1', 'Payments')

    expect(() => addView(document, view('view-contexto'))).toThrow(
      'View already exists: view-contexto'
    )
    expect(() => removeView(document, 'missing')).toThrow('View not found: missing')
  })

  it('updates one view without changing another', () => {
    const document = createEmptyDocument('project-1', 'Payments')
    const updated = updateView(document, 'view-sistema', { viewport: { x: 10, y: 20, zoom: 2 } })

    expect(updated.views[1].viewport).toEqual({ x: 10, y: 20, zoom: 2 })
    expect(updated.views[0].viewport).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})

describe('node and group operations', () => {
  it('adds and updates a node while preserving its ID', () => {
    const document = addNode(
      createEmptyDocument('project-1', 'Payments'),
      'view-contexto',
      node('api')
    )

    expect(
      updateNode(document, 'view-contexto', 'api', { label: 'API' }).views[0].nodes[0]
    ).toMatchObject({
      id: 'api',
      label: 'API'
    })
  })

  it('rejects duplicate node IDs and missing groups', () => {
    const document = addNode(
      createEmptyDocument('project-1', 'Payments'),
      'view-contexto',
      node('api')
    )

    expect(() => addNode(document, 'view-contexto', node('api'))).toThrow(
      'Node already exists: api'
    )
    expect(() => addNode(document, 'view-contexto', node('worker', 'missing'))).toThrow(
      'Group not found: missing'
    )
  })

  it('removes attached edges with a node', () => {
    const withNodes = addNode(
      addNode(createEmptyDocument('project-1', 'Payments'), 'view-contexto', node('api')),
      'view-contexto',
      node('worker')
    )
    const document = addEdge(withNodes, 'view-contexto', {
      id: 'edge-api-worker',
      sourceId: 'api',
      targetId: 'worker',
      style: 'solid'
    })

    expect(removeNode(document, 'view-contexto', 'api').views[0]).toMatchObject({
      nodes: [node('worker')],
      edges: []
    })
  })

  it('updates a group and clears its reference from nodes when removed', () => {
    const withGroup = addGroup(
      createEmptyDocument('project-1', 'Payments'),
      'view-contexto',
      group('platform')
    )
    const document = addNode(withGroup, 'view-contexto', node('api', 'platform'))

    expect(
      updateGroup(document, 'view-contexto', 'platform', { label: 'Platform' }).views[0].groups[0]
        .label
    ).toBe('Platform')
    expect(removeGroup(document, 'view-contexto', 'platform').views[0]).toMatchObject({
      groups: [],
      nodes: [node('api')]
    })
  })
})

describe('edge operations', () => {
  it('adds and removes an edge with existing distinct endpoints', () => {
    const withNodes = addNode(
      addNode(createEmptyDocument('project-1', 'Payments'), 'view-contexto', node('api')),
      'view-contexto',
      node('worker')
    )
    const withEdge = addEdge(withNodes, 'view-contexto', {
      id: 'edge-api-worker',
      sourceId: 'api',
      targetId: 'worker',
      style: 'solid'
    })

    expect(removeEdge(withEdge, 'view-contexto', 'edge-api-worker').views[0].edges).toEqual([])
  })

  it('rejects duplicate IDs and invalid endpoints', () => {
    const document = addNode(
      createEmptyDocument('project-1', 'Payments'),
      'view-contexto',
      node('api')
    )
    const edge = {
      id: 'edge-api-worker',
      sourceId: 'api',
      targetId: 'worker',
      style: 'solid' as const
    }

    expect(() => addEdge(document, 'view-contexto', edge)).toThrow(
      'Edge endpoints must exist and differ'
    )
    expect(() => addEdge(document, 'view-contexto', { ...edge, targetId: 'api' })).toThrow(
      'Edge endpoints must exist and differ'
    )
  })
})
