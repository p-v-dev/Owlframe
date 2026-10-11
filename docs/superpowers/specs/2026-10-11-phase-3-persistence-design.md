# Phase 3 Persistence Design

## Goal

Persist Owlframe documents locally as `.owlframe` JSON files without giving the renderer unrestricted filesystem access.

## Architecture

The renderer owns the current file path and dirty state. Its preload API exposes only `new`, `open`, `save`, and `saveAs`; the Electron main process owns native dialogs, validation, reads, and writes.

Each save validates the document using `validateDocument`, writes JSON to a temporary sibling file, then replaces the destination. Opening validates JSON before returning it to the renderer.

## Behavior

- New creates an empty document and prompts before discarding unsaved edits.
- Open uses a native dialog filtered to `.owlframe`, validates the file, and reports readable errors.
- Save writes the current file when one exists; otherwise it behaves as Save As.
- Save As uses the `.owlframe` extension and becomes the current file.
- The title area shows the project name and a dirty marker.
- Failed reads, validation failures, permission errors, and write failures remain in the renderer as actionable feedback.

## Security

- `contextIsolation` remains enabled and `nodeIntegration` remains disabled.
- The preload exposes a narrow typed bridge only; it exposes no generic filesystem or IPC primitives.
- The main process treats every IPC document payload as untrusted and validates it before writing.

## Testing

- Unit-test file serialization, validation failures, and atomic write behavior with a temporary directory.
- Test renderer dirty state and handling of successful and failed bridge calls.
- Manually verify create, save, close, open, and continue editing.
