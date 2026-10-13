import { useCallback, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  NodeResizer,
  Position,
  ReactFlow,
  type Node,
  type NodeChange,
  type Edge,
  type Connection,
  type Viewport,
  type ReactFlowInstance,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Database, Globe, Layers, Server, Waypoints } from 'lucide-react'
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  type DiagramAltitude,
  type DiagramNodeKind
} from '../../core/document'
import { createDiagramSvg, createPngBlob } from './diagram-export'
import { useEditorStore } from './editor-store'
import { techIcons } from './tech-icons'
const palette: [DiagramNodeKind, string, React.ElementType][] = [
  ['service', 'Service', Server],
  ['client', 'API', Globe],
  ['database', 'Database', Database],
  ['queue', 'Queue', Waypoints],
  ['gateway', 'Gateway', Layers],
  ['container', 'Container', Box]
]

const paletteByAltitude: Record<DiagramAltitude, DiagramNodeKind[]> = {
  contexto: ['client', 'gateway', 'container'],
  sistema: ['service', 'client', 'database', 'queue', 'gateway', 'container'],
  servicos: ['service', 'database', 'queue', 'container'],
  fluxo: ['client', 'service', 'queue', 'gateway']
}

type ComponentNode = Node<
  {
    label: string
    color?: string
    icon?: string
    kind: DiagramNodeKind
    compact: boolean
    onOpenDetails: () => void
    resizeSettling: boolean
    onResize: (size: { width: number; height: number }) => void
    onResizeSettled: () => void
  },
  'component'
>
type GroupNode = Node<
  {
    label: string
    color: string
    resizeSettling: boolean
    onResize: (size: { width: number; height: number }) => void
    onResizeSettled: () => void
  },
  'group'
>
type CanvasNode = ComponentNode | GroupNode

function ServiceNode({
  data,
  selected,
  isConnectable,
  dragging
}: NodeProps<ComponentNode>): React.JSX.Element {
  const tech = data.icon ? techIcons[data.icon as keyof typeof techIcons] : undefined
  const [resizing, setResizing] = useState(false)
  const PaletteIcon = palette.find(([kind]) => kind === data.kind)?.[2]
  return (
    <div
      className="animate-node-enter diagram-node size-full min-h-16 min-w-36 rounded-sm border bg-[#fafafa] px-4 py-3 font-mono text-sm text-[#18181b] shadow-[0_8px_20px_rgb(24_24_27/12%)] motion-reduce:animate-none"
      data-dragging={dragging || undefined}
      data-resizing={resizing || undefined}
      data-resize-settled={data.resizeSettling || undefined}
      onAnimationEnd={data.onResizeSettled}
      style={{ borderColor: data.color ?? '#3f3f46' }}
      data-testid="service-node"
    >
      <NodeResizer
        color="#27272a"
        handleStyle={{ height: 14, width: 14 }}
        isVisible={selected}
        minHeight={64}
        minWidth={144}
        onResizeStart={() => setResizing(true)}
        onResizeEnd={(_, { width, height }) => {
          setResizing(false)
          data.onResize({ width, height })
        }}
      />
      <Handle
        className="connection-handle"
        isConnectable={isConnectable}
        type="target"
        position={Position.Left}
      />
      <span className="flex items-center gap-2">
        {tech && !data.compact && (
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
            <path d={tech.path} fill="currentColor" />
          </svg>
        )}
        {!tech && PaletteIcon && !data.compact && (
          <PaletteIcon
            aria-hidden="true"
            className="size-4"
            data-testid={`default-icon-${data.kind}`}
          />
        )}
        {data.label}
      </span>
      {!data.compact && (
        <span className="mt-1 block text-[10px] uppercase text-[#52525b]">{data.kind}</span>
      )}
      <Handle
        className="connection-handle"
        isConnectable={isConnectable}
        type="source"
        position={Position.Right}
      />
    </div>
  )
}

function DiagramGroupNode({ data, selected, dragging }: NodeProps<GroupNode>): React.JSX.Element {
  const [resizing, setResizing] = useState(false)
  return (
    <div
      className="group-layer diagram-group size-full"
      data-dragging={dragging || undefined}
      data-resizing={resizing || undefined}
      data-resize-settled={data.resizeSettling || undefined}
      data-selected={selected || undefined}
      onAnimationEnd={data.onResizeSettled}
      style={{ borderColor: data.color }}
    >
      <NodeResizer
        color="#27272a"
        handleStyle={{ height: 14, width: 14 }}
        isVisible={selected}
        minHeight={160}
        minWidth={240}
        onResizeStart={() => setResizing(true)}
        onResizeEnd={(_, { width, height }) => {
          setResizing(false)
          data.onResize({ width, height })
        }}
      />
      {data.label}
    </div>
  )
}

const nodeTypes = { component: ServiceNode, group: DiagramGroupNode }
const snapGrid: [number, number] = [16, 16]
const defaultEdgeOptions = { style: { stroke: '#52525b', strokeWidth: 1.5 } }
const connectionLineStyle = { stroke: '#27272a', strokeWidth: 2 }

const contourPaths: Record<DiagramAltitude, string[]> = {
  contexto: ['M3 20C18 4 48 4 61 20'],
  sistema: ['M3 20C18 4 48 4 61 20', 'M8 24C22 10 43 10 56 24'],
  servicos: [
    'M3 20C18 4 48 4 61 20',
    'M6 22C20 7 45 7 58 22',
    'M10 25C23 12 42 12 54 25',
    'M14 28C25 17 39 17 50 28'
  ],
  fluxo: ['M4 24H56', 'M48 16L56 24L48 32']
}

function App(): React.JSX.Element {
  const state = useEditorStore()
  const view = state.getActiveView()
  const parentView = state.document.views.find((candidate) => candidate.id === state.activeViewId)!
  const detailRoot = state.activeDetailNodeId
    ? parentView.nodes.find((node) => node.id === state.activeDetailNodeId)
    : undefined
  const canvasId = `${state.document.metadata.id}:${state.activeViewId}:${state.activeDetailNodeId ?? ''}`
  const [viewport, setViewport] = useState({
    canvasId,
    value: view.viewport
  })
  const [exportBackground, setExportBackground] = useState<'theme' | 'transparent'>('theme')
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(2)
  const [flow, setFlow] = useState<ReactFlowInstance<CanvasNode> | null>(null)
  const [settlingNodeId, setSettlingNodeId] = useState<string | null>(null)
  const activeViewport = viewport.canvasId === canvasId ? viewport.value : view.viewport
  const compact = activeViewport.zoom < 0.65
  const nodes = useMemo<CanvasNode[]>(
    () => [
      ...view.groups.map((group): GroupNode => ({
        id: `group:${group.id}`,
        type: 'group',
        position: group.position,
        selected: state.selectedGroupIds.includes(group.id),
        className: settlingNodeId === `group:${group.id}` ? 'resize-settling' : undefined,
        data: {
          label: group.label,
          color: group.style.color,
          resizeSettling: settlingNodeId === `group:${group.id}`,
          onResize: (size) => {
            useEditorStore.getState().resizeGroup(group.id, size)
            setSettlingNodeId(`group:${group.id}`)
          },
          onResizeSettled: () => setSettlingNodeId(null)
        },
        style: { height: group.height, width: group.width, zIndex: 0 }
      })),
      ...view.nodes.map((node): ComponentNode => ({
        id: node.id,
        type: 'component',
        position: node.position,
        selected: state.selectedNodeIds.includes(node.id),
        className: settlingNodeId === node.id ? 'resize-settling' : undefined,
        style: {
          height: node.height ?? DEFAULT_NODE_HEIGHT,
          width: node.width ?? DEFAULT_NODE_WIDTH,
          zIndex: 1
        },
        data: {
          label: node.label,
          color: node.style.color,
          icon: node.style.icon,
          kind: node.kind,
          compact,
          onOpenDetails: () => state.openComponentDetail(node.id),
          resizeSettling: settlingNodeId === node.id,
          onResize: (size) => {
            useEditorStore.getState().resizeNode(node.id, size)
            setSettlingNodeId(node.id)
          },
          onResizeSettled: () => setSettlingNodeId(null)
        }
      }))
    ],
    [
      compact,
      settlingNodeId,
      state.selectedGroupIds,
      state.selectedNodeIds,
      view.groups,
      view.nodes
    ]
  )
  const edges = useMemo(
    () =>
      view.edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label,
        ...(state.selectedEdgeIds.includes(edge.id) ? { selected: true } : {}),
        style: edge.style === 'dashed' ? { strokeDasharray: '6 4' } : undefined
      })),
    [state.selectedEdgeIds, view.edges]
  )
  const selected = view.nodes.find((node) => node.id === state.selectedNodeIds[0])
  const selectedGroup = view.groups.find((group) => group.id === state.selectedGroupIds[0])
  const selectedEdge = view.edges.find((edge) => edge.id === state.selectedEdgeIds[0])
  const activePalette = palette.filter(([kind]) =>
    paletteByAltitude[parentView.altitude].includes(kind)
  )
  const download = (blob: Blob, extension: 'svg' | 'png'): void => {
    const anchor = document.createElement('a')
    const url = URL.createObjectURL(blob)
    anchor.href = url
    anchor.download = `${state.document.metadata.name.replace(/[^a-z0-9]+/gi, '-')}.${extension}`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }
  const svg = (): string =>
    createDiagramSvg({ ...parentView, ...view }, { background: exportBackground })
  const onConnect = useCallback(({ source, target }: Connection) => {
    useEditorStore.getState().connect(source, target)
  }, [])
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    useEditorStore.getState().removeEdges(deleted.map((edge) => edge.id))
  }, [])
  const onNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    const editor = useEditorStore.getState()
    for (const change of changes) {
      if (change.type !== 'position' || !change.position) continue
      if (change.id.startsWith('group:')) {
        editor.moveGroup(change.id.slice(6), change.position)
      } else {
        editor.moveNode(change.id, change.position)
      }
    }
  }, [])
  const onMove = useCallback(
    (_: MouseEvent | TouchEvent | null, nextViewport: Viewport) =>
      setViewport({ canvasId, value: nextViewport }),
    [canvasId]
  )
  const onMoveEnd = useCallback(
    (_: MouseEvent | TouchEvent | null, nextViewport: Viewport) => {
      setViewport({ canvasId, value: nextViewport })
      useEditorStore.getState().setViewport(nextViewport)
    },
    [canvasId]
  )
  const onNodesDelete = useCallback((deleted: CanvasNode[]) => {
    const editor = useEditorStore.getState()
    editor.removeGroups(
      deleted.filter((node) => node.id.startsWith('group:')).map((node) => node.id.slice(6))
    )
    editor.removeNodes(
      deleted.filter((node) => !node.id.startsWith('group:')).map((node) => node.id)
    )
  }, [])
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: CanvasNode[]; edges: Edge[] }) => {
      const editor = useEditorStore.getState()
      const group = selectedNodes.find((node) => node.id.startsWith('group:'))
      if (group) editor.selectGroup(group.id.slice(6))
      else {
        editor.setSelection(
          selectedNodes.map((node) => node.id),
          selectedEdges.map((edge) => edge.id)
        )
      }
    },
    []
  )

  return (
    <main className="flex h-screen overflow-hidden flex-col bg-[#f4f4f5] text-[#18181b]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#52525b] bg-[#18181b] px-4 py-3 text-[#fafafa]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Owlframe</h1>
          <h2 className="font-mono text-xs text-[#a1a1aa]">
            {state.document.metadata.name}
            {state.dirty ? ' *' : ''}
          </h2>
          {detailRoot && (
            <div className="mt-1 flex items-center gap-2 text-xs text-[#d4d4d8]">
              <button onClick={state.closeComponentDetail} type="button">
                Back to {parentView.name}
              </button>
              <span>
                {parentView.name} / {detailRoot.label}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={state.newProject}
            type="button"
          >
            New
          </button>
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={state.openProject}
            type="button"
          >
            Open
          </button>
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={state.save}
            type="button"
          >
            Save
          </button>
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={state.saveAs}
            type="button"
          >
            Save as
          </button>
          <button
            className="rounded-sm bg-[#fafafa] px-3 py-2 text-sm font-semibold text-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={state.addService}
            type="button"
          >
            Add service
          </button>
          <label className="text-xs">
            Export background
            <select
              className="ml-1 border bg-[#fafafa] p-1 text-[#18181b]"
              onChange={(event) =>
                setExportBackground(event.target.value as 'theme' | 'transparent')
              }
              value={exportBackground}
            >
              <option value="theme">Theme</option>
              <option value="transparent">Transparent</option>
            </select>
          </label>
          <label className="text-xs">
            PNG scale
            <select
              className="ml-1 border bg-[#fafafa] p-1 text-[#18181b]"
              onChange={(event) => setPngScale(Number(event.target.value) as 1 | 2 | 3)}
              value={pngScale}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </label>
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={() => download(new Blob([svg()], { type: 'image/svg+xml' }), 'svg')}
            type="button"
          >
            Export SVG
          </button>
          <button
            className="rounded-sm border border-[#a1a1aa] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fafafa]"
            onClick={async () => download(await createPngBlob(svg(), pngScale), 'png')}
            type="button"
          >
            Export PNG
          </button>
        </div>
      </header>
      {state.message && (
        <p
          className="border-b border-[#52525b] bg-[#fafafa] px-4 py-2 text-sm text-[#27272a]"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <div className="canvas-shell">
        <div className="canvas-controls border-r border-[#52525b] bg-[#fafafa]">
          <nav className="altitude-ruler" aria-label="Altitude views">
            {state.document.views.map((candidate) => (
              <button
                aria-current={candidate.id === state.activeViewId ? 'page' : undefined}
                className="altitude-view"
                disabled={candidate.name === 'Em breve'}
                key={candidate.id}
                onClick={() => {
                  state.setActiveView(candidate.id)
                  setViewport({
                    canvasId: `${state.document.metadata.id}:${candidate.id}:`,
                    value: candidate.viewport
                  })
                }}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 64 36">
                  {contourPaths[candidate.altitude].map((path) => (
                    <path d={path} fill="none" key={path} stroke="currentColor" strokeWidth="1.5" />
                  ))}
                </svg>
                <span>{candidate.name}</span>
              </button>
            ))}
          </nav>
          <aside className="component-palette" aria-label="Components">
            <span className="px-2 py-1 font-mono text-xs text-[#52525b]">COMPONENTS</span>
            <button className="palette-action" onClick={() => state.addGroup()} type="button">
              Add group
            </button>
            {activePalette.map(([kind, label, Icon]) => (
              <button
                className="palette-action flex items-center gap-2"
                draggable
                key={kind}
                onClick={() => state.addComponent(kind)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy'
                  event.dataTransfer.setData('application/owlframe-component', kind)
                }}
                type="button"
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </aside>
          {selectedGroup && (
            <aside className="properties-panel" aria-label="Properties">
              <label className="block text-xs">
                Group title
                <input
                  className="mt-1 w-full border p-1"
                  value={selectedGroup.label}
                  onChange={(event) => state.updateSelectedGroup({ label: event.target.value })}
                />
              </label>
              <label className="block text-xs">
                Group color
                <input
                  className="mt-1 w-full"
                  type="color"
                  value={selectedGroup.style.color}
                  onChange={(event) =>
                    state.updateSelectedGroup({
                      style: { ...selectedGroup.style, color: event.target.value }
                    })
                  }
                />
              </label>
              <button
                onClick={() => state.assignSelectedNodesToGroup(selectedGroup.id)}
                type="button"
              >
                Assign selected nodes
              </button>
              <button onClick={() => state.removeGroups([selectedGroup.id])} type="button">
                Delete group
              </button>
            </aside>
          )}
          {selected && !selectedGroup && (
            <aside className="properties-panel" aria-label="Properties">
              <label className="block text-xs">
                Name
                <input
                  className="mt-1 w-full border p-1"
                  value={selected.label}
                  onChange={(event) => state.updateSelectedNode({ label: event.target.value })}
                />
              </label>
              <label className="block text-xs">
                Type
                <select
                  className="mt-1 w-full border p-1"
                  value={selected.kind}
                  onChange={(event) =>
                    state.updateSelectedNode({ kind: event.target.value as DiagramNodeKind })
                  }
                >
                  {palette.map(([kind, label]) => (
                    <option key={kind} value={kind}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Color
                <input
                  className="mt-1 w-full"
                  type="color"
                  value={selected.style.color}
                  onChange={(event) =>
                    state.updateSelectedNode({
                      style: { ...selected.style, color: event.target.value }
                    })
                  }
                />
              </label>
              <label className="block text-xs">
                Icon
                <select
                  className="mt-1 w-full border p-1"
                  value={selected.style.icon ?? ''}
                  onChange={(event) =>
                    state.updateSelectedNode({
                      style: { ...selected.style, icon: event.target.value || undefined }
                    })
                  }
                >
                  <option value="">None</option>
                  {Object.keys(techIcons).map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </select>
              </label>
            </aside>
          )}
          {selectedEdge && (
            <aside className="properties-panel" aria-label="Properties">
              <p className="text-xs text-[#52525b]">Connection</p>
              <button onClick={() => state.removeEdges(state.selectedEdgeIds)} type="button">
                Delete connection
              </button>
            </aside>
          )}
        </div>
        <section
          className="relative min-h-0 min-w-0 flex-1"
          aria-label={`${detailRoot?.label ?? parentView.name} diagram`}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
          }}
          onDrop={(event) => {
            event.preventDefault()
            const kind = event.dataTransfer.getData(
              'application/owlframe-component'
            ) as DiagramNodeKind
            if (flow && palette.some(([candidate]) => candidate === kind)) {
              state.addComponent(
                kind,
                flow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
              )
            }
          }}
        >
          {!nodes.length && (
            <p className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-mono text-sm text-[#52525b]">
              Drag a component here to start diagramming.
            </p>
          )}
          <ReactFlow
            key={state.activeViewId}
            deleteKeyCode="Delete"
            defaultViewport={view.viewport}
            edges={edges}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={connectionLineStyle}
            nodes={nodes}
            nodeTypes={nodeTypes}
            onInit={setFlow}
            snapGrid={snapGrid}
            snapToGrid
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodesChange={onNodesChange}
            onMove={onMove}
            onMoveEnd={onMoveEnd}
            onNodesDelete={onNodesDelete}
            onNodeDoubleClick={(_, node) => state.openComponentDetail(node.id)}
            onSelectionChange={onSelectionChange}
            viewport={activeViewport}
          >
            <Background color="#a1a1aa" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </section>
      </div>
    </main>
  )
}

export default App
