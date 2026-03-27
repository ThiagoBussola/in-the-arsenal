"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { NavAuth } from "../NavAuth";
import { useAuth } from "../../lib/auth-context";
import type { CardData, DeckData, DeckFormat } from "../../lib/types";
import { FORMAT_LABELS } from "../../lib/types";
import { apiFetch, authHeaders } from "../../lib/api";
import { DeckCardMenu } from "../../components/decks/DeckCardMenu";

export default function MyDecksPage() {
  const t = useTranslations("myDecks");
  const tNav = useTranslations("nav");
  const { accessToken } = useAuth();

  const [decks, setDecks] = useState<DeckData[]>([]);
  const [heroThumbById, setHeroThumbById] = useState<
    Record<string, string | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mine" | "public">("public");
  const [formatFilter, setFormatFilter] = useState<DeckFormat | "">("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", limit: "50" });
        if (formatFilter) params.set("format", formatFilter);

        const isMine = tab === "mine";
        if (isMine && !accessToken) {
          setDecks([]);
          setLoading(false);
          return;
        }

        const endpoint = isMine
          ? `/decks?${params}`
          : `/decks/public?${params}`;
        const headers =
          isMine && accessToken ? authHeaders(accessToken) : undefined;

        const data = await apiFetch<{ rows: DeckData[]; count: number }>(
          endpoint,
          { headers },
        );
        setDecks(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        setDecks([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [tab, formatFilter, accessToken]);

  useEffect(() => {
    const ids = [
      ...new Set(
        decks
          .map((d) => d.heroCardId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (ids.length === 0) {
      setHeroThumbById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const c = await apiFetch<CardData>(`/cards/${id}`);
            return [id, c.imageUrl ?? null] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      setHeroThumbById((prev) => {
        const out = { ...prev };
        for (const [id, url] of results) {
          out[id] = url;
        }
        return out;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [decks]);

  const showMineLoginGate = tab === "mine" && !accessToken;
  const emptyMine =
    tab === "mine" && accessToken && !loading && decks.length === 0;
  const emptyPublic = tab === "public" && !loading && decks.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="sticky top-0 z-40 border-b border-surface-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-heading text-sm font-semibold tracking-wider text-gold transition-colors hover:text-gold-bright"
          >
            In the Arsenal
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {tNav("blog")}
            </Link>
            <Link href="/decks" className="text-sm text-foreground">
              {tNav("decks")}
            </Link>
            <Link
              href="/decks/builder"
              className="rounded-sm border border-gold/40 bg-gold/10 px-4 py-1.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15"
            >
              {t("newDeck")}
            </Link>
            <LanguageSwitcher />
            <NavAuth />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-sm border border-surface-border overflow-hidden">
              <button
                type="button"
                onClick={() => setTab("public")}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                  tab === "public"
                    ? "bg-gold/10 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("publicDecks")}
              </button>
              <button
                type="button"
                onClick={() => setTab("mine")}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                  tab === "mine"
                    ? "bg-gold/10 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("myDecks")}
              </button>
            </div>

            <select
              value={formatFilter}
              onChange={(e) =>
                setFormatFilter(e.target.value as DeckFormat | "")
              }
              className="rounded-sm border border-surface-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-gold/40 focus:outline-none"
            >
              <option value="">{t("allFormats")}</option>
              {(Object.keys(FORMAT_LABELS) as DeckFormat[]).map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        ) : showMineLoginGate ? (
          <div className="card-glow rounded-sm border border-surface-border bg-surface/60 px-8 py-16 text-center">
            <p className="text-lg text-muted">{t("loginToSeeMine")}</p>
            <Link
              href="/auth/login"
              className="mt-6 inline-block rounded-sm border border-gold/40 bg-gold/10 px-6 py-2 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15"
            >
              {t("signInCta")}
            </Link>
          </div>
        ) : emptyMine ? (
          <div className="card-glow rounded-sm border border-surface-border bg-surface/60 px-8 py-16 text-center">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t("emptyMineTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              {t("emptyMineHint")}
            </p>
            <Link
              href="/decks/builder"
              className="mt-8 inline-block rounded-sm border border-gold/40 bg-gold/10 px-6 py-2.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15"
            >
              {t("emptyMineCta")}
            </Link>
          </div>
        ) : emptyPublic ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted">{t("noDecks")}</p>
            <Link
              href="/decks/builder"
              className="mt-4 inline-block rounded-sm border border-gold/40 bg-gold/10 px-6 py-2 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15"
            >
              {t("createFirst")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
              const showMineMenu = tab === "mine" && accessToken;
              const heroId = deck.heroCardId;
              const heroThumb = heroId ? heroThumbById[heroId] : undefined;
              return (
                <div
                  key={deck.id}
                  className="card-glow group relative rounded-sm border border-surface-border bg-surface transition-all hover:border-gold/20"
                >
                  {showMineMenu && (
                    <DeckCardMenu
                      deck={{
                        id: deck.id,
                        slug: deck.slug,
                        name: deck.name,
                      }}
                      accessToken={accessToken}
                      onDeleted={(id) =>
                        setDecks((prev) => prev.filter((d) => d.id !== id))
                      }
                    />
                  )}
                  <Link
                    href={`/decks/${deck.slug}`}
                    className="block p-5 pr-12"
                  >
                    <div className="flex items-start gap-3">
                      {heroId ? (
                        heroThumb ? (
                          <img
                            src={heroThumb}
                            alt=""
                            className="h-[4.5rem] w-[3.25rem] shrink-0 rounded-[3px] border border-gold/25 object-cover object-top"
                          />
                        ) : (
                          <div
                            className="h-[4.5rem] w-[3.25rem] shrink-0 animate-pulse rounded-[3px] border border-surface-border border-dashed bg-surface/70"
                            aria-hidden
                          />
                        )
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-heading text-sm font-semibold text-foreground transition-colors group-hover:text-gold">
                              {deck.name}
                            </h3>
                            {deck.user && (
                              <p className="mt-0.5 text-xs text-muted">
                                {t("byAuthor", { name: deck.user.name })}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-sm border border-surface-border px-2 py-0.5 text-[10px] font-medium text-gold">
                            {deck.format}
                          </span>
                        </div>

                        {deck.description && (
                          <p className="mt-2 text-xs text-muted line-clamp-2">
                            {deck.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted">
                          <span>
                            {t("cardCount", {
                              count: deck.cardCount ?? deck.cards?.length ?? 0,
                            })}
                          </span>
                          <span>
                            {deck.visibility === "PUBLIC"
                              ? t("visibilityPublic")
                              : t("visibilityPrivate")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
