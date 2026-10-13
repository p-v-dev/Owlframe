import {
  SCHEMA_VERSION,
  type DiagramAltitude,
  type DiagramDocument,
  type DiagramEdgeStyle,
  type DiagramNodeKind
} from './document'

const altitudes: DiagramAltitude[] = ['contexto', 'sistema', 'servicos', 'fluxo']
const nodeKinds: DiagramNodeKind[] = [
  'service',
  'database',
  'queue',
  'gateway',
  'client',
  'container'
]
const edgeStyles: DiagramEdgeStyle[] = ['solid', 'dashed']

export type DocumentValidationResult =
  { ok: true; document: DiagramDocument } | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function uniqueIds(items: unknown[], viewId: string, type: string): string | undefined {
  const ids = new Set<string>()
  for (const item of items) {
    if (!isRecord(item) || !isString(item.id)) {
      return `View ${viewId} has an invalid ${type}`
    }
    if (ids.has(item.id)) {
      return `View ${viewId} has a duplicate ${type} ID: ${item.id}`
    }
    ids.add(item.id)
  }

  return undefined
}

export function validateDocument(value: unknown): DocumentValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: 'Document must be an object' }
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: `Unsupported schema version: ${String(value.schemaVersion)}` }
  }
  if (!isRecord(value.metadata) || !isString(value.metadata.id) || !isString(value.metadata.name)) {
    return { ok: false, error: 'Document metadata must include string id and name' }
  }
  if (!Array.isArray(value.views) || value.views.length === 0) {
    return { ok: false, error: 'Document must contain at least one view' }
  }

  const viewIds = new Set<string>()
  for (const view of value.views) {
    if (!isRecord(view) || !isString(view.id)) {
      return { ok: false, error: 'Document has an invalid view' }
    }
    if (viewIds.has(view.id)) {
      return { ok: false, error: `Duplicate view ID: ${view.id}` }
    }
    viewIds.add(view.id)

    if (!isString(view.name) || !altitudes.includes(view.altitude as DiagramAltitude)) {
      return { ok: false, error: `View ${view.id} has an invalid altitude` }
    }
    if (!Array.isArray(view.nodes) || !Array.isArray(view.edges) || !Array.isArray(view.groups)) {
      return { ok: false, error: `View ${view.id} has invalid contents` }
    }

    const nodeIdError = uniqueIds(view.nodes, view.id, 'node')
    if (nodeIdError) return { ok: false, error: nodeIdError }
    const edgeIdError = uniqueIds(view.edges, view.id, 'edge')
    if (edgeIdError) return { ok: false, error: edgeIdError }
    const groupIdError = uniqueIds(view.groups, view.id, 'group')
    if (groupIdError) return { ok: false, error: groupIdError }

    const groupIds = new Set(view.groups.map((group) => (group as { id: string }).id))
    const nodeIds = new Set<string>()
    for (const node of view.nodes) {
      const candidate = node as Record<string, unknown>
      if (!nodeKinds.includes(candidate.kind as DiagramNodeKind)) {
        return { ok: false, error: `View ${view.id} node ${candidate.id} has an invalid kind` }
      }
      if (
        (candidate.width !== undefined || candidate.height !== undefined) &&
        (!isPositiveNumber(candidate.width) || !isPositiveNumber(candidate.height))
      ) {
        return { ok: false, error: `View ${view.id} node ${candidate.id} has invalid dimensions` }
      }
      if (
        candidate.groupId !== undefined &&
        (!isString(candidate.groupId) || !groupIds.has(candidate.groupId))
      ) {
        return {
          ok: false,
          error: `View ${view.id} node ${candidate.id} references an unknown group`
        }
      }
      nodeIds.add(candidate.id as string)

      if (candidate.detail !== undefined) {
        if (!isRecord(candidate.detail)) {
          return { ok: false, error: `Detail for view ${view.id} node ${candidate.id} is invalid` }
        }
        const detail = candidate.detail
        if (
          !Array.isArray(detail.nodes) ||
          !Array.isArray(detail.edges) ||
          !Array.isArray(detail.groups)
        ) {
          return {
            ok: false,
            error: `Detail for view ${view.id} node ${candidate.id} has invalid contents`
          }
        }
        const detailLabel = `Detail for view ${view.id} node ${candidate.id}`
        const detailNodeError = uniqueIds(detail.nodes, detailLabel, 'node')
        if (detailNodeError) return { ok: false, error: detailNodeError.replace('View ', '') }
        const detailEdgeError = uniqueIds(detail.edges, detailLabel, 'edge')
        if (detailEdgeError) return { ok: false, error: detailEdgeError.replace('View ', '') }
        const detailGroupError = uniqueIds(detail.groups, detailLabel, 'group')
        if (detailGroupError) return { ok: false, error: detailGroupError.replace('View ', '') }

        const detailGroupIds = new Set(detail.groups.map((group) => (group as { id: string }).id))
        const detailNodeIds = new Set<string>()
        for (const detailNode of detail.nodes) {
          const detailCandidate = detailNode as Record<string, unknown>
          if (
            detailCandidate.detail !== undefined ||
            !nodeKinds.includes(detailCandidate.kind as DiagramNodeKind)
          ) {
            return { ok: false, error: `${detailLabel} node ${detailCandidate.id} is invalid` }
          }
          if (
            (detailCandidate.width !== undefined || detailCandidate.height !== undefined) &&
            (!isPositiveNumber(detailCandidate.width) || !isPositiveNumber(detailCandidate.height))
          ) {
            return {
              ok: false,
              error: `${detailLabel} node ${detailCandidate.id} has invalid dimensions`
            }
          }
          if (
            detailCandidate.groupId !== undefined &&
            (!isString(detailCandidate.groupId) || !detailGroupIds.has(detailCandidate.groupId))
          ) {
            return {
              ok: false,
              error: `${detailLabel} node ${detailCandidate.id} references an unknown group`
            }
          }
          detailNodeIds.add(detailCandidate.id as string)
        }
        for (const detailEdge of detail.edges) {
          const detailCandidate = detailEdge as Record<string, unknown>
          if (
            !edgeStyles.includes(detailCandidate.style as DiagramEdgeStyle) ||
            !isString(detailCandidate.sourceId) ||
            !isString(detailCandidate.targetId) ||
            !detailNodeIds.has(detailCandidate.sourceId) ||
            !detailNodeIds.has(detailCandidate.targetId)
          ) {
            return {
              ok: false,
              error: `${detailLabel} edge ${detailCandidate.id} references an unknown node`
            }
          }
          if (detailCandidate.sourceId === detailCandidate.targetId) {
            return {
              ok: false,
              error: `${detailLabel} edge ${detailCandidate.id} endpoints must differ`
            }
          }
        }
        if (
          !isRecord(detail.viewport) ||
          !isPositiveNumber(detail.viewport.zoom) ||
          typeof detail.viewport.x !== 'number' ||
          typeof detail.viewport.y !== 'number'
        ) {
          return { ok: false, error: `${detailLabel} has an invalid viewport` }
        }
      }
    }

    for (const edge of view.edges) {
      const candidate = edge as Record<string, unknown>
      if (!edgeStyles.includes(candidate.style as DiagramEdgeStyle)) {
        return { ok: false, error: `View ${view.id} edge ${candidate.id} has an invalid style` }
      }
      if (
        !isString(candidate.sourceId) ||
        !isString(candidate.targetId) ||
        !nodeIds.has(candidate.sourceId) ||
        !nodeIds.has(candidate.targetId)
      ) {
        return {
          ok: false,
          error: `View ${view.id} edge ${candidate.id} references an unknown node`
        }
      }
      if (candidate.sourceId === candidate.targetId) {
        return { ok: false, error: `View ${view.id} edge ${candidate.id} endpoints must differ` }
      }
    }
  }

  return { ok: true, document: value as unknown as DiagramDocument }
}
