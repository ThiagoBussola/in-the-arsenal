"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "../../lib/api";
import type { CardData } from "../../lib/types";

interface CardSearchProps {
  onSelect: (card: CardData) => void;
  placeholder?: string;
  filterType?: string;
}

export function CardSearch({ onSelect, placeholder, filterType }: CardSearchProps) {
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
              <div className="flex-1 min-w-0">
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
        <div className="fixed right-8 top-24 z-[60] pointer-events-none hidden lg:block">
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
