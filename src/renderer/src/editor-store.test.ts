import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../../core/document'
import { useEditorStore } from './editor-store'

function resetStore(): void {
  useEditorStore.setState({
    document: createEmptyDocument('test', 'Test diagram'),
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
})
