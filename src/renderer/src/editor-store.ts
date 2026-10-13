import { create } from 'zustand'
import {
  createEmptyDocument,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  type DiagramDocument,
  type ComponentDetail,
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
  createComponentDetail,
  removeEdge,
  removeGroup,
  removeNode,
  updateComponentDetail,
  updateGroup,
  updateNode,
  updateView
} from '../../core/operations'

interface EditorState {
  document: DiagramDocument
  path?: string
  dirty: boolean
  activeViewId: string
  activeDetailNodeId?: string
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  selectedGroupIds: string[]
  message: string
  getActiveView: () => DiagramView | ComponentDetail
  setActiveView: (viewId: string) => void
  openComponentDetail: (nodeId: string) => void
  closeComponentDetail: () => void
  selectGroup: (groupId: string) => void
  addService: () => void
  addComponent: (kind: DiagramNodeKind, position?: DiagramPosition) => void
  addGroup: (position?: DiagramPosition) => void
  updateSelectedGroup: (patch: Partial<Omit<DiagramGroup, 'id'>>) => void
  removeGroups: (ids: string[]) => void
  assignNodeToGroup: (nodeId: string, groupId: string | undefined) => void
  assignSelectedNodesToGroup: (groupId: string) => void
  setViewport: (viewport: DiagramViewport) => void
  updateSelectedNode: (patch: {
    label?: string
    kind?: DiagramNodeKind
    style?: DiagramStyle
  }) => void
  moveNode: (nodeId: string, position: DiagramPosition) => void
  resizeNode: (nodeId: string, size: { width: number; height: number }) => void
  moveGroup: (groupId: string, position: DiagramPosition) => void
  resizeGroup: (groupId: string, size: { width: number; height: number }) => void
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

function getActiveView(
  document: DiagramDocument,
  activeViewId: string,
  activeDetailNodeId?: string
): DiagramView | ComponentDetail {
  const view = document.views.find((candidate) => candidate.id === activeViewId)!
  return activeDetailNodeId
    ? view.nodes.find((node) => node.id === activeDetailNodeId)!.detail!
    : view
}

function updateActiveView(
  document: DiagramDocument,
  activeViewId: string,
  activeDetailNodeId: string | undefined,
  change: (canvas: DiagramView | ComponentDetail) => DiagramView | ComponentDetail
): DiagramDocument {
  const canvas = getActiveView(document, activeViewId, activeDetailNodeId)
  return activeDetailNodeId
    ? updateComponentDetail(document, activeViewId, activeDetailNodeId, change(canvas))
    : updateView(document, activeViewId, change(canvas))
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
  activeDetailNodeId: undefined,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  selectedGroupIds: [],
  message: '',
  getActiveView: () => getActiveView(get().document, get().activeViewId, get().activeDetailNodeId),
  setActiveView: (activeViewId) => {
    if (!get().document.views.some((view) => view.id === activeViewId)) return
    set({
      activeViewId,
      activeDetailNodeId: undefined,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedGroupIds: []
    })
  },
  openComponentDetail: (nodeId) => {
    const { document, activeViewId, activeDetailNodeId } = get()
    if (activeDetailNodeId) return
    const node = document.views
      .find((view) => view.id === activeViewId)!
      .nodes.find((candidate) => candidate.id === nodeId)
    if (!node) return
    set({
      document: node.detail ? document : createComponentDetail(document, activeViewId, nodeId),
      activeDetailNodeId: nodeId,
      dirty: node.detail ? get().dirty : true,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedGroupIds: []
    })
  },
  closeComponentDetail: () =>
    set({
      activeDetailNodeId: undefined,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedGroupIds: []
    }),
  selectGroup: (groupId) => {
    const selectedGroupIds = get().selectedGroupIds
    if (selectedGroupIds.length === 1 && selectedGroupIds[0] === groupId) return
    set({ selectedGroupIds: [groupId] })
  },
  addService: () => {
    get().addComponent('service')
  },
  addComponent: (kind, position) => {
    const { document, activeViewId, activeDetailNodeId } = get()
    const view = getActiveView(document, activeViewId, activeDetailNodeId)
    const number = view.nodes.length + 1
    const name =
      kind === 'api'
        ? 'API'
        : kind === 'worker'
          ? 'Worker / Lambda'
          : kind === 'load-balancer'
            ? 'Load Balancer'
            : `${kind[0].toUpperCase()}${kind.slice(1)}`
    const label = `${name} ${number}`

    set({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            nodes: [
              ...canvas.nodes,
              {
                id: crypto.randomUUID(),
                kind,
                label,
                position: position ?? { x: 80, y: 80 },
                width: kind === 'worker' ? 208 : DEFAULT_NODE_WIDTH,
                height: DEFAULT_NODE_HEIGHT,
                style: { color: '#3f3f46' }
              }
            ]
          }))
        : addNode(document, activeViewId, {
            id: crypto.randomUUID(),
            kind,
            label,
            position: position ?? {
              x: 80 + ((number - 1) % 4) * 192,
              y: 80 + Math.floor((number - 1) / 4) * 128
            },
            width: kind === 'worker' ? 208 : DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            style: { color: '#3f3f46' }
          }),
      dirty: true,
      message: ''
    })
  },
  updateSelectedNode: (patch) => {
    const nodeId = get().selectedNodeIds[0]
    if (!nodeId) return
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
          }))
        : updateNode(document, activeViewId, nodeId, patch),
      dirty: true
    }))
  },
  moveNode: (nodeId, position) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
          }))
        : updateNode(document, activeViewId, nodeId, { position }),
      dirty: true
    })),
  resizeNode: (nodeId, size) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, ...size } : node))
          }))
        : updateNode(document, activeViewId, nodeId, size),
      dirty: true
    })),
  connect: (sourceId, targetId) => {
    const { document, activeViewId, activeDetailNodeId } = get()
    const view = getActiveView(document, activeViewId, activeDetailNodeId)
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
        document: activeDetailNodeId
          ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
              ...canvas,
              edges: [
                ...canvas.edges,
                { id: crypto.randomUUID(), sourceId, targetId, style: 'solid' }
              ]
            }))
          : addEdge(document, activeViewId, {
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
  addGroup: (position) => {
    const { document, activeViewId, activeDetailNodeId } = get()
    const number = getActiveView(document, activeViewId, activeDetailNodeId).groups.length + 1
    set({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            groups: [
              ...canvas.groups,
              {
                id: crypto.randomUUID(),
                label: `Group ${number}`,
                position: position ?? { x: 48, y: 48 },
                width: 360,
                height: 240,
                style: { color: '#71717a' }
              }
            ]
          }))
        : addGroup(document, activeViewId, {
            id: crypto.randomUUID(),
            label: `Group ${number}`,
            position: position ?? {
              x: 48 + ((number - 1) % 2) * 400,
              y: 48 + Math.floor((number - 1) / 2) * 280
            },
            width: 360,
            height: 240,
            style: { color: '#71717a' }
          }),
      dirty: true,
      message: ''
    })
  },
  updateSelectedGroup: (patch) => {
    const groupId = get().selectedGroupIds[0]
    if (!groupId) return
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            groups: canvas.groups.map((group) =>
              group.id === groupId ? { ...group, ...patch } : group
            )
          }))
        : updateGroup(document, activeViewId, groupId, patch),
      dirty: true
    }))
  },
  moveGroup: (groupId, position) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            groups: canvas.groups.map((group) =>
              group.id === groupId ? { ...group, position } : group
            )
          }))
        : updateGroup(document, activeViewId, groupId, { position }),
      dirty: true
    })),
  resizeGroup: (groupId, size) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            groups: canvas.groups.map((group) =>
              group.id === groupId ? { ...group, ...size } : group
            )
          }))
        : updateGroup(document, activeViewId, groupId, size),
      dirty: true
    })),
  removeGroups: (ids) => {
    const { activeViewId, activeDetailNodeId } = get()
    if (activeDetailNodeId) {
      set(({ document }) => ({
        document: updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
          ...canvas,
          groups: canvas.groups.filter((group) => !ids.includes(group.id)),
          nodes: canvas.nodes.map((node) =>
            ids.includes(node.groupId ?? '') ? { ...node, groupId: undefined } : node
          )
        })),
        dirty: true,
        selectedGroupIds: []
      }))
      return
    }
    let next = get().document
    for (const id of ids) next = removeGroup(next, activeViewId, id)
    set({ document: next, dirty: true, selectedGroupIds: [] })
  },
  assignNodeToGroup: (nodeId, groupId) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
            ...canvas,
            nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, groupId } : node))
          }))
        : updateNode(document, activeViewId, nodeId, { groupId }),
      dirty: true
    })),
  assignSelectedNodesToGroup: (groupId) => {
    let next = get().document
    const { activeViewId, activeDetailNodeId, selectedNodeIds } = get()
    if (activeDetailNodeId) {
      next = updateActiveView(next, activeViewId, activeDetailNodeId, (canvas) => ({
        ...canvas,
        nodes: canvas.nodes.map((node) =>
          selectedNodeIds.includes(node.id) ? { ...node, groupId } : node
        )
      }))
    } else
      for (const nodeId of selectedNodeIds)
        next = updateNode(next, activeViewId, nodeId, { groupId })
    set({ document: next, dirty: true })
  },
  setViewport: (viewport) =>
    set(({ document, activeViewId, activeDetailNodeId }) => ({
      document: activeDetailNodeId
        ? updateComponentDetail(document, activeViewId, activeDetailNodeId, { viewport })
        : updateView(document, activeViewId, { viewport }),
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
    set({ selectedNodeIds, selectedEdgeIds, selectedGroupIds: [] })
  },
  removeSelection: () => {
    const { document, activeViewId, activeDetailNodeId, selectedNodeIds, selectedEdgeIds } = get()
    if (activeDetailNodeId) {
      set({
        document: updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
          ...canvas,
          nodes: canvas.nodes.filter((node) => !selectedNodeIds.includes(node.id)),
          edges: canvas.edges.filter(
            (edge) =>
              !selectedEdgeIds.includes(edge.id) &&
              !selectedNodeIds.includes(edge.sourceId) &&
              !selectedNodeIds.includes(edge.targetId)
          )
        })),
        dirty: true,
        selectedNodeIds: [],
        selectedEdgeIds: []
      })
      return
    }
    let next = document
    for (const nodeId of selectedNodeIds) next = removeNode(next, activeViewId, nodeId)
    for (const edgeId of selectedEdgeIds) {
      if (getActiveView(next, activeViewId).edges.some((edge) => edge.id === edgeId))
        next = removeEdge(next, activeViewId, edgeId)
    }
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeNodes: (nodeIds) => {
    const { activeViewId, activeDetailNodeId } = get()
    if (activeDetailNodeId) {
      set(({ document }) => ({
        document: updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
          ...canvas,
          nodes: canvas.nodes.filter((node) => !nodeIds.includes(node.id)),
          edges: canvas.edges.filter(
            (edge) => !nodeIds.includes(edge.sourceId) && !nodeIds.includes(edge.targetId)
          )
        })),
        dirty: true,
        selectedNodeIds: [],
        selectedEdgeIds: []
      }))
      return
    }
    let next = get().document
    for (const nodeId of nodeIds) next = removeNode(next, activeViewId, nodeId)
    set({ document: next, dirty: true, selectedNodeIds: [], selectedEdgeIds: [] })
  },
  removeEdges: (edgeIds) => {
    const { activeViewId, activeDetailNodeId } = get()
    if (activeDetailNodeId) {
      set(({ document }) => ({
        document: updateActiveView(document, activeViewId, activeDetailNodeId, (canvas) => ({
          ...canvas,
          edges: canvas.edges.filter((edge) => !edgeIds.includes(edge.id))
        })),
        dirty: true,
        selectedEdgeIds: []
      }))
      return
    }
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
        activeDetailNodeId: undefined,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        selectedGroupIds: [],
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
          activeDetailNodeId: undefined,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          selectedGroupIds: [],
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
