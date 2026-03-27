"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "../../lib/api";
import type { CardData } from "../../lib/types";

interface CardSearchProps {
  onSelect: (card: CardData) => void;
  placeholder?: string;
  filterType?: string;
  /** Sidebar: grid of results in-panel (FaBrary-style). Default: dropdown under input. */
  variant?: "dropdown" | "sidebar";
}

export function CardSearch({
  onSelect,
  placeholder,
  filterType,
  variant = "dropdown",
}: CardSearchProps) {
  const t = useTranslations("deckBuilder.cardSearch");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<CardData | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "20" });
      if (filterType) params.set("type", filterType);
      const data = await apiFetch<{ cards: CardData[]; total: number }>(
        `/cards/search?${params}`
      );
      setResults(data.cards);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(card: CardData) {
    onSelect(card);
    setQuery("");
    setResults([]);
    setOpen(false);
    setHoveredCard(null);
  }

  const isSidebar = variant === "sidebar";

  if (isSidebar) {
    return (
      <div ref={containerRef} className="flex flex-col gap-2">
        <div className="relative shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || t("placeholder")}
            className="w-full rounded-sm border border-surface-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            </div>
          )}
        </div>

        <div className="max-h-[min(42vh,280px)] overflow-y-auto rounded-sm border border-gold/10 bg-black/20 p-2 sm:max-h-[min(46vh,320px)] lg:max-h-[min(52vh,380px)]">
          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted">{t("noResults")}</p>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {results.map((card) => (
                <button
                  key={card.uniqueId}
                  type="button"
                  onClick={() => handleSelect(card)}
                  className="group touch-manipulation flex flex-col gap-1 rounded-sm border border-transparent p-1 text-left transition-colors hover:border-gold/25 hover:bg-gold/[0.06]"
                >
                  <div
                    className="relative mx-auto w-full overflow-hidden rounded-md border border-white/10 bg-zinc-950 shadow-md"
                    style={{ aspectRatio: "5 / 7", maxHeight: "140px" }}
                  >
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted">
                        {card.name}
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-foreground">
                    {card.name}
                  </p>
                </button>
              ))}
            </div>
          )}
          {query.length < 2 && (
            <p className="px-2 py-8 text-center text-xs leading-relaxed text-muted/80">
              {t("sidebarHint")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || t("placeholder")}
          className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-sm border border-surface-border bg-surface-raised shadow-xl shadow-black/50">
          {results.map((card) => (
            <button
              key={card.uniqueId}
              onClick={() => handleSelect(card)}
              onMouseEnter={() => setHoveredCard(card)}
              onMouseLeave={() => setHoveredCard(null)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gold/5"
            >
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="h-10 w-7 rounded-[2px] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {card.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {card.typeText}
                  {card.pitch && (
                    <span className="ml-2">
                      {"●".repeat(parseInt(card.pitch) || 0).split("").map((_, i) => (
                        <span key={i} className={getPitchColor(card.pitch)}>●</span>
                      ))}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                {card.cost !== null && <span>{card.cost}⚡</span>}
                {card.power !== null && <span>{card.power}⚔</span>}
                {card.defense !== null && <span>{card.defense}🛡</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {hoveredCard && hoveredCard.imageUrl && (
        <div className="pointer-events-none fixed top-24 right-8 z-[60] hidden lg:block">
          <div className="rounded-lg border border-surface-border bg-surface-raised p-2 shadow-2xl shadow-black/60">
            <img
              src={hoveredCard.imageUrl}
              alt={hoveredCard.name}
              className="h-[420px] w-[300px] rounded-md object-contain"
            />
            {hoveredCard.functionalText && (
              <p className="mt-2 max-w-[300px] px-1 text-xs leading-relaxed text-muted">
                {hoveredCard.functionalText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getPitchColor(pitch: string | null): string {
  switch (pitch) {
    case "1": return "text-red-400";
    case "2": return "text-yellow-400";
    case "3": return "text-blue-400";
    default: return "text-muted";
  }
}
