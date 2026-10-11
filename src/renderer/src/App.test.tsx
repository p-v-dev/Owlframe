// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
  useEditorStore.setState({
    document: createEmptyDocument('test', 'Test diagram'),
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

  it('shows feedback for an invalid connection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    const node = useEditorStore.getState().document.views[0].nodes[0]

    act(() => useEditorStore.getState().connect(node.id, node.id))

    expect(screen.getByRole('alert').textContent).toBe('Choose two different services to connect.')
  })
})
