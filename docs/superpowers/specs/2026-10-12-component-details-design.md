# Component Details

## Views

- New diagrams start with `Arquitetura geral`, `Componentes` and a disabled `Em breve` view.
- `Arquitetura geral` represents the infrastructure inside a cloud provider; `Componentes` represents APIs, databases, queues and containers.
- Existing project files keep their stored view names and data. The new terminology applies to new documents and the editor chrome.

## Component Flows

- A component can own one optional, persisted detail diagram containing nodes, edges, groups and its own viewport.
- Double-clicking a component opens its detail diagram. The header presents a breadcrumb to return to the parent diagram.
- A new detail diagram starts empty; components can then add Nginx, APIs, databases and queues using the existing palette and connection controls.
- Detail diagrams are one level deep in this increment. Components inside them do not open further diagrams.
- Removing a component removes its attached detail diagram.

## Interaction

- Node and group dimensions update continuously while resizing, using `requestAnimationFrame` to coalesce document updates and a short CSS size transition.
- Resize controls use a visibly larger handle and selection gets a larger transparent pointer target, without changing the visible diagram footprint.
- All movement honors `prefers-reduced-motion`.

## Validation

- The document validator accepts optional component detail diagrams and checks their node IDs, edge endpoints, group references and viewport using the same invariants as top-level views.
- Existing v1 files without details remain valid.

## Verification

- Unit-test creation, update and deletion of component detail diagrams.
- Test detail navigation and return to the parent diagram.
- Test validation and persistence of a nested Nginx-to-API-to-database flow.
- Run the full suite, type checks and formatting checks.
