"use client"

import { useEffect, useState } from "react"
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet"
import L, { type LatLngExpression } from "leaflet"
import type { RoutePlan, ScoredRoute } from "@/lib/viaflow/types"
import "leaflet/dist/leaflet.css"

const HYDERABAD_CENTER: LatLngExpression = [17.385, 78.4867]

type LiveMapClientProps = {
  origin: RoutePlan["origin"]
  destination: RoutePlan["destination"]
  options: ScoredRoute[]
  selectedRouteId: string | null
  onSelect: (id: string) => void
}

function toLeafletLatLng(position: [number, number]): LatLngExpression {
  // GeoJSON is [lon, lat], Leaflet is [lat, lon]
  return [position[1], position[0]]
}

// Custom Leaflet Icons for ViaFlow
function createOriginIcon() {
  return L.divIcon({
    className: "viaflow-marker-origin",
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        background: #111318;
        border: 2px solid #8B93A7;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: #F3F4F6; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function createDestinationIcon() {
  return L.divIcon({
    className: "viaflow-marker-destination",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: #E08E45;
        border: 3px solid #111318;
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(224, 142, 69, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: #111318; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function FitBounds({ routes }: { routes: ScoredRoute[] }) {
  const map = useMap()

  useEffect(() => {
    if (routes.length === 0) return

    const coords: LatLngExpression[] = []
    routes.forEach((route) => {
      route.geometry.coordinates.forEach((position) => {
        coords.push(toLeafletLatLng(position))
      })
    })

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [map, routes])

  return null
}

function MapControls({ onRecenter }: { onRecenter: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onRecenter}
        title="Recenter corridor bounds"
        className="flex size-8 items-center justify-center rounded border border-[#2A2E38] bg-[#1A1D24]/90 text-[#8B93A7] shadow-lg backdrop-blur-md transition-colors hover:border-[#E08E45] hover:text-[#E08E45] cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  )
}

export function LiveMapInner({
  origin,
  destination,
  options,
  selectedRouteId,
  onSelect,
}: LiveMapClientProps) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mapKey, setMapKey] = useState(0)

  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }
    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const originIcon = createOriginIcon()
  const destinationIcon = createDestinationIcon()

  const originLatLng = toLeafletLatLng(origin.location.coordinates)
  const destinationLatLng = toLeafletLatLng(destination.location.coordinates)

  return (
    <div className="relative aspect-[4/3] w-full min-h-[340px] md:aspect-square overflow-hidden rounded-xl border border-[#2A2E38] bg-[#1A1D24] shadow-xl">
      <MapContainer
        key={mapKey}
        center={HYDERABAD_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full bg-[#111318]"
        attributionControl={true}
      >
        {/* CartoDB Dark Matter / Positron Tiles */}
        <TileLayer
          url={
            isDarkMode
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <FitBounds routes={options} />

        {/* Alternative Routes (Drawn first so active recommended sits on top) */}
        {options
          .filter((r) => r.id !== selectedRouteId)
          .map((route) => (
            <Polyline
              key={route.id}
              positions={route.geometry.coordinates.map((pos) => toLeafletLatLng(pos))}
              pathOptions={{
                color: "#3A3F4D",
                weight: 3.5,
                opacity: 0.45,
                lineCap: "round",
                lineJoin: "round",
              }}
              eventHandlers={{
                click: () => onSelect(route.id),
              }}
            />
          ))}

        {/* Selected Route Polyline (Glow & Active Dash Animation) */}
        {options
          .filter((r) => r.id === selectedRouteId)
          .map((route) => (
            <Polyline
              key={`selected-${route.id}`}
              positions={route.geometry.coordinates.map((pos) => toLeafletLatLng(pos))}
              className="viaflow-flow"
              pathOptions={{
                color: "#E08E45",
                weight: 6,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ))}

        {/* Origin Marker */}
        <Marker position={originLatLng} icon={originIcon} />

        {/* Destination Marker */}
        <Marker position={destinationLatLng} icon={destinationIcon} />
      </MapContainer>

      <MapControls onRecenter={() => setMapKey((k) => k + 1)} />
    </div>
  )
}
