/**
 * Lightweight projection helpers.
 *
 * A real deployment would project WGS84 coordinates with a proper map library.
 * For ViaFlow's abstract instrument canvas we only need a stable, aspect-aware
 * linear projection from a lng/lat bounding box into SVG screen space. Keeping
 * this isolated means the MapCanvas never hard-codes coordinates.
 */

import type { GeoPosition } from "./types"

export interface ScreenPoint {
  x: number
  y: number
}

export interface BBox {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

export function boundsOf(positions: GeoPosition[]): BBox {
  const lngs = positions.map((p) => p[0])
  const lats = positions.map((p) => p[1])
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  }
}

export interface ProjectorOptions {
  width: number
  height: number
  /** Inner padding in screen units so nodes never touch the frame. */
  padding?: number
}

/**
 * Build a projector for a set of positions. The bbox is expanded to preserve
 * aspect ratio, so the schematic never looks stretched regardless of viewport.
 */
export function createProjector(
  positions: GeoPosition[],
  { width, height, padding = 64 }: ProjectorOptions,
): (p: GeoPosition) => ScreenPoint {
  const b = boundsOf(positions)

  const spanLng = Math.max(b.maxLng - b.minLng, 1e-6)
  const spanLat = Math.max(b.maxLat - b.minLat, 1e-6)

  const innerW = width - padding * 2
  const innerH = height - padding * 2

  // Uniform scale (screen units per degree) to keep geography undistorted.
  const scale = Math.min(innerW / spanLng, innerH / spanLat)

  // Center the projected content within the padded frame.
  const contentW = spanLng * scale
  const contentH = spanLat * scale
  const offsetX = padding + (innerW - contentW) / 2
  const offsetY = padding + (innerH - contentH) / 2

  return ([lng, lat]) => ({
    x: offsetX + (lng - b.minLng) * scale,
    // Screen y grows downward; latitude grows upward — invert.
    y: offsetY + (b.maxLat - lat) * scale,
  })
}

/**
 * Catmull-Rom → cubic bezier. Produces a smooth, instrument-grade path through
 * the projected control points.
 */
export function smoothPath(points: ScreenPoint[]): string {
  if (points.length < 2) return ""
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return d
}
