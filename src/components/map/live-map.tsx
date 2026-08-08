"use client"

import dynamic from "next/dynamic"

export const LiveMap = dynamic(
  () => import("./live-map-client").then((mod) => mod.LiveMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] w-full min-h-[340px] md:aspect-square animate-pulse rounded-xl border border-[#2A2A32] bg-[#1A1A1E] flex items-center justify-center">
        <span className="font-mono text-xs text-[#8A8A95] tracking-widest">
          INITIALIZING HYDERABAD SPATIAL MAP...
        </span>
      </div>
    ),
  }
)

export default LiveMap
