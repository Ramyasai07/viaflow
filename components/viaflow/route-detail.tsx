"use client"

import { cn } from "@/lib/utils"
import { FACTOR_META, SCORE_FACTORS } from "@/lib/viaflow/scoring"
import type { CongestionLevel, ScoredRoute } from "@/lib/viaflow/types"
import {
  formatEtaWindow,
  formatKm,
  formatMinutes,
  FACTOR_SWATCH_CLASS,
} from "@/lib/format"
import { Chip, FieldLabel, Readout } from "./primitives"

const CONGESTION_TONE: Record<CongestionLevel, string> = {
  clear: "bg-signal",
  moderate: "bg-caution",
  heavy: "bg-warning",
}

function FactorRow({
  route,
  factor,
}: {
  route: ScoredRoute
  factor: (typeof SCORE_FACTORS)[number]
}) {
  const c = route.score.components[factor]
  const meta = FACTOR_META[factor]
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-[2px]", FACTOR_SWATCH_CLASS[factor])}
            aria-hidden
          />
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="tabular text-sm font-semibold">
            {c.contribution.toFixed(1)}
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            pts
          </span>
        </div>
      </div>

      {/* factor score bar (normalized performance, faded to weight) */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", FACTOR_SWATCH_CLASS[factor])}
          style={{ width: `${c.normalized}%` }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[0.65rem] text-muted-foreground">
        <span>
          {c.normalized.toFixed(0)} score × {(c.weight * 100).toFixed(0)}% weight
        </span>
        <span className="tabular">
          {factor === "reliability"
            ? `${c.rawValue}${meta.unit}`
            : factor === "distance"
              ? formatKm(c.rawValue)
              : formatMinutes(c.rawValue)}
        </span>
      </div>
    </div>
  )
}

export function RouteDetail({ route }: { route: ScoredRoute | null }) {
  if (!route) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Select a route to inspect its score composition and segments.
        </p>
      </div>
    )
  }

  const m = route.metrics

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{route.name}</span>
            <Chip>Rank {route.rank}</Chip>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="tabular text-lg font-semibold">
              {route.score.total.toFixed(1)}
            </span>
            <span className="font-mono text-[0.65rem] text-muted-foreground">
              / 100
            </span>
          </div>
        </div>

        <div className="px-4 py-1">
          <div className="flex items-center justify-between border-b border-border pb-2 pt-3">
            <FieldLabel>Score composition</FieldLabel>
            <FieldLabel>Contribution</FieldLabel>
          </div>
          <div className="divide-y divide-border">
            {SCORE_FACTORS.map((factor) => (
              <FactorRow key={factor} route={route} factor={factor} />
            ))}
          </div>
        </div>
      </div>

      {/* Extended metrics */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4">
        <Readout
          label="ETA window"
          value={formatEtaWindow(m.durationMin, m.etaVarianceMin)}
        />
        <Readout label="Variance" value={`±${m.etaVarianceMin}`} unit="min" />
        <Readout
          label="Access cost"
          value={m.costUnits === 0 ? "None" : m.costUnits.toFixed(1)}
          unit={m.costUnits === 0 ? undefined : "units"}
        />
      </div>

      {/* Segment timeline */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <FieldLabel>Segments · {route.segments.length}</FieldLabel>
        </div>
        <ol className="flex flex-col">
          {route.segments.map((seg, i) => (
            <li
              key={seg.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="flex flex-col items-center self-stretch">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    CONGESTION_TONE[seg.congestion],
                  )}
                  aria-hidden
                />
                {i < route.segments.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm">{seg.label}</span>
                <div className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                  <span>{seg.segmentClass}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular">{seg.congestion}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="tabular text-sm font-medium">
                  {formatMinutes(seg.durationMin)}
                </span>
                <span className="tabular font-mono text-[0.65rem] text-muted-foreground">
                  {formatKm(seg.distanceKm)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
