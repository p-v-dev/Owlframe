import type {
  ComponentDetail,
  DiagramDocument,
  DiagramEdge,
  DiagramGroup,
  DiagramNode,
  DiagramView
} from './document'

function changeView(
  document: DiagramDocument,
  viewId: string,
  change: (view: DiagramView) => DiagramView
): DiagramDocument {
  if (!document.views.some((view) => view.id === viewId)) {
    throw new Error(`View not found: ${viewId}`)
  }

  return {
    ...document,
    views: document.views.map((view) => (view.id === viewId ? change(view) : view))
  }
}

export function addView(document: DiagramDocument, view: DiagramView): DiagramDocument {
  if (document.views.some((candidate) => candidate.id === view.id)) {
    throw new Error(`View already exists: ${view.id}`)
  }

  return { ...document, views: [...document.views, view] }
}

export function renameView(
  document: DiagramDocument,
  viewId: string,
  name: string
): DiagramDocument {
  return changeView(document, viewId, (view) => ({ ...view, name }))
}

export function updateView(
  document: DiagramDocument,
  viewId: string,
  patch: Partial<Omit<DiagramView, 'id'>>
): DiagramDocument {
  return changeView(document, viewId, (view) => ({ ...view, ...patch, id: view.id }))
}

export function removeView(document: DiagramDocument, viewId: string): DiagramDocument {
  if (document.views.length === 1) {
    throw new Error('Cannot remove the final view')
  }
  if (!document.views.some((view) => view.id === viewId)) {
    throw new Error(`View not found: ${viewId}`)
  }

  return { ...document, views: document.views.filter((view) => view.id !== viewId) }
}

export function addNode(
  document: DiagramDocument,
  viewId: string,
  node: DiagramNode
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (view.nodes.some((candidate) => candidate.id === node.id)) {
      throw new Error(`Node already exists: ${node.id}`)
    }
    if (node.groupId && !view.groups.some((group) => group.id === node.groupId)) {
      throw new Error(`Group not found: ${node.groupId}`)
    }

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
    const node = view.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    const updated = { ...node, ...patch, id: node.id }
    if (updated.groupId && !view.groups.some((group) => group.id === updated.groupId)) {
      throw new Error(`Group not found: ${updated.groupId}`)
    }

    return {
      ...view,
      nodes: view.nodes.map((candidate) => (candidate.id === nodeId ? updated : candidate))
    }
  })
}

export function removeNode(
  document: DiagramDocument,
  viewId: string,
  nodeId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (!view.nodes.some((node) => node.id === nodeId)) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    return {
      ...view,
      nodes: view.nodes.filter((node) => node.id !== nodeId),
      edges: view.edges.filter((edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId)
    }
  })
}

export function createComponentDetail(
  document: DiagramDocument,
  viewId: string,
  nodeId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    const node = view.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) throw new Error(`Node not found: ${nodeId}`)
    if (node.detail) throw new Error(`Component detail already exists: ${nodeId}`)
    const detail: ComponentDetail = {
      nodes: [],
      edges: [],
      groups: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }

    return {
      ...view,
      nodes: view.nodes.map((candidate) =>
        candidate.id === nodeId ? { ...candidate, detail } : candidate
      )
    }
  })
}

export function updateComponentDetail(
  document: DiagramDocument,
  viewId: string,
  nodeId: string,
  patch: Partial<ComponentDetail>
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    const node = view.nodes.find((candidate) => candidate.id === nodeId)
    if (!node?.detail) throw new Error(`Component detail not found: ${nodeId}`)
    const detail: ComponentDetail = { ...node.detail, ...patch }

    return {
      ...view,
      nodes: view.nodes.map((candidate) =>
        candidate.id === nodeId ? { ...candidate, detail } : candidate
      )
    }
  })
}

export function addGroup(
  document: DiagramDocument,
  viewId: string,
  group: DiagramGroup
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (view.groups.some((candidate) => candidate.id === group.id)) {
      throw new Error(`Group already exists: ${group.id}`)
    }

    return { ...view, groups: [...view.groups, group] }
  })
}

export function updateGroup(
  document: DiagramDocument,
  viewId: string,
  groupId: string,
  patch: Partial<Omit<DiagramGroup, 'id'>>
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    const group = view.groups.find((candidate) => candidate.id === groupId)
    if (!group) {
      throw new Error(`Group not found: ${groupId}`)
    }

    const updated = { ...group, ...patch, id: group.id }
    return {
      ...view,
      groups: view.groups.map((candidate) => (candidate.id === groupId ? updated : candidate))
    }
  })
}

export function removeGroup(
  document: DiagramDocument,
  viewId: string,
  groupId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (!view.groups.some((group) => group.id === groupId)) {
      throw new Error(`Group not found: ${groupId}`)
    }

    return {
      ...view,
      groups: view.groups.filter((group) => group.id !== groupId),
      nodes: view.nodes.map((node) =>
        node.groupId === groupId ? { ...node, groupId: undefined } : node
      )
    }
  })
}

export function addEdge(
  document: DiagramDocument,
  viewId: string,
  edge: DiagramEdge
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (view.edges.some((candidate) => candidate.id === edge.id)) {
      throw new Error(`Edge already exists: ${edge.id}`)
    }
    if (
      edge.sourceId === edge.targetId ||
      !view.nodes.some((node) => node.id === edge.sourceId) ||
      !view.nodes.some((node) => node.id === edge.targetId)
    ) {
      throw new Error('Edge endpoints must exist and differ')
    }

    return { ...view, edges: [...view.edges, edge] }
  })
}

export function removeEdge(
  document: DiagramDocument,
  viewId: string,
  edgeId: string
): DiagramDocument {
  return changeView(document, viewId, (view) => {
    if (!view.edges.some((edge) => edge.id === edgeId)) {
      throw new Error(`Edge not found: ${edgeId}`)
    }

    return { ...view, edges: view.edges.filter((edge) => edge.id !== edgeId) }
  })
}
