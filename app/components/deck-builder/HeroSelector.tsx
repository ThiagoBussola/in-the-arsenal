"use client";

import { useTranslations } from "next-intl";
import type { CardData } from "../../lib/types";
import { CardSearch } from "./CardSearch";

interface HeroSelectorProps {
  hero: CardData | null;
  onSelect: (card: CardData) => void;
  onClear: () => void;
  /** Horizontal bar layout: smaller art, fits in a responsive top row with equipment. */
  compact?: boolean;
}

export function HeroSelector({
  hero,
  onSelect,
  onClear,
  compact = false,
}: HeroSelectorProps) {
  const t = useTranslations("deckBuilder.heroSelector");

  return (
    <div className={compact ? "flex min-w-0 flex-col" : "space-y-3"}>
      {!compact && (
        <h3 className="font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
          {t("title")}
        </h3>
      )}

      {hero ? (
        <div
          className={`relative group ${compact ? "flex max-w-full flex-col items-center sm:max-w-[min(42vw,200px)]" : ""}`}
        >
          {hero.imageUrl ? (
            <img
              src={hero.imageUrl}
              alt={hero.name}
              className={
                compact
                  ? "h-[clamp(96px,22vw,200px)] w-auto max-w-[min(46vw,180px)] rounded-md border border-gold/25 object-contain shadow-lg shadow-black/40"
                  : "w-full max-w-[220px] rounded-lg border border-gold/20 object-contain shadow-lg shadow-black/40"
              }
            />
          ) : (
            <div
              className={
                compact
                  ? "flex h-[clamp(96px,22vw,200px)] w-full min-w-[100px] max-w-[min(46vw,180px)] items-center justify-center rounded-md border border-gold/20 bg-surface px-1 text-center text-[11px] text-muted"
                  : "flex h-[300px] w-full max-w-[220px] items-center justify-center rounded-lg border border-gold/20 bg-surface text-muted"
              }
            >
              {hero.name}
            </div>
          )}

          <div className={compact ? "mt-1.5 w-full space-y-0.5 text-center sm:text-left" : "mt-2 space-y-1"}>
            <p
              className={`font-heading font-semibold text-foreground ${compact ? "line-clamp-2 text-[11px] leading-tight sm:text-xs" : "text-sm"}`}
            >
              {hero.name}
            </p>
            {hero.health && (
              <p className={`text-muted ${compact ? "text-[10px]" : "text-xs"}`}>
                {t("health")}:{" "}
                <span className="text-crimson-bright">{hero.health}</span>
              </p>
            )}
            {!compact && (
              <p className="text-xs text-muted">{hero.typeText}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClear}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-surface-raised text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-crimson-bright sm:-right-2 sm:-top-2"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className={compact ? "w-full min-w-[min(100%,12rem)] max-w-xs" : ""}>
          <CardSearch
            onSelect={onSelect}
            placeholder={t("searchPlaceholder")}
            filterType="Hero"
          />
        </div>
      )}
    </div>
  );
}
