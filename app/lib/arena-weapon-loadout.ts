import type { CardData } from "./types";

export type HandSlotKind = "two_handed" | "one_handed" | "off_hand";

type HandSlice = Pick<
  CardData,
  "types" | "typeText" | "functionalText" | "cardKeywords"
>;

/** Same rules as backend `arenaWeaponLoadout` — keep in sync. */
export function classifyHandSlotItem(card: HandSlice): HandSlotKind | null {
  const types = card.types || [];
  const hasWeapon = types.includes("Weapon");
  const typeText = card.typeText || "";
  const tt = typeText.toLowerCase();
  const blob = [
    tt,
    (card.functionalText || "").toLowerCase(),
    ...(card.cardKeywords || []).map((k) => String(k).toLowerCase()),
  ].join(" ");

  if (hasWeapon) {
    if (
      /\(2h\)/i.test(typeText) ||
      /\b2h\b/.test(tt) ||
      /\btwo[- ]hand(ed)?\b/.test(blob)
    ) {
      return "two_handed";
    }
    if (/\(1h\)/i.test(typeText)) {
      return "one_handed";
    }
    return "one_handed";
  }

  if (types.some((t) => /off[- ]?hand/i.test(t)) || /\boff[- ]hand\b/.test(tt)) {
    return "off_hand";
  }

  return null;
}

export function summarizeHandLoadout(
  items: Array<{ kind: HandSlotKind; quantity: number }>,
): { T: number; H: number; O: number } {
  let T = 0;
  let H = 0;
  let O = 0;
  for (const { kind, quantity } of items) {
    const q = Math.min(1, Math.max(0, quantity));
    if (kind === "two_handed") T += q;
    else if (kind === "one_handed") H += q;
    else O += q;
  }
  return { T, H, O };
}

export function isHandLoadoutValid(counts: { T: number; H: number; O: number }): boolean {
  const { T, H, O } = counts;
  if (T >= 1) return T === 1 && H === 0 && O === 0;
  return O <= 1 && H + O <= 2;
}
