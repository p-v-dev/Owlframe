# Motion and Default Icons

## Goal

Make canvas resizing visibly settle into its final dimensions, reinforce button hover feedback, and give new components the same icon shown in the component palette.

## Design

- Node and group resize dimensions transition for 160 ms after a resize completes; dimensions remain immediate while the pointer is dragging so the editor stays precise.
- Buttons keep their existing subtle shadow and press feedback and gain a small visual lift on hover.
- The palette Lucide icon is rendered by component kind when no custom technology icon is selected. A custom technology icon remains the explicit override.
- No document schema changes or dependencies are required.
- `prefers-reduced-motion` disables the resize settlement transition and hover motion while retaining all static states.

## Verification

- Test that each component kind renders its default palette icon.
- Test that a selected node and group receive the resize-settling state after resize end.
- Run the renderer tests, full test suite, and type checks.
