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
import { useEditorStore } from './editor-store'

function ServiceNode({ data }: NodeProps<Node<{ label: string }>>): React.JSX.Element {
  return (
    <div
      className="animate-node-enter min-w-36 rounded-sm border border-[#315B68] bg-[#F8F7F2] px-4 py-3 font-mono text-sm text-[#162127] shadow-[0_8px_20px_rgb(22_33_39/12%)] motion-reduce:animate-none"
      data-testid="service-node"
    >
      <Handle type="target" position={Position.Left} />
      {data.label}
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
        data: { label: node.label }
      })),
    [view.nodes]
  )
  const edges = useMemo(
    () => view.edges.map((edge) => ({ id: edge.id, source: edge.sourceId, target: edge.targetId })),
    [view.edges]
  )

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
