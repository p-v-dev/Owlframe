import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Database, Globe, Layers, Server, Waypoints } from 'lucide-react'
import type { DiagramAltitude, DiagramNodeKind } from '../../core/document'
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

function ServiceNode({
  data
}: NodeProps<
  Node<{ label: string; color?: string; icon?: string; kind: DiagramNodeKind; compact: boolean }>
>): React.JSX.Element {
  const tech = data.icon ? techIcons[data.icon as keyof typeof techIcons] : undefined
  return (
    <div
      className="animate-node-enter min-w-36 rounded-sm border bg-[#F8F7F2] px-4 py-3 font-mono text-sm text-[#162127] shadow-[0_8px_20px_rgb(22_33_39/12%)] motion-reduce:animate-none"
      style={{ borderColor: data.color ?? '#315B68' }}
      data-testid="service-node"
    >
      <Handle type="target" position={Position.Left} />
      <span className="flex items-center gap-2">
        {tech && !data.compact && (
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
            <path d={tech.path} fill={`#${tech.hex}`} />
          </svg>
        )}
        {data.label}
      </span>
      {!data.compact && (
        <span className="mt-1 block text-[10px] uppercase text-[#315B68]">{data.kind}</span>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { service: ServiceNode }

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
  const [viewport, setViewport] = useState(view.viewport)
  const [exportBackground, setExportBackground] = useState<'theme' | 'transparent'>('theme')
  const [pngScale, setPngScale] = useState<1 | 2 | 3>(2)
  useEffect(() => setViewport(view.viewport), [view.viewport])
  const compact = viewport.zoom < 0.65
  const nodes = useMemo<
    Node<{
      label: string
      color?: string
      icon?: string
      kind: DiagramNodeKind
      compact: boolean
    }>[]
  >(
    () =>
      view.nodes.map((node) => ({
        id: node.id,
        type: 'service',
        position: node.position,
        data: {
          label: node.label,
          color: node.style.color,
          icon: node.style.icon,
          kind: node.kind,
          compact
        }
      })),
    [compact, view.nodes]
  )
  const edges = useMemo(
    () => view.edges.map((edge) => ({ id: edge.id, source: edge.sourceId, target: edge.targetId })),
    [view.edges]
  )
  const selected = view.nodes.find((node) => node.id === state.selectedNodeIds[0])
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
  const svg = (): string => createDiagramSvg(view, { background: exportBackground })

  return (
    <main className="flex min-h-screen flex-col bg-[#E8ECE7] text-[#162127]">
      <header className="flex items-center justify-between border-b border-[#315B68] bg-[#162127] px-4 py-3 text-[#F8F7F2]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Owlframe</h1>
          <h2 className="font-mono text-xs text-[#8DA59A]">
            {state.document.metadata.name}
            {state.dirty ? ' *' : ''}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={state.newProject}
            type="button"
          >
            New
          </button>
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={state.openProject}
            type="button"
          >
            Open
          </button>
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={state.save}
            type="button"
          >
            Save
          </button>
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={state.saveAs}
            type="button"
          >
            Save as
          </button>
          <button
            className="rounded-sm bg-[#C85F30] px-3 py-2 text-sm font-semibold text-[#F8F7F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={state.addService}
            type="button"
          >
            Add service
          </button>
          <label className="text-xs">
            Export background
            <select
              className="ml-1 border bg-[#F8F7F2] p-1 text-[#162127]"
              onChange={(event) => setExportBackground(event.target.value as 'theme' | 'transparent')}
              value={exportBackground}
            >
              <option value="theme">Theme</option>
              <option value="transparent">Transparent</option>
            </select>
          </label>
          <label className="text-xs">
            PNG scale
            <select
              className="ml-1 border bg-[#F8F7F2] p-1 text-[#162127]"
              onChange={(event) => setPngScale(Number(event.target.value) as 1 | 2 | 3)}
              value={pngScale}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </label>
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={() => download(new Blob([svg()], { type: 'image/svg+xml' }), 'svg')}
            type="button"
          >
            Export SVG
          </button>
          <button
            className="rounded-sm border border-[#8DA59A] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85F30]"
            onClick={async () => download(await createPngBlob(svg(), pngScale), 'png')}
            type="button"
          >
            Export PNG
          </button>
        </div>
      </header>
      {state.message && (
        <p
          className="border-b border-[#C85F30] bg-[#F8F7F2] px-4 py-2 text-sm text-[#C85F30]"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <div className="canvas-controls border-b border-[#315B68] bg-[#F8F7F2]">
        <nav className="altitude-ruler" aria-label="Altitude views">
          {state.document.views.map((candidate) => (
            <button
              aria-current={candidate.id === state.activeViewId ? 'page' : undefined}
              className="altitude-view"
              key={candidate.id}
              onClick={() => {
                state.setActiveView(candidate.id)
                setViewport(candidate.viewport)
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
          <span className="px-2 py-1 font-mono text-xs text-[#315B68]">COMPONENTS</span>
          <button className="palette-action" onClick={state.addGroup} type="button">
            Add group
          </button>
          {palette.map(([kind, label, Icon]) => (
            <button
              className="palette-action flex items-center gap-2"
              key={kind}
              onClick={() => state.addComponent(kind)}
              type="button"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </aside>
        {selected && (
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
      </div>
      <section className="relative min-h-0 flex-1" aria-label={`${view.name} diagram`}>
        {!nodes.length && (
          <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-mono text-sm text-[#315B68]">
            Add a service to start diagramming.
          </p>
        )}
        <div
          aria-hidden="true"
          className="group-layer"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
          }}
        >
          {view.groups.map((group) => (
            <div
              className="diagram-group"
              key={group.id}
              style={{
                borderColor: group.style.color,
                height: group.height,
                left: group.position.x,
                top: group.position.y,
                width: group.width
              }}
            >
              {group.label}
            </div>
          ))}
        </div>
        <ReactFlow
          key={state.activeViewId}
          deleteKeyCode="Delete"
          defaultViewport={view.viewport}
          edges={edges}
          defaultEdgeOptions={{ style: { stroke: '#315B68', strokeWidth: 1.5 } }}
          nodes={nodes}
          nodeTypes={nodeTypes}
          snapGrid={[16, 16]}
          snapToGrid
          onConnect={({ source, target }) => state.connect(source, target)}
          onEdgesDelete={(deleted) => state.removeEdges(deleted.map((edge) => edge.id))}
          onNodeDragStop={(_, node) => state.moveNode(node.id, node.position)}
          onMove={(_, nextViewport) => setViewport(nextViewport)}
          onMoveEnd={(_, viewport) => {
            setViewport(viewport)
            state.setViewport(viewport)
          }}
          onNodesDelete={(deleted) => state.removeNodes(deleted.map((node) => node.id))}
          onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) =>
            state.setSelection(
              selectedNodes.map((node) => node.id),
              selectedEdges.map((edge) => edge.id)
            )
          }
          viewport={viewport}
        >
          <Background color="#8DA59A" gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  )
}

export default App
