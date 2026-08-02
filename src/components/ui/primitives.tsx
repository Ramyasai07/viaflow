"use client"

import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function FieldLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[#8B93A7]",
        className
      )}
    >
      {children}
    </span>
  )
}

export function Chip({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode
  variant?: "default" | "accent" | "success" | "muted"
  className?: string
}) {
  const styles = {
    default: "border-[#2A2E38] bg-[#1A1D24] text-[#8B93A7]",
    accent: "border-[#E08E45]/40 bg-[#E08E45]/10 text-[#E08E45]",
    success: "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]",
    muted: "border-[#2A2E38] bg-[#111318] text-[#8B93A7]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-tight transition-colors",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function Readout({
  label,
  value,
  unit,
  emphasis,
  accent,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  emphasis?: boolean
  accent?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "tabular font-mono tracking-tight font-semibold leading-none",
            emphasis ? "text-xl text-foreground" : "text-sm text-foreground",
            accent && "text-[#E08E45]"
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-[0.68rem] text-[#8B93A7]">{unit}</span>
        ) : null}
      </div>
    </div>
  )
}

export function Swatch({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-sm", className)}
    />
  )
}

export function NumberTicker({
  value,
  decimals = 1,
  className,
}: {
  value: number
  decimals?: number
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startVal = displayValue
    const endVal = value
    const duration = 300 // ms

    if (Math.abs(startVal - endVal) < 0.01) {
      setDisplayValue(endVal)
      return
    }

    function step(timestamp: number) {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      const current = startVal + (endVal - startVal) * easedProgress
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
      }
    }

    const animationFrame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [value])

  return (
    <span className={cn("tabular font-mono", className)}>
      {displayValue.toFixed(decimals)}
    </span>
  )
}
