import type { DiagramDocument } from './document'

export type NewProjectResult = { document: DiagramDocument }
export type OpenProjectResult =
  { canceled: true } | { canceled: false; path: string; document: DiagramDocument }
export type SaveProjectResult = { canceled: true } | { canceled: false; path: string }

export interface OwlframeBridge {
  new: () => Promise<NewProjectResult>
  open: () => Promise<OpenProjectResult>
  save: (document: unknown) => Promise<SaveProjectResult>
  saveAs: (document: unknown) => Promise<SaveProjectResult>
}
