"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch, authHeaders } from "../../lib/api";
import type {
  CardData,
  CardZone,
  DeckData,
  DeckVisibility,
} from "../../lib/types";
import { FORMAT_LABELS } from "../../lib/types";

const PITCH_LABEL: Record<string, string> = {
  "1": "red",
  "2": "yellow",
  "3": "blue",
};

function pitchSuffix(pitch: string | null): string {
  if (!pitch) return "";
  const p = PITCH_LABEL[pitch];
  return p ? ` (${p})` : "";
}

function buildDeckListText(
  deck: DeckData,
  cardMap: Record<string, CardData>,
): string {
  const hero = deck.heroCardId ? cardMap[deck.heroCardId] : null;
  const lines: string[] = [];
  lines.push(`Name: ${deck.name}`);
  if (hero) lines.push(`Hero: ${hero.name}`);
  lines.push(`Format: ${FORMAT_LABELS[deck.format] ?? deck.format}`);
  lines.push("");

  const arenaZones: CardZone[] = ["EQUIPMENT", "WEAPON"];
  const arena = (deck.cards ?? []).filter((c) => arenaZones.includes(c.zone));
  const main = (deck.cards ?? []).filter(
    (c) => c.zone === "MAIN" || c.zone === "SIDEBOARD",
  );

  if (arena.length) {
    lines.push("Arena cards");
    for (const c of arena) {
      const card = cardMap[c.cardUniqueId];
      const name = card?.name ?? c.cardUniqueId;
      lines.push(`${c.quantity}x ${name}${pitchSuffix(card?.pitch ?? null)}`);
    }
    lines.push("");
  }

  if (main.length) {
    lines.push("Deck cards");
    for (const c of main) {
      const card = cardMap[c.cardUniqueId];
      const name = card?.name ?? c.cardUniqueId;
      lines.push(`${c.quantity}x ${name}${pitchSuffix(card?.pitch ?? null)}`);
    }
  }

  lines.push("");
  lines.push("Exported from In the Arsenal");
  return lines.join("\n");
}

async function loadDeckWithCards(
  slug: string,
  token: string,
): Promise<{ deck: DeckData; cardMap: Record<string, CardData> }> {
  const deck = await apiFetch<DeckData>(`/decks/${slug}`, {
    headers: authHeaders(token),
  });
  const cardMap: Record<string, CardData> = {};
  const ids = [
    ...new Set((deck.cards ?? []).map((c) => c.cardUniqueId)),
    ...(deck.heroCardId ? [deck.heroCardId] : []),
  ];
  for (const id of ids) {
    try {
      cardMap[id] = await apiFetch<CardData>(`/cards/${id}`);
    } catch {
      /* skip missing */
    }
  }
  return { deck, cardMap };
}

export function DeckCardMenu({
  deck,
  accessToken,
  onDeleted,
  /** When set, copy uses this data instead of refetching (e.g. deck detail page). */
  copySource,
  /** Owner can toggle public/private without opening the builder. */
  visibilityManaged,
  /** Use on deck cards in lists (absolute corner). Omit or false for header/toolbar. */
  anchorOnCard = true,
}: {
  deck: Pick<DeckData, "id" | "slug" | "name">;
  accessToken: string;
  onDeleted: (id: string) => void;
  copySource?: { deck: DeckData; cardMap: Record<string, CardData> };
  visibilityManaged?: {
    current: DeckVisibility;
    onUpdated: (v: DeckVisibility) => void;
  };
  anchorOnCard?: boolean;
}) {
  const t = useTranslations("myDecks");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"copy" | "delete" | "visibility" | null>(
    null,
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCopy = async () => {
    setBusy("copy");
    try {
      const full = copySource?.deck;
      const map = copySource?.cardMap;
      const { deck: loadedDeck, cardMap } =
        full && map
          ? { deck: full, cardMap: map }
          : await loadDeckWithCards(deck.slug, accessToken);
      const text = buildDeckListText(loadedDeck, cardMap);
      await navigator.clipboard.writeText(text);
      setOpen(false);
    } catch {
      window.alert(t("cardMenu.copyFailed"));
    } finally {
      setBusy(null);
    }
  };

  const handleVisibility = async (next: DeckVisibility) => {
    if (!visibilityManaged || next === visibilityManaged.current) return;
    setBusy("visibility");
    try {
      await apiFetch(`/decks/${deck.id}`, {
        method: "PATCH",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ visibility: next }),
      });
      visibilityManaged.onUpdated(next);
      setOpen(false);
    } catch {
      window.alert(t("cardMenu.visibilityFailed"));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("cardMenu.deleteConfirm", { name: deck.name })))
      return;
    setBusy("delete");
    try {
      await apiFetch(`/decks/${deck.id}`, {
        method: "DELETE",
        headers: authHeaders(accessToken),
      });
      setOpen(false);
      onDeleted(deck.id);
    } catch {
      window.alert(t("cardMenu.deleteFailed"));
    } finally {
      setBusy(null);
    }
  };

  const wrapClass = anchorOnCard
    ? "absolute right-2 top-2 z-20"
    : "relative z-20 shrink-0";

  return (
    <div ref={wrapRef} className={wrapClass}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("cardMenu.openMenu")}
        disabled={busy !== null}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-surface-border bg-background/90 text-muted transition-colors hover:border-gold/30 hover:text-foreground"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 min-w-[10rem] rounded-sm border border-surface-border bg-background py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/decks/builder?edit=${encodeURIComponent(deck.slug)}`}
            role="menuitem"
            className="block px-3 py-2 text-left text-xs text-foreground hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            {t("cardMenu.edit")}
          </Link>
          {visibilityManaged && (
            <button
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() =>
                void handleVisibility(
                  visibilityManaged.current === "PRIVATE"
                    ? "PUBLIC"
                    : "PRIVATE",
                )
              }
              className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface disabled:opacity-50"
            >
              {busy === "visibility"
                ? t("cardMenu.updatingVisibility")
                : visibilityManaged.current === "PRIVATE"
                  ? t("cardMenu.makePublic")
                  : t("cardMenu.makePrivate")}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={busy !== null}
            onClick={() => void handleCopy()}
            className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface disabled:opacity-50"
          >
            {busy === "copy" ? t("cardMenu.copying") : t("cardMenu.copyList")}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy !== null}
            onClick={() => void handleDelete()}
            className="w-full px-3 py-2 text-left text-xs text-crimson-bright hover:bg-surface/80 disabled:opacity-50"
          >
            {busy === "delete"
              ? t("cardMenu.deleting")
              : t("cardMenu.delete")}
          </button>
        </div>
      )}
    </div>
  );
}
