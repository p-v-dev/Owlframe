export const SCHEMA_VERSION = 1
export const DEFAULT_NODE_WIDTH = 176
export const DEFAULT_NODE_HEIGHT = 64

export type DiagramAltitude = 'contexto' | 'sistema' | 'servicos' | 'fluxo'
export type DiagramNodeKind = 'service' | 'database' | 'queue' | 'gateway' | 'client' | 'container'
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
  width?: number
  height?: number
  style: DiagramStyle
  groupId?: string
  detail?: ComponentDetail
}

export interface ComponentDetail {
  nodes: Omit<DiagramNode, 'detail'>[]
  edges: DiagramEdge[]
  groups: DiagramGroup[]
  viewport: DiagramViewport
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
        name: 'Arquitetura geral',
        altitude: 'contexto',
        nodes: [],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      {
        id: 'view-sistema',
        name: 'Componentes',
        altitude: 'sistema',
        nodes: [],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      {
        id: 'view-servicos',
        name: 'Em breve',
        altitude: 'servicos',
        nodes: [],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    ]
  }
}
