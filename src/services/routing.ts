import type { Place, Route } from "@/lib/viaflow/types"

export interface OSRMStep {
  distance: number
  duration: number
  name: string
  mode: string
  maneuver: {
    location: [number, number]
    type: string
  }
}

export interface OSRMLeg {
  distance: number
  duration: number
  steps: OSRMStep[]
  summary: string
}

export interface OSRMRouteResponse {
  geometry: {
    type: "LineString"
    coordinates: [number, number][]
  }
  legs: OSRMLeg[]
  distance: number
  duration: number
}

export interface OSRMResponse {
  code: string
  routes: OSRMRouteResponse[]
}

/**
 * Fetches real routing alternatives from public OSRM API for Hyderabad coordinates.
 */
export async function fetchHyderabadRoutes(
  origin: Place,
  destination: Place
): Promise<Route[]> {
  try {
    const res = await fetch("/api/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ origin, destination }),
    })

    if (!res.ok) {
      throw new Error(`Server routing endpoint failed with status: ${res.status}`)
    }

    return (await res.json()) as Route[]
  } catch (err) {
    console.error("fetchHyderabadRoutes failed", err)
    throw err
  }
}
