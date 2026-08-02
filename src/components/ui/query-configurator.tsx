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
      <label className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em] text-[#8B93A7]">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={handleFocus}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#2A2E38] bg-[#111318] px-3.5 py-2.5 font-sans text-sm text-[#F3F4F6] placeholder-[#8B93A7]/50 shadow-inner outline-none transition-colors focus:border-[#E08E45]/80"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 text-[#8B93A7] hover:text-[#F3F4F6] cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] z-[500] w-full max-h-56 overflow-y-auto rounded-lg border border-[#2A2E38] bg-[#1A1D24] shadow-xl backdrop-blur-md">
          {loading && (
            <div className="px-3.5 py-3 font-mono text-[0.68rem] text-[#8B93A7] animate-pulse">
              Searching OpenStreetMap...
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-3.5 py-3 font-mono text-[0.68rem] text-[#8B93A7]">
              No Hyderabad locations found
            </div>
          )}
          {!loading && suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#222630] cursor-pointer"
            >
              <span className="font-sans text-xs font-semibold text-foreground">{s.name}</span>
              <span className="font-mono text-[0.625rem] text-[#8B93A7] truncate">{s.detail}</span>
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
    <div className="flex flex-col gap-2 rounded-lg border border-[#2A2E38]/60 bg-[#16181F] p-3.5 transition-colors hover:border-[#2A2E38]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 rounded-sm", swatchClass)} aria-hidden />
          <span className="font-sans text-sm font-semibold text-foreground tracking-tight">
            {label} Weight
          </span>
        </div>
        <span className="tabular font-mono text-xs font-bold text-[#E08E45]">
          Weight: {value}/10
        </span>
      </div>

      <div className="py-1">
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
            <Slider.Track className="h-1.5 w-full rounded-full bg-[#232731]">
              <Slider.Indicator className="rounded-full bg-[#E08E45]" />
              <Slider.Thumb className="size-4.5 rounded-full border-2 border-[#E08E45] bg-[#111318] shadow-[0_0_10px_rgba(224,142,69,0.5)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#E08E45] data-dragging:scale-125" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>

      <div className="text-xs text-[#8B93A7]">{description}</div>
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
    <div className="flex flex-col gap-6 rounded-xl border border-[#2A2E38] bg-[#1A1D24] p-5 md:p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#2A2E38]/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-[#E08E45]" />
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#E08E45]">
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
        <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[#8B93A7]">
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
                onClick={() => handleQuickSelect(hub)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 font-mono text-[0.68rem] font-medium tracking-tight transition-all cursor-pointer",
                  isOrigin && "border-[#8B93A7] bg-[#8B93A7]/10 text-foreground",
                  isDest && "border-[#E08E45] bg-[#E08E45]/15 text-[#E08E45]",
                  !isOrigin && !isDest && "border-[#2A2E38] bg-[#111318] text-[#8B93A7] hover:border-[#3A3F4D] hover:text-foreground"
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
        <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em] text-[#8B93A7]">
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
            swatchClass="bg-[#F59E0B]"
            value={weights.distance}
            onValueChange={(v) => onWeightsChange({ ...weights, distance: v })}
          />
          <WeightSlider
            label="Corridor Grade"
            description="Prefer flyovers/expressways vs streets (wf)."
            swatchClass="bg-[#E08E45]"
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
          "w-full rounded-xl py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-[#111318] bg-[#E08E45] hover:bg-[#f09f56] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(224,142,69,0.25)] cursor-pointer text-center",
          (!origin || !destination || loading) && "opacity-40 cursor-not-allowed bg-[#2A2E38] text-[#8B93A7] shadow-none"
        )}
      >
        {loading ? "RUNNING DETERMINISTIC ANALYSIS..." : "RUN HYDERABAD SPATIAL CORRIDOR ANALYSIS"}
      </button>
    </div>
  )
}
