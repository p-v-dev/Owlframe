import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'

describe('createEmptyDocument', () => {
  it('creates a versioned document with a Contexto view', () => {
    expect(createEmptyDocument('project-1', 'Payments')).toMatchObject({
      schemaVersion: 1,
      metadata: { id: 'project-1', name: 'Payments' },
      views: [{ id: 'view-contexto', name: 'Contexto', altitude: 'contexto' }]
    })
  })
})
