"use client"

import { useMemo, useState } from "react"
import { useRoutePlan, useScenarios } from "@/lib/viaflow/hooks"
import type { PlanRequest, Weights } from "@/lib/viaflow/types"
import { formatClock } from "@/lib/format"
import { AppHeader } from "./app-header"
import { PlannerPanel } from "./planner-panel"
import { RouteList } from "./route-list"
import { RouteDetail } from "./route-detail"
import { SchematicMap } from "./schematic-map"
import { FieldLabel, Swatch } from "./primitives"

const DEFAULT_WEIGHTS: Weights = { time: 5, distance: 5, reliability: 5 }

function Legend() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-chart-2" />
        <FieldLabel>Time</FieldLabel>
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-caution" />
        <FieldLabel>Distance</FieldLabel>
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-signal" />
        <FieldLabel>Reliability</FieldLabel>
      </span>
    </div>
  )
}

export function ViaFlowApp() {
  const { scenarios } = useScenarios()
  const [activeScenarioId, setActiveScenarioId] = useState("yard-to-air")
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId),
    [scenarios, activeScenarioId],
  )

  const request: PlanRequest | null = activeScenario
    ? {
        originId: activeScenario.originId,
        destinationId: activeScenario.destinationId,
        weights,
      }
    : null

  const { plan, isLoading, isValidating } = useRoutePlan(request)

  // Effective selection: the user's pick, or the top-ranked route as fallback.
  const selectedRoute = useMemo(() => {
    if (!plan) return null
    return (
      plan.options.find((o) => o.id === selectedRouteId) ?? plan.options[0]
    )
  }, [plan, selectedRouteId])

  const handleScenarioChange = (id: string) => {
    setActiveScenarioId(id)
    setSelectedRouteId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader computeMs={plan?.computeMs} computedAt={plan?.computedAt} />

      {/* Intro strip */}
      <div className="border-b border-border bg-surface/40">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="max-w-xl">
            <h1 className="text-balance text-xl font-semibold tracking-tight md:text-2xl">
              Every route, scored in the open.
            </h1>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              ViaFlow ranks each option with a transparent weighted score across
              time, distance, and reliability. Adjust the weights and watch the
              ranking recompute — no black box.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <FieldLabel>Last computed</FieldLabel>
              <span className="tabular font-mono text-xs">
                {plan ? formatClock(plan.computedAt) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-6 md:px-6 lg:grid-cols-12 lg:gap-6">
        {/* Controls */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20">
            <PlannerPanel
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onScenarioChange={handleScenarioChange}
              origin={plan?.origin}
              destination={plan?.destination}
              weights={weights}
              onWeightsChange={setWeights}
            />
          </div>
        </div>

        {/* Ranked options */}
        <div className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Ranked options</h2>
              {plan ? (
                <span className="tabular font-mono text-xs text-muted-foreground">
                  {plan.options.length}
                </span>
              ) : null}
              {isValidating && !isLoading ? (
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-signal">
                  recomputing
                </span>
              ) : null}
            </div>
            <Legend />
          </div>
          <RouteList
            routes={plan?.options ?? []}
            selectedRouteId={selectedRoute?.id ?? null}
            onSelect={setSelectedRouteId}
            loading={isLoading && !plan}
          />
        </div>

        {/* Schematic + detail */}
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            {plan ? (
              <SchematicMap
                plan={plan}
                selectedRouteId={selectedRoute?.id ?? null}
                onSelect={setSelectedRouteId}
              />
            ) : (
              <div className="aspect-square w-full animate-pulse rounded-lg border border-border bg-surface" />
            )}
            <RouteDetail route={selectedRoute} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:px-6">
          <span>
            ViaFlow — a portfolio demonstration. Data served from a typed mock
            API layer.
          </span>
          <span className="font-mono">wsum engine · deterministic scoring</span>
        </div>
      </footer>
    </div>
  )
}
