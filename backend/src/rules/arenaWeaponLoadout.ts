import { CardZone } from "../models";
import type { CardCache } from "../models";

export type HandSlotKind = "two_handed" | "one_handed" | "off_hand";

export type HandSlotCardSlice = Pick<
  CardCache,
  "types" | "typeText" | "functionalText" | "cardKeywords"
>;

/** Occupies a hero hand / off-hand slot (arena row). Armor-only equipment returns null. */
export function classifyHandSlotItem(card: HandSlotCardSlice): HandSlotKind | null {
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

export interface FabraryArenaEntry {
  zone: CardZone;
  quantity: number;
  card: Record<string, unknown>;
}

/**
 * FaBrary lists the whole arena in one block; extras that cannot be equipped at once
 * (e.g. a 2H weapon alongside 1H + shield) are moved to SIDEBOARD so the deck stays legal.
 */
export function rebalanceFabraryArenaWeaponZones(arenaEntries: FabraryArenaEntry[]): void {
  const asSlice = (c: Record<string, unknown>): HandSlotCardSlice => ({
    types: (c.types as string[]) || [],
    typeText: (c.typeText as string) || null,
    functionalText: (c.functionalText as string) || null,
    cardKeywords: (c.cardKeywords as string[]) || [],
  });

  const handRows = (): Array<{ entry: FabraryArenaEntry; kind: HandSlotKind }> => {
    const out: Array<{ entry: FabraryArenaEntry; kind: HandSlotKind }> = [];
    for (const entry of arenaEntries) {
      if (entry.zone !== CardZone.WEAPON && entry.zone !== CardZone.EQUIPMENT) continue;
      const kind = classifyHandSlotItem(asSlice(entry.card));
      if (kind) out.push({ entry, kind });
    }
    return out;
  };

  const stats = (rows: Array<{ entry: FabraryArenaEntry; kind: HandSlotKind }>) =>
    summarizeHandLoadout(
      rows.map((r) => ({
        kind: r.kind,
        quantity: Math.min(1, r.entry.quantity),
      })),
    );

  let rows = handRows();
  if (isHandLoadoutValid(stats(rows))) return;

  let { T, H, O } = stats(rows);

  if (T >= 1 && (H >= 1 || O >= 1)) {
    for (const { entry, kind } of rows) {
      if (kind === "two_handed") entry.zone = CardZone.SIDEBOARD;
    }
    return;
  }

  if (T > 1) {
    const twoHs = rows.filter((r) => r.kind === "two_handed");
    for (let i = 1; i < twoHs.length; i++) {
      twoHs[i]!.entry.zone = CardZone.SIDEBOARD;
    }
    return;
  }

  if (O > 1) {
    const offs = rows.filter((r) => r.kind === "off_hand");
    for (let i = 1; i < offs.length; i++) {
      offs[i]!.entry.zone = CardZone.SIDEBOARD;
    }
    return;
  }

  if (T === 0 && H + O > 2) {
    while (true) {
      rows = handRows();
      ({ T, H, O } = stats(rows));
      if (isHandLoadoutValid({ T, H, O })) break;
      if (T !== 0 || H + O <= 2) break;
      const victim = [...rows]
        .reverse()
        .find((r) => r.kind === "one_handed" || r.kind === "off_hand");
      if (!victim) break;
      victim.entry.zone = CardZone.SIDEBOARD;
    }
  }
}
