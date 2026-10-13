import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'

describe('createEmptyDocument', () => {
  it('creates a versioned document with the component-detail views', () => {
    const document = createEmptyDocument('project-1', 'Payments')

    expect(document).toMatchObject({
      schemaVersion: 1,
      metadata: { id: 'project-1', name: 'Payments' }
    })

    expect(document.views.map(({ id, name, altitude }) => ({ id, name, altitude }))).toEqual([
      { id: 'view-contexto', name: 'Arquitetura geral', altitude: 'contexto' },
      { id: 'view-sistema', name: 'Componentes', altitude: 'sistema' },
      { id: 'view-servicos', name: 'Em breve', altitude: 'servicos' }
    ])
  })

  it('creates independent view state', () => {
    const { views } = createEmptyDocument('project-1', 'Payments')

    expect(new Set(views.map((view) => view.nodes))).toHaveLength(3)
    expect(views.map((view) => view.viewport)).toEqual([
      { x: 0, y: 0, zoom: 1 },
      { x: 0, y: 0, zoom: 1 },
      { x: 0, y: 0, zoom: 1 }
    ])
  })
})
