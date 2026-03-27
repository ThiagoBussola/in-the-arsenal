"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import {
  FORMAT_LABELS,
  FORMAT_MAX_COPIES,
  copyLimitGroupKey,
} from "../../../lib/types";
import {
  DND_MIME,
  inferArenaZoneFromCard,
  parseDeckDragPayload,
} from "../../../lib/deck-dnd";
import {
  classifyHandSlotItem,
  isHandLoadoutValid,
  summarizeHandLoadout,
} from "../../../lib/arena-weapon-loadout";
import Link from "next/link";
import { Link as I18nLink, useRouter } from "@/i18n/navigation";

const EQUIPMENT_SLOT_TYPES = ["Head", "Chest", "Arms", "Legs"] as const;

export default function DeckBuilderPage() {
  const t = useTranslations("deckBuilder");
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const { accessToken, loading: authLoading, user } = useAuth();

  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deckName, setDeckName] = useState("");
  const [format, setFormat] = useState<DeckFormat>("CC");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [hero, setHero] = useState<CardData | null>(null);
  const [entries, setEntries] = useState<DeckEntry[]>([]);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [libraryHint, setLibraryHint] = useState<string | null>(null);
  const [validationStamp, setValidationStamp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [description, setDescription] = useState("");
  const [deckView, setDeckView] = useState<"gallery" | "list">("gallery");
  const [arenaDropOver, setArenaDropOver] = useState(false);

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

        if (user?.id && d.userId !== user.id) {
          setSaveError(t("notOwnerEdit"));
          setEditingDeckId(null);
          setEntries([]);
          setHero(null);
          setDeckName("");
          setDescription("");
          router.replace("/decks/builder");
          return;
        }

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
  }, [editSlug, accessToken, authLoading, user?.id, t, router]);

  useEffect(() => {
    if (!libraryHint) return;
    const id = window.setTimeout(() => setLibraryHint(null), 2800);
    return () => window.clearTimeout(id);
  }, [libraryHint]);

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

  const handleAddCard = useCallback(
    (card: CardData) => {
      setLibraryHint(null);
      setPreviewCard(card);

      const types = Array.isArray(card.types) ? card.types : [];
      const isHeroCard = types.includes("Hero");
      if (isHeroCard) {
        setHero(card);
        return;
      }

      const arena = inferArenaZoneFromCard(card);
      const zone: CardZone = arena ?? "MAIN";
      const isArena = zone === "EQUIPMENT" || zone === "WEAPON";
      const maxCopies = FORMAT_MAX_COPIES[format];

      setEntries((prev) => {
        const existing = prev.find((e) => e.uniqueId === card.uniqueId);
        if (existing) {
          if (isArena) {
            queueMicrotask(() =>
              setLibraryHint(t("cardSearch.alreadyEquipped")),
            );
            return prev;
          }
          const gk = copyLimitGroupKey(card.name, card.pitch);
          const groupTotal = prev
            .filter(
              (e) => e.zone === "MAIN" || e.zone === "SIDEBOARD",
            )
            .filter(
              (e) => copyLimitGroupKey(e.card.name, e.card.pitch) === gk,
            )
            .reduce((s, e) => s + e.quantity, 0);
          if (groupTotal >= maxCopies) return prev;
          return prev.map((e) =>
            e.uniqueId === card.uniqueId
              ? { ...e, quantity: e.quantity + 1 }
              : e,
          );
        }
        if (!isArena) {
          const gk = copyLimitGroupKey(card.name, card.pitch);
          const groupTotal = prev
            .filter(
              (e) => e.zone === "MAIN" || e.zone === "SIDEBOARD",
            )
            .filter(
              (e) => copyLimitGroupKey(e.card.name, e.card.pitch) === gk,
            )
            .reduce((s, e) => s + e.quantity, 0);
          if (groupTotal >= maxCopies) return prev;
        }
        return [...prev, { uniqueId: card.uniqueId, card, quantity: 1, zone }];
      });
    },
    [format, t],
  );

  const handleUpdateQuantity = useCallback(
    (uniqueId: string, quantity: number) => {
      const maxCopies = FORMAT_MAX_COPIES[format];
      setEntries((prev) => {
        const entry = prev.find((e) => e.uniqueId === uniqueId);
        if (!entry) return prev;
        const q = Math.max(1, Math.floor(quantity));
        if (entry.zone === "MAIN" || entry.zone === "SIDEBOARD") {
          const gk = copyLimitGroupKey(entry.card.name, entry.card.pitch);
          const others = prev
            .filter((e) => e.uniqueId !== uniqueId)
            .filter((e) => e.zone === "MAIN" || e.zone === "SIDEBOARD")
            .filter(
              (e) => copyLimitGroupKey(e.card.name, e.card.pitch) === gk,
            )
            .reduce((s, e) => s + e.quantity, 0);
          const room = maxCopies - others;
          const capped = Math.min(q, Math.max(1, room));
          return prev.map((e) =>
            e.uniqueId === uniqueId ? { ...e, quantity: capped } : e,
          );
        }
        return prev.map((e) =>
          e.uniqueId === uniqueId ? { ...e, quantity: q } : e,
        );
      });
    },
    [format],
  );

  const handleRemoveCard = useCallback((uniqueId: string) => {
    setEntries((prev) => prev.filter((e) => e.uniqueId !== uniqueId));
  }, []);

  const handleChangeZone = useCallback((uniqueId: string, zone: CardZone) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.uniqueId !== uniqueId) return e;
        if (zone === "MAIN" || zone === "SIDEBOARD") {
          return { ...e, zone };
        }
        const correct = inferArenaZoneFromCard(e.card);
        const nextZone = correct ?? zone;
        return { ...e, zone: nextZone };
      }),
    );
  }, []);

  const onArenaDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setArenaDropOver(true);
  }, []);

  const onArenaDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as Node | null;
    if (related && el.contains(related)) return;
    setArenaDropOver(false);
  }, []);

  const onArenaDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setArenaDropOver(false);
      const raw =
        e.dataTransfer.getData(DND_MIME) ||
        e.dataTransfer.getData("text/plain");
      const parsed = parseDeckDragPayload(raw);
      if (!parsed) return;
      if (parsed.fromZone !== "MAIN" && parsed.fromZone !== "SIDEBOARD")
        return;
      const entry = entries.find((x) => x.uniqueId === parsed.uniqueId);
      if (!entry) return;
      const target = inferArenaZoneFromCard(entry.card);
      if (!target) return;
      handleChangeZone(entry.uniqueId, target);
    },
    [entries, handleChangeZone],
  );

  const handleRemoveEquipment = useCallback((cardUniqueId: string) => {
    setEntries((prev) => prev.filter((e) => e.uniqueId !== cardUniqueId));
  }, []);

  const handleFabraryImported = useCallback(
    (payload: {
      deckName?: string;
      format?: DeckFormat;
      hero: CardData | null;
      entries: DeckEntry[];
    }) => {
      setSaveError("");
      setPreviewCard(null);

      if (payload.format) setFormat(payload.format);
      setHero(payload.hero);
      setEntries(payload.entries);

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
    },
    [deckName, t],
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

  const computeValidationErrors = useCallback((): ValidationError[] => {
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

    const maxCopies = FORMAT_MAX_COPIES[format];
    const countByGroup = new Map<
      string,
      { name: string; pitch: string | null; count: number }
    >();
    entries.forEach((e) => {
      if (e.zone !== "MAIN" && e.zone !== "SIDEBOARD") return;
      const key = copyLimitGroupKey(e.card.name, e.card.pitch);
      const cur = countByGroup.get(key);
      const nextCount = (cur?.count ?? 0) + e.quantity;
      countByGroup.set(key, {
        name: e.card.name,
        pitch: e.card.pitch,
        count: nextCount,
      });
    });
    countByGroup.forEach(({ name, pitch, count }) => {
      if (count <= maxCopies) return;
      const pr = pitch?.trim() ?? "";
      const pitchLabel =
        pr === "1"
          ? t("validation.pitch1")
          : pr === "2"
            ? t("validation.pitch2")
            : pr === "3"
              ? t("validation.pitch3")
              : pr || null;
      errors.push({
        code: "TOO_MANY_COPIES",
        severity: "error",
        message: pitchLabel
          ? t("validation.tooManyCopiesPitch", {
              name,
              count,
              max: maxCopies,
              pitchLabel,
            })
          : t("validation.tooManyCopies", {
              name,
              count,
              max: maxCopies,
            }),
      });
    });

    for (const e of entries) {
      const arenaType = inferArenaZoneFromCard(e.card);
      if (e.zone === "EQUIPMENT" && arenaType === "WEAPON") {
        errors.push({
          code: "WEAPON_WRONG_ZONE",
          severity: "error",
          message: t("validation.weaponWrongZone", { name: e.card.name }),
          cardName: e.card.name,
        });
      }
      if (e.zone === "WEAPON" && arenaType === "EQUIPMENT") {
        errors.push({
          code: "EQUIPMENT_WRONG_ZONE",
          severity: "error",
          message: t("validation.equipmentWrongZone", { name: e.card.name }),
          cardName: e.card.name,
        });
      }
      if (
        (e.zone === "WEAPON" || e.zone === "EQUIPMENT") &&
        !arenaType
      ) {
        errors.push({
          code: "INVALID_ARENA_ZONE_CARD",
          severity: "error",
          message: t("validation.cardNotArenaGear", { name: e.card.name }),
          cardName: e.card.name,
        });
      }
    }

    const handItems: Array<{ kind: "two_handed" | "one_handed" | "off_hand"; quantity: number }> =
      [];
    for (const e of entries) {
      if (e.quantity <= 0) continue;
      if (e.zone !== "WEAPON" && e.zone !== "EQUIPMENT") continue;
      const kind = classifyHandSlotItem(e.card);
      if (!kind) continue;
      handItems.push({ kind, quantity: e.quantity });
    }
    const { T, H, O } = summarizeHandLoadout(handItems);
    if (!isHandLoadoutValid({ T, H, O })) {
      if (T >= 1 && (H >= 1 || O >= 1)) {
        errors.push({
          code: "INVALID_WEAPON_LOADOUT",
          severity: "error",
          message: t("validation.invalidWeaponLoadout2hWithOther"),
        });
      } else if (T > 1) {
        errors.push({
          code: "INVALID_WEAPON_LOADOUT",
          severity: "error",
          message: t("validation.invalidWeaponLoadoutTooMany2h"),
        });
      } else if (O > 1) {
        errors.push({
          code: "INVALID_WEAPON_LOADOUT",
          severity: "error",
          message: t("validation.invalidWeaponLoadoutTooManyOffhand"),
        });
      } else {
        errors.push({
          code: "INVALID_WEAPON_LOADOUT",
          severity: "error",
          message: t("validation.invalidWeaponLoadoutHands"),
        });
      }
    }

    return errors;
  }, [hero, format, entries, totalMain, t]);

  const validationErrors = useMemo(
    () => computeValidationErrors(),
    [computeValidationErrors, validationStamp],
  );

  const runValidation = useCallback(() => {
    setValidationStamp((s) => s + 1);
  }, []);

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

      {/* Deck workspace (main) + library sidebar — FaBrary-style: busca na lateral, deck no centro */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:order-2">
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
                  onMoveToZone={handleChangeZone}
                  dragHint={t("equipment.dragToDeck")}
                />
              </div>
            </div>
            <div
              role="region"
              aria-label={t("dropArenaStrip")}
              onDragOver={onArenaDragOver}
              onDragLeave={onArenaDragLeave}
              onDrop={onArenaDrop}
              className={`mt-2 rounded-sm border border-dashed px-2 py-1.5 text-center text-[10px] leading-snug transition-colors ${
                arenaDropOver
                  ? "border-gold/50 bg-gold/[0.1] text-gold"
                  : "border-gold/15 text-muted"
              }`}
            >
              {t("dropArenaStrip")}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FabraryImportPanel
                accessToken={accessToken}
                onImported={handleFabraryImported}
              />
              <ValidationPanel errors={validationErrors} />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 px-3 py-2 sm:px-5">
            <p className="font-heading text-[10px] font-semibold tracking-[0.2em] text-gold/90 uppercase">
              {t("deckView.deckWorkspace")}
            </p>
            <div
              className="flex rounded-sm border border-gold/20 p-0.5"
              role="group"
              aria-label={t("deckView.toggleLabel")}
            >
              <button
                type="button"
                onClick={() => setDeckView("gallery")}
                className={`rounded-sm px-3 py-1 font-heading text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                  deckView === "gallery"
                    ? "bg-gold/15 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("deckView.gallery")}
              </button>
              <button
                type="button"
                onClick={() => setDeckView("list")}
                className={`rounded-sm px-3 py-1 font-heading text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                  deckView === "list"
                    ? "bg-gold/15 text-gold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("deckView.list")}
              </button>
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <DeckList
              entries={mainEntries}
              format={format}
              layout={deckView}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveCard}
              onChangeZone={handleChangeZone}
            />
          </main>
        </div>

        <aside className="deck-builder-sidebar deck-builder-sidebar--left order-2 flex max-h-[min(50vh,28rem)] w-full shrink-0 flex-col overflow-y-auto border-t border-gold/20 lg:order-1 lg:max-h-none lg:min-h-0 lg:w-[min(22rem,36vw)] lg:max-w-sm lg:overflow-y-auto lg:border-t-0">
          <div className="shrink-0 px-3 pt-4 pb-2">
            <h3 className="font-heading text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              {t("cardSearch.libraryTitle")}
            </h3>
          </div>
          <div className="flex flex-col px-3 pb-2">
            <CardSearch variant="sidebar" onSelect={handleAddCard} />
            {libraryHint && (
              <p
                role="status"
                className="mt-2 rounded-sm border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-center text-[11px] leading-snug text-amber-100/90"
              >
                {libraryHint}
              </p>
            )}
          </div>

          {previewCard && (
            <div className="shrink-0 border-t border-gold/15 px-3 py-3">
              <CardPreview
                card={previewCard}
                heroCardId={hero?.uniqueId}
                format={format}
                compact
                onDismiss={() => setPreviewCard(null)}
              />
            </div>
          )}

          <div className="shrink-0 border-t border-gold/15 p-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              className="w-full resize-none rounded-sm border border-surface-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/40 focus:outline-none"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
