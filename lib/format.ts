import type { ScoreFactor } from "./viaflow/types"

export function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatPct(pct: number): string {
  return `${Math.round(pct)}%`
}

export function formatEtaWindow(durationMin: number, varianceMin: number): string {
  const lo = Math.round(durationMin - varianceMin)
  const hi = Math.round(durationMin + varianceMin)
  return `${lo}–${hi} min`
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

/**
 * Visual language for the three factors. Kept in one place so the legend,
 * score bars, and detail view stay perfectly in sync.
 */
export const FACTOR_COLOR: Record<ScoreFactor, string> = {
  reliability: "var(--signal)",
  time: "var(--chart-2)",
  distance: "var(--caution)",
}

export const FACTOR_SWATCH_CLASS: Record<ScoreFactor, string> = {
  reliability: "bg-signal",
  time: "bg-chart-2",
  distance: "bg-caution",
}
