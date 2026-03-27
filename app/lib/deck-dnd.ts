import type { DragEvent } from "react";
import type { CardData, CardZone } from "./types";

export const DND_MIME = "application/x-in-the-arsenal-deck-entry";

export interface DeckDragPayload {
  uniqueId: string;
  fromZone: CardZone;
}

export function parseDeckDragPayload(data: string): DeckDragPayload | null {
  if (!data) return null;
  try {
    const o = JSON.parse(data) as { uniqueId?: string; fromZone?: string };
    const z = o.fromZone;
    if (
      o.uniqueId &&
      (z === "MAIN" ||
        z === "SIDEBOARD" ||
        z === "EQUIPMENT" ||
        z === "WEAPON")
    ) {
      return { uniqueId: o.uniqueId, fromZone: z as CardZone };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setDeckDragData(
  e: DragEvent,
  uniqueId: string,
  fromZone: CardZone,
) {
  const payload = JSON.stringify({ uniqueId, fromZone });
  e.dataTransfer.setData(DND_MIME, payload);
  e.dataTransfer.setData("text/plain", payload);
  e.dataTransfer.effectAllowed = "move";
}

/**
 * Arena strip / library add: weapons → WEAPON, other equipment → EQUIPMENT.
 * Falls back to `typeText` when `types` is missing or incomplete (e.g. stale cache rows).
 */
export function inferArenaZoneFromCard(card: CardData): CardZone | null {
  const types = Array.isArray(card.types) ? card.types : [];
  const isHero = types.includes("Hero");
  const tt = card.typeText ?? "";
  const isWeapon =
    types.includes("Weapon") || (!isHero && /\bweapon\b/i.test(tt));
  const isEquipment =
    types.includes("Equipment") ||
    (!isHero && !isWeapon && /\bequipment\b/i.test(tt));
  if (isWeapon) return "WEAPON";
  if (isEquipment) return "EQUIPMENT";
  return null;
}
