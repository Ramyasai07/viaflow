import type { Route, ScoredRoute, Weights, ScoreComponent, RouteSegment } from "@/lib/viaflow/types"

// Friction factors per road classification
const FRICTION_EXPRESSWAY = 0.1
const FRICTION_ARTERIAL = 0.4
const FRICTION_LOCAL = 0.8

// Regular expressions to analyze road names from steps
const EXPRESSWAY_REGEX = /(flyover|expressway|orr|outer ring|pvnr|elevated|bypass)/i
const ARTERIAL_REGEX = /(national highway|nh\d|main road|road no|highway|marg|express route)/i

/**
 * Computes the Friction Index of a route based on segment classifications.
 * Weighted by distance of each segment.
 */
export function calculateFrictionIndex(segments: RouteSegment[]): number {
  if (segments.length === 0) return FRICTION_LOCAL

  let totalWeightedFriction = 0
  let totalDistance = 0

  for (const seg of segments) {
    let f = FRICTION_LOCAL
    const name = seg.label.toLowerCase()

    if (EXPRESSWAY_REGEX.test(name)) {
      f = FRICTION_EXPRESSWAY
    } else if (ARTERIAL_REGEX.test(name)) {
      f = FRICTION_ARTERIAL
    }

    totalWeightedFriction += seg.distanceKm * f
    totalDistance += seg.distanceKm
  }

  return totalDistance === 0 ? FRICTION_LOCAL : totalWeightedFriction / totalDistance
}

/**
 * Normalizes weight parameters so they always sum to exactly 1.0.
 * This guarantees the final score remains strictly in the [0, 100] range.
 */
export function normalizeWeights(weights: Weights): Weights {
  const sum = (weights.time || 0) + (weights.distance || 0) + (weights.reliability || 0)
  if (sum <= 0) {
    return { time: 0.33, distance: 0.33, reliability: 0.34 }
  }
  return {
    time: (weights.time || 0) / sum,
    distance: (weights.distance || 0) / sum,
    reliability: (weights.reliability || 0) / sum,
  }
}

/**
 * Normalizes a raw value across candidates.
 * Returns a value from 0 to 100, where 100 represents the BEST performance
 * (minimum time, minimum distance, minimum friction).
 */
function normalizeMetric(
  value: number,
  min: number,
  max: number
): number {
  const range = max - min
  if (range === 0) return 50
  
  // Lower value is better, so minimum raw value gets 100, maximum gets 0.
  const percentage = ((value - min) / range) * 100
  return Math.round((100 - percentage) * 10) / 10
}

/**
 * Generates exact explanatory deltas comparing a route to other candidate routes.
 */
export function generateRouteExplanations(
  route: Route,
  allRoutes: Route[],
  frictionIndex: number
): string[] {
  const explanations: string[] = []
  if (allRoutes.length <= 1) {
    explanations.push("Single available corridor configuration.")
    return explanations
  }

  const otherRoutes = allRoutes.filter((r) => r.id !== route.id)
  
  // Calculate average duration and distance of other routes
  const avgDuration = otherRoutes.reduce((sum, r) => sum + r.metrics.durationMin, 0) / otherRoutes.length
  const avgDistance = otherRoutes.reduce((sum, r) => sum + r.metrics.distanceKm, 0) / otherRoutes.length

  // Compare Time
  if (route.metrics.durationMin < avgDuration) {
    const diffPct = Math.round(((avgDuration - route.metrics.durationMin) / avgDuration) * 100)
    if (diffPct > 0) {
      explanations.push(`${diffPct}% faster transit time than alternatives`)
    }
  }

  // Compare Distance
  if (route.metrics.distanceKm < avgDistance) {
    const diffPct = Math.round(((avgDistance - route.metrics.distanceKm) / avgDistance) * 100)
    if (diffPct > 0) {
      explanations.push(`${diffPct}% shorter spatial distance`)
    }
  }

  // Segment classification analysis
  const totalDist = route.metrics.distanceKm || 1
  const expressDist = route.segments
    .filter((s) => EXPRESSWAY_REGEX.test(s.label))
    .reduce((sum, s) => sum + s.distanceKm, 0)

  const expressPct = Math.round((expressDist / totalDist) * 100)
  if (expressPct >= 40) {
    explanations.push(`${expressPct}% dedicated flyovers & expressways`)
  }

  const localSegments = route.segments.filter(
    (s) => !EXPRESSWAY_REGEX.test(s.label) && !ARTERIAL_REGEX.test(s.label)
  )
  if (localSegments.length === 0) {
    explanations.push("Avoids high-density surface street intersections")
  } else if (localSegments.length <= 2) {
    explanations.push("Minimizes residential corridor friction")
  }

  // Heuristic description of the winner factor
  if (frictionIndex < 0.3) {
    explanations.push("Prioritizes uninterrupted high-speed flow")
  }

  return explanations.slice(0, 3)
}

/**
 * Client-side mathematical scoring function.
 */
export function scoreHyderabadRoutes(
  routes: Route[],
  weights: Weights
): ScoredRoute[] {
  if (routes.length === 0) return []

  const w = normalizeWeights(weights)

  // Compute friction index for each route
  const routeFrictions = routes.map((r) => ({
    id: r.id,
    friction: calculateFrictionIndex(r.segments),
  }))

  // Extract min/max bounds for normalizations
  const times = routes.map((r) => r.metrics.durationMin)
  const distances = routes.map((r) => r.metrics.distanceKm)
  const frictions = routeFrictions.map((f) => f.friction)

  const bounds = {
    time: { min: Math.min(...times), max: Math.max(...times) },
    distance: { min: Math.min(...distances), max: Math.max(...distances) },
    reliability: { min: Math.min(...frictions), max: Math.max(...frictions) },
  }

  const scored: ScoredRoute[] = routes.map((route) => {
    const fIdx = routeFrictions.find((f) => f.id === route.id)?.friction ?? FRICTION_LOCAL

    // Calculate normalized factor values (0..100, where 100 is best)
    const normTime = normalizeMetric(route.metrics.durationMin, bounds.time.min, bounds.time.max)
    const normDistance = normalizeMetric(route.metrics.distanceKm, bounds.distance.min, bounds.distance.max)
    const normFriction = normalizeMetric(fIdx, bounds.reliability.min, bounds.reliability.max)

    const components: Record<"time" | "distance" | "reliability", ScoreComponent> = {
      time: {
        factor: "time",
        normalized: normTime,
        weight: w.time,
        contribution: Math.round(normTime * w.time * 10) / 10,
        rawValue: route.metrics.durationMin,
      },
      distance: {
        factor: "distance",
        normalized: normDistance,
        weight: w.distance,
        contribution: Math.round(normDistance * w.distance * 10) / 10,
        rawValue: route.metrics.distanceKm,
      },
      reliability: {
        factor: "reliability",
        normalized: normFriction,
        weight: w.reliability,
        contribution: Math.round(normFriction * w.reliability * 10) / 10,
        rawValue: Math.round(fIdx * 100) / 100,
      },
    }

    // Total score is sum of weighted positive contributions
    const total = Math.round(
      (components.time.contribution +
        components.distance.contribution +
        components.reliability.contribution) * 10
    ) / 10

    return {
      ...route,
      score: {
        total,
        components,
      },
      rank: 0,
    }
  })

  // Rank best-first (highest score); break ties by duration
  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total
    return a.metrics.durationMin - b.metrics.durationMin
  })

  scored.forEach((route, idx) => {
    route.rank = idx + 1
  })

  return scored
}
