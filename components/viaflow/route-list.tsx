"use client"

import type { ScoredRoute } from "@/lib/viaflow/types"
import { RouteCard } from "./route-card"

export function RouteList({
  routes,
  selectedRouteId,
  onSelect,
  loading,
}: {
  routes: ScoredRoute[]
  selectedRouteId: string | null
  onSelect: (id: string) => void
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[188px] w-full animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {routes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          selected={route.id === selectedRouteId}
          onSelect={() => onSelect(route.id)}
        />
      ))}
    </div>
  )
}
