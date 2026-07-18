import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Uppercase monospace micro-label used to annotate the instrument. */
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
        "font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A small chip/tag. */
export function Chip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.65rem] font-medium tracking-tight text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A labelled numeric readout — the core instrument unit. */
export function Readout({
  label,
  value,
  unit,
  emphasis,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  emphasis?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "tabular font-medium leading-none",
            emphasis ? "text-2xl" : "text-lg",
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Small colored square used in legends. */
export function Swatch({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-[2px]", className)}
    />
  )
}
