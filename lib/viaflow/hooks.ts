"use client"

/**
 * SWR-based data hooks. Components consume these and never touch the client
 * directly, which keeps the swap-in-a-real-backend boundary clean.
 */

import useSWR from "swr"
import { api } from "./client"
import type { PlanRequest, Place, RoutePlan, Scenario } from "./types"

export function usePlaces(query?: string) {
  const { data, error, isLoading } = useSWR<Place[]>(
    ["places", query ?? ""],
    () => api.listPlaces(query),
    { revalidateOnFocus: false },
  )
  return { places: data ?? [], error, isLoading }
}

export function useScenarios() {
  const { data, error, isLoading } = useSWR<Scenario[]>(
    ["scenarios"],
    () => api.listScenarios(),
    { revalidateOnFocus: false },
  )
  return { scenarios: data ?? [], error, isLoading }
}

/**
 * Plan a route corridor. Pass `null` to skip fetching (SWR conditional key).
 * The key is derived from the full request so changing weights, origin, or
 * destination transparently refetches and recomputes the ranking.
 */
export function useRoutePlan(request: PlanRequest | null) {
  const key = request
    ? [
        "plan",
        request.originId,
        request.destinationId,
        request.weights.time,
        request.weights.distance,
        request.weights.reliability,
      ]
    : null

  const { data, error, isLoading, isValidating } = useSWR<RoutePlan>(
    key,
    () => api.planRoutes(request as PlanRequest),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  return { plan: data, error, isLoading, isValidating }
}
