"use client"

import dynamic from "next/dynamic"

export const LiveMap = dynamic(
  () => import("./live-map-client").then((mod) => mod.LiveMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] w-full min-h-[340px] md:aspect-square animate-pulse rounded-xl border border-[#2A2E38] bg-[#1A1D24] flex items-center justify-center">
        <span className="font-mono text-xs text-[#8B93A7] tracking-widest">
          INITIALIZING HYDERABAD SPATIAL MAP...
        </span>
      </div>
    ),
  }
)

export default LiveMap
