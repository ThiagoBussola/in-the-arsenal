"use client";

import type { CardData } from "../../lib/types";
import { CardUsageBadge } from "./CardUsageBadge";

interface CardPreviewProps {
  card: CardData;
  heroCardId?: string | null;
  format?: string;
}

export function CardPreview({ card, heroCardId, format }: CardPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="h-[350px] w-[250px] rounded-lg border border-surface-border object-contain shadow-lg shadow-black/40"
        />
      ) : (
        <div className="flex h-[350px] w-[250px] items-center justify-center rounded-lg border border-surface-border bg-surface text-muted">
          No Image
        </div>
      )}

      <div className="w-full max-w-[250px] space-y-2 text-center">
        <h3 className="font-heading text-sm font-semibold text-foreground">{card.name}</h3>
        <p className="text-xs text-muted">{card.typeText}</p>

        <div className="flex justify-center gap-3 text-xs">
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
