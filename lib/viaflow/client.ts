/**
 * Mock implementation of the `ViaFlowApi` contract.
 *
 * Every method returns a Promise and simulates network latency, so components
 * treat this exactly as they would a real backend. To go live, implement a
 * `HttpViaFlowClient` that satisfies `ViaFlowApi` and swap the `api` export
 * below — no component or hook changes required.
 */

import {
  CORRIDOR_ROUTES,
  PLACES,
  SCENARIOS,
  corridorKey,
} from "./mock-data"
import { scoreRoutes } from "./scoring"
import type {
  Place,
  PlanRequest,
  Route,
  RoutePlan,
  Scenario,
  ViaFlowApi,
} from "./types"

/** Simulate variable network/compute latency. */
function delay<T>(value: T, minMs = 180, maxMs = 520): Promise<T> {
  const ms = Math.round(minMs + Math.random() * (maxMs - minMs))
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class MockViaFlowClient implements ViaFlowApi {
  async listPlaces(query?: string): Promise<Place[]> {
    const q = query?.trim().toLowerCase()
    const result = !q
      ? PLACES
      : PLACES.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.detail.toLowerCase().includes(q),
        )
    return delay(result, 80, 220)
  }

  async listScenarios(): Promise<Scenario[]> {
    return delay(SCENARIOS, 80, 200)
  }

  async planRoutes(request: PlanRequest): Promise<RoutePlan> {
    const origin = PLACES.find((p) => p.id === request.originId)
    const destination = PLACES.find((p) => p.id === request.destinationId)

    if (!origin) throw new NotFoundError(`Unknown origin: ${request.originId}`)
    if (!destination)
      throw new NotFoundError(`Unknown destination: ${request.destinationId}`)

    const key = corridorKey(request.originId, request.destinationId)
    const candidates: Route[] = CORRIDOR_ROUTES[key] ?? []

    if (candidates.length === 0) {
      throw new NotFoundError(
        `No corridor data for ${origin.name} → ${destination.name}`,
      )
    }

    const started = performance.now()
    const options = scoreRoutes(candidates, request.weights)
    const computeMs = Math.round((performance.now() - started) * 100) / 100

    const plan: RoutePlan = {
      origin,
      destination,
      weights: request.weights,
      options,
      computedAt: new Date().toISOString(),
      computeMs,
    }

    return delay(plan, 260, 620)
  }
}

/**
 * The single app-wide API instance. Swap this line to change data sources:
 *
 *   export const api: ViaFlowApi = new HttpViaFlowClient(env.API_URL)
 */
export const api: ViaFlowApi = new MockViaFlowClient()
