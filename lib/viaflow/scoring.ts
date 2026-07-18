/**
 * Transparent, deterministic scoring engine.
 *
 * Given a set of candidate routes and a user's factor weights, this module
 * produces a fully explainable 0..100 score for each route. Nothing here is a
 * black box: every number the UI shows can be traced back to a min/max
 * normalisation and a weighted sum.
 */

import type {
  Route,
  RouteScore,
  ScoreComponent,
  ScoreFactor,
  ScoredRoute,
  Weights,
} from "./types"

export const SCORE_FACTORS: ScoreFactor[] = ["time", "distance", "reliability"]

export const FACTOR_META: Record<
  ScoreFactor,
  { label: string; unit: string; direction: "lower" | "higher"; blurb: string }
> = {
  time: {
    label: "Time",
    unit: "min",
    direction: "lower",
    blurb: "Median door-to-door travel time.",
  },
  distance: {
    label: "Distance",
    unit: "km",
    direction: "lower",
    blurb: "Total path length across all segments.",
  },
  reliability: {
    label: "Reliability",
    unit: "%",
    direction: "higher",
    blurb: "How often the ETA held on historical trips.",
  },
}

/** Normalise arbitrary positive weights so they sum to exactly 1. */
export function normalizeWeights(weights: Weights): Weights {
  const sum = SCORE_FACTORS.reduce((acc, f) => acc + Math.max(0, weights[f]), 0)
  if (sum <= 0) {
    // Degenerate input — fall back to an equal split.
    return { time: 1 / 3, distance: 1 / 3, reliability: 1 / 3 }
  }
  return {
    time: Math.max(0, weights.time) / sum,
    distance: Math.max(0, weights.distance) / sum,
    reliability: Math.max(0, weights.reliability) / sum,
  }
}

/**
 * Min/max normalise a raw value to 0..100 where 100 is always "best".
 * For `lower` factors (time, distance) a smaller value scores higher.
 */
function normalizeValue(
  value: number,
  min: number,
  max: number,
  direction: "lower" | "higher",
): number {
  if (max === min) return 100
  const t = (value - min) / (max - min)
  const good = direction === "lower" ? 1 - t : t
  return Math.round(good * 1000) / 10
}

function rawValueFor(route: Route, factor: ScoreFactor): number {
  switch (factor) {
    case "time":
      return route.metrics.durationMin
    case "distance":
      return route.metrics.distanceKm
    case "reliability":
      return route.metrics.reliabilityPct
  }
}

/**
 * Score and rank a candidate set. Pure function: same inputs always produce the
 * same output, which keeps the "transparent score" claim honest and testable.
 */
export function scoreRoutes(routes: Route[], weights: Weights): ScoredRoute[] {
  const w = normalizeWeights(weights)

  // Establish per-factor bounds across the candidate set.
  const bounds = SCORE_FACTORS.reduce(
    (acc, factor) => {
      const values = routes.map((r) => rawValueFor(r, factor))
      acc[factor] = { min: Math.min(...values), max: Math.max(...values) }
      return acc
    },
    {} as Record<ScoreFactor, { min: number; max: number }>,
  )

  const scored = routes.map((route) => {
    const components = SCORE_FACTORS.reduce(
      (acc, factor) => {
        const raw = rawValueFor(route, factor)
        const normalized = normalizeValue(
          raw,
          bounds[factor].min,
          bounds[factor].max,
          FACTOR_META[factor].direction,
        )
        const weight = w[factor]
        const component: ScoreComponent = {
          factor,
          normalized,
          weight,
          contribution: Math.round(normalized * weight * 10) / 10,
          rawValue: raw,
        }
        acc[factor] = component
        return acc
      },
      {} as Record<ScoreFactor, ScoreComponent>,
    )

    const total =
      Math.round(
        SCORE_FACTORS.reduce((sum, f) => sum + components[f].contribution, 0) *
          10,
      ) / 10

    const score: RouteScore = { total, components }
    return { ...route, score, rank: 0 }
  })

  // Rank best-first; break ties by reliability so results stay stable.
  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total
    return b.metrics.reliabilityPct - a.metrics.reliabilityPct
  })
  scored.forEach((route, index) => {
    route.rank = index + 1
  })

  return scored
}
