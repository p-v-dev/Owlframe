import { useMemo } from 'react'
import { Controls, Handle, Position, ReactFlow, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEditorStore } from './editor-store'

function ServiceNode({ data }: NodeProps<Node<{ label: string }>>): React.JSX.Element {
  return (
    <div className="min-w-32 rounded border border-slate-400 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
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
    <main className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">Owlframe</h1>
        <button
          className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white"
          onClick={state.addService}
          type="button"
        >
          Add service
        </button>
      </header>
      {state.message && (
        <p className="px-4 py-2 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <section className="relative min-h-0 flex-1" aria-label="Contexto diagram">
        {!nodes.length && (
          <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-slate-600">
            Add a service to start diagramming.
          </p>
        )}
        <ReactFlow
          deleteKeyCode="Delete"
          edges={edges}
          fitView
          nodes={nodes}
          nodeTypes={nodeTypes}
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
          <Controls />
        </ReactFlow>
      </section>
    </main>
  )
}

export default App
