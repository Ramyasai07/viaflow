import { SCORE_FACTORS } from "@/lib/viaflow/scoring"
import type { RouteScore } from "@/lib/viaflow/types"
import { FACTOR_COLOR } from "@/lib/format"

/**
 * A stacked bar that decomposes a route's total score into the exact
 * contribution of each factor. This is the visual embodiment of the
 * "transparent, weighted score" — the bar segments literally sum to the total.
 */
export function ScoreBar({
  score,
  height = 8,
}: {
  score: RouteScore
  height?: number
}) {
  return (
    <div
      className="flex w-full overflow-hidden rounded-full bg-muted"
      style={{ height }}
      role="img"
      aria-label={`Weighted score ${score.total} of 100`}
    >
      {SCORE_FACTORS.map((factor) => {
        const c = score.components[factor]
        if (c.contribution <= 0) return null
        return (
          <div
            key={factor}
            className="h-full transition-[width] duration-500 ease-out"
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
