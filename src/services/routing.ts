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
  const [originLon, originLat] = origin.location.coordinates
  const [destLon, destLat] = destination.location.coordinates

  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&alternatives=true&steps=true`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`OSRM routing failed with status: ${res.status}`)
    }

    const data = (await res.json()) as OSRMResponse
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No routes found from OSRM.")
    }

    return data.routes.map((rawRoute, index) => {
      const distanceKm = Math.round((rawRoute.distance / 1000) * 10) / 10
      const durationMin = Math.round(rawRoute.duration / 60)

      // Substring matching to classify segment types and estimate cost
      let hasToll = false
      const steps = rawRoute.legs[0]?.steps || []

      const segments = steps
        .map((step, stepIdx) => {
          const stepName = step.name || "Unnamed link"
          const distKm = Math.round((step.distance / 1000) * 100) / 100
          const durMin = Math.round((step.duration / 60) * 100) / 100

          // Classify the segment based on keywords
          let segmentClass: "express" | "arterial" | "surface" | "connector" = "surface"
          let congestion: "clear" | "moderate" | "heavy" = "clear"

          const nameLower = stepName.toLowerCase()
          if (/(flyover|expressway|orr|outer ring|pvnr|elevated|bypass)/i.test(nameLower)) {
            segmentClass = "express"
            if (/(orr|outer ring|toll)/i.test(nameLower)) {
              hasToll = true
            }
          } else if (/(national highway|nh\d|main road|road no|highway|marg|express route)/i.test(nameLower)) {
            segmentClass = "arterial"
          } else if (distKm < 0.3) {
            segmentClass = "connector"
          } else {
            segmentClass = "surface"
          }

          // Deterministic congestion rule based on segmentClass and distanceKm
          if (segmentClass === "express") {
            congestion = "clear"
          } else if (segmentClass === "arterial") {
            congestion = "moderate"
          } else if (segmentClass === "surface" || segmentClass === "connector") {
            if (distKm > 0.5) {
              congestion = "moderate"
            } else {
              congestion = "clear"
            }
          }

          // Return segment
          return {
            id: `route-${index}-step-${stepIdx}`,
            label: stepName,
            segmentClass,
            distanceKm: distKm,
            durationMin: durMin,
            congestion,
          }
        })
        .filter((seg) => seg.distanceKm > 0)

      // Fallback segment if empty
      if (segments.length === 0) {
        segments.push({
          id: `route-${index}-step-fallback`,
          label: `${origin.name} to ${destination.name} Connecting Corridor`,
          segmentClass: "arterial" as const,
          distanceKm,
          durationMin,
          congestion: "moderate" as const,
        })
      }

      // Compute heuristics for reliability, variance, and cost
      // These are heuristic models derived from road type composition
      const expressDist = segments
        .filter((s) => s.segmentClass === "express")
        .reduce((sum, s) => sum + s.distanceKm, 0)
      const surfaceDist = segments
        .filter((s) => s.segmentClass === "surface")
        .reduce((sum, s) => sum + s.distanceKm, 0)

      const expressShare = distanceKm > 0 ? expressDist / distanceKm : 0
      const surfaceShare = distanceKm > 0 ? surfaceDist / distanceKm : 0

      const reliabilityPct = Math.min(
        98,
        Math.max(65, Math.round(85 + expressShare * 12 - surfaceShare * 18))
      )
      const etaVarianceMin = Math.max(
        2,
        Math.round((durationMin * 0.08) + (surfaceShare * 6) - (expressShare * 2))
      )
      const costUnits = hasToll ? 8.5 : 0

      // Dynamic tags
      const tags: string[] = []
      if (costUnits > 0) {
        tags.push("Tolled")
      } else {
        tags.push("Toll-free")
      }

      if (expressShare > 0.5) {
        tags.push("Grade-separated")
      } else if (surfaceShare > 0.5) {
        tags.push("Urban Surface")
      } else {
        tags.push("Balanced Link")
      }

      if (etaVarianceMin <= 4) {
        tags.push("Low variance")
      }

      // Summary label
      const rawSummary = rawRoute.legs[0]?.summary || "Hyderabad Corridor"
      const summary = rawSummary.trim() ? `Via ${rawSummary}` : "Corridor Link"

      return {
        id: `route-option-${index}`,
        name: `Route Option #${index + 1} (${rawSummary || "Hyderabad Local"})`,
        summary,
        metrics: {
          durationMin,
          distanceKm,
          reliabilityPct,
          etaVarianceMin,
          costUnits,
        },
        tags,
        geometry: rawRoute.geometry,
        segments,
      }
    })
  } catch (err) {
    console.error("fetchHyderabadRoutes failed", err)
    throw err
  }
}
