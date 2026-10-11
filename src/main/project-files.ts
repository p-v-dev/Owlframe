import { randomUUID } from 'node:crypto'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { type DiagramDocument } from '../core/document'
import { validateDocument } from '../core/validation'

function validatedDocument(value: unknown): DiagramDocument {
  const result = validateDocument(value)
  if (!result.ok) throw new Error(result.error)
  return result.document
}

export async function readProject(path: string): Promise<DiagramDocument> {
  let value: unknown
  try {
    value = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Project file is not valid JSON')
    throw error
  }
  return validatedDocument(value)
}

export async function writeProject(path: string, value: unknown): Promise<void> {
  const document = validatedDocument(value)
  const temporaryPath = join(dirname(path), `.${randomUUID()}.owlframe.tmp`)

  try {
    await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
