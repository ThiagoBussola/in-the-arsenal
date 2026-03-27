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
  const stepY = size === "lg" ? 10 : size === "md" ? 9 : 8;
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

  const backCount = Math.max(0, layers - 1);
  const stackPadTop = backCount > 0 ? backCount * stepY : 0;

  return (
    <div className={`group mx-auto w-full ${maxW} ${className}`}>
      <div
        className="relative flex justify-center"
        style={{
          paddingTop: stackPadTop > 0 ? `${stackPadTop}px` : undefined,
        }}
      >
        {backCount > 0 &&
          Array.from({ length: backCount }).map((_, i) => {
            const depth = backCount - 1 - i;
            const widthScale = 0.72 + depth * 0.09;
            const top = i * stepY;
            return (
              <div
                key={i}
                className="pointer-events-none absolute left-1/2 overflow-hidden rounded-md border border-white/12 bg-zinc-950 shadow-md shadow-black/40"
                style={{
                  top: `${top}px`,
                  width: `${widthScale * 100}%`,
                  maxWidth: "100%",
                  transform: "translateX(-50%)",
                  aspectRatio: "5 / 7",
                  zIndex: i + 1,
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  draggable={false}
                />
              </div>
            );
          })}
        <div
          className="relative z-[30] w-full overflow-hidden rounded-md border border-white/20 shadow-xl shadow-black/55"
          style={{ aspectRatio: "5 / 7" }}
        >
          <img
            src={imageUrl}
            alt={card.name}
            className="h-full w-full object-cover object-top"
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
