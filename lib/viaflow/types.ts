/**
 * ViaFlow domain model.
 *
 * These types describe the shape of every entity the UI consumes. They are
 * intentionally transport-agnostic and modelled on the payloads a real routing
 * backend (OSRM / Valhalla behind a FastAPI + PostGIS service) would return:
 * geometries are GeoJSON, metrics are plain numeric metadata. The mock client
 * in `client.ts` implements the exact same `ViaFlowApi` contract an HTTP client
 * would, so swapping the data source requires zero component changes.
 */

/** GeoJSON position: [longitude, latitude]. */
export type GeoPosition = [number, number]

/** GeoJSON Point geometry (RFC 7946). */
export interface PointGeometry {
  type: "Point"
  coordinates: GeoPosition
}

/** GeoJSON LineString geometry (RFC 7946) — the shape OSRM returns per route. */
export interface LineStringGeometry {
  type: "LineString"
  coordinates: GeoPosition[]
}

export type PlaceKind = "origin" | "hub" | "landmark" | "district" | "terminal"

export interface Place {
  id: string
  /** Short display name, e.g. "Gachibowli Junction". */
  name: string
  /** Secondary descriptor, e.g. "Logistics terminal · Sector 4". */
  detail: string
  kind: PlaceKind
  /** GeoJSON point location. */
  location: PointGeometry
}

export type SegmentClass = "arterial" | "express" | "surface" | "connector"

export type CongestionLevel = "clear" | "moderate" | "heavy"

export interface RouteSegment {
  id: string
  label: string
  segmentClass: SegmentClass
  distanceKm: number
  durationMin: number
  congestion: CongestionLevel
}

/**
 * Raw, un-scored measurements for a single route option. This is the payload a
 * real routing backend would return per candidate — scoring happens on the
 * client from these numbers.
 */
export interface RouteMetrics {
  /** Estimated travel time in minutes (median). */
  durationMin: number
  /** Total distance in kilometres. */
  distanceKm: number
  /**
   * Historical on-time reliability as a percentage (0..100). Higher is better:
   * it reflects how often the ETA held within tolerance on past trips.
   */
  reliabilityPct: number
  /** +/- minutes of ETA variance used to render a confidence band. */
  etaVarianceMin: number
  /** Toll / access cost in local currency units. */
  costUnits: number
}

export interface Route {
  id: string
  /** Human label, e.g. "Ridge Expressway". */
  name: string
  /** One-line character summary, e.g. "Fewest stops, tolled". */
  summary: string
  metrics: RouteMetrics
  segments: RouteSegment[]
  /** GeoJSON LineString describing the path from origin to destination. */
  geometry: LineStringGeometry
  /** Free-form descriptors surfaced as chips. */
  tags: string[]
}

/** The three transparent factors the user can weight. */
export type ScoreFactor = "time" | "distance" | "reliability"

/**
 * Relative importance of each factor. Values are arbitrary positive numbers;
 * the scoring engine normalises them so they always sum to 1.
 */
export type Weights = Record<ScoreFactor, number>

/** A single factor's normalised (0..100) score and its weighted contribution. */
export interface ScoreComponent {
  factor: ScoreFactor
  /** How this route performs on the factor vs. the candidate set (0..100). */
  normalized: number
  /** Effective weight after normalisation (0..1). */
  weight: number
  /** normalized * weight — the transparent contribution to the total. */
  contribution: number
  /** The raw underlying value, for display (e.g. "24 min"). */
  rawValue: number
}

export interface RouteScore {
  /** Weighted total, 0..100. */
  total: number
  components: Record<ScoreFactor, ScoreComponent>
}

/** A route enriched with its computed, transparent score. */
export interface ScoredRoute extends Route {
  score: RouteScore
  /** 1-based rank within the plan (1 = best). */
  rank: number
}

export interface PlanRequest {
  originId: string
  destinationId: string
  weights: Weights
}

export interface RoutePlan {
  origin: Place
  destination: Place
  weights: Weights
  options: ScoredRoute[]
  computedAt: string
  computeMs: number
}

export interface SchematicPoint {
  x: number
  y: number
}

/**
 * The raw corridor payload returned by the backend for an origin/destination
 * pair: endpoints plus the candidate routes. Scoring is applied client-side.
 */
export interface CorridorData {
  origin: Place
  destination: Place
  /** Candidate routes, un-scored (server order). */
  routes: Route[]
}

/** A pre-baked origin/destination pairing used to seed the planner. */
export interface Scenario {
  id: string
  label: string
  originId: string
  destinationId: string
  context: string
}

/**
 * The full API surface the UI depends on. Any implementation (mock, REST,
 * GraphQL, RPC) that satisfies this interface can be dropped in without
 * touching a single component or hook.
 */
export interface ViaFlowApi {
  listPlaces(query?: string): Promise<Place[]>
  listScenarios(): Promise<Scenario[]>
  /** Fetch the candidate corridor between two places (raw, un-scored). */
  getCorridor(originId: string, destinationId: string): Promise<CorridorData>
}
