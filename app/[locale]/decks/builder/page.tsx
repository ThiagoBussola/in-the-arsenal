"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CardSearch } from "../../../components/deck-builder/CardSearch";
import { HeroSelector } from "../../../components/deck-builder/HeroSelector";
import { EquipmentSlots } from "../../../components/deck-builder/EquipmentSlots";
import {
  DeckList,
  type DeckEntry,
} from "../../../components/deck-builder/DeckList";
import { ValidationPanel } from "../../../components/deck-builder/ValidationPanel";
import { CardPreview } from "../../../components/deck-builder/CardPreview";
import { FabraryImportPanel } from "../../../components/deck-builder/FabraryImportPanel";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { useAuth } from "../../../lib/auth-context";
import { saveDeckToApi, updateDeckToApi } from "../../../lib/deck-save";
import { devError } from "../../../lib/dev-log";
import { apiFetch, authHeaders } from "../../../lib/api";
import type {
  CardData,
  CardZone,
  DeckData,
  DeckFormat,
  ValidationError,
} from "../../../lib/types";
import { FORMAT_LABELS } from "../../../lib/types";
import Link from "next/link";
import { Link as I18nLink, useRouter } from "@/i18n/navigation";

const EQUIPMENT_SLOT_TYPES = ["Head", "Chest", "Arms", "Legs"] as const;

export default function DeckBuilderPage() {
  const t = useTranslations("deckBuilder");
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const { accessToken, loading: authLoading } = useAuth();

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deckName, setDeckName] = useState("");
  const [format, setFormat] = useState<DeckFormat>("CC");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [hero, setHero] = useState<CardData | null>(null);
  const [entries, setEntries] = useState<DeckEntry[]>([]);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!editSlug) {
      setEditingDeckId(null);
      return;
    }
    if (authLoading) return;
    if (!accessToken) {
      setEditingDeckId(null);
      setSaveError(t("saveNeedLogin"));
      return;
    }

    let cancelled = false;
    setEditLoading(true);
    setSaveError("");

    (async () => {
      try {
        const d = await apiFetch<DeckData>(`/decks/${editSlug}`, {
          headers: authHeaders(accessToken),
        });
        if (cancelled) return;

        const cardMap: Record<string, CardData> = {};
        const ids = [
          ...new Set((d.cards ?? []).map((c) => c.cardUniqueId)),
          ...(d.heroCardId ? [d.heroCardId] : []),
        ];
        for (const id of ids) {
          try {
            cardMap[id] = await apiFetch<CardData>(`/cards/${id}`);
          } catch {
            /* optional */
          }
        }
        if (cancelled) return;

        setEditingDeckId(d.id);
        setDeckName(d.name);
        setDescription(d.description ?? "");
        setFormat(d.format);
        setVisibility(d.visibility);
        if (d.heroCardId && cardMap[d.heroCardId]) {
          setHero(cardMap[d.heroCardId]!);
        } else {
          setHero(null);
        }

        const nextEntries: DeckEntry[] = [];
        for (const c of d.cards ?? []) {
          const card = cardMap[c.cardUniqueId];
          if (card) {
            nextEntries.push({
              uniqueId: c.cardUniqueId,
              quantity: c.quantity,
              zone: c.zone,
              card,
            });
          }
        }
        setEntries(nextEntries);
        const last = nextEntries[nextEntries.length - 1];
        if (last) setPreviewCard(last.card);
      } catch (e) {
        if (!cancelled) {
          setSaveError(t("loadDeckFailed"));
          devError("[deck builder] load edit deck failed", e);
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editSlug, accessToken, authLoading, t]);

  const mainEntries = entries.filter(
    (e) => e.zone === "MAIN" || e.zone === "SIDEBOARD",
  );
  const equipmentEntries = entries.filter((e) => e.zone === "EQUIPMENT");
  const weaponEntries = entries.filter((e) => e.zone === "WEAPON");

  const equipmentSlots = EQUIPMENT_SLOT_TYPES.map((slot) => {
    const found = equipmentEntries.find((e) =>
      e.card.types.some((t) => t.toLowerCase().includes(slot.toLowerCase())),
    );
    return { slot, card: found?.card || null };
  });

  const weaponCards = weaponEntries.map((e) => e.card);

  const totalMain = entries
    .filter((e) => e.zone === "MAIN")
    .reduce((s, e) => s + e.quantity, 0);

  const handleAddCard = useCallback((card: CardData) => {
    setPreviewCard(card);

    const isHeroCard = card.types.includes("Hero");
    if (isHeroCard) {
      setHero(card);
      return;
    }

    const isEquipment = card.types.includes("Equipment");
    const isWeapon = card.types.includes("Weapon");
    let zone: CardZone = "MAIN";
    if (isEquipment) zone = "EQUIPMENT";
    else if (isWeapon) zone = "WEAPON";

    setEntries((prev) => {
      const existing = prev.find((e) => e.uniqueId === card.uniqueId);
      if (existing) {
        if (isEquipment || isWeapon) return prev;
        if (existing.quantity >= 3) return prev;
        return prev.map((e) =>
          e.uniqueId === card.uniqueId ? { ...e, quantity: e.quantity + 1 } : e,
        );
      }
      return [...prev, { uniqueId: card.uniqueId, card, quantity: 1, zone }];
    });
  }, []);

  const handleUpdateQuantity = useCallback(
    (uniqueId: string, quantity: number) => {
      setEntries((prev) =>
        prev.map((e) => (e.uniqueId === uniqueId ? { ...e, quantity } : e)),
      );
    },
    [],
  );

  const handleRemoveCard = useCallback((uniqueId: string) => {
    setEntries((prev) => prev.filter((e) => e.uniqueId !== uniqueId));
  }, []);

  const handleChangeZone = useCallback((uniqueId: string, zone: CardZone) => {
    setEntries((prev) =>
      prev.map((e) => (e.uniqueId === uniqueId ? { ...e, zone } : e)),
    );
  }, []);

  const handleRemoveEquipment = useCallback((cardUniqueId: string) => {
    setEntries((prev) => prev.filter((e) => e.uniqueId !== cardUniqueId));
  }, []);

  const handleFabraryImported = useCallback(
    async (payload: {
      deckName?: string;
      format?: DeckFormat;
      hero: CardData | null;
      entries: DeckEntry[];
    }) => {
      setSaveError("");

      if (payload.format) setFormat(payload.format);
      setHero(payload.hero);
      setEntries(payload.entries);
      if (payload.entries.length > 0) {
        setPreviewCard(payload.entries[payload.entries.length - 1]!.card);
      }

      const importedName = payload.deckName?.trim() ?? "";
      const resolvedName =
        importedName.length >= 2
          ? importedName
          : deckName.trim().length >= 2
            ? deckName.trim()
            : t("defaultImportedName");

      if (importedName.length >= 2) {
        setDeckName(importedName);
      } else if (deckName.trim().length < 2) {
        setDeckName(resolvedName);
      }

      if (!accessToken) return;

      const resolvedFormat = payload.format ?? format;

      setSaving(true);
      try {
        const { slug } = await saveDeckToApi(accessToken, {
          name: resolvedName,
          description,
          format: resolvedFormat,
          visibility,
          hero: payload.hero,
          entries: payload.entries,
        });
        router.push(`/decks/${slug}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        devError("[deck builder] save after import failed", msg, e);
        if (msg === "NAME_TOO_SHORT") {
          setSaveError(t("saveNameTooShort"));
        } else {
          setSaveError(msg || t("saveFailed"));
        }
      } finally {
        setSaving(false);
      }
    },
    [accessToken, deckName, description, format, visibility, t, router],
  );

  const handleSaveClick = useCallback(async () => {
    setSaveError("");
    if (!accessToken) {
      setSaveError(t("saveNeedLogin"));
      return;
    }
    const name = deckName.trim();
    if (name.length < 2) {
      setSaveError(t("saveNameTooShort"));
      return;
    }

    setSaving(true);
    try {
      const { slug } = editingDeckId
        ? await updateDeckToApi(accessToken, editingDeckId, {
            name,
            description,
            format,
            visibility,
            hero,
            entries,
          })
        : await saveDeckToApi(accessToken, {
            name,
            description,
            format,
            visibility,
            hero,
            entries,
          });
      router.push(`/decks/${slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      devError("[deck builder] save failed", msg, e);
      if (msg === "NAME_TOO_SHORT") {
        setSaveError(t("saveNameTooShort"));
      } else {
        setSaveError(msg || t("saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  }, [
    accessToken,
    editingDeckId,
    deckName,
    description,
    format,
    visibility,
    hero,
    entries,
    t,
    router,
  ]);

  const runValidation = useCallback(() => {
    const errors: ValidationError[] = [];

    if (!hero) {
      errors.push({
        code: "NO_HERO",
        severity: "error",
        message: t("validation.noHero"),
      });
    }

    const minDeck = format === "CC" || format === "LL" ? 60 : 40;
    if (totalMain < minDeck) {
      errors.push({
        code: "DECK_TOO_SMALL",
        severity: "warning",
        message: t("validation.tooFewCards", {
          count: totalMain,
          min: minDeck,
        }),
      });
    }

    const countByName = new Map<string, number>();
    entries.forEach((e) => {
      const n = countByName.get(e.card.name) || 0;
      countByName.set(e.card.name, n + e.quantity);
    });
    countByName.forEach((count, name) => {
      if (count > 3) {
        errors.push({
          code: "TOO_MANY_COPIES",
          severity: "error",
          message: t("validation.tooManyCopies", { name, count }),
        });
      }
    });

    setValidationErrors(errors);
  }, [hero, format, entries, totalMain, t]);

  if (editSlug && (authLoading || editLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        <p className="text-sm text-muted">{t("loadingDeck")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-surface-border/50 bg-background/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-wider text-gold"
        >
          In the Arsenal
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {saveError && (
            <div className="flex max-w-[220px] flex-col gap-1 text-right">
              <span className="text-xs text-crimson-bright">{saveError}</span>
              {!accessToken && (
                <I18nLink
                  href="/auth/login"
                  className="text-xs text-gold hover:underline"
                >
                  {t("signInToSave")}
                </I18nLink>
              )}
            </div>
          )}
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder={t("deckName")}
            className="w-56 rounded-sm border border-surface-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/40 focus:outline-none"
          />

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as DeckFormat)}
            className="rounded-sm border border-surface-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-gold/40 focus:outline-none"
          >
            {(Object.keys(FORMAT_LABELS) as DeckFormat[]).map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>

          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
            }
            className="rounded-sm border border-surface-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-gold/40 focus:outline-none"
          >
            <option value="PRIVATE">{t("private")}</option>
            <option value="PUBLIC">{t("public")}</option>
          </select>

          <button
            onClick={runValidation}
            className="rounded-sm border border-gold/30 px-4 py-1.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/60 hover:bg-gold/5"
          >
            {t("validate")}
          </button>

          <button
            type="button"
            disabled={saving || deckName.trim().length < 2}
            onClick={() => void handleSaveClick()}
            className="rounded-sm border border-gold/40 bg-gold/10 px-5 py-1.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15 disabled:opacity-40"
          >
            {saving ? t("saving") : t("save")}
          </button>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Main: top arena bar + search + deck list */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <section className="shrink-0 border-b border-gold/20 bg-gradient-to-b from-gold/[0.08] via-background to-background px-3 py-3 sm:px-5 sm:py-4">
            <h2 className="mb-3 font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              {t("heroAndArena")}
            </h2>
            <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end xl:gap-6">
              <div className="flex w-full flex-wrap items-end justify-center gap-x-4 gap-y-3 sm:justify-start xl:min-w-0 xl:flex-1">
                <HeroSelector
                  compact
                  hero={hero}
                  onSelect={(card) => setHero(card)}
                  onClear={() => setHero(null)}
                />
                <EquipmentSlots
                  compact
                  equipment={equipmentSlots}
                  weapons={weaponCards}
                  onRemove={handleRemoveEquipment}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FabraryImportPanel
                accessToken={accessToken}
                onImported={handleFabraryImported}
              />
              <ValidationPanel errors={validationErrors} />
            </div>
          </section>

          <main className="flex flex-1 flex-col p-4">
            <div className="mb-4">
              <CardSearch onSelect={handleAddCard} />
            </div>

            {previewCard && (
              <div className="mb-4 flex justify-center">
                <CardPreview
                  card={previewCard}
                  heroCardId={hero?.uniqueId}
                  format={format}
                />
              </div>
            )}

            <div className="mt-auto">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="w-full resize-none rounded-sm border border-surface-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/40 focus:outline-none"
              />
            </div>
          </main>
        </div>

        <aside className="deck-builder-sidebar deck-builder-sidebar--right flex max-h-[45vh] w-full shrink-0 flex-col overflow-y-auto border-t border-gold/20 p-4 pt-5 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
          <DeckList
            entries={mainEntries}
            format={format}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveCard}
            onChangeZone={handleChangeZone}
          />
        </aside>
      </div>
    </div>
  );
}
