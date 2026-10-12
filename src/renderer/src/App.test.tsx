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
    Handle: () => null,
    ReactFlow: ({
      children,
      defaultViewport,
      nodeTypes,
      nodes,
      onMove,
      viewport
    }: {
      children?: ReactNode
      defaultViewport?: { x: number; y: number; zoom: number }
      nodeTypes?: Record<
        string,
        ComponentType<{
          data: { label: string; color?: string; icon?: string; kind: string; compact: boolean }
        }>
      >
      nodes?: {
        id: string
        type?: string
        data: { label: string; color?: string; icon?: string; kind: string; compact: boolean }
      }[]
      onMove?: (event: null, viewport: { x: number; y: number; zoom: number }) => void
      viewport?: { x: number; y: number; zoom: number }
    }) => {
      const [initialViewport] = useState(defaultViewport)
      const activeViewport = viewport ?? initialViewport

      return (
        <div
          data-testid="react-flow"
          data-viewport={`${activeViewport?.x},${activeViewport?.y},${activeViewport?.zoom}`}
          onMouseMove={() => onMove?.(null, { x: 24, y: 48, zoom: 0.5 })}
        >
          {nodes?.map((node) => {
            const NodeComponent = nodeTypes?.[node.type ?? 'default']
            return NodeComponent ? <NodeComponent data={node.data} key={node.id} /> : null
          })}
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

  it('switches the active altitude view from the ruler', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Sistema' }))

    expect(useEditorStore.getState().activeViewId).toBe('view-sistema')
  })

  it('adds a visual group from the component palette', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    expect(useEditorStore.getState().getActiveView().groups).toHaveLength(1)
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

    expect((document.querySelector('.group-layer') as HTMLElement).style.transform).toBe(
      'translate(24px, 48px) scale(0.5)'
    )
    expect(screen.queryByText('service')).toBeNull()
  })

  it('adds a service to the document', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))

    expect(screen.getByText('Service 1')).toBeTruthy()
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
