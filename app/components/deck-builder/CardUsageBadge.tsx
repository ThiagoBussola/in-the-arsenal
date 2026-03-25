"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import type { CardUsageStat } from "../../lib/types";

interface CardUsageBadgeProps {
  cardUniqueId: string;
  heroCardId: string;
  format: string;
}

export function CardUsageBadge({
  cardUniqueId,
  heroCardId,
  format,
}: CardUsageBadgeProps) {
  const [stat, setStat] = useState<CardUsageStat | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ hero: heroCardId, format });
    apiFetch<CardUsageStat[]>(`/cards/${cardUniqueId}/usage?${params}`)
      .then((stats) => {
        if (stats.length > 0) setStat(stats[0]);
      })
      .catch(() => {});
  }, [cardUniqueId, heroCardId, format]);

  if (!stat || stat.usagePercentage === 0) return null;

  const pct = stat.usagePercentage;
  const color =
    pct >= 70
      ? "text-green-400 border-green-800/30 bg-green-900/10"
      : pct >= 40
        ? "text-yellow-400 border-yellow-800/30 bg-yellow-900/10"
        : "text-muted border-surface-border bg-surface";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-medium ${color}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {pct.toFixed(0)}% of decks
    </div>
  );
}
