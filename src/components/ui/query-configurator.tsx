"use client"

import { useEffect, useState, useRef } from "react"
import { Slider } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"
import { geocodeHyderabad, DEFAULT_HUBS } from "@/src/services/geocoding"
import type { Place, Weights } from "@/lib/viaflow/types"

interface QueryConfiguratorProps {
  origin: Place | null
  destination: Place | null
  weights: Weights
  onSetOrigin: (place: Place | null) => void
  onSetDestination: (place: Place | null) => void
  onWeightsChange: (weights: Weights) => void
  onCompute: () => void
  loading: boolean
}

function AutocompleteInput({
  label,
  placeholder,
  value,
  onSelect,
  excludePlace,
}: {
  label: string
  placeholder: string
  value: Place | null
  onSelect: (place: Place | null) => void
  excludePlace: Place | null
}) {
  const [query, setQuery] = useState(value ? value.name : "")
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (value) {
      setQuery(value.name)
    } else {
      setQuery("")
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!val.trim()) {
      setSuggestions(DEFAULT_HUBS.filter(h => h.id !== excludePlace?.id))
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await geocodeHyderabad(val)
        setSuggestions(results.filter(h => h.id !== excludePlace?.id))
      } catch (err) {
        console.error("Geocoding failed", err)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleFocus = () => {
    setIsOpen(true)
    if (!query) {
      setSuggestions(DEFAULT_HUBS.filter(h => h.id !== excludePlace?.id))
    }
  }

  const handleSuggestionClick = (place: Place) => {
    onSelect(place)
    setQuery(place.name)
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery("")
    setSuggestions(DEFAULT_HUBS.filter(h => h.id !== excludePlace?.id))
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      <label className="font-mono text-[12px] font-medium tracking-wide text-[#8A8A95]">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={handleFocus}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#2A2A32] bg-[#1A1A1E] px-3.5 py-2.5 font-sans text-sm text-[#E8E8EC] placeholder-[#6A6A75] outline-none transition-all focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 text-[#8A8A95] hover:text-[#E8E8EC] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#F5A623] rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] z-[500] w-full max-h-56 overflow-y-auto rounded-lg border border-[#2A2A32] bg-[#1A1A1E] shadow-none backdrop-blur-md">
          {loading && (
            <div className="px-3.5 py-3 font-mono text-[11px] text-[#8A8A95] animate-pulse">
              Searching OpenStreetMap...
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-3.5 py-3 font-mono text-[11px] text-[#8A8A95]">
              No Hyderabad locations found
            </div>
          )}
          {!loading && suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#23232A] cursor-pointer outline-none focus:bg-[#23232A]"
            >
              <span className="font-sans text-xs font-semibold text-foreground">{s.name}</span>
              <span className="font-mono text-[11px] text-[#8A8A95] truncate">{s.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WeightSlider({
  label,
  description,
  value,
  swatchClass,
  onValueChange,
}: {
  label: string
  description: string
  value: number
  swatchClass: string
  onValueChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2A2A32] bg-[#23232A] p-4 transition-all duration-150 hover:border-[#F5A623]/35">
      {/* Label section */}
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-sm", swatchClass)} aria-hidden />
        <span className="font-sans text-[12px] font-medium text-[#8A8A95] tracking-tight">
          {label} Optimization Weight
        </span>
      </div>

      {/* Row containing Slider track and value side-by-side */}
      <div className="flex items-center gap-4">
        {/* Slider control area */}
        <div className="flex-1 py-1">
          <Slider.Root
            value={value}
            min={0}
            max={10}
            step={1}
            onValueChange={(next) =>
              onValueChange(Array.isArray(next) ? next[0] : (next as number))
            }
            aria-label={`${label} optimization weight`}
          >
            <Slider.Control className="flex h-5 w-full items-center cursor-pointer">
              {/* Track background: #2A2A32, height: 4px */}
              <Slider.Track className="relative h-1 w-full rounded-full bg-[#2A2A32]">
                {/* Active track: #F5A623 */}
                <Slider.Indicator className="absolute h-full rounded-full bg-[#F5A623]" />
                {/* Thumb: compact, 16px (size-4), amber #F5A623, subtle hover scale/glow, focus ring */}
                <Slider.Thumb className="block size-4 rounded-full bg-[#F5A623] hover:scale-110 active:scale-125 focus:scale-110 shadow-[0_0_8px_rgba(245,166,35,0.4)] hover:shadow-[0_0_12px_rgba(245,166,35,0.6)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#F5A623]" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Numeric value: monospace, amber, ~16px */}
        <span className="tabular font-mono text-[16px] font-medium text-[#F5A623] min-w-[20px] text-right">
          {value}
        </span>
      </div>

      {/* Description */}
      <div className="text-[11px] font-mono text-[#8A8A95]/90">{description}</div>
    </div>
  )
}

export function QueryConfigurator({
  origin,
  destination,
  weights,
  onSetOrigin,
  onSetDestination,
  onWeightsChange,
  onCompute,
  loading,
}: QueryConfiguratorProps) {
  const handleQuickSelect = (place: Place) => {
    if (!origin) {
      onSetOrigin(place)
    } else if (!destination && place.id !== origin.id) {
      onSetDestination(place)
    } else if (origin && destination) {
      onSetOrigin(place)
      onSetDestination(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-[#2A2A32] bg-[#1A1A1E] p-5 md:p-6 shadow-none">
      <div className="flex items-center justify-between border-b border-[#2A2A32] pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-[#F5A623]" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
            HYDERABAD SPATIAL CONFIGURATOR
          </span>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <AutocompleteInput
          label="Origin Terminal/Hub"
          placeholder="Type origin (e.g. Gachibowli, Raidurg)"
          value={origin}
          onSelect={onSetOrigin}
          excludePlace={destination}
        />
        <AutocompleteInput
          label="Destination Terminal/Hub"
          placeholder="Type destination (e.g. Shamshabad, HITEC)"
          value={destination}
          onSelect={onSetDestination}
          excludePlace={origin}
        />
      </div>

      {/* Quick select tokens */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A95]">
          Quick-Select Corridor Hubs
        </span>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_HUBS.map((hub) => {
            const isOrigin = origin?.id === hub.id
            const isDest = destination?.id === hub.id
            const isDisabled = (origin && destination && !isOrigin && !isDest)

            return (
              <button
                key={hub.id}
                type="button"
                disabled={isDisabled}
                onClick={() => handleQuickSelect(hub)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-tight transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]",
                  isOrigin && "border-[#8A8A95] bg-[#8A8A95]/10 text-foreground",
                  isDest && "border-[#F5A623] bg-[#F5A623]/15 text-[#F5A623]",
                  !isOrigin && !isDest && "border-[#2A2A32] bg-[#111113] text-[#8A8A95] hover:border-[#F5A623] hover:text-[#E8E8EC]",
                  isDisabled && "opacity-30 cursor-not-allowed hover:border-[#2A2A32] hover:text-[#8A8A95]"
                )}
              >
                {hub.name.split(" ")[0]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Optimization weights */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A8A95]">
          Multi-Criteria Optimization Weights
        </span>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WeightSlider
            label="Speed"
            description="Prioritize fastest transit time (wt)."
            swatchClass="bg-[#60A5FA]"
            value={weights.time}
            onValueChange={(v) => onWeightsChange({ ...weights, time: v })}
          />
          <WeightSlider
            label="Distance"
            description="Favor shortest spatial length (wd)."
            swatchClass="bg-[#F5A623]"
            value={weights.distance}
            onValueChange={(v) => onWeightsChange({ ...weights, distance: v })}
          />
          <WeightSlider
            label="Corridor Grade"
            description="Prefer flyovers/expressways vs streets (wf)."
            swatchClass="bg-[#F5A623]"
            value={weights.reliability}
            onValueChange={(v) => onWeightsChange({ ...weights, reliability: v })}
          />
        </div>
      </div>

      {/* Compute Button */}
      <button
        type="button"
        disabled={!origin || !destination || loading}
        onClick={onCompute}
        className={cn(
          "w-full rounded-lg py-2.5 px-5 font-sans text-sm font-semibold uppercase tracking-wider text-[#E8E8EC] bg-[#F5A623] hover:bg-[#F7B84D] active:scale-[0.98] transition-all cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]",
          (!origin || !destination || loading) && "opacity-45 cursor-not-allowed bg-[#2A2A32] text-[#8A8A95] hover:bg-[#2A2A32] border-[#2A2A32] shadow-none"
        )}
      >
        {loading ? "RUNNING DETERMINISTIC ANALYSIS..." : "RUN HYDERABAD SPATIAL CORRIDOR ANALYSIS"}
      </button>
    </div>
  )
}
