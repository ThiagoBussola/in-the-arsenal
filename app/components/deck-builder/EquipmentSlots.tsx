"use client";

import { useTranslations } from "next-intl";
import type { CardData } from "../../lib/types";

interface EquipmentSlot {
  slot: string;
  card: CardData | null;
}

interface EquipmentSlotsProps {
  equipment: EquipmentSlot[];
  weapons: CardData[];
  onRemove: (cardUniqueId: string) => void;
  /** Single scrollable/wrapping row with small card art — for top arena bar. */
  compact?: boolean;
}

const SLOT_ICONS: Record<string, string> = {
  Head: "👑",
  Chest: "🛡",
  Arms: "🤲",
  Legs: "🦶",
};

export function EquipmentSlots({
  equipment,
  weapons,
  onRemove,
  compact = false,
}: EquipmentSlotsProps) {
  const t = useTranslations("deckBuilder.equipment");

  if (compact) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="-mx-1 flex min-w-0 flex-wrap items-end justify-center gap-2 sm:justify-start sm:gap-3">
          {equipment.map(({ slot, card }) => (
            <div
              key={slot}
              className={`group relative flex w-[4.5rem] shrink-0 flex-col items-center rounded-sm border p-1.5 sm:w-[5.25rem] ${
                card
                  ? "border-gold/25 bg-gold/[0.06]"
                  : "border-surface-border border-dashed bg-surface/80"
              }`}
            >
              <span className="text-sm leading-none">{SLOT_ICONS[slot] || "⬜"}</span>
              <span className="mt-0.5 text-[9px] font-medium tracking-wider text-muted uppercase">
                {slot}
              </span>
              {card ? (
                <>
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt=""
                      className="mt-1 h-[4.5rem] w-full max-w-[3.25rem] rounded-[3px] object-cover object-top"
                    />
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-center text-[9px] font-medium leading-tight text-foreground">
                    {card.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(card.uniqueId)}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson/85 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <p className="mt-1 text-center text-[9px] text-muted/50">{t("empty")}</p>
              )}
            </div>
          ))}

          {weapons.map((w) => (
            <div
              key={w.uniqueId}
              className="group relative flex w-[4.75rem] shrink-0 flex-col items-center rounded-sm border border-gold/20 bg-gold/[0.06] p-1 sm:w-[5.5rem]"
            >
              <span className="text-[9px] text-muted" aria-hidden title={t("weapons")}>
                ⚔
              </span>
              {w.imageUrl ? (
                <img
                  src={w.imageUrl}
                  alt=""
                  className="mt-0.5 h-[4.75rem] w-full max-w-[3.35rem] rounded-[3px] object-cover object-top"
                />
              ) : null}
              <p className="mt-1 line-clamp-2 text-center text-[9px] font-medium leading-tight text-foreground">
                {w.name}
              </p>
              <button
                type="button"
                onClick={() => onRemove(w.uniqueId)}
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson/85 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
        {t("title")}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {equipment.map(({ slot, card }) => (
          <div
            key={slot}
            className={`group relative flex flex-col items-center rounded-sm border p-2 transition-all ${
              card
                ? "border-gold/20 bg-gold/5"
                : "border-surface-border border-dashed bg-surface"
            }`}
          >
            <span className="text-lg">{SLOT_ICONS[slot] || "⬜"}</span>
            <span className="mt-1 text-[10px] font-medium tracking-wider text-muted uppercase">
              {slot}
            </span>
            {card ? (
              <>
                <p className="mt-1 text-center text-[11px] font-medium text-foreground leading-tight">
                  {card.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(card.uniqueId)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-crimson/80 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </>
            ) : (
              <p className="mt-1 text-center text-[10px] text-muted/50">{t("empty")}</p>
            )}
          </div>
        ))}
      </div>

      {weapons.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
            {t("weapons")}
          </span>
          {weapons.map((w) => (
            <div
              key={w.uniqueId}
              className="group flex items-center justify-between rounded-sm border border-gold/15 bg-gold/5 px-2 py-1.5"
            >
              <span className="text-xs text-foreground">{w.name}</span>
              <button
                type="button"
                onClick={() => onRemove(w.uniqueId)}
                className="text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-crimson-bright"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
