import { create } from 'zustand'
import {
  createEmptyDocument,
  type DiagramDocument,
  type DiagramPosition,
  type DiagramView
} from '../../core/document'
import { addEdge, addNode, removeEdge, removeNode, updateNode } from '../../core/operations'

const viewId = 'view-contexto'

interface EditorState {
  document: DiagramDocument
  path?: string
  dirty: boolean
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  message: string
  addService: () => void
  moveNode: (nodeId: string, position: DiagramPosition) => void
  connect: (sourceId: string | null, targetId: string | null) => void
  setSelection: (nodeIds: string[], edgeIds: string[]) => void
  removeSelection: () => void
  removeNodes: (nodeIds: string[]) => void
  removeEdges: (edgeIds: string[]) => void
  newProject: () => Promise<void>
  openProject: () => Promise<void>
  save: () => Promise<void>
  saveAs: () => Promise<void>
}

function getView(document: DiagramDocument): DiagramView {
  return document.views.find((view) => view.id === viewId)!
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function canDiscard(dirty: boolean): boolean {
  return !dirty || window.confirm('Discard unsaved changes?')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not complete that project operation.'
}

export const useEditorStore = create<EditorState>((set, get) => ({
  document: createEmptyDocument('untitled', 'Untitled diagram'),
  path: undefined,
  dirty: false,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  message: '',
  addService: () => {
    const view = getView(get().document)
    const number = view.nodes.length + 1

    set({
      document: addNode(get().document, viewId, {
        id: crypto.randomUUID(),
        kind: 'service',
        label: `Service ${number}`,
        position: { x: 80 + (number - 1) * 48, y: 80 + (number - 1) * 48 },
        style: { color: '#64748b' }
      }),
      dirty: true,
      message: ''
    })
  },
  moveNode: (nodeId, position) =>
    set(({ document }) => ({
      document: updateNode(document, viewId, nodeId, { position }),
      dirty: true
    })),
  connect: (sourceId, targetId) => {
    const view = getView(get().document)
    if (!sourceId || !targetId || sourceId === targetId) {
      set({ message: 'Choose two different services to connect.' })
      return
    }
    if (view.edges.some((edge) => edge.sourceId === sourceId && edge.targetId === targetId)) {
      set({ message: 'These services are already connected.' })
      return
    }

    try {
      set({
        document: addEdge(get().document, viewId, {
          id: crypto.randomUUID(),
          sourceId,
          targetId,
          style: 'solid'
        }),
        dirty: true,
        message: ''
      })
    } catch {
      set({ message: 'Choose two services that exist in this diagram.' })
    }
  },
  setSelection: (selectedNodeIds, selectedEdgeIds) => {
    const current = get()
    if (
      sameIds(current.selectedNodeIds, selectedNodeIds) &&
      sameIds(current.selectedEdgeIds, selectedEdgeIds)
    ) {
      return
    }
    set({ selectedNodeIds, selectedEdgeIds })
  },
  removeSelection: () => {
    const { document, selectedNodeIds, selectedEdgeIds } = get()
    let next = document
    for (const nodeId of selectedNodeIds) next = removeNode(next, viewId, nodeId)
    for (const edgeId of selectedEdgeIds) {
      if (getView(next).edges.some((edge) => edge.id === edgeId))
        next = removeEdge(next, viewId, edgeId)
    }
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeNodes: (nodeIds) => {
    let next = get().document
    for (const nodeId of nodeIds) next = removeNode(next, viewId, nodeId)
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeEdges: (edgeIds) => {
    let next = get().document
    for (const edgeId of edgeIds) {
      if (getView(next).edges.some((edge) => edge.id === edgeId))
        next = removeEdge(next, viewId, edgeId)
    }
    set({ document: next, dirty: true, selectedEdgeIds: [] })
  },
  newProject: async () => {
    if (!canDiscard(get().dirty)) return
    try {
      const { document } = await window.owlframe.new()
      set({
        document,
        path: undefined,
        dirty: false,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        message: ''
      })
    } catch (error) {
      set({ message: errorMessage(error) })
    }
  },
  openProject: async () => {
    if (!canDiscard(get().dirty)) return
    try {
      const result = await window.owlframe.open()
      if (!result.canceled) {
        set({
          document: result.document,
          path: result.path,
          dirty: false,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          message: ''
        })
      }
    } catch (error) {
      set({ message: errorMessage(error) })
    }
  },
  save: async () => {
    try {
      const result = await window.owlframe.save(get().document)
      if (!result.canceled) set({ path: result.path, dirty: false, message: '' })
    } catch (error) {
      set({ message: errorMessage(error) })
    }
  },
  saveAs: async () => {
    try {
      const result = await window.owlframe.saveAs(get().document)
      if (!result.canceled) set({ path: result.path, dirty: false, message: '' })
    } catch (error) {
      set({ message: errorMessage(error) })
    }
  }
}))
