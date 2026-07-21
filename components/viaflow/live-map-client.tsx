"use client"

import { useEffect, useState } from "react"
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import type { RoutePlan } from "@/lib/viaflow/types"
import { FieldLabel } from "./primitives"
import "leaflet/dist/leaflet.css"

const HYDERABAD_CENTER: LatLngExpression = [17.385, 78.4867]

type LiveMapProps = {
  plan: RoutePlan
  selectedRouteId: string | null
  onSelect: (id: string) => void
}

function toLeafletLatLng(position: [number, number]): LatLngExpression {
  return [position[1], position[0]]
}

function FitBounds({ routes }: { routes: RoutePlan["options"] }) {
  const map = useMap()

  useEffect(() => {
    if (routes.length === 0) return

    const latLngBounds = routes.map((route) =>
      route.geometry.coordinates.map((position) => toLeafletLatLng(position)) as LatLngExpression[],
    )

    if (latLngBounds.length > 0) {
      map.fitBounds(latLngBounds, { padding: [24, 24] })
    }
  }, [map, routes])

  return null
}

export function LiveMapInner({ plan, selectedRouteId, onSelect }: LiveMapProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <FieldLabel>Live corridor map</FieldLabel>
        <FieldLabel>{plan.options.length} routes</FieldLabel>
      </div>

      <div className="aspect-square w-full">
        <MapContainer
          center={HYDERABAD_CENTER}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            url={
              isDarkMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            subdomains={isDarkMode ? ["a", "b", "c", "d"] : ["a", "b", "c"]}
            maxZoom={19}
            attribution={
              isDarkMode
                ? '&copy; <a href="https://carto.com/attributions">CARTO</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
          />
          <FitBounds routes={plan.options} />

          {plan.options.map((route) => {
            const isSelected = route.id === selectedRouteId
            return (
              <Polyline
                key={route.id}
                positions={route.geometry.coordinates.map((position) => toLeafletLatLng(position))}
                pathOptions={{
                  color: isSelected ? "var(--color-primary)" : "var(--color-secondary)",
                  weight: isSelected ? 5 : 3,
                  opacity: isSelected ? 0.95 : 0.55,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                eventHandlers={{
                  click: () => onSelect(route.id),
                }}
              />
            )
          })}

          <CircleMarker
            center={toLeafletLatLng(plan.origin.location.coordinates)}
            radius={8}
            pathOptions={{
              color: "var(--color-primary)",
              fillColor: "var(--color-primary)",
              fillOpacity: 1,
              weight: 3,
            }}
          />
          <CircleMarker
            center={toLeafletLatLng(plan.destination.location.coordinates)}
            radius={8}
            pathOptions={{
              color: "var(--color-primary)",
              fillColor: "var(--color-primary)",
              fillOpacity: 1,
              weight: 3,
            }}
          />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border-2 border-foreground" aria-hidden />
          <span className="text-xs text-muted-foreground">{plan.origin.name}</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{plan.destination.name}</span>
          <span className="size-2.5 rounded-full bg-signal" aria-hidden />
        </div>
      </div>
    </div>
  )
}
