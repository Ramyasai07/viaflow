import { FieldLabel } from "./primitives"

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="text-foreground"
      >
        <rect x="1" y="1" width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="17" r="2" fill="currentColor" />
        <circle cx="17" cy="7" r="2" fill="var(--signal)" />
        <path
          d="M7 17 C 11 17, 9 7, 17 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="text-[0.95rem] font-semibold tracking-tight">
        ViaFlow
      </span>
    </div>
  )
}

export function AppHeader({
  computeMs,
  computedAt,
}: {
  computeMs?: number
  computedAt?: string
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Wordmark />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden text-xs text-muted-foreground sm:block">
            Route intelligence
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-2 md:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-signal" />
            </span>
            <FieldLabel>Engine online</FieldLabel>
          </div>

          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <FieldLabel>Compute</FieldLabel>
            <span className="tabular font-mono text-xs">
              {computeMs !== undefined ? `${computeMs.toFixed(2)} ms` : "—"}
            </span>
          </div>

          <div className="hidden flex-col items-end gap-0.5 lg:flex">
            <FieldLabel>Model</FieldLabel>
            <span className="font-mono text-xs">wsum · v2.1</span>
          </div>
        </div>
      </div>
    </header>
  )
}
