import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEmptyDocument, type DiagramDocument } from './document'
import { validateDocument } from './validation'

function validDocument(): DiagramDocument {
  const document = createEmptyDocument('project-1', 'Payments')
  document.views[0].groups.push({
    id: 'platform',
    label: 'Platform',
    position: { x: 0, y: 0 },
    width: 200,
    height: 100,
    style: { color: '#315B68' }
  })
  document.views[0].nodes.push(
    {
      id: 'api',
      kind: 'service',
      label: 'API',
      position: { x: 0, y: 0 },
      style: { color: '#315B68' },
      groupId: 'platform'
    },
    {
      id: 'database',
      kind: 'database',
      label: 'Database',
      position: { x: 10, y: 20 },
      style: { color: '#315B68' }
    }
  )
  document.views[0].edges.push({
    id: 'api-database',
    sourceId: 'api',
    targetId: 'database',
    style: 'solid'
  })
  return document
}

describe('validateDocument', () => {
  it.each(['web-architecture.owlframe', 'microservices.owlframe'])(
    'accepts the shipped %s example',
    async (filename) => {
      const contents = await readFile(resolve(process.cwd(), 'examples', filename), 'utf8')

      expect(validateDocument(JSON.parse(contents)).ok).toBe(true)
    }
  )

  it('accepts a complete version 1 document', () => {
    const document = validDocument()

    expect(validateDocument(document)).toEqual({ ok: true, document })
  })

  it('validates persisted component details independently from their parent view', () => {
    const document = validDocument()
    document.views[0].nodes[0].detail = {
      groups: [
        {
          id: 'runtime',
          label: 'Runtime',
          position: { x: 0, y: 0 },
          width: 200,
          height: 100,
          style: { color: '#315B68' }
        }
      ],
      nodes: [
        { ...document.views[0].nodes[0], id: 'nginx', groupId: 'runtime' },
        { ...document.views[0].nodes[0], id: 'api', groupId: undefined },
        { ...document.views[0].nodes[1], id: 'database' }
      ],
      edges: [
        { id: 'nginx-api', sourceId: 'nginx', targetId: 'api', style: 'solid' },
        { id: 'api-database', sourceId: 'api', targetId: 'database', style: 'solid' }
      ],
      viewport: { x: 12, y: 24, zoom: 1.25 }
    }

    expect(validateDocument(document)).toEqual({ ok: true, document })
    document.views[0].nodes[0].detail.edges[0].targetId = 'missing'
    expect(validateDocument(document)).toEqual({
      ok: false,
      error: 'Detail for view view-contexto node api edge nginx-api references an unknown node'
    })
    document.views[0].nodes[0].detail.edges[0].targetId = 'api'
    document.views[0].nodes[0].detail.nodes[0].groupId = 'missing'
    expect(validateDocument(document)).toEqual({
      ok: false,
      error: 'Detail for view view-contexto node api node nginx references an unknown group'
    })
  })

  it.each([
    ['a non-object root', null, 'Document must be an object'],
    [
      'an unsupported schema version',
      { ...validDocument(), schemaVersion: 2 },
      'Unsupported schema version: 2'
    ],
    [
      'missing metadata',
      { ...validDocument(), metadata: { id: 'project-1' } },
      'Document metadata must include string id and name'
    ],
    ['no views', { ...validDocument(), views: [] }, 'Document must contain at least one view'],
    [
      'an unknown altitude',
      { ...validDocument(), views: [{ ...validDocument().views[0], altitude: 'cloud' }] },
      'View view-contexto has an invalid altitude'
    ],
    [
      'an unknown node kind',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            nodes: [{ ...validDocument().views[0].nodes[0], kind: 'cloud' }]
          }
        ]
      },
      'View view-contexto node api has an invalid kind'
    ],
    [
      'invalid node dimensions',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            nodes: [{ ...validDocument().views[0].nodes[0], width: 0, height: 100 }]
          }
        ]
      },
      'View view-contexto node api has invalid dimensions'
    ],
    [
      'an unknown edge style',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            edges: [{ ...validDocument().views[0].edges[0], style: 'dotted' }]
          }
        ]
      },
      'View view-contexto edge api-database has an invalid style'
    ],
    [
      'duplicate view IDs',
      { ...validDocument(), views: [validDocument().views[0], validDocument().views[0]] },
      'Duplicate view ID: view-contexto'
    ],
    [
      'duplicate node IDs',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            nodes: [validDocument().views[0].nodes[0], validDocument().views[0].nodes[0]]
          }
        ]
      },
      'View view-contexto has a duplicate node ID: api'
    ],
    [
      'duplicate edge IDs',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            edges: [validDocument().views[0].edges[0], validDocument().views[0].edges[0]]
          }
        ]
      },
      'View view-contexto has a duplicate edge ID: api-database'
    ],
    [
      'duplicate group IDs',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            groups: [validDocument().views[0].groups[0], validDocument().views[0].groups[0]]
          }
        ]
      },
      'View view-contexto has a duplicate group ID: platform'
    ],
    [
      'an unknown node group',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            nodes: [{ ...validDocument().views[0].nodes[0], groupId: 'missing' }]
          }
        ]
      },
      'View view-contexto node api references an unknown group'
    ],
    [
      'an unknown edge endpoint',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            edges: [{ ...validDocument().views[0].edges[0], targetId: 'missing' }]
          }
        ]
      },
      'View view-contexto edge api-database references an unknown node'
    ],
    [
      'equal edge endpoints',
      {
        ...validDocument(),
        views: [
          {
            ...validDocument().views[0],
            edges: [{ ...validDocument().views[0].edges[0], targetId: 'api' }]
          }
        ]
      },
      'View view-contexto edge api-database endpoints must differ'
    ]
  ])('rejects %s', (_case, value, error) => {
    expect(validateDocument(value)).toEqual({ ok: false, error })
  })
})
