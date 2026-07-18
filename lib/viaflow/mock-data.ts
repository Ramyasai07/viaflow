/**
 * Static mock dataset.
 *
 * This is the only file that "knows" the data is fake. It stands in for what a
 * routing service (OSRM / Valhalla behind FastAPI + PostGIS) would return:
 * places are GeoJSON Points, routes carry GeoJSON LineString geometries plus
 * numeric metric metadata. Coordinates describe a compact fictional metro so
 * ViaFlow renders as an analytical instrument rather than a branded map.
 */

import type { Place, Route, Scenario } from "./types"

export const PLACES: Place[] = [
  {
    id: "kester-yard",
    name: "Kester Yard",
    detail: "Logistics terminal · Sector 4",
    kind: "terminal",
    location: { type: "Point", coordinates: [-122.452, 37.7376] },
  },
  {
    id: "meridian-core",
    name: "Meridian Core",
    detail: "Central interchange",
    kind: "hub",
    location: { type: "Point", coordinates: [-122.41, 37.7664] },
  },
  {
    id: "halden-exchange",
    name: "Halden Exchange",
    detail: "Freight interchange · North ring",
    kind: "hub",
    location: { type: "Point", coordinates: [-122.398, 37.7872] },
  },
  {
    id: "vantor-quay",
    name: "Vantor Quay",
    detail: "Waterfront district",
    kind: "district",
    location: { type: "Point", coordinates: [-122.37, 37.744] },
  },
  {
    id: "orrin-field",
    name: "Orrin Field",
    detail: "Regional air terminal",
    kind: "terminal",
    location: { type: "Point", coordinates: [-122.368, 37.7808] },
  },
  {
    id: "lowbridge",
    name: "Lowbridge",
    detail: "Riverside crossing",
    kind: "landmark",
    location: { type: "Point", coordinates: [-122.426, 37.7456] },
  },
]

/**
 * Routes are keyed by a "corridor" id — the origin/destination pair they serve.
 * The scoring engine derives everything transparent from `metrics`.
 */
export const CORRIDOR_ROUTES: Record<string, Route[]> = {
  "kester-yard::orrin-field": [
    {
      id: "ridge-express",
      name: "Ridge Expressway",
      summary: "Fewest stops · tolled",
      metrics: {
        durationMin: 24,
        distanceKm: 31.4,
        reliabilityPct: 91,
        etaVarianceMin: 3,
        co2Kg: 6.1,
        costUnits: 8.5,
      },
      tags: ["Tolled", "Grade-separated", "Low variance"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.432, 37.76],
          [-122.4, 37.7728],
          [-122.368, 37.7808],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Kester ramp → Ridge on-ramp",
          segmentClass: "connector",
          distanceKm: 4.2,
          durationMin: 4,
          congestion: "clear",
        },
        {
          id: "s2",
          label: "Ridge Expressway mainline",
          segmentClass: "express",
          distanceKm: 21.6,
          durationMin: 14,
          congestion: "moderate",
        },
        {
          id: "s3",
          label: "Orrin approach arterial",
          segmentClass: "arterial",
          distanceKm: 5.6,
          durationMin: 6,
          congestion: "clear",
        },
      ],
    },
    {
      id: "meridian-link",
      name: "Meridian Link",
      summary: "Balanced · toll-free",
      metrics: {
        durationMin: 29,
        distanceKm: 27.8,
        reliabilityPct: 84,
        etaVarianceMin: 6,
        co2Kg: 5.2,
        costUnits: 0,
      },
      tags: ["Toll-free", "Central", "Scenic"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.41, 37.7664],
          [-122.39, 37.776],
          [-122.368, 37.7808],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Kester surface streets",
          segmentClass: "surface",
          distanceKm: 6.1,
          durationMin: 8,
          congestion: "moderate",
        },
        {
          id: "s2",
          label: "Meridian Core transit",
          segmentClass: "arterial",
          distanceKm: 12.4,
          durationMin: 12,
          congestion: "moderate",
        },
        {
          id: "s3",
          label: "North arterial to Orrin",
          segmentClass: "arterial",
          distanceKm: 9.3,
          durationMin: 9,
          congestion: "clear",
        },
      ],
    },
    {
      id: "halden-bypass",
      name: "Halden Bypass",
      summary: "Shortest · variable",
      metrics: {
        durationMin: 33,
        distanceKm: 25.1,
        reliabilityPct: 72,
        etaVarianceMin: 11,
        co2Kg: 4.7,
        costUnits: 2.0,
      },
      tags: ["Shortest", "Freight", "Weather-sensitive"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.426, 37.7456],
          [-122.398, 37.7872],
          [-122.368, 37.7808],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Lowbridge crossing",
          segmentClass: "surface",
          distanceKm: 7.4,
          durationMin: 11,
          congestion: "heavy",
        },
        {
          id: "s2",
          label: "Halden freight corridor",
          segmentClass: "connector",
          distanceKm: 12.9,
          durationMin: 14,
          congestion: "moderate",
        },
        {
          id: "s3",
          label: "Ring descent to Orrin",
          segmentClass: "arterial",
          distanceKm: 4.8,
          durationMin: 8,
          congestion: "moderate",
        },
      ],
    },
  ],
  "kester-yard::vantor-quay": [
    {
      id: "quay-direct",
      name: "Quay Direct",
      summary: "Fastest · waterfront",
      metrics: {
        durationMin: 19,
        distanceKm: 18.2,
        reliabilityPct: 88,
        etaVarianceMin: 4,
        co2Kg: 3.9,
        costUnits: 3.0,
      },
      tags: ["Fastest", "Waterfront", "Low variance"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.426, 37.7456],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Kester dockside",
          segmentClass: "surface",
          distanceKm: 5.1,
          durationMin: 6,
          congestion: "clear",
        },
        {
          id: "s2",
          label: "Quay boulevard",
          segmentClass: "arterial",
          distanceKm: 13.1,
          durationMin: 13,
          congestion: "moderate",
        },
      ],
    },
    {
      id: "core-loop",
      name: "Core Loop",
      summary: "Reliable · via center",
      metrics: {
        durationMin: 26,
        distanceKm: 22.6,
        reliabilityPct: 93,
        etaVarianceMin: 3,
        co2Kg: 4.8,
        costUnits: 0,
      },
      tags: ["Most reliable", "Toll-free", "Central"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.41, 37.7664],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Kester → Meridian ramp",
          segmentClass: "connector",
          distanceKm: 9.2,
          durationMin: 11,
          congestion: "moderate",
        },
        {
          id: "s2",
          label: "Meridian → Quay descent",
          segmentClass: "arterial",
          distanceKm: 13.4,
          durationMin: 15,
          congestion: "clear",
        },
      ],
    },
    {
      id: "lowbridge-cut",
      name: "Lowbridge Cut",
      summary: "Shortest · congested",
      metrics: {
        durationMin: 28,
        distanceKm: 16.9,
        reliabilityPct: 69,
        etaVarianceMin: 13,
        co2Kg: 3.4,
        costUnits: 0,
      },
      tags: ["Shortest", "Toll-free", "Peak congestion"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.452, 37.7376],
          [-122.426, 37.7456],
          [-122.398, 37.756],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Lowbridge span",
          segmentClass: "surface",
          distanceKm: 6.8,
          durationMin: 12,
          congestion: "heavy",
        },
        {
          id: "s2",
          label: "Riverside connector",
          segmentClass: "connector",
          distanceKm: 10.1,
          durationMin: 16,
          congestion: "heavy",
        },
      ],
    },
  ],
  "halden-exchange::vantor-quay": [
    {
      id: "south-descent",
      name: "South Descent",
      summary: "Fastest · grade-separated",
      metrics: {
        durationMin: 21,
        distanceKm: 23.7,
        reliabilityPct: 90,
        etaVarianceMin: 4,
        co2Kg: 5.0,
        costUnits: 4.5,
      },
      tags: ["Fastest", "Tolled", "Low variance"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.398, 37.7872],
          [-122.4, 37.7664],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Halden south ramp",
          segmentClass: "express",
          distanceKm: 12.4,
          durationMin: 9,
          congestion: "clear",
        },
        {
          id: "s2",
          label: "Quay descent",
          segmentClass: "arterial",
          distanceKm: 11.3,
          durationMin: 12,
          congestion: "moderate",
        },
      ],
    },
    {
      id: "meridian-transfer",
      name: "Meridian Transfer",
      summary: "Balanced · toll-free",
      metrics: {
        durationMin: 25,
        distanceKm: 21.2,
        reliabilityPct: 86,
        etaVarianceMin: 6,
        co2Kg: 4.4,
        costUnits: 0,
      },
      tags: ["Toll-free", "Central", "Even load"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.398, 37.7872],
          [-122.41, 37.7664],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "Halden → Meridian link",
          segmentClass: "connector",
          distanceKm: 10.6,
          durationMin: 13,
          congestion: "moderate",
        },
        {
          id: "s2",
          label: "Meridian → Quay arterial",
          segmentClass: "arterial",
          distanceKm: 10.6,
          durationMin: 12,
          congestion: "clear",
        },
      ],
    },
    {
      id: "ring-perimeter",
      name: "Ring Perimeter",
      summary: "Longest · most reliable",
      metrics: {
        durationMin: 27,
        distanceKm: 28.9,
        reliabilityPct: 95,
        etaVarianceMin: 2,
        co2Kg: 5.9,
        costUnits: 1.5,
      },
      tags: ["Most reliable", "Perimeter", "Steady flow"],
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.398, 37.7872],
          [-122.368, 37.7808],
          [-122.365, 37.76],
          [-122.37, 37.744],
        ],
      },
      segments: [
        {
          id: "s1",
          label: "North ring on-ramp",
          segmentClass: "express",
          distanceKm: 14.2,
          durationMin: 12,
          congestion: "clear",
        },
        {
          id: "s2",
          label: "East perimeter to Quay",
          segmentClass: "express",
          distanceKm: 14.7,
          durationMin: 15,
          congestion: "clear",
        },
      ],
    },
  ],
}

export const SCENARIOS: Scenario[] = [
  {
    id: "yard-to-air",
    label: "Yard → Air terminal",
    originId: "kester-yard",
    destinationId: "orrin-field",
    context: "Time-critical freight handoff before the evening cargo window.",
  },
  {
    id: "yard-to-quay",
    label: "Yard → Waterfront",
    originId: "kester-yard",
    destinationId: "vantor-quay",
    context: "Recurring delivery loop with tight reliability requirements.",
  },
  {
    id: "exchange-to-quay",
    label: "Exchange → Waterfront",
    originId: "halden-exchange",
    destinationId: "vantor-quay",
    context: "Inter-hub transfer balancing cost against schedule risk.",
  },
]

export function corridorKey(originId: string, destinationId: string): string {
  return `${originId}::${destinationId}`
}
