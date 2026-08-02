import type { Place } from "@/lib/viaflow/types"

// Pre-populated default quick-select tokens for key Hyderabad hubs
export const DEFAULT_HUBS: Place[] = [
  {
    id: "gachibowli",
    name: "Gachibowli Junction",
    detail: "Financial & IT Corridor",
    kind: "hub",
    location: { type: "Point", coordinates: [78.3489, 17.4401] },
  },
  {
    id: "hitec-city",
    name: "HITEC City (Cyber Towers)",
    detail: "Tech Hub · Madhapur",
    kind: "hub",
    location: { type: "Point", coordinates: [78.3815, 17.4504] },
  },
  {
    id: "raidurg",
    name: "Raidurg Metro Station",
    detail: "Transit Terminal · Mindspace",
    kind: "terminal",
    location: { type: "Point", coordinates: [78.3762, 17.4429] },
  },
  {
    id: "financial-district",
    name: "Financial District",
    detail: "Corporate Hub · Nanakramguda",
    kind: "district",
    location: { type: "Point", coordinates: [78.3418, 17.4172] },
  },
  {
    id: "jubilee-hills",
    name: "Jubilee Hills Checkpost",
    detail: "Road No. 36 Transit Hub",
    kind: "landmark",
    location: { type: "Point", coordinates: [78.4010, 17.4250] },
  },
  {
    id: "shamshabad-airport",
    name: "Shamshabad Airport (RGIA)",
    detail: "International Air Terminal",
    kind: "terminal",
    location: { type: "Point", coordinates: [78.4294, 17.2403] },
  },
  {
    id: "secunderabad-station",
    name: "Secunderabad Station",
    detail: "Intercity Rail Terminal",
    kind: "terminal",
    location: { type: "Point", coordinates: [78.5034, 17.4334] },
  },
  {
    id: "kukatpally",
    name: "Kukatpally (Y Junction)",
    detail: "Commercial Corridor",
    kind: "hub",
    location: { type: "Point", coordinates: [78.4120, 17.4815] },
  },
]

// Strict spatial bounding limits for Hyderabad
const MIN_LAT = 17.15
const MAX_LAT = 17.65
const MIN_LNG = 78.15
const MAX_LNG = 78.75

export interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
  icon?: string
}

/**
 * Validates whether a given lat/lng falls within Hyderabad bounding box.
 */
export function isWithinHyderabad(lat: number, lng: number): boolean {
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG
}

/**
 * Cache geocode query in localStorage.
 */
function getCachedGeocode(query: string): Place[] | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(`viaflow_geocode_${query}`)
    if (cached) {
      return JSON.parse(cached) as Place[]
    }
  } catch (e) {
    console.error("Geocode cache retrieval failed", e)
  }
  return null
}

function setCachedGeocode(query: string, results: Place[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`viaflow_geocode_${query}`, JSON.stringify(results))
  } catch (e) {
    console.error("Geocode cache storage failed", e)
  }
}

/**
 * Searches Nominatim API restricted to Hyderabad and caches the output.
 */
export async function geocodeHyderabad(query: string): Promise<Place[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return DEFAULT_HUBS

  // Check pre-populated hubs first
  const localMatch = DEFAULT_HUBS.filter((hub) =>
    hub.name.toLowerCase().includes(trimmed) ||
    hub.detail.toLowerCase().includes(trimmed)
  )
  if (localMatch.length > 0) return localMatch

  // Check localStorage cache
  const cached = getCachedGeocode(trimmed)
  if (cached) return cached

  // Query Nominatim API with spatial bias and strict viewbox
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&viewbox=78.2,17.2,78.6,17.6&bounded=1&addressdetails=1&limit=8`

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ViaFlow-Hyderabad-Spatial-Engine/1.0",
      },
    })

    if (!res.ok) {
      throw new Error(`Nominatim error: HTTP ${res.status}`)
    }

    const data = (await res.json()) as NominatimResult[]

    const formatted: Place[] = data
      .map((item) => {
        const lat = parseFloat(item.lat)
        const lon = parseFloat(item.lon)

        // Strict post-fetch validation filter
        if (!isWithinHyderabad(lat, lon)) {
          return null
        }

        // Clean display name by splitting commas
        const nameParts = item.display_name.split(",")
        const name = nameParts[0].trim()
        const detail = nameParts.slice(1, 3).map((p) => p.trim()).join(", ") || "Hyderabad, India"

        let kind: Place["kind"] = "landmark"
        if (item.class === "highway" || item.type === "bus_stop" || item.type === "station") {
          kind = "terminal"
        } else if (item.class === "boundary" || item.class === "place") {
          kind = "district"
        } else if (item.type === "townhall" || item.type === "university" || item.type === "hospital") {
          kind = "hub"
        }

        return {
          id: `osm-${item.osm_id}`,
          name,
          detail,
          kind,
          location: {
            type: "Point" as const,
            coordinates: [lon, lat] as [number, number],
          },
        }
      })
      .filter((p): p is Place => p !== null)

    setCachedGeocode(trimmed, formatted)
    return formatted
  } catch (err) {
    console.error("Geocoding API request failed", err)
    // Fall back to filtered default hubs if network is offline or throttled
    return DEFAULT_HUBS.filter(
      (hub) =>
        hub.name.toLowerCase().includes(trimmed) ||
        hub.detail.toLowerCase().includes(trimmed)
    )
  }
}
