"use client"

import { Slider } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

/**
 * A single labelled weight control. Renders the factor name, its live weight
 * percentage, and a precise track with a signal-colored fill.
 */
export function WeightSlider({
  label,
  description,
  value,
  percent,
  swatchClass,
  onValueChange,
}: {
  label: string
  description: string
  value: number
  /** Normalised share (0..100) shown to the right. */
  percent: number
  swatchClass: string
  onValueChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-[2px]", swatchClass)} aria-hidden />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="tabular font-mono text-xs text-muted-foreground">
          {Math.round(percent)}%
        </span>
      </div>

      <Slider.Root
        value={value}
        min={0}
        max={10}
        step={1}
        onValueChange={(next) =>
          onValueChange(Array.isArray(next) ? next[0] : (next as number))
        }
        aria-label={`${label} weight`}
      >
        <Slider.Control className="flex h-5 w-full items-center">
          <Slider.Track className="h-1.5 w-full rounded-full bg-muted">
            <Slider.Indicator className="rounded-full bg-signal" />
            <Slider.Thumb className="size-4 rounded-full border-2 border-signal bg-background shadow-sm outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/40 data-dragging:scale-110" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
