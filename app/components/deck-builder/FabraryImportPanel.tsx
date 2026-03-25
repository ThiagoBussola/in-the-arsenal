"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "../../lib/api";
import { devError } from "../../lib/dev-log";
import { cardFromApiJson } from "../../lib/card-map";
import type { CardData, CardZone, DeckFormat } from "../../lib/types";
import type { DeckEntry } from "./DeckList";

export interface FabraryImportApiResponse {
  deckName: string | null;
  heroName: string | null;
  format: string | null;
  heroCard: Record<string, unknown> | null;
  entries: Array<{
    uniqueId: string;
    quantity: number;
    zone: string;
    card: Record<string, unknown>;
  }>;
  unresolved: Array<{ line: string; reason: string }>;
}

function isDeckFormat(v: string): v is DeckFormat {
  return ["CC", "BLITZ", "COMMONER", "LL", "SAGE"].includes(v);
}

interface FabraryImportPanelProps {
  accessToken: string | null;
  onImported: (payload: {
    deckName?: string;
    format?: DeckFormat;
    hero: CardData | null;
    entries: DeckEntry[];
  }) => void | Promise<void>;
}

export function FabraryImportPanel({
  accessToken,
  onImported,
}: FabraryImportPanelProps) {
  const t = useTranslations("deckBuilder.fabraryImport");
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!accessToken) {
      setError(t("needLogin"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<FabraryImportApiResponse>("/decks/import/fabrary", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ raw }),
      });

      const entries: DeckEntry[] = data.entries.map((e) => ({
        uniqueId: e.uniqueId,
        quantity: e.quantity,
        zone: e.zone as CardZone,
        card: cardFromApiJson(e.card),
      }));

      const hero = data.heroCard ? cardFromApiJson(data.heroCard) : null;

      let deckName: string | undefined;
      if (data.deckName) {
        deckName = data.deckName.replace(/\s*\(copy\)\s*$/i, "").trim();
      }

      let format: DeckFormat | undefined;
      if (data.format && isDeckFormat(data.format)) {
        format = data.format;
      }

      await onImported({ deckName, format, hero, entries });

      if (data.unresolved.length > 0) {
        const preview = data.unresolved
          .slice(0, 5)
          .map((u) => u.line)
          .join(" · ");
        setError(
          t("partialImport", {
            count: data.unresolved.length,
            preview,
          })
        );
      } else {
        setRaw("");
        setOpen(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("failed");
      devError("[fabrary import] failed", msg, e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-sm border border-gold/20 bg-black/30 shadow-[inset_0_1px_0_rgba(201,168,76,0.08)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gold/90 transition-colors hover:bg-surface/60"
      >
        <span>{t("title")}</span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="relative space-y-2 border-t border-surface-border p-3">
          {loading && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-b-sm bg-background/85 px-4 py-8 backdrop-blur-sm"
              aria-busy="true"
              aria-live="polite"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
              <p className="max-w-[220px] text-center text-xs leading-relaxed text-muted">
                {t("importingDetail")}
              </p>
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted">{t("hint")}</p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t("placeholder")}
            rows={10}
            disabled={loading}
            className="w-full resize-y rounded-sm border border-surface-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted/40 focus:border-gold/40 focus:outline-none disabled:opacity-50"
          />
          {error && (
            <p className="text-xs text-crimson-bright">{error}</p>
          )}
          <button
            type="button"
            disabled={loading || !raw.trim()}
            onClick={handleImport}
            className="w-full rounded-sm border border-gold/35 bg-gold/10 py-2 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15 disabled:opacity-40"
          >
            {loading ? t("importing") : t("import")}
          </button>
        </div>
      )}
    </div>
  );
}
