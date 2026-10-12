// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { siDocker } from 'simple-icons'
import type { DiagramView } from '../../core/document'
import { createDiagramSvg, createPngBlob } from './diagram-export'

const view: DiagramView = {
  id: 'view-test',
  name: 'Test',
  altitude: 'contexto',
  viewport: { x: 0, y: 0, zoom: 1 },
  groups: [
    {
      id: 'group-1',
      label: "Platform & API's",
      position: { x: 10, y: 20 },
      width: 300,
      height: 180,
      style: { color: '#8DA59A' }
    }
  ],
  nodes: [
    {
      id: 'source',
      kind: 'service',
      label: 'Source <one>',
      position: { x: 40, y: 80 },
      style: { color: '#315B68' }
    },
    {
      id: 'target',
      kind: 'database',
      label: 'Target "two"',
      position: { x: 360, y: 80 },
      style: { color: '#C85F30' }
    }
  ],
  edges: [
    { id: 'edge-1', sourceId: 'source', targetId: 'target', label: 'API <sync>', style: 'dashed' }
  ]
}

afterEach(() => vi.restoreAllMocks())

describe('diagram export', () => {
  it('creates a bounded diagram SVG with escaped groups, nodes, and marked edges', () => {
    const svg = createDiagramSvg(view, { background: 'transparent' })

    expect(svg).toContain('viewBox="-22 -12 590 244"')
    expect(svg).toContain('width="590" height="244"')
    expect(svg).toContain('<marker id="arrow"')
    expect(svg).toContain('Platform &amp; API&apos;s')
    expect(svg).toContain('Source &lt;one&gt;')
    expect(svg).toContain('Target &quot;two&quot;')
    expect(svg).toContain('<rect x="10" y="20" width="300" height="180"')
    expect(svg).toContain('<rect x="40" y="80" width="176" height="56"')
    expect(svg).toContain('marker-end="url(#arrow)"')
    expect(svg).toContain('fill="none"')
    expect(svg).toContain('stroke-dasharray="6 4"')
    expect(svg).toContain('API &lt;sync&gt;')
    expect(svg).not.toContain('#E8ECE7')
  })

  it('uses the Survey background only when requested', () => {
    expect(createDiagramSvg(view, { background: 'theme' })).toContain('fill="#E8ECE7"')
    expect(createDiagramSvg(view, { background: 'transparent' })).not.toContain('fill="#E8ECE7"')
  })

  it('preserves a supported node icon path and label in SVG output', () => {
    const svg = createDiagramSvg(
      {
        ...view,
        nodes: [{ ...view.nodes[0], style: { ...view.nodes[0].style, icon: 'docker' } }]
      },
      { background: 'transparent' }
    )

    expect(svg).toContain(siDocker.path)
    expect(svg).toContain('Source &lt;one&gt;')
  })

  it('creates a scaled PNG blob and releases its source URL', async () => {
    const revokeObjectURL = vi.fn()
    const createObjectURL = vi.fn(() => 'blob:diagram')
    const drawImage = vi.fn()
    const toBlob = vi.fn((callback: BlobCallback) =>
      callback(new Blob(['png'], { type: 'image/png' }))
    )
    class ImageMock {
      naturalWidth = 20
      naturalHeight = 10
      onload?: () => void
      onerror?: () => void
      set src(_: string) {
        this.onload?.()
      }
    }
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.stubGlobal('Image', ImageMock)
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob
    } as unknown as HTMLCanvasElement)

    const png = await createPngBlob('<svg width="20" height="10" />', 2)

    expect(png.type).toBe('image/png')
    expect(drawImage).toHaveBeenCalledWith(expect.any(ImageMock), 0, 0, 40, 20)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:diagram')
  })

  it('rejects null PNG blobs and releases its source URL', async () => {
    const revokeObjectURL = vi.fn()
    const image = {
      naturalWidth: 20,
      naturalHeight: 10,
      onload: undefined as (() => void) | undefined,
      set src(_: string) {
        this.onload?.()
      }
    }
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:diagram', revokeObjectURL })
    vi.stubGlobal(
      'Image',
      class {
        constructor() {
          return image
        }
      }
    )
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback: BlobCallback) => callback(null)
    } as unknown as HTMLCanvasElement)

    await expect(createPngBlob('<svg />', 1)).rejects.toThrow('Could not create PNG blob.')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:diagram')
  })
})
