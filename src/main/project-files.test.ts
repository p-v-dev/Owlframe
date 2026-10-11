import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../core/document'
import { addNode } from '../core/operations'
import { readProject, writeProject } from './project-files'

const directories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'owlframe-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })))
})

describe('project files', () => {
  it('writes a validated document through a temporary sibling file', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'diagram.owlframe')
    const document = createEmptyDocument('diagram', 'Diagram')
    await writeFile(path, '{"previous":true}')

    await writeProject(path, document)

    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(document)
  })

  it('rejects invalid documents without replacing the existing file', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'diagram.owlframe')
    await writeFile(path, '{"previous":true}')

    await expect(writeProject(path, { schemaVersion: 1 })).rejects.toThrow('Document metadata')

    await expect(readFile(path, 'utf8')).resolves.toBe('{"previous":true}')
  })

  it('rejects invalid JSON when opening a project', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'diagram.owlframe')
    await writeFile(path, '{not json')

    await expect(readProject(path)).rejects.toThrow('valid JSON')
  })

  it('reopens a saved project for continued editing', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'diagram.owlframe')
    const created = addNode(createEmptyDocument('diagram', 'Diagram'), 'view-contexto', {
      id: 'service-1',
      kind: 'service',
      label: 'Service 1',
      position: { x: 80, y: 80 },
      style: { color: '#64748b' }
    })
    await writeProject(path, created)

    const reopened = await readProject(path)
    const continued = addNode(reopened, 'view-contexto', {
      id: 'service-2',
      kind: 'service',
      label: 'Service 2',
      position: { x: 128, y: 128 },
      style: { color: '#64748b' }
    })

    expect(continued.views[0].nodes.map((node) => node.id)).toEqual(['service-1', 'service-2'])
  })
})
