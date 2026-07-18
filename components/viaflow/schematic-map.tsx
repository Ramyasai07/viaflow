"use client"

import { useId } from "react"
import type { RoutePlan, SchematicPoint } from "@/lib/viaflow/types"
import { FieldLabel } from "./primitives"

const VIEW = 1000
const PAD = 80

function project(p: SchematicPoint): SchematicPoint {
  return {
    x: PAD + p.x * (VIEW - PAD * 2),
    y: PAD + p.y * (VIEW - PAD * 2),
  }
}

/** Catmull-Rom → cubic bezier for a smooth, instrument-grade path. */
function smoothPath(points: SchematicPoint[]): string {
  const pts = points.map(project)
  if (pts.length < 2) return ""
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return d
}

export function SchematicMap({
  plan,
  selectedRouteId,
  onSelect,
}: {
  plan: RoutePlan
  selectedRouteId: string | null
  onSelect: (id: string) => void
}) {
  const gradId = useId()
  const origin = project(plan.origin.point)
  const dest = project(plan.destination.point)
  const selected = plan.options.find((o) => o.id === selectedRouteId)

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <FieldLabel>Corridor schematic</FieldLabel>
        <FieldLabel>{plan.options.length} paths</FieldLabel>
      </div>

      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="aspect-square w-full"
        role="img"
        aria-label={`Schematic of routes from ${plan.origin.name} to ${plan.destination.name}`}
      >
        <defs>
          <pattern
            id={`grid-${gradId}`}
            width={VIEW / 12}
            height={VIEW / 12}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${VIEW / 12} 0 L 0 0 0 ${VIEW / 12}`}
              fill="none"
              stroke="var(--grid)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width={VIEW} height={VIEW} fill={`url(#grid-${gradId})`} />

        {/* Non-selected candidate paths, dimmed */}
        {plan.options.map((route) => {
          const isSelected = route.id === selectedRouteId
          if (isSelected) return null
          return (
            <path
              key={route.id}
              d={smoothPath(route.geometry)}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.28}
              strokeWidth={3}
              strokeLinecap="round"
              className="viaflow-candidate cursor-pointer"
              onClick={() => onSelect(route.id)}
            />
          )
        })}

        {/* Selected path, highlighted with animated flow */}
        {selected ? (
          <>
            <path
              d={smoothPath(selected.geometry)}
              fill="none"
              stroke="var(--signal)"
              strokeOpacity={0.18}
              strokeWidth={12}
              strokeLinecap="round"
            />
            <path
              d={smoothPath(selected.geometry)}
              fill="none"
              stroke="var(--signal)"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <path
              d={smoothPath(selected.geometry)}
              fill="none"
              stroke="var(--signal-foreground)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="2 14"
              className="viaflow-flow"
            />
          </>
        ) : null}

        {/* Origin node */}
        <g>
          <circle cx={origin.x} cy={origin.y} r={16} fill="var(--surface)" stroke="var(--foreground)" strokeWidth={3} />
          <circle cx={origin.x} cy={origin.y} r={5} fill="var(--foreground)" />
        </g>

        {/* Destination node */}
        <g>
          <circle cx={dest.x} cy={dest.y} r={16} fill="var(--signal)" stroke="var(--signal)" strokeWidth={3} />
          <circle cx={dest.x} cy={dest.y} r={5} fill="var(--signal-foreground)" />
        </g>
      </svg>

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border-2 border-foreground" aria-hidden />
          <span className="text-xs text-muted-foreground">{plan.origin.name}</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{plan.destination.name}</span>
          <span className="size-2.5 rounded-full bg-signal" aria-hidden />
        </div>
      </div>
    </div>
  )
}
