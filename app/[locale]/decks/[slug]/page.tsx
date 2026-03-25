"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { useAuth } from "../../../lib/auth-context";
import type { DeckData, CardData, CardZone } from "../../../lib/types";
import { FORMAT_LABELS, ZONE_LABELS } from "../../../lib/types";
import { apiFetch, authHeaders } from "../../../lib/api";
import { devError } from "../../../lib/dev-log";
import { Link, useRouter } from "@/i18n/navigation";
import { DeckCardStack } from "../../../components/decks/DeckCardStack";
import { DeckCardMenu } from "../../../components/decks/DeckCardMenu";

export default function DeckViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("deckViewer");
  const tMine = useTranslations("myDecks");
  const router = useRouter();
  const { accessToken, loading: authLoading, user } = useAuth();

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [cardMap, setCardMap] = useState<Record<string, CardData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const headers = accessToken ? authHeaders(accessToken) : undefined;
        const d = await apiFetch<DeckData>(`/decks/${slug}`, {
          headers,
        });
        if (cancelled) return;
        setDeck(d);

        const cardsList = d.cards ?? [];
        const uniqueIds = [
          ...new Set(cardsList.map((c) => c.cardUniqueId)),
          ...(d.heroCardId ? [d.heroCardId] : []),
        ];
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const card = await apiFetch<CardData>(`/cards/${id}`);
              return [id, card] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        const cards: Record<string, CardData> = {};
        for (const [id, card] of results) {
          if (card) cards[id] = card;
        }
        if (!cancelled) setCardMap(cards);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        devError("[deck viewer] GET /decks/:slug failed", slug, msg);
        if (!cancelled) {
          setDeck(null);
          setError(t("notFound"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, accessToken, authLoading, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-6">
        <p className="text-center text-xl text-muted">
          {error || t("notFound")}
        </p>
        {!accessToken && (
          <p className="max-w-md text-center text-sm text-muted">
            {t("privateHint")}
          </p>
        )}
        <Link href="/decks" className="text-sm text-gold hover:underline">
          {t("backToDecks")}
        </Link>
      </div>
    );
  }

  const heroCard = deck.heroCardId ? cardMap[deck.heroCardId] : null;

  const cardsList = deck.cards ?? [];

  const weaponEntries = cardsList
    .filter((c) => c.zone === "WEAPON")
    .map((c) => ({ ...c, card: cardMap[c.cardUniqueId] }));
  const equipmentEntries = cardsList
    .filter((c) => c.zone === "EQUIPMENT")
    .map((c) => ({ ...c, card: cardMap[c.cardUniqueId] }));
  const mainEntries = cardsList
    .filter((c) => c.zone === "MAIN")
    .map((c) => ({ ...c, card: cardMap[c.cardUniqueId] }));
  const sideEntries = cardsList
    .filter((c) => c.zone === "SIDEBOARD")
    .map((c) => ({ ...c, card: cardMap[c.cardUniqueId] }));

  const groupedCards = (
    ["MAIN", "EQUIPMENT", "WEAPON", "SIDEBOARD"] as CardZone[]
  ).map((zone) => ({
    zone,
    label: ZONE_LABELS[zone],
    cards: cardsList
      .filter((c) => c.zone === zone)
      .map((c) => ({ ...c, card: cardMap[c.cardUniqueId] })),
  }));

  const heroArenaQty =
    (deck.heroCardId ? 1 : 0) +
    weaponEntries.reduce((s, c) => s + c.quantity, 0) +
    equipmentEntries.reduce((s, c) => s + c.quantity, 0);

  const totalCards = cardsList.reduce((s, c) => s + c.quantity, 0);

  const isOwner =
    Boolean(accessToken && user?.id && deck.userId === user.id);

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
              href="/decks"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t("backToDecks")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {viewMode === "list" && heroCard?.imageUrl && (
            <img
              src={heroCard.imageUrl}
              alt={heroCard.name}
              className="h-48 shrink-0 rounded-lg border border-gold/20 object-contain shadow-lg shadow-black/40"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
                {deck.name}
              </h1>
              <span className="rounded-sm border border-gold/30 px-2.5 py-0.5 text-xs font-medium text-gold">
                {FORMAT_LABELS[deck.format]}
              </span>
              <span className="text-xs text-muted">
                {deck.visibility === "PUBLIC"
                  ? tMine("visibilityPublic")
                  : tMine("visibilityPrivate")}
              </span>
            </div>

            {heroCard && (
              <p className="mt-1 text-sm text-muted">
                {t("hero")}:{" "}
                <span className="text-foreground">{heroCard.name}</span>
              </p>
            )}

            {deck.user && (
              <p className="mt-1 text-xs text-muted">
                {t("by")} {deck.user.name}
              </p>
            )}

            {deck.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {deck.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span>
                {totalCards} {t("cards")}
              </span>
              <span>
                {t("created")} {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-5 inline-flex rounded-sm border border-surface-border bg-surface/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("gallery")}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "gallery"
                    ? "bg-gold/15 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("viewGallery")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-gold/15 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("viewList")}
              </button>
            </div>
            </div>

            {isOwner && accessToken && (
              <DeckCardMenu
                deck={{
                  id: deck.id,
                  slug: deck.slug,
                  name: deck.name,
                }}
                accessToken={accessToken}
                onDeleted={() => {
                  router.push("/decks");
                }}
                copySource={{ deck, cardMap }}
                visibilityManaged={{
                  current: deck.visibility,
                  onUpdated: (v) =>
                    setDeck((prev) => (prev ? { ...prev, visibility: v } : null)),
                }}
                anchorOnCard={false}
              />
            )}
          </div>
        </div>

        {viewMode === "gallery" ? (
          <div className="space-y-10">
            {heroArenaQty > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                  {t("heroAndArena")} ({heroArenaQty})
                </h2>
                <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {deck.heroCardId && (
                    <div className="w-full max-w-[200px]">
                      <DeckCardStack
                        card={heroCard ?? null}
                        quantity={1}
                        size="lg"
                      />
                    </div>
                  )}
                  {weaponEntries.map((dc) => (
                    <div
                      key={dc.id || dc.cardUniqueId}
                      className="w-full max-w-[168px]"
                    >
                      <DeckCardStack
                        card={dc.card}
                        quantity={dc.quantity}
                        size="md"
                      />
                    </div>
                  ))}
                  {equipmentEntries.map((dc) => (
                    <div
                      key={dc.id || dc.cardUniqueId}
                      className="w-full max-w-[168px]"
                    >
                      <DeckCardStack
                        card={dc.card}
                        quantity={dc.quantity}
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mainEntries.length > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                  {t("deckSection")} (
                  {mainEntries.reduce((s, c) => s + c.quantity, 0)})
                </h2>
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                  {mainEntries.map((dc) => (
                    <DeckCardStack
                      key={dc.id || dc.cardUniqueId}
                      card={dc.card}
                      quantity={dc.quantity}
                      size="sm"
                    />
                  ))}
                </div>
              </section>
            )}

            {sideEntries.length > 0 && (
              <section>
                <h2 className="mb-4 font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                  {ZONE_LABELS.SIDEBOARD} (
                  {sideEntries.reduce((s, c) => s + c.quantity, 0)})
                </h2>
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                  {sideEntries.map((dc) => (
                    <DeckCardStack
                      key={dc.id || dc.cardUniqueId}
                      card={dc.card}
                      quantity={dc.quantity}
                      size="sm"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {groupedCards
              .filter((g) => g.cards.length > 0)
              .map(({ zone, label, cards }) => (
                <div key={zone}>
                  <h2 className="mb-3 font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                    {label} ({cards.reduce((s, c) => s + c.quantity, 0)})
                  </h2>
                  <div className="space-y-0.5 rounded-sm border border-surface-border bg-surface p-3">
                    {cards.map((dc) => (
                      <div
                        key={dc.id || dc.cardUniqueId}
                        className="flex items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-surface-raised"
                      >
                        <span className="w-5 text-center text-xs font-medium text-gold">
                          {dc.quantity}x
                        </span>
                        {dc.card?.imageUrl && (
                          <img
                            src={dc.card.imageUrl}
                            alt=""
                            className="h-7 w-5 rounded-[1px] object-cover"
                          />
                        )}
                        <span className="flex-1 text-sm text-foreground">
                          {dc.card?.name || dc.cardUniqueId}
                        </span>
                        {dc.card?.pitch && (
                          <div className="flex gap-0.5">
                            {Array.from({
                              length: parseInt(dc.card.pitch) || 0,
                            }).map((_, i) => (
                              <span
                                key={i}
                                className={`inline-block h-2 w-2 rounded-full ${
                                  dc.card!.pitch === "1"
                                    ? "bg-red-500"
                                    : dc.card!.pitch === "2"
                                      ? "bg-yellow-400"
                                      : "bg-blue-500"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-muted">
                          {dc.card?.typeText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-surface-border/50 bg-background px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="font-heading text-xs tracking-widest text-muted/60 uppercase">
            In the Arsenal &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
