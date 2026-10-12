import { create } from 'zustand'
import {
  createEmptyDocument,
  type DiagramDocument,
  type DiagramGroup,
  type DiagramPosition,
  type DiagramView,
  type DiagramNodeKind,
  type DiagramStyle,
  type DiagramViewport
} from '../../core/document'
import {
  addEdge,
  addGroup,
  addNode,
  removeEdge,
  removeGroup,
  removeNode,
  updateGroup,
  updateNode,
  updateView
} from '../../core/operations'

interface EditorState {
  document: DiagramDocument
  path?: string
  dirty: boolean
  activeViewId: string
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  message: string
  getActiveView: () => DiagramView
  setActiveView: (viewId: string) => void
  addService: () => void
  addComponent: (kind: DiagramNodeKind) => void
  addGroup: () => void
  updateSelectedGroup: (patch: Partial<Omit<DiagramGroup, 'id'>>) => void
  removeGroups: (ids: string[]) => void
  assignNodeToGroup: (nodeId: string, groupId: string | undefined) => void
  setViewport: (viewport: DiagramViewport) => void
  updateSelectedNode: (patch: {
    label?: string
    kind?: DiagramNodeKind
    style?: DiagramStyle
  }) => void
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

function getActiveView(document: DiagramDocument, activeViewId: string): DiagramView {
  return document.views.find((view) => view.id === activeViewId)!
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
  activeViewId: 'view-contexto',
  selectedNodeIds: [],
  selectedEdgeIds: [],
  message: '',
  getActiveView: () => getActiveView(get().document, get().activeViewId),
  setActiveView: (activeViewId) => {
    if (!get().document.views.some((view) => view.id === activeViewId)) return
    set({ activeViewId, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  addService: () => {
    get().addComponent('service')
  },
  addComponent: (kind) => {
    const { document, activeViewId } = get()
    const view = getActiveView(document, activeViewId)
    const number = view.nodes.length + 1
    const label = `${kind[0].toUpperCase()}${kind.slice(1)} ${number}`

    set({
      document: addNode(document, activeViewId, {
        id: crypto.randomUUID(),
        kind,
        label,
        position: { x: 80 + (number - 1) * 48, y: 80 + (number - 1) * 48 },
        style: { color: '#315B68' }
      }),
      dirty: true,
      message: ''
    })
  },
  updateSelectedNode: (patch) => {
    const nodeId = get().selectedNodeIds[0]
    if (!nodeId) return
    set(({ document, activeViewId }) => ({
      document: updateNode(document, activeViewId, nodeId, patch),
      dirty: true
    }))
  },
  moveNode: (nodeId, position) =>
    set(({ document, activeViewId }) => ({
      document: updateNode(document, activeViewId, nodeId, { position }),
      dirty: true
    })),
  connect: (sourceId, targetId) => {
    const { document, activeViewId } = get()
    const view = getActiveView(document, activeViewId)
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
        document: addEdge(document, activeViewId, {
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
  addGroup: () => {
    const { document, activeViewId } = get()
    const number = getActiveView(document, activeViewId).groups.length + 1
    set({
      document: addGroup(document, activeViewId, {
        id: crypto.randomUUID(),
        label: `Group ${number}`,
        position: { x: 48, y: 48 },
        width: 360,
        height: 240,
        style: { color: '#8DA59A' }
      }),
      dirty: true,
      message: ''
    })
  },
  updateSelectedGroup: (patch) => {
    const groupId = get().selectedNodeIds[0]
    if (!groupId) return
    set(({ document, activeViewId }) => ({
      document: updateGroup(document, activeViewId, groupId, patch),
      dirty: true
    }))
  },
  removeGroups: (ids) => {
    const activeViewId = get().activeViewId
    let next = get().document
    for (const id of ids) next = removeGroup(next, activeViewId, id)
    set({ document: next, dirty: true })
  },
  assignNodeToGroup: (nodeId, groupId) =>
    set(({ document, activeViewId }) => ({
      document: updateNode(document, activeViewId, nodeId, { groupId }),
      dirty: true
    })),
  setViewport: (viewport) =>
    set(({ document, activeViewId }) => ({
      document: updateView(document, activeViewId, { viewport }),
      dirty: true
    })),
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
    const { document, activeViewId, selectedNodeIds, selectedEdgeIds } = get()
    let next = document
    for (const nodeId of selectedNodeIds) next = removeNode(next, activeViewId, nodeId)
    for (const edgeId of selectedEdgeIds) {
      if (getActiveView(next, activeViewId).edges.some((edge) => edge.id === edgeId))
        next = removeEdge(next, activeViewId, edgeId)
    }
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeNodes: (nodeIds) => {
    const activeViewId = get().activeViewId
    let next = get().document
    for (const nodeId of nodeIds) next = removeNode(next, activeViewId, nodeId)
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeEdges: (edgeIds) => {
    const activeViewId = get().activeViewId
    let next = get().document
    for (const edgeId of edgeIds) {
      if (getActiveView(next, activeViewId).edges.some((edge) => edge.id === edgeId))
        next = removeEdge(next, activeViewId, edgeId)
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
        activeViewId: document.views[0].id,
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
          activeViewId: result.document.views[0].id,
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
