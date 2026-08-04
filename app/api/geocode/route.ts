import { NextRequest, NextResponse } from "next/server"
import type { Place } from "@/lib/viaflow/types"
import { isWithinHyderabad } from "@/src/services/geocoding"

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""

  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return NextResponse.json([])
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&viewbox=78.2,17.2,78.6,17.6&bounded=1&addressdetails=1&limit=8`

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ViaFlow-Hyderabad-Portfolio-Project/1.0 (contact: support@viaflow-planner.io)",
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Nominatim error: HTTP ${res.status}` }, { status: res.status })
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

    return NextResponse.json(formatted)
  } catch (err) {
    console.error("Server-side geocoding request failed", err)
    return NextResponse.json({ error: "Failed to fetch from Nominatim" }, { status: 500 })
  }
}
