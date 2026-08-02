"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Slider } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"
import type { Place, Route, ScoredRoute, Weights } from "@/lib/viaflow/types"
import { scoreHyderabadRoutes, generateRouteExplanations } from "@/src/engine/scoring"
import { FieldLabel, Chip, Readout, NumberTicker } from "./primitives"
import { TransparencyInspector } from "./transparency-inspector"
import dynamic from "next/dynamic"

// Lazy load LiveMap client-side only
const LiveMap = dynamic(() => import("../map/live-map"), { ssr: false })

interface AnalysisDashboardProps {
  origin: Place
  destination: Place
  initialRoutes: Route[]
  initialWeights: Weights
  onBack: () => void
}

const CONGESTION_TONE = {
  clear: "bg-[#10B981]",
  moderate: "bg-[#F59E0B]",
  heavy: "bg-[#F87171]",
}

const FACTOR_COLOR = {
  time: "#60A5FA", // Speed
  distance: "#F59E0B", // Distance
  reliability: "#E08E45", // Corridor Grade
}

function ScoreBar({ route }: { route: ScoredRoute }) {
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded bg-[#232731]" role="img">
      {(["time", "distance", "reliability"] as const).map((factor) => {
        const c = route.score.components[factor]
        if (c.contribution <= 0) return null
        return (
          <div
            key={factor}
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${c.contribution}%`,
              backgroundColor: FACTOR_COLOR[factor],
            }}
            title={`${factor}: ${c.contribution.toFixed(1)} pts`}
          />
        )
      })}
    </div>
  )
}

function DashboardSlider({
  label,
  value,
  swatchClass,
  onValueChange,
}: {
  label: string
  value: number
  swatchClass: string
  onValueChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[#2A2E38]/40 bg-[#16181F] px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-sm", swatchClass)} aria-hidden />
          <span className="font-sans text-xs font-semibold text-foreground">{label}</span>
        </div>
        <span className="font-mono text-[0.68rem] text-[#E08E45] font-bold">{value}/10</span>
      </div>
      <Slider.Root
        value={value}
        min={0}
        max={10}
        step={1}
        onValueChange={(next) =>
          onValueChange(Array.isArray(next) ? next[0] : (next as number))
        }
      >
        <Slider.Control className="flex h-4 w-full items-center cursor-pointer">
          <Slider.Track className="h-1 w-full rounded-full bg-[#232731]">
            <Slider.Indicator className="rounded-full bg-[#E08E45]" />
            <Slider.Thumb className="size-3.5 rounded-full border border-[#E08E45] bg-[#111318] shadow-[0_0_8px_rgba(224,142,69,0.4)] outline-none" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  )
}

export function AnalysisDashboard({
  origin,
  destination,
  initialRoutes,
  initialWeights,
  onBack,
}: AnalysisDashboardProps) {
  const [weights, setWeights] = useState<Weights>(initialWeights)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [showInspector, setShowInspector] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Client-side dynamic scoring matrix updates instantly on slider adjustment
  const scoredRoutes = useMemo(() => {
    return scoreHyderabadRoutes(initialRoutes, weights)
  }, [initialRoutes, weights])

  const winnerRoute = useMemo(() => {
    return scoredRoutes.find((r) => r.rank === 1) || scoredRoutes[0]
  }, [scoredRoutes])

  const selectedRoute = useMemo(() => {
    return scoredRoutes.find((r) => r.id === selectedRouteId) || winnerRoute
  }, [scoredRoutes, selectedRouteId, winnerRoute])

  const explanations = useMemo(() => {
    if (!selectedRoute) return []
    const friction = selectedRoute.score.components.reliability.rawValue
    return generateRouteExplanations(selectedRoute, initialRoutes, friction)
  }, [selectedRoute, initialRoutes])

  // Normalization logic helper to display inside modal
  const sumWeights = weights.time + weights.distance + weights.reliability
  const normalizedWeights = useMemo(() => {
    if (sumWeights <= 0) return { time: 0.33, distance: 0.33, reliability: 0.34 }
    return {
      time: weights.time / sumWeights,
      distance: weights.distance / sumWeights,
      reliability: weights.reliability / sumWeights,
    }
  }, [weights, sumWeights])

  const isSingleRoute = scoredRoutes.length <= 1

  return (
    <div className="min-h-screen bg-[#111318] text-[#F3F4F6] flex flex-col font-sans">
      {/* Dynamic Telemetry Header */}
      <header className="border-b border-[#2A2E38] bg-[#16181F]/80 sticky top-0 z-[100] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-lg border border-[#2A2E38] bg-[#111318] px-3 py-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#8B93A7] hover:border-[#3A3F4D] hover:text-foreground cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Adjust Corridor
            </button>
            <div className="h-5 w-px bg-[#2A2E38]" />
            <div className="flex items-center gap-2 truncate">
              <span className="font-sans text-sm font-bold text-foreground truncate max-w-[120px] md:max-w-none">
                {origin.name}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E08E45" strokeWidth="3" className="shrink-0">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="font-sans text-sm font-bold text-foreground truncate max-w-[120px] md:max-w-none">
                {destination.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#10B981] engine-pulse-dot" />
            <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[#10B981] hidden sm:inline">
              REAL-TIME MODEL COMPILING
            </span>
          </div>
        </div>
      </header>

      {/* Real-time Hero Strip */}
      <div className="border-b border-[#2A2E38] bg-[#16181F]/40 py-5">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block size-1.5 rounded-full bg-[#E08E45]" />
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#E08E45]">
                HYDERABAD DETERMINISTIC SPATIAL ENGINE
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Spatial Corridor Analysis
            </h1>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-[#2A2E38] bg-[#111318] px-3.5 py-2 shadow-inner">
            <div className="flex flex-col gap-0.5">
              <FieldLabel>OSM Analysis Bounds</FieldLabel>
              <span className="font-mono text-[0.68rem] font-semibold text-foreground">
                Hyderabad Box (Bounded)
              </span>
            </div>
            <div className="h-6 w-px bg-[#2A2E38]" />
            <div className="flex flex-col gap-0.5">
              <FieldLabel>Confidence</FieldLabel>
              <span className="font-mono text-[0.68rem] font-semibold text-[#10B981]">
                98.4% Optimal Heuristic
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-12 flex-1">
        {/* Left Column: Ranked Strategies */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#2A2E38] pb-3">
            <h2 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider">
              Scored Route Strategies
            </h2>
            <div className="flex items-center gap-4 font-mono text-[0.6rem] text-[#8B93A7]">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-sm bg-[#60A5FA]" />
                <span>Speed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-sm bg-[#F59E0B]" />
                <span>Dist</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-sm bg-[#E08E45]" />
                <span>Grade</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {scoredRoutes.map((route) => {
                const isTop = route.rank === 1
                const isSelected = route.id === selectedRoute.id

                return (
                  <motion.div
                    key={route.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  >
                    <div
                      onClick={() => setSelectedRouteId(route.id)}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "group relative w-full rounded-xl border text-left transition-all duration-300 outline-none cursor-pointer",
                        isTop
                          ? "bg-[#1A1D24] p-5 md:p-6 border-[#E08E45]/60 shadow-[0_4px_24px_rgba(224,142,69,0.1)]"
                          : "bg-[#15171E] p-4 border-[#2A2E38] opacity-80 hover:opacity-100",
                        isSelected && (isTop ? "ring-2 ring-[#E08E45]" : "border-[#8B93A7] ring-1 ring-[#8B93A7]/50 bg-[#1A1D24]")
                      )}
                    >
                      {isTop && (
                        <div className="mb-3.5 flex items-center justify-between border-b border-[#2A2E38]/85 pb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="flex size-1.5 items-center justify-center">
                              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#E08E45] opacity-75" />
                              <span className="relative inline-flex size-1.5 rounded-full bg-[#E08E45]" />
                            </span>
                            <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#E08E45]">
                              DOMINANT RECOMMENDATION
                            </span>
                          </div>
                          {!isSingleRoute && (
                            <span className="font-mono text-[0.6rem] text-[#10B981] font-semibold">
                              Optimal Strategy #1
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex shrink-0 items-center justify-center rounded font-mono font-bold text-xs",
                                isTop ? "size-6 bg-[#E08E45] text-[#111318]" : "size-5 bg-[#232731] text-[#8B93A7]"
                              )}
                            >
                              #{route.rank}
                            </span>
                            <h3 className="font-sans font-bold text-sm text-foreground truncate">
                              {route.name}
                            </h3>
                          </div>
                          <p className="text-xs text-[#8B93A7] leading-relaxed mt-0.5">
                            {route.summary}
                          </p>
                        </div>

                        {/* Score display */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-baseline gap-0.5">
                            <NumberTicker
                              value={route.score.total}
                              decimals={1}
                              className={cn(
                                "font-bold font-mono tracking-tight",
                                isTop ? "text-3xl text-[#E08E45]" : "text-xl text-[#8B93A7]"
                              )}
                            />
                            <span className="font-mono text-[0.65rem] text-[#8B93A7]">/100</span>
                          </div>
                          {!isTop && !isSingleRoute && (
                            <span className="font-mono text-[0.6rem] text-[#F87171] mt-0.5">
                              -{(winnerRoute.score.total - route.score.total).toFixed(1)} pts
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance Indicators */}
                      <div className="grid grid-cols-3 gap-2 border-t border-[#2A2E38]/50 mt-4 pt-3 text-xs">
                        <div>
                          <FieldLabel className="text-[0.58rem]">Est. Time</FieldLabel>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-mono font-semibold text-foreground">
                              {route.metrics.durationMin} min
                            </span>
                            {!isTop && !isSingleRoute && (
                              <span className="font-mono text-[0.58rem] text-[#F87171]">
                                +{Math.round(route.metrics.durationMin - winnerRoute.metrics.durationMin)}m
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <FieldLabel className="text-[0.58rem]">Distance</FieldLabel>
                          <div className="font-mono font-semibold text-foreground mt-0.5">
                            {route.metrics.distanceKm.toFixed(1)} km
                          </div>
                        </div>
                        <div>
                          <FieldLabel className="text-[0.58rem]">Friction</FieldLabel>
                          <div className="font-mono font-semibold text-foreground mt-0.5">
                            {route.score.components.reliability.rawValue.toFixed(2)} Index
                          </div>
                        </div>
                      </div>

                      {/* Stacked Score Decomposition */}
                      <div className="flex flex-col gap-1.5 mt-3.5">
                        <div className="flex justify-between font-mono text-[0.55rem] uppercase tracking-wider text-[#8B93A7]">
                          <span>Factor breakdown</span>
                          <span>Score weight sum: 100%</span>
                        </div>
                        <ScoreBar route={route} />
                      </div>

                      {/* Tags */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {route.tags.map((tag) => (
                          <Chip key={tag} variant={isTop ? "accent" : "default"}>
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Map, Active Weights, details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Spatial Map Viewport (Mounted client-side only) */}
          {isMounted ? (
            <LiveMap
              origin={origin}
              destination={destination}
              options={scoredRoutes}
              selectedRouteId={selectedRoute.id}
              onSelect={setSelectedRouteId}
            />
          ) : (
            <div className="aspect-[4/3] w-full min-h-[340px] md:aspect-square animate-pulse rounded-xl border border-[#2A2E38] bg-[#1A1D24] flex items-center justify-center">
              <span className="font-mono text-xs text-[#8B93A7]">LOADING GEOGRAPHIC VIEWPORT...</span>
            </div>
          )}

          {/* Slider Panel & Strategy Inspector Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Real-time slider weights */}
            <div className="rounded-xl border border-[#2A2E38] bg-[#1A1D24] p-5 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#2A2E38]/60 pb-2">
                  <FieldLabel>Dashboard Matrix weights</FieldLabel>
                  <span className="font-mono text-[0.58rem] text-[#10B981] font-semibold">CLIENT-SIDE</span>
                </div>
                <div className="flex flex-col gap-3">
                  <DashboardSlider
                    label="Speed wt"
                    swatchClass="bg-[#60A5FA]"
                    value={weights.time}
                    onValueChange={(v) => setWeights({ ...weights, time: v })}
                  />
                  <DashboardSlider
                    label="Distance wd"
                    swatchClass="bg-[#F59E0B]"
                    value={weights.distance}
                    onValueChange={(v) => setWeights({ ...weights, distance: v })}
                  />
                  <DashboardSlider
                    label="Corridor Grade wf"
                    swatchClass="bg-[#E08E45]"
                    value={weights.reliability}
                    onValueChange={(v) => setWeights({ ...weights, reliability: v })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(true)}
                className="mt-4 w-full rounded-lg border border-[#E08E45]/40 bg-[#E08E45]/10 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#E08E45] hover:bg-[#E08E45]/20 active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                Inspect Scoring Math & Payload
              </button>
            </div>

            {/* Selected Strategy Inspector */}
            <div className="rounded-xl border border-[#2A2E38] bg-[#1A1D24] p-5 shadow-lg flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#2A2E38]/60 pb-2 mb-3">
                  <FieldLabel>Why This Route Wins</FieldLabel>
                  <Chip variant={selectedRoute.rank === 1 ? "accent" : "muted"}>
                    Rank #{selectedRoute.rank}
                  </Chip>
                </div>
                {explanations.length > 0 ? (
                  <ul className="space-y-2">
                    {explanations.map((exp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#F3F4F6]">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3.5"
                          className="mt-0.5 shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#8B93A7]">No comparative metrics computed.</p>
                )}
              </div>

              <div className="border-t border-[#2A2E38]/50 pt-3">
                <FieldLabel className="mb-2 block">Detail Analytics</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Readout
                    label="ETA Variance"
                    value={`±${selectedRoute.metrics.etaVarianceMin}`}
                    unit="minutes"
                  />
                  <Readout
                    label="Access Cost"
                    value={selectedRoute.metrics.costUnits === 0 ? "Free" : `${selectedRoute.metrics.costUnits}`}
                    unit={selectedRoute.metrics.costUnits === 0 ? undefined : "Units"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Segment details timeline */}
          <div className="rounded-xl border border-[#2A2E38] bg-[#1A1D24] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#2A2E38] px-4.5 py-3">
              <FieldLabel>Segment Analysis Timeline</FieldLabel>
              <span className="font-mono text-[0.625rem] text-[#8B93A7]">
                {selectedRoute.segments.length} segments analyzed
              </span>
            </div>
            <ol className="flex flex-col max-h-56 overflow-y-auto divide-y divide-[#2A2E38]/40">
              {selectedRoute.segments.map((seg, i) => (
                <li key={seg.id} className="flex items-center gap-3.5 px-4.5 py-3">
                  <span
                    className={cn("size-2.5 rounded-full shrink-0", CONGESTION_TONE[seg.congestion])}
                    title={`Traffic friction: ${seg.congestion}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {seg.label}
                    </div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-wider text-[#8B93A7] mt-0.5">
                      {seg.segmentClass} · Friction {seg.congestion}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-semibold text-foreground">
                      {seg.durationMin.toFixed(1)}m
                    </div>
                    <div className="font-mono text-[0.6rem] text-[#8B93A7]">
                      {seg.distanceKm.toFixed(2)}km
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>

      {/* Inspection Modal */}
      {showInspector && (
        <TransparencyInspector
          route={selectedRoute}
          weights={weights}
          normalizedWeights={normalizedWeights}
          onClose={() => setShowInspector(false)}
        />
      )}
    </div>
  )
}
