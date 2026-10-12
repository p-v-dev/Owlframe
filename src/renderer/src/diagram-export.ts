import type { DiagramView } from '../../core/document'
import { techIcons } from './tech-icons'

const NODE_WIDTH = 176
const NODE_HEIGHT = 56
const PADDING = 32

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]!
  })
}

function bounds(view: DiagramView): { x: number; y: number; width: number; height: number } {
  const items = [
    ...view.groups.map((group) => ({
      left: group.position.x,
      top: group.position.y,
      right: group.position.x + group.width,
      bottom: group.position.y + group.height
    })),
    ...view.nodes.map((node) => ({
      left: node.position.x,
      top: node.position.y,
      right: node.position.x + NODE_WIDTH,
      bottom: node.position.y + NODE_HEIGHT
    }))
  ]
  if (!items.length) return { x: 0, y: 0, width: 64, height: 64 }

  const left = Math.min(...items.map((item) => item.left)) - PADDING
  const top = Math.min(...items.map((item) => item.top)) - PADDING
  const right = Math.max(...items.map((item) => item.right)) + PADDING
  const bottom = Math.max(...items.map((item) => item.bottom)) + PADDING
  return { x: left, y: top, width: right - left, height: bottom - top }
}

export function createDiagramSvg(
  view: DiagramView,
  { background }: { background: 'transparent' | 'theme' }
): string {
  const frame = bounds(view)
  const nodes = new Map(view.nodes.map((node) => [node.id, node]))
  const backgroundRect =
    background === 'theme'
      ? `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="#E8ECE7" />`
      : ''
  const groups = view.groups
    .map(
      (group) =>
        `<rect x="${group.position.x}" y="${group.position.y}" width="${group.width}" height="${group.height}" fill="none" stroke="${group.style.color}" stroke-width="2" /><text x="${group.position.x + 12}" y="${group.position.y + 24}" fill="#162127" font-family="sans-serif" font-size="14">${escapeText(group.label)}</text>`
    )
    .join('')
  const edges = view.edges
    .flatMap((edge) => {
      const source = nodes.get(edge.sourceId)
      const target = nodes.get(edge.targetId)
      if (!source || !target) return []
      const x1 = source.position.x + NODE_WIDTH
      const y1 = source.position.y + NODE_HEIGHT / 2
      const x2 = target.position.x
      const y2 = target.position.y + NODE_HEIGHT / 2
      const label = edge.label
        ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" fill="#162127" font-family="sans-serif" font-size="12">${escapeText(edge.label)}</text>`
        : ''
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#315B68" stroke-width="2" fill="none" marker-end="url(#arrow)"${edge.style === 'dashed' ? ' stroke-dasharray="6 4"' : ''} />${label}`
    })
    .join('')
  const diagramNodes = view.nodes
    .map((node) => {
      const icon = node.style.icon
        ? techIcons[node.style.icon as keyof typeof techIcons]
        : undefined
      const iconSvg = icon
        ? `<path d="${icon.path}" fill="#${icon.hex}" transform="translate(${node.position.x + 12} ${node.position.y + 20}) scale(0.75)" />`
        : ''
      const labelX = node.position.x + (icon ? 40 : 12)
      return `<rect x="${node.position.x}" y="${node.position.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="2" fill="#F8F7F2" stroke="${node.style.color}" stroke-width="2" />${iconSvg}<text x="${labelX}" y="${node.position.y + 34}" fill="#162127" font-family="monospace" font-size="14">${escapeText(node.label)}</text>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" height="${frame.height}"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#315B68" /></marker></defs>${backgroundRect}${groups}${edges}${diagramNodes}</svg>`
}

export function createPngBlob(svg: string, scale: 1 | 2 | 3): Promise<Blob> {
  if (![1, 2, 3].includes(scale)) return Promise.reject(new RangeError('Scale must be 1, 2, or 3.'))

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    const fail = (error: Error): void => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    image.onerror = () => fail(new Error('Could not load diagram SVG.'))
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth * scale
        canvas.height = image.naturalHeight * scale
        const context = canvas.getContext('2d')
        if (!context) return fail(new Error('Could not create PNG canvas.'))
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Could not create PNG blob.'))
        }, 'image/png')
      } catch (error) {
        fail(error instanceof Error ? error : new Error('Could not create PNG.'))
      }
    }
    image.src = url
  })
}
