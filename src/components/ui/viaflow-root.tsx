"use client"

import { useState } from "react"
import { Place, Weights, Route } from "@/lib/viaflow/types"
import { QueryConfigurator } from "./query-configurator"
import { AnalysisDashboard } from "./analysis-dashboard"
import { fetchHyderabadRoutes } from "@/src/services/routing"

export function ViaFlowRoot() {
  const [phase, setPhase] = useState<"input" | "dashboard">("input")
  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [weights, setWeights] = useState<Weights>({ time: 5, distance: 5, reliability: 5 })

  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompute = async () => {
    if (!origin || !destination) return

    setLoading(true)
    setError(null)

    try {
      const results = await fetchHyderabadRoutes(origin, destination)
      if (results.length === 0) {
        throw new Error("No routes found between these locations in Hyderabad.")
      }
      setRoutes(results)
      setPhase("dashboard")
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : "Spatial routing network request failed. Nominatim/OSRM demo servers might be rate-limiting. Try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setPhase("input")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#111113] text-[#E8E8EC] flex flex-col font-sans">
      {phase === "input" ? (
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <header className="border-b border-[#2A2A32] bg-[#1A1A1E]/70 px-4 py-4 md:px-6">
            <div className="mx-auto max-w-[1200px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full bg-[#F5A623]" />
                <span className="font-sans text-sm font-bold text-[#E8E8EC] tracking-tight">
                  ViaFlow — Urban Mobility Computation Engine
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8A8A95] border border-[#2A2A32] rounded px-2 py-0.5">
                v2.5 · Hyderabad Edition
              </span>
            </div>
          </header>

          {/* Main Form container */}
          <main className="mx-auto w-full max-w-[1000px] px-4 py-12 flex-1 flex flex-col justify-center gap-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-4">
              <h2 className="text-[28px] font-bold tracking-tight text-[#E8E8EC] sm:text-3xl">
                Continuous Strategy Evaluation
              </h2>
              <p className="text-sm text-[#8A8A95] leading-relaxed">
                Analyze and score spatial transit corridors in Hyderabad using real OpenStreetMap networks. Adjust optimization weights to dynamically update strategy models.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-[#EF4444]/45 bg-[#EF4444]/10 p-4 font-mono text-xs text-[#EF4444] max-w-2xl mx-auto w-full flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider">Spatial Routing Failure</div>
                  <div className="opacity-90">{error}</div>
                </div>
              </div>
            )}

            <div className="max-w-2xl mx-auto w-full">
              <QueryConfigurator
                origin={origin}
                destination={destination}
                weights={weights}
                onSetOrigin={setOrigin}
                onSetDestination={setDestination}
                onWeightsChange={setWeights}
                onCompute={handleCompute}
                loading={loading}
              />
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#2A2A32] bg-[#111113] px-4 py-6 md:px-6">
            <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-[#8A8A95]">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#34D399]" />
                <span>HYDERABAD CORRIDOR NETWORK · OPENSTREETMAP PIPELINE</span>
              </div>
              <div>
                <span>DETERMINISTIC SPATIAL MODEL V2.5</span>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <AnalysisDashboard
          origin={origin!}
          destination={destination!}
          initialRoutes={routes}
          initialWeights={weights}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
