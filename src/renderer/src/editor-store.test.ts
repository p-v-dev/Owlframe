import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../../core/document'
import { useEditorStore } from './editor-store'

function resetStore(): void {
  useEditorStore.setState({
    document: createEmptyDocument('test', 'Test diagram'),
    path: undefined,
    dirty: false,
    activeViewId: 'view-contexto',
    selectedNodeIds: [],
    selectedEdgeIds: [],
    message: ''
  })
}

describe('editor store', () => {
  beforeEach(resetStore)

  it('creates uniquely identified services and persists a dragged position', () => {
    useEditorStore.getState().addService()
    useEditorStore.getState().addService()

    const [first, second] = useEditorStore.getState().document.views[0].nodes
    useEditorStore.getState().moveNode(first.id, { x: 120, y: 80 })

    expect(first.id).not.toBe(second.id)
    expect(useEditorStore.getState().document.views[0].nodes[0].position).toEqual({
      x: 120,
      y: 80
    })
    expect(useEditorStore.getState().dirty).toBe(true)
  })

  it('removes selected nodes and their attached connections', () => {
    useEditorStore.getState().addService()
    useEditorStore.getState().addService()
    const [first, second] = useEditorStore.getState().document.views[0].nodes
    useEditorStore.getState().connect(first.id, second.id)
    useEditorStore.getState().setSelection([first.id], [])

    useEditorStore.getState().removeSelection()

    expect(useEditorStore.getState().document.views[0]).toMatchObject({
      nodes: [{ id: second.id }],
      edges: []
    })
  })

  it('rejects a self connection with feedback', () => {
    useEditorStore.getState().addService()
    const node = useEditorStore.getState().document.views[0].nodes[0]

    useEditorStore.getState().connect(node.id, node.id)

    expect(useEditorStore.getState().message).toBe('Choose two different services to connect.')
    expect(useEditorStore.getState().document.views[0].edges).toEqual([])
  })

  it('keeps a Contexto edit out of Sistema after switching views', () => {
    useEditorStore.getState().addService()
    useEditorStore.getState().setActiveView('view-sistema')

    expect(useEditorStore.getState().getActiveView().nodes).toEqual([])
  })

  it('retains nodes when their group is removed', () => {
    useEditorStore.getState().addService()
    const node = useEditorStore.getState().getActiveView().nodes[0]
    useEditorStore.getState().addGroup()
    const group = useEditorStore.getState().getActiveView().groups[0]
    useEditorStore.getState().assignNodeToGroup(node.id, group.id)

    useEditorStore.getState().removeGroups([group.id])

    expect(useEditorStore.getState().getActiveView().nodes).toEqual([
      expect.objectContaining({ id: node.id, groupId: undefined })
    ])
  })

  it('sets the viewport on only the active view', () => {
    useEditorStore.getState().setActiveView('view-sistema')
    useEditorStore.getState().setViewport({ x: 24, y: 48, zoom: 1.5 })

    expect(
      useEditorStore.getState().document.views.map((view) => ({
        id: view.id,
        viewport: view.viewport
      }))
    ).toEqual([
      { id: 'view-contexto', viewport: { x: 0, y: 0, zoom: 1 } },
      { id: 'view-sistema', viewport: { x: 24, y: 48, zoom: 1.5 } },
      { id: 'view-servicos', viewport: { x: 0, y: 0, zoom: 1 } },
      { id: 'view-fluxo', viewport: { x: 0, y: 0, zoom: 1 } }
    ])
  })
})
