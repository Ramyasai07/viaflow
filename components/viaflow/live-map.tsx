"use client"

import dynamic from "next/dynamic"

export const LiveMap = dynamic(
  () => import("./live-map-client").then((mod) => mod.LiveMapInner),
  {
    ssr: false,
  },
)

export default LiveMap
