// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState, type ComponentType, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDocument } from '../../core/document'
import App from './App'
import { useEditorStore } from './editor-store'

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()

  return {
    ...actual,
    Background: () => null,
    Controls: () => null,
    Handle: ({ type }: { type: string }) => <span data-testid={`${type}-handle`} />,
    NodeResizer: ({
      isVisible,
      onResizeEnd
    }: {
      isVisible?: boolean
      onResizeEnd?: (event: unknown, size: { width: number; height: number }) => void
    }) =>
      isVisible ? (
        <button
          data-testid="node-resizer"
          onClick={() => onResizeEnd?.({}, { width: 240, height: 112 })}
          type="button"
        >
          Resize test node
        </button>
      ) : null,
    ReactFlow: ({
      children,
      defaultViewport,
      edges,
      nodeTypes,
      nodes,
      onMove,
      onNodesChange,
      onConnect,
      onSelectionChange,
      viewport
    }: {
      children?: ReactNode
      defaultViewport?: { x: number; y: number; zoom: number }
      edges?: { id: string; label?: string; style?: { strokeDasharray?: string } }[]
      nodeTypes?: Record<
        string,
        ComponentType<{
          data: {
            label: string
            color?: string
            icon?: string
            kind?: string
            compact?: boolean
            onResize?: (size: { width: number; height: number }) => void
            onOpenDetails?: () => void
          }
          selected?: boolean
        }>
      >
      nodes?: {
        id: string
        type?: string
        data: {
          label: string
          color?: string
          icon?: string
          kind?: string
          compact?: boolean
          onResize?: (size: { width: number; height: number }) => void
          onOpenDetails?: () => void
        }
        selected?: boolean
      }[]
      onMove?: (event: null, viewport: { x: number; y: number; zoom: number }) => void
      onNodesChange?: (changes: unknown[]) => void
      onConnect?: (connection: { source: string; target: string }) => void
      onNodeDoubleClick?: (event: unknown, node: { id: string }) => void
      onSelectionChange?: (selection: { nodes: { id: string }[]; edges: { id: string }[] }) => void
      viewport?: { x: number; y: number; zoom: number }
    }) => {
      const [initialViewport] = useState(defaultViewport)
      const activeViewport = viewport ?? initialViewport

      return (
        <div
          data-testid="react-flow"
          data-edges={JSON.stringify(edges)}
          data-viewport={`${activeViewport?.x},${activeViewport?.y},${activeViewport?.zoom}`}
          onMouseMove={() => onMove?.(null, { x: 24, y: 48, zoom: 0.5 })}
          onDoubleClick={() =>
            nodes?.[0] &&
            onNodesChange?.([{ id: nodes[0].id, type: 'position', position: { x: 208, y: 144 } }])
          }
          onContextMenu={() =>
            nodes?.[0] &&
            onNodesChange?.([
              { id: nodes[0].id, type: 'dimensions', dimensions: { width: 999, height: 999 } }
            ])
          }
        >
          {nodes?.map((node) => {
            const NodeComponent = nodeTypes?.[node.type ?? 'default']
            return NodeComponent ? (
              <div
                key={node.id}
                onClick={() => onSelectionChange?.({ nodes: [node], edges: [] })}
                onDoubleClick={() => node.data.onOpenDetails?.()}
              >
                <NodeComponent data={node.data} selected={node.selected} />
              </div>
            ) : null
          })}
          {nodes && nodes.length >= 2 && (
            <button
              onClick={() => onConnect?.({ source: nodes[0].id, target: nodes[1].id })}
              type="button"
            >
              Connect test nodes
            </button>
          )}
          {edges?.[0] && (
            <>
              <button
                onClick={() => onSelectionChange?.({ nodes: [], edges: [{ id: edges[0].id }] })}
                type="button"
              >
                Select test edge
              </button>
              <button
                onClick={() =>
                  onSelectionChange?.({
                    nodes: nodes?.slice(0, 1) ?? [],
                    edges: [{ id: edges[0].id }]
                  })
                }
                type="button"
              >
                Select test node and edge
              </button>
            </>
          )}
          {children}
        </div>
      )
    }
  }
})

class ResizeObserver {
  observe(): void {
    return undefined
  }
  unobserve(): void {
    return undefined
  }
  disconnect(): void {
    return undefined
  }
}

globalThis.ResizeObserver = ResizeObserver

afterEach(cleanup)
beforeEach(() => {
  window.owlframe = {
    new: vi.fn(async () => ({ document: createEmptyDocument('new', 'Untitled diagram') })),
    open: vi.fn(async () => ({ canceled: true as const })),
    save: vi.fn(async () => ({ canceled: false, path: 'C:/projects/test.owlframe' })),
    saveAs: vi.fn(async () => ({ canceled: false, path: 'C:/projects/test.owlframe' }))
  }
  useEditorStore.setState({
    document: createEmptyDocument('test', 'Test diagram'),
    path: undefined,
    dirty: false,
    activeViewId: 'view-contexto',
    selectedNodeIds: [],
    selectedEdgeIds: [],
    message: ''
  })
})

describe('App', () => {
  it('shows the Owlframe heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Owlframe' })).toBeTruthy()
  })

  it('offers an action to add a service from the empty canvas', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Add service' })).toBeTruthy()
  })

  it('offers export actions with background and PNG scale controls', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Export SVG' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Export PNG' })).toBeTruthy()
    expect(screen.getByLabelText('Export background')).toBeTruthy()
    expect(screen.getByLabelText('PNG scale')).toBeTruthy()
  })

  it('switches the active altitude view from the ruler', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))

    expect(useEditorStore.getState().activeViewId).toBe('view-sistema')
  })

  it('disables the forthcoming view and navigates component details with a breadcrumb', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Em breve' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.doubleClick(screen.getByText('Service 1'))

    expect(screen.getByRole('button', { name: 'Back to Arquitetura geral' })).toBeTruthy()
    expect(screen.getByText('Arquitetura geral / Service 1')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Back to Arquitetura geral' }))
    expect(screen.queryByRole('button', { name: 'Back to Arquitetura geral' })).toBeNull()
  })

  it('adds a visual group from the component palette', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    expect(useEditorStore.getState().getActiveView().groups).toHaveLength(1)
  })

  it('shows component choices appropriate to the active altitude', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'API' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Database' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))

    expect(screen.getByRole('button', { name: 'Database' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'API' })).toBeTruthy()
  })

  it('edits, assigns nodes to, and deletes a selected visual group', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    const node = useEditorStore.getState().getActiveView().nodes[0]
    act(() => useEditorStore.getState().setSelection([node.id], []))
    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    const group = screen.getByText('Group 1')
    fireEvent.click(group)

    expect(group.closest('.group-layer')?.getAttribute('aria-hidden')).toBeNull()
    fireEvent.change(screen.getByLabelText('Group title'), { target: { value: 'Platform' } })
    fireEvent.change(screen.getByLabelText('Group color'), { target: { value: '#c85f30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign selected nodes' }))

    expect(useEditorStore.getState().getActiveView().nodes[0].groupId).toBe(
      useEditorStore.getState().getActiveView().groups[0].id
    )
    expect(useEditorStore.getState().getActiveView().groups[0]).toMatchObject({
      label: 'Platform',
      style: { color: '#c85f30' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete group' }))

    expect(useEditorStore.getState().getActiveView().groups).toEqual([])
  })

  it('renders persisted dashed edges and labels in React Flow', () => {
    const document = createEmptyDocument('edge', 'Edge diagram')
    document.views[0].nodes = [
      {
        id: 'source',
        kind: 'service',
        label: 'Source',
        position: { x: 0, y: 0 },
        style: { color: '#315B68' }
      },
      {
        id: 'target',
        kind: 'service',
        label: 'Target',
        position: { x: 100, y: 0 },
        style: { color: '#315B68' }
      }
    ]
    document.views[0].edges = [
      { id: 'edge-1', sourceId: 'source', targetId: 'target', label: 'async', style: 'dashed' }
    ]
    useEditorStore.setState({ document })

    render(<App />)

    expect(screen.getByTestId('react-flow').dataset.edges).toBe(
      '[{"id":"edge-1","source":"source","target":"target","label":"async","style":{"strokeDasharray":"6 4"}}]'
    )
  })

  it('restores the replacement document viewport for the unchanged active view', async () => {
    render(<App />)
    const opened = createEmptyDocument('opened', 'Opened diagram')
    opened.views[0].viewport = { x: 12, y: 24, zoom: 0.75 }

    act(() => useEditorStore.setState({ document: opened }))

    await waitFor(() =>
      expect(screen.getByTestId('react-flow').dataset.viewport).toBe('12,24,0.75')
    )
  })

  it('updates groups and semantic node detail during a canvas move', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))

    fireEvent.mouseMove(screen.getByTestId('react-flow'))

    expect(screen.getByTestId('react-flow').dataset.viewport).toBe('24,48,0.5')
    expect(screen.getByText('Group 1')).toBeTruthy()
    expect(screen.queryByText('service')).toBeNull()
  })

  it('adds a service to the document', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))

    expect(screen.getByText('Service 1')).toBeTruthy()
  })

  it('renders the palette icon for new components without a custom technology icon', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))

    for (const label of ['Service', 'API', 'Database', 'Queue', 'Gateway', 'Container']) {
      fireEvent.click(screen.getByRole('button', { name: label }))
    }

    for (const kind of ['service', 'client', 'database', 'queue', 'gateway', 'container']) {
      expect(screen.getByTestId(`default-icon-${kind}`)).toBeTruthy()
    }
  })

  it('persists a node position change emitted by the canvas', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.doubleClick(screen.getByTestId('react-flow'))

    expect(useEditorStore.getState().getActiveView().nodes[0].position).toEqual({
      x: 208,
      y: 144
    })
  })

  it('makes palette components draggable', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))

    expect(screen.getByRole('button', { name: 'Database' }).getAttribute('draggable')).toBe('true')
  })

  it('connects two components through the canvas', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: 'Database' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect test nodes' }))

    expect(useEditorStore.getState().getActiveView().edges).toHaveLength(1)
  })

  it('shows resize controls for a selected component', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByText('Service 1'))

    expect(screen.getByTestId('node-resizer')).toBeTruthy()
  })

  it('ignores automatic measurements and persists only explicit resize', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.contextMenu(screen.getByTestId('react-flow'))

    expect(useEditorStore.getState().getActiveView().nodes[0]).toMatchObject({
      width: 176,
      height: 64
    })

    fireEvent.click(screen.getByText('Service 1'))
    fireEvent.click(screen.getByRole('button', { name: 'Resize test node' }))

    expect(useEditorStore.getState().getActiveView().nodes[0]).toMatchObject({
      width: 240,
      height: 112
    })
  })

  it('marks a resized component for its settling animation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByText('Service 1'))
    fireEvent.click(screen.getByRole('button', { name: 'Resize test node' }))

    expect(screen.getByTestId('service-node').dataset.resizeSettled).toBe('true')
  })

  it('shows resize controls for a selected group and persists its dimensions', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))
    fireEvent.click(screen.getByText('Group 1'))
    fireEvent.click(screen.getByRole('button', { name: 'Resize test node' }))

    expect(useEditorStore.getState().getActiveView().groups[0]).toMatchObject({
      width: 240,
      height: 112
    })
  })

  it('keeps a selected edge selected in the controlled canvas', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: 'Database' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect test nodes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select test edge' }))

    expect(screen.getByTestId('react-flow').dataset.edges).toContain('"selected":true')
  })

  it('deletes a selected connection from its properties panel', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: 'Database' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect test nodes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select test edge' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete connection' }))

    expect(useEditorStore.getState().getActiveView().edges).toEqual([])
  })

  it('keeps the delete connection action available with another selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Componentes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: 'Database' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect test nodes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select test node and edge' }))

    expect(screen.getByRole('button', { name: 'Delete connection' })).toBeTruthy()
  })

  it('animates a newly added service', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))

    expect(screen.getByTestId('service-node').className).toContain('animate-node-enter')
  })

  it('shows the project name and unsaved marker after an edit', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))

    expect(screen.getByRole('heading', { name: 'Test diagram *' })).toBeTruthy()
  })

  it('shows a save failure to the user', async () => {
    window.owlframe.save = vi.fn(async () => {
      throw new Error('Project folder is not writable')
    })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Project folder is not writable')
  })

  it('shows feedback for an invalid connection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    const node = useEditorStore.getState().document.views[0].nodes[0]

    act(() => useEditorStore.getState().connect(node.id, node.id))

    expect(screen.getByRole('alert').textContent).toBe('Choose two different services to connect.')
  })
})
