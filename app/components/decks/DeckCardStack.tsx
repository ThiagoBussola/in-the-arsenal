"use client";

import type { CardData } from "../../lib/types";

const MAX_STACK_LAYERS = 5;

interface DeckCardStackProps {
  card: CardData | null | undefined;
  quantity: number;
  /** Larger tiles for hero + arena row */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DeckCardStack({
  card,
  quantity,
  size = "sm",
  className = "",
}: DeckCardStackProps) {
  const q = Math.max(1, quantity);
  const layers = Math.min(q, MAX_STACK_LAYERS);
  const sliverStep =
    size === "lg" ? 16 : size === "md" ? 14 : 12;
  const sliverH = size === "lg" ? 26 : size === "md" ? 24 : 20;
  const maxW =
    size === "lg"
      ? "max-w-[200px]"
      : size === "md"
        ? "max-w-[160px]"
        : "max-w-[132px]";

  const imageUrl = card?.imageUrl ?? null;
  if (!card || !imageUrl) {
    return (
      <div
        className={`mx-auto flex w-full ${maxW} flex-col items-center justify-center rounded-md border border-surface-border bg-surface/80 px-2 py-4 text-center ${className}`}
      >
        <span className="line-clamp-3 text-[11px] font-medium leading-tight text-foreground">
          {card?.name ?? "—"}
        </span>
        <span className="mt-1 text-xs font-semibold text-gold">×{q}</span>
      </div>
    );
  }

  return (
    <div className={`group mx-auto w-full ${maxW} ${className}`}>
      <div
        className="relative"
        style={{
          paddingTop: layers > 1 ? `${(layers - 1) * sliverStep}px` : undefined,
        }}
      >
        {layers > 1 &&
          Array.from({ length: layers - 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 z-[1] w-[94%] -translate-x-1/2 overflow-hidden rounded-t-[5px] border border-white/12 bg-zinc-950 shadow-md"
              style={{
                top: `${i * sliverStep}px`,
                height: `${sliverH}px`,
                zIndex: layers - 1 - i,
              }}
            >
              <img
                src={imageUrl}
                alt=""
                className="h-[420%] w-full object-cover object-top"
                draggable={false}
              />
            </div>
          ))}
        <div
          className="relative z-10 overflow-hidden rounded-md border border-white/18 shadow-lg shadow-black/50"
          style={{ aspectRatio: "5 / 7" }}
        >
          <img
            src={imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {q > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-heading text-[10px] font-bold tabular-nums text-white">
              ×{q}
            </span>
          )}
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-center text-[10px] leading-snug text-muted transition-colors group-hover:text-foreground">
        {card.name}
      </p>
    </div>
  );
}
