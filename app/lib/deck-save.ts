import { apiFetch, authHeaders } from "./api";
import type { CardData, CardZone, DeckData, DeckFormat } from "./types";

export type DeckVisibility = "PUBLIC" | "PRIVATE";

export interface DeckEntryLike {
  uniqueId: string;
  quantity: number;
  zone: CardZone;
}

/** URL slug: lowercase, hyphens, a-z0-9 only (matches API schema). */
export function slugifyDeckName(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
  return s.length >= 2 ? s : "deck";
}

function zoneRank(z: CardZone): number {
  if (z === "MAIN") return 0;
  if (z === "EQUIPMENT") return 1;
  if (z === "WEAPON") return 2;
  return 3;
}

/**
 * API allows one row per card per deck. Merge duplicate uniqueIds, summing quantity
 * and keeping the "most main-deck" zone when they differ.
 */
export function mergeEntriesForSave(
  entries: DeckEntryLike[],
): Array<{ cardUniqueId: string; quantity: number; zone: CardZone }> {
  const map = new Map<
    string,
    { quantity: number; zone: CardZone; rank: number }
  >();

  for (const e of entries) {
    const prev = map.get(e.uniqueId);
    const r = zoneRank(e.zone);
    if (!prev) {
      map.set(e.uniqueId, { quantity: e.quantity, zone: e.zone, rank: r });
    } else {
      const bestZone = r < prev.rank ? e.zone : prev.zone;
      const bestRank = Math.min(prev.rank, r);
      map.set(e.uniqueId, {
        quantity: prev.quantity + e.quantity,
        zone: bestZone,
        rank: bestRank,
      });
    }
  }

  return [...map.entries()].map(([cardUniqueId, v]) => ({
    cardUniqueId,
    quantity: Math.min(v.quantity, 3),
    zone: v.zone,
  }));
}

function randomSlugSuffix(): string {
  const n = Math.floor(Math.random() * 0xffff_ffff);
  return (n >>> 0).toString(16).padStart(8, "0");
}

export async function saveDeckToApi(
  accessToken: string,
  input: {
    name: string;
    description: string;
    format: DeckFormat;
    visibility: DeckVisibility;
    hero: CardData | null;
    entries: DeckEntryLike[];
  },
): Promise<{ slug: string; id: string }> {
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    throw new Error("NAME_TOO_SHORT");
  }

  const cards = mergeEntriesForSave(input.entries);
  let baseSlug = slugifyDeckName(trimmedName);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${randomSlugSuffix()}`;

    try {
      const deck = await apiFetch<DeckData>("/decks", {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({
          name: trimmedName,
          slug,
          description: input.description.trim() || undefined,
          heroCardId: input.hero?.uniqueId,
          format: input.format,
          visibility: input.visibility,
        }),
      });

      await apiFetch(`/decks/${deck.id}/cards`, {
        method: "PUT",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ cards }),
      });

      return { slug: deck.slug, id: deck.id };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const msg = lastError.message;
      if (/slug already exists|slug already taken/i.test(msg)) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("SAVE_FAILED");
}

export async function updateDeckToApi(
  accessToken: string,
  deckId: string,
  input: {
    name: string;
    description: string;
    format: DeckFormat;
    visibility: DeckVisibility;
    hero: CardData | null;
    entries: DeckEntryLike[];
  },
): Promise<{ slug: string; id: string }> {
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    throw new Error("NAME_TOO_SHORT");
  }

  const cards = mergeEntriesForSave(input.entries);

  const deck = await apiFetch<DeckData>(`/decks/${deckId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      name: trimmedName,
      description: input.description.trim() || undefined,
      heroCardId: input.hero?.uniqueId,
      format: input.format,
      visibility: input.visibility,
    }),
  });

  await apiFetch(`/decks/${deckId}/cards`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ cards }),
  });

  return { slug: deck.slug, id: deck.id };
}
