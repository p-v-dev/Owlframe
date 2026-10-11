import { useMemo } from 'react'
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
import { siDocker, siGo, siNodedotjs, siPostgresql, siRedis } from 'simple-icons'
import type { DiagramNodeKind } from '../../core/document'
import { useEditorStore } from './editor-store'

const techIcons = {
  go: siGo,
  docker: siDocker,
  postgres: siPostgresql,
  redis: siRedis,
  node: siNodedotjs
}
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
}: NodeProps<Node<{ label: string; color?: string; icon?: string }>>): React.JSX.Element {
  const tech = data.icon ? techIcons[data.icon as keyof typeof techIcons] : undefined
  return (
    <div
      className="animate-node-enter min-w-36 rounded-sm border bg-[#F8F7F2] px-4 py-3 font-mono text-sm text-[#162127] shadow-[0_8px_20px_rgb(22_33_39/12%)] motion-reduce:animate-none"
      style={{ borderColor: data.color ?? '#315B68' }}
      data-testid="service-node"
    >
      <Handle type="target" position={Position.Left} />
      <span className="flex items-center gap-2">
        {tech && (
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
            <path d={tech.path} fill={`#${tech.hex}`} />
          </svg>
        )}
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { service: ServiceNode }

function App(): React.JSX.Element {
  const state = useEditorStore()
  const view = state.document.views.find((candidate) => candidate.id === 'view-contexto')!
  const nodes = useMemo<Node<{ label: string }>[]>(
    () =>
      view.nodes.map((node) => ({
        id: node.id,
        type: 'service',
        position: node.position,
        data: { label: node.label, color: node.style.color, icon: node.style.icon }
      })),
    [view.nodes]
  )
  const edges = useMemo(
    () => view.edges.map((edge) => ({ id: edge.id, source: edge.sourceId, target: edge.targetId })),
    [view.edges]
  )
  const selected = view.nodes.find((node) => node.id === state.selectedNodeIds[0])

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
      <div className="flex border-b border-[#315B68] bg-[#F8F7F2]">
        <aside
          className="flex w-44 flex-col gap-1 border-r border-[#315B68] p-2"
          aria-label="Components"
        >
          <span className="px-2 py-1 font-mono text-xs text-[#315B68]">COMPONENTS</span>
          {palette.map(([kind, label, Icon]) => (
            <button
              className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-[#E8ECE7]"
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
          <aside className="w-64 space-y-3 border-r border-[#315B68] p-3" aria-label="Properties">
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
      <section className="relative min-h-0 flex-1" aria-label="Contexto diagram">
        {!nodes.length && (
          <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-mono text-sm text-[#315B68]">
            Add a service to start diagramming.
          </p>
        )}
        <ReactFlow
          deleteKeyCode="Delete"
          edges={edges}
          fitView
          defaultEdgeOptions={{ style: { stroke: '#315B68', strokeWidth: 1.5 } }}
          nodes={nodes}
          nodeTypes={nodeTypes}
          snapGrid={[16, 16]}
          snapToGrid
          onConnect={({ source, target }) => state.connect(source, target)}
          onEdgesDelete={(deleted) => state.removeEdges(deleted.map((edge) => edge.id))}
          onNodeDragStop={(_, node) => state.moveNode(node.id, node.position)}
          onNodesDelete={(deleted) => state.removeNodes(deleted.map((node) => node.id))}
          onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) =>
            state.setSelection(
              selectedNodes.map((node) => node.id),
              selectedEdges.map((edge) => edge.id)
            )
          }
        >
          <Background color="#8DA59A" gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  )
}

export default App
