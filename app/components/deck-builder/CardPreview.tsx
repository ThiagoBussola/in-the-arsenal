"use client";

import type { CardData } from "../../lib/types";
import { CardUsageBadge } from "./CardUsageBadge";

interface CardPreviewProps {
  card: CardData;
  heroCardId?: string | null;
  format?: string;
  /** Smaller tile for library sidebar */
  compact?: boolean;
  onDismiss?: () => void;
}

export function CardPreview({
  card,
  heroCardId,
  format,
  compact,
  onDismiss,
}: CardPreviewProps) {
  const imgClass = compact
    ? "h-[200px] w-[140px] rounded-md border border-surface-border object-contain shadow-md shadow-black/30"
    : "h-[350px] w-[250px] rounded-lg border border-surface-border object-contain shadow-lg shadow-black/40";
  const placeholderClass = compact
    ? "flex h-[200px] w-[140px] items-center justify-center rounded-md border border-surface-border bg-surface text-xs text-muted"
    : "flex h-[350px] w-[250px] items-center justify-center rounded-lg border border-surface-border bg-surface text-muted";
  const metaMax = compact ? "max-w-[180px]" : "max-w-[250px]";

  return (
    <div className="relative flex flex-col items-center gap-3">
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-background/95 text-xs text-muted shadow-sm transition-colors hover:border-gold/40 hover:text-foreground"
          aria-label="Close preview"
        >
          ✕
        </button>
      ) : null}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className={imgClass}
        />
      ) : (
        <div className={placeholderClass}>
          No Image
        </div>
      )}

      <div className={`w-full ${metaMax} space-y-2 text-center`}>
        <h3
          className={`font-heading font-semibold text-foreground ${compact ? "text-xs leading-snug" : "text-sm"}`}
        >
          {card.name}
        </h3>
        <p className={`text-muted ${compact ? "text-[10px] leading-relaxed" : "text-xs"}`}>
          {card.typeText}
        </p>

        <div className={`flex justify-center flex-wrap gap-2 ${compact ? "gap-1.5 text-[10px]" : "gap-3 text-xs"}`}>
          {card.cost !== null && (
            <span className="rounded border border-surface-border bg-surface px-2 py-0.5 text-gold">
              Cost {card.cost}
            </span>
          )}
          {card.power !== null && (
            <span className="rounded border border-crimson/30 bg-crimson/5 px-2 py-0.5 text-crimson-bright">
              {card.power} Power
            </span>
          )}
          {card.defense !== null && (
            <span className="rounded border border-blue-800/30 bg-blue-900/10 px-2 py-0.5 text-blue-300">
              {card.defense} Def
            </span>
          )}
        </div>

        {card.pitch && (
          <div className="flex justify-center gap-1">
            {Array.from({ length: parseInt(card.pitch) || 0 }).map((_, i) => (
              <span
                key={i}
                className={`inline-block h-3 w-3 rounded-full ${getPitchBg(card.pitch)}`}
              />
            ))}
          </div>
        )}

        {heroCardId && format && (
          <CardUsageBadge
            cardUniqueId={card.uniqueId}
            heroCardId={heroCardId}
            format={format}
          />
        )}
      </div>
    </div>
  );
}

function getPitchBg(pitch: string | null): string {
  switch (pitch) {
    case "1": return "bg-red-500";
    case "2": return "bg-yellow-400";
    case "3": return "bg-blue-500";
    default: return "bg-muted";
  }
}
