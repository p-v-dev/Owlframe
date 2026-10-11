// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDocument } from '../../core/document'
import App from './App'
import { useEditorStore } from './editor-store'

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
