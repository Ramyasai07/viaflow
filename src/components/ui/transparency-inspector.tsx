"use client"

import type { ScoredRoute, Weights } from "@/lib/viaflow/types"

interface TransparencyInspectorProps {
  route: ScoredRoute
  weights: Weights
  normalizedWeights: Weights
  onClose: () => void
}

export function TransparencyInspector({
  route,
  weights,
  normalizedWeights,
  onClose,
}: TransparencyInspectorProps) {
  // Format weights for math expression
  const wt = normalizedWeights.time.toFixed(3)
  const wd = normalizedWeights.distance.toFixed(3)
  const wf = normalizedWeights.reliability.toFixed(3)

  const normTime = route.score.components.time.normalized.toFixed(1)
  const normDist = route.score.components.distance.normalized.toFixed(1)
  const normFric = route.score.components.reliability.normalized.toFixed(1)

  const scoreTotal = route.score.total.toFixed(1)

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#111318]/85 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#2A2E38] bg-[#1A1D24] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2E38] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-block size-2.5 rounded-sm bg-[#E08E45]" />
            <h3 className="font-sans text-base font-bold text-foreground">
              Transparency Inspector: {route.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#2A2E38] bg-[#111318] p-1.5 text-[#8B93A7] hover:border-[#3A3F4D] hover:text-[#F3F4F6] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Formula section */}
          <section className="space-y-2">
            <h4 className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#8B93A7]">
              Multi-Criteria Optimization Model
            </h4>
            <div className="rounded-lg border border-[#2A2E38] bg-[#111318] p-4 font-mono text-xs">
              <div className="text-center text-[#E08E45] text-sm font-bold mb-3">
                Score = 100 - (w_t' * T_hat + w_d' * D_hat + w_f' * F_hat)
              </div>
              <div className="space-y-1.5 border-t border-[#2A2E38] pt-3 text-[#8B93A7]">
                <div className="flex justify-between">
                  <span>User Weights (Sliders):</span>
                  <span className="text-foreground">Speed: {weights.time} · Distance: {weights.distance} · Friction: {weights.reliability}</span>
                </div>
                <div className="flex justify-between">
                  <span>Normalized Weights (wt', wd', wf'):</span>
                  <span className="text-foreground">{wt} · {wd} · {wf} (Sum = 1.0)</span>
                </div>
                <div className="flex justify-between">
                  <span>Route Penalty Indexes (T_hat, D_hat, F_hat):</span>
                  <span className="text-foreground">{(100 - parseFloat(normTime)).toFixed(1)} · {(100 - parseFloat(normDist)).toFixed(1)} · {(100 - parseFloat(normFric)).toFixed(1)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground pt-1.5 border-t border-[#2A2E38]/50">
                  <span>Computed Score calculation:</span>
                  <span className="text-[#E08E45]">
                    100 - ({wt}*{((100 - parseFloat(normTime))).toFixed(1)} + {wd}*{((100 - parseFloat(normDist))).toFixed(1)} + {wf}*{((100 - parseFloat(normFric))).toFixed(1)}) = {scoreTotal}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Road Segment Friction classifications */}
          <section className="space-y-2">
            <h4 className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#8B93A7]">
              OSM Segment Friction Index Detail
            </h4>
            <div className="overflow-x-auto rounded-lg border border-[#2A2E38] bg-[#111318]">
              <table className="w-full border-collapse font-mono text-xs text-[#8B93A7]">
                <thead>
                  <tr className="border-b border-[#2A2E38] bg-[#16181F] text-left text-[0.625rem] font-bold uppercase tracking-wider text-[#8B93A7]">
                    <th className="px-4 py-2">Road/Segment Name</th>
                    <th className="px-4 py-2">Length (km)</th>
                    <th className="px-4 py-2">Friction Coeff</th>
                    <th className="px-4 py-2 text-right">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E38]/50">
                  {route.segments.map((seg) => {
                    let coef = "0.80 (Local)"
                    if (/(flyover|expressway|orr|outer ring|pvnr|elevated|bypass)/i.test(seg.label)) {
                      coef = "0.10 (Express)"
                    } else if (/(national highway|nh\d|main road|road no|highway|marg|express route)/i.test(seg.label)) {
                      coef = "0.40 (Arterial)"
                    }
                    return (
                      <tr key={seg.id} className="hover:bg-[#1A1D24]/50">
                        <td className="px-4 py-2.5 text-foreground font-semibold truncate max-w-[240px]">
                          {seg.label}
                        </td>
                        <td className="px-4 py-2.5">{seg.distanceKm.toFixed(2)} km</td>
                        <td className="px-4 py-2.5">{coef}</td>
                        <td className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-[0.65rem] text-[#8B93A7]">
                          {seg.segmentClass}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-[0.68rem] font-mono text-[#8B93A7] px-1 text-right">
              Friction Index = Sum(Length * Friction) / Sum(Length) = <span className="text-foreground font-bold">{route.score.components.reliability.rawValue.toFixed(2)}</span>
            </div>
          </section>

          {/* Raw GeoJSON Payload */}
          <section className="space-y-2">
            <h4 className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#8B93A7]">
              Raw OSRM Geometry payload (GeoJSON LineString)
            </h4>
            <div className="rounded-lg border border-[#2A2E38] bg-[#111318] p-4 max-h-48 overflow-y-auto">
              <pre className="font-mono text-[0.65rem] text-[#10B981] leading-relaxed select-all">
                {JSON.stringify(route.geometry, null, 2)}
              </pre>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#2A2E38] bg-[#16181F] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#E08E45] px-4 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#111318] hover:bg-[#f09f56] active:scale-[0.98] transition-all cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}
