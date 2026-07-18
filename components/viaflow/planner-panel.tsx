"use client"

import { cn } from "@/lib/utils"
import { normalizeWeights } from "@/lib/viaflow/scoring"
import type { Place, Scenario, Weights } from "@/lib/viaflow/types"
import { FieldLabel } from "./primitives"
import { WeightSlider } from "./weight-slider"

const PRESETS: { id: string; label: string; weights: Weights }[] = [
  { id: "balanced", label: "Balanced", weights: { time: 5, distance: 5, reliability: 5 } },
  { id: "fastest", label: "Fastest", weights: { time: 9, distance: 3, reliability: 4 } },
  { id: "shortest", label: "Shortest", weights: { time: 3, distance: 9, reliability: 3 } },
  { id: "reliable", label: "Reliable", weights: { time: 4, distance: 2, reliability: 9 } },
]

function matchesPreset(weights: Weights, preset: Weights): boolean {
  return (
    weights.time === preset.time &&
    weights.distance === preset.distance &&
    weights.reliability === preset.reliability
  )
}

function CorridorEndpoint({
  place,
  role,
}: {
  place: Place
  role: "origin" | "destination"
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          role === "origin" ? "border-2 border-foreground" : "bg-signal",
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{place.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {place.detail}
        </span>
      </div>
    </div>
  )
}

export function PlannerPanel({
  scenarios,
  activeScenarioId,
  onScenarioChange,
  origin,
  destination,
  weights,
  onWeightsChange,
}: {
  scenarios: Scenario[]
  activeScenarioId: string
  onScenarioChange: (id: string) => void
  origin?: Place
  destination?: Place
  weights: Weights
  onWeightsChange: (weights: Weights) => void
}) {
  const norm = normalizeWeights(weights)
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId)

  return (
    <div className="flex flex-col gap-4">
      {/* Corridor selector */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <FieldLabel>Corridor</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scenarios.map((s) => {
            const active = s.id === activeScenarioId
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onScenarioChange(s.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-foreground/40 bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            )
          })}
        </div>

        {origin && destination ? (
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-background p-3">
            <CorridorEndpoint place={origin} role="origin" />
            <div className="ml-[4px] h-4 w-px bg-border" aria-hidden />
            <CorridorEndpoint place={destination} role="destination" />
          </div>
        ) : null}

        {activeScenario ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {activeScenario.context}
          </p>
        ) : null}
      </section>

      {/* Weight controls */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <FieldLabel>Scoring weights</FieldLabel>
          <FieldLabel>Normalized</FieldLabel>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = matchesPreset(weights, p.weights)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onWeightsChange(p.weights)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[0.7rem] font-medium transition-colors",
                  active
                    ? "border-signal/50 bg-signal/12 text-signal"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-5">
          <WeightSlider
            label="Time"
            description="Prioritise the fastest median travel time."
            swatchClass="bg-chart-2"
            value={weights.time}
            percent={norm.time * 100}
            onValueChange={(v) => onWeightsChange({ ...weights, time: v })}
          />
          <WeightSlider
            label="Distance"
            description="Favour the shortest total path length."
            swatchClass="bg-caution"
            value={weights.distance}
            percent={norm.distance * 100}
            onValueChange={(v) => onWeightsChange({ ...weights, distance: v })}
          />
          <WeightSlider
            label="Reliability"
            description="Reward routes whose ETA holds most consistently."
            swatchClass="bg-signal"
            value={weights.reliability}
            percent={norm.reliability * 100}
            onValueChange={(v) =>
              onWeightsChange({ ...weights, reliability: v })
            }
          />
        </div>
      </section>
    </div>
  )
}
