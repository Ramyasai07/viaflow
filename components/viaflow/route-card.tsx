"use client"

import { cn } from "@/lib/utils"
import type { ScoredRoute } from "@/lib/viaflow/types"
import { formatKm, formatMinutes, formatPct } from "@/lib/format"
import { ScoreBar } from "./score-bar"
import { Chip, FieldLabel } from "./primitives"

function CongestionMeter({ route }: { route: ScoredRoute }) {
  const rel = route.metrics.reliabilityPct
  const tone =
    rel >= 88 ? "text-signal" : rel >= 78 ? "text-caution" : "text-warning"
  return <span className={cn("tabular font-medium", tone)}>{formatPct(rel)}</span>
}

export function RouteCard({
  route,
  selected,
  onSelect,
}: {
  route: ScoredRoute
  selected: boolean
  onSelect: () => void
}) {
  const isTop = route.rank === 1

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative w-full rounded-lg border bg-surface p-4 text-left transition-all",
        "hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        selected
          ? "border-foreground/40 shadow-sm ring-1 ring-foreground/10"
          : "border-border",
      )}
    >
      {/* Rank rail */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold tabular",
              isTop
                ? "bg-signal text-signal-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {route.rank}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold leading-none">
                {route.name}
              </span>
              {isTop ? (
                <span className="rounded-[4px] bg-signal/12 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-signal">
                  Top ranked
                </span>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">{route.summary}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="tabular text-2xl font-semibold leading-none">
            {route.score.total.toFixed(1)}
          </span>
          <FieldLabel>Score / 100</FieldLabel>
        </div>
      </div>

      {/* Metrics row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel>Time</FieldLabel>
          <span className="tabular text-sm font-medium">
            {formatMinutes(route.metrics.durationMin)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel>Distance</FieldLabel>
          <span className="tabular text-sm font-medium">
            {formatKm(route.metrics.distanceKm)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel>Reliability</FieldLabel>
          <span className="text-sm">
            <CongestionMeter route={route} />
          </span>
        </div>
      </div>

      {/* Transparent score decomposition */}
      <div className="mt-4 flex flex-col gap-2">
        <ScoreBar score={route.score} />
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {route.tags.map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </div>
    </button>
  )
}
