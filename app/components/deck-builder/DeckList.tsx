"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { CardData, CardZone } from "../../lib/types";
import {
  DND_MIME,
  parseDeckDragPayload,
  setDeckDragData,
  inferArenaZoneFromCard,
} from "../../lib/deck-dnd";
import { DeckCardStack } from "../decks/DeckCardStack";

export interface DeckEntry {
  uniqueId: string;
  card: CardData;
  quantity: number;
  zone: CardZone;
}

interface DeckListProps {
  entries: DeckEntry[];
  format: string;
  onUpdateQuantity: (uniqueId: string, quantity: number) => void;
  onRemove: (uniqueId: string) => void;
  onChangeZone: (uniqueId: string, zone: CardZone) => void;
  /** Dense card stacks (default). List = compact rows for reordering detail. */
  layout?: "gallery" | "list";
}

export function DeckList({
  entries,
  format,
  onUpdateQuantity,
  onRemove,
  onChangeZone,
  layout = "gallery",
}: DeckListProps) {
  const t = useTranslations("deckBuilder.deckList");

  const mainCards = entries.filter((e) => e.zone === "MAIN");
  const sideboardCards = entries.filter((e) => e.zone === "SIDEBOARD");

  const mainCount = mainCards.reduce((s, e) => s + e.quantity, 0);
  const sideCount = sideboardCards.reduce((s, e) => s + e.quantity, 0);

  const minDeck = format === "CC" || format === "LL" ? 60 : 40;
  const maxPool = format === "CC" || format === "LL" ? 80 : 40;

  const [dragOverZone, setDragOverZone] = useState<CardZone | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const clearDragUi = useCallback(() => {
    setDragOverZone(null);
    setDraggingId(null);
  }, []);

  return (
    <div className="space-y-4">
      <ZoneSection
        title={`${t("mainDeck")} (${mainCount}/${minDeck}-${maxPool})`}
        dropZone="MAIN"
        entries={mainCards}
        layout={layout}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
        onChangeZone={onChangeZone}
        mainCount={mainCount}
        minDeck={minDeck}
        emptyLabel={t("emptyMain")}
        dragOverZone={dragOverZone}
        draggingId={draggingId}
        setDragOverZone={setDragOverZone}
        setDraggingId={setDraggingId}
        clearDragUi={clearDragUi}
        dragHint={t("dragCard")}
        regionLabel={t("mainDeck")}
      />

      <ZoneSection
        title={`${t("sideboard")} (${sideCount})`}
        dropZone="SIDEBOARD"
        entries={sideboardCards}
        layout={layout}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
        onChangeZone={onChangeZone}
        emptyLabel={t("emptySide")}
        dragOverZone={dragOverZone}
        draggingId={draggingId}
        setDragOverZone={setDragOverZone}
        setDraggingId={setDraggingId}
        clearDragUi={clearDragUi}
        dragHint={t("dragCard")}
        regionLabel={t("sideboard")}
      />
    </div>
  );
}

function zoneMoveButtonClass() {
  return "pointer-events-auto rounded-sm border border-gold/25 bg-black/85 px-1.5 py-0.5 font-heading text-[9px] font-semibold tracking-wide text-gold uppercase transition-colors hover:border-gold/50 hover:bg-gold/10";
}

function ZoneMoveButtons({
  entry,
  onChangeZone,
  variant = "gallery",
}: {
  entry: DeckEntry;
  onChangeZone: (uniqueId: string, zone: CardZone) => void;
  variant?: "gallery" | "inline";
}) {
  const t = useTranslations("deckBuilder.deckList");
  const arenaZ = inferArenaZoneFromCard(entry.card);

  const wrap =
    variant === "inline"
      ? "flex flex-row flex-wrap items-center justify-end gap-0.5 py-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      : "flex flex-wrap justify-center gap-0.5 py-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100";

  const stopParentDrag = (ev: React.SyntheticEvent) => {
    ev.stopPropagation();
  };

  return (
    <div className={wrap} onMouseDown={stopParentDrag} onPointerDown={stopParentDrag}>
      {entry.zone !== "MAIN" && (
        <button
          type="button"
          draggable={false}
          className={zoneMoveButtonClass()}
          onClick={(ev) => {
            stopParentDrag(ev);
            onChangeZone(entry.uniqueId, "MAIN");
          }}
        >
          {t("toMain")}
        </button>
      )}
      {entry.zone !== "SIDEBOARD" && (
        <button
          type="button"
          draggable={false}
          className={zoneMoveButtonClass()}
          onClick={(ev) => {
            stopParentDrag(ev);
            onChangeZone(entry.uniqueId, "SIDEBOARD");
          }}
        >
          {t("toSide")}
        </button>
      )}
      {arenaZ && (entry.zone === "MAIN" || entry.zone === "SIDEBOARD") && (
        <button
          type="button"
          draggable={false}
          className={zoneMoveButtonClass()}
          onClick={(ev) => {
            stopParentDrag(ev);
            onChangeZone(entry.uniqueId, arenaZ);
          }}
        >
          {t("toArena")}
        </button>
      )}
    </div>
  );
}

function ZoneSection({
  title,
  dropZone,
  entries,
  layout,
  onUpdateQuantity,
  onRemove,
  onChangeZone,
  mainCount,
  minDeck,
  emptyLabel,
  dragOverZone,
  draggingId,
  setDragOverZone,
  setDraggingId,
  clearDragUi,
  dragHint,
  regionLabel,
}: {
  title: string;
  dropZone: "MAIN" | "SIDEBOARD";
  entries: DeckEntry[];
  layout: "gallery" | "list";
  onUpdateQuantity: (uniqueId: string, quantity: number) => void;
  onRemove: (uniqueId: string) => void;
  onChangeZone: (uniqueId: string, zone: CardZone) => void;
  mainCount?: number;
  minDeck?: number;
  emptyLabel: string;
  dragOverZone: CardZone | null;
  draggingId: string | null;
  setDragOverZone: (z: CardZone | null) => void;
  setDraggingId: (id: string | null) => void;
  clearDragUi: () => void;
  dragHint: string;
  regionLabel: string;
}) {
  const countMet =
    mainCount === undefined || minDeck === undefined || mainCount >= minDeck;

  const isOver = dragOverZone === dropZone;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverZone(dropZone);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData(DND_MIME) ||
      e.dataTransfer.getData("text/plain");
    const parsed = parseDeckDragPayload(raw);
    clearDragUi();
    if (!parsed) return;
    if (parsed.fromZone === dropZone) return;
    onChangeZone(parsed.uniqueId, dropZone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as Node | null;
    if (related && el.contains(related)) return;
    setDragOverZone(null);
  };

  return (
    <div>
      <h4
        className={`mb-2 font-heading text-xs font-semibold tracking-[0.15em] uppercase ${
          countMet ? "text-gold" : "text-crimson-bright"
        }`}
      >
        {title}
      </h4>

      <div
        role="region"
        aria-label={regionLabel}
        className={`rounded-sm border border-dashed px-1 py-1 transition-colors ${
          layout === "gallery" ? "min-h-[6rem]" : "min-h-[4.5rem]"
        } ${
          isOver
            ? "border-gold/55 bg-gold/[0.08]"
            : "border-gold/10 bg-black/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {entries.length === 0 ? (
          <p className="flex min-h-[4rem] items-center justify-center px-2 py-3 text-center text-xs leading-relaxed text-muted/70">
            {emptyLabel}
          </p>
        ) : layout === "gallery" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries
              .sort((a, b) => a.card.name.localeCompare(b.card.name))
              .map((entry) => (
                <div
                  key={entry.uniqueId}
                  draggable
                  title={dragHint}
                  aria-grabbed={draggingId === entry.uniqueId}
                  onDragStart={(e) => {
                    setDraggingId(entry.uniqueId);
                    setDeckDragData(e, entry.uniqueId, entry.zone);
                  }}
                  onDragEnd={clearDragUi}
                  className={`group relative cursor-grab rounded-sm border border-transparent p-1 transition-colors active:cursor-grabbing hover:border-gold/15 hover:bg-gold/[0.05] ${
                    draggingId === entry.uniqueId ? "opacity-45" : ""
                  }`}
                >
                  <div className="absolute top-0 right-0 z-20 flex gap-0.5">
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={() => onRemove(entry.uniqueId)}
                      className="flex h-6 w-6 items-center justify-center rounded-bl-sm border border-gold/20 bg-background/95 text-[11px] text-muted opacity-0 transition-opacity hover:text-crimson-bright group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    className="absolute top-1 left-1 z-20 flex items-center gap-0.5 rounded-sm border border-surface-border bg-background/95 px-0.5 py-0.5 shadow-sm"
                    onMouseDown={(ev) => ev.stopPropagation()}
                  >
                    <button
                      type="button"
                      draggable={false}
                      onClick={() =>
                        onUpdateQuantity(
                          entry.uniqueId,
                          Math.max(1, entry.quantity - 1),
                        )
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-sm text-[10px] text-muted hover:bg-gold/10 hover:text-foreground"
                    >
                      −
                    </button>
                    <span className="min-w-[1rem] text-center text-[10px] font-semibold text-foreground">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      draggable={false}
                      onClick={() =>
                        onUpdateQuantity(
                          entry.uniqueId,
                          Math.min(3, entry.quantity + 1),
                        )
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-sm text-[10px] text-muted hover:bg-gold/10 hover:text-foreground"
                    >
                      +
                    </button>
                  </div>
                  <DeckCardStack
                    card={entry.card}
                    quantity={entry.quantity}
                    size="md"
                    className="pt-6"
                  />
                  <ZoneMoveButtons
                    entry={entry}
                    onChangeZone={onChangeZone}
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries
              .sort((a, b) => a.card.name.localeCompare(b.card.name))
              .map((entry) => (
                <div
                  key={entry.uniqueId}
                  draggable
                  title={dragHint}
                  aria-grabbed={draggingId === entry.uniqueId}
                  onDragStart={(e) => {
                    setDraggingId(entry.uniqueId);
                    setDeckDragData(e, entry.uniqueId, entry.zone);
                  }}
                  onDragEnd={clearDragUi}
                  className={`group flex cursor-grab items-center gap-2 rounded-sm border border-transparent px-2 py-1 transition-colors active:cursor-grabbing hover:border-gold/10 hover:bg-gold/[0.06] ${
                    draggingId === entry.uniqueId ? "opacity-45" : ""
                  }`}
                >
                  <span
                    className="select-none text-muted/50 hover:text-gold/70"
                    aria-hidden
                  >
                    ⋮⋮
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={() =>
                        onUpdateQuantity(
                          entry.uniqueId,
                          Math.max(1, entry.quantity - 1),
                        )
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-sm border border-surface-border text-[10px] text-muted transition-colors hover:border-gold/30 hover:text-foreground"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-medium text-foreground">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={() =>
                        onUpdateQuantity(
                          entry.uniqueId,
                          Math.min(3, entry.quantity + 1),
                        )
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-sm border border-surface-border text-[10px] text-muted transition-colors hover:border-gold/30 hover:text-foreground"
                    >
                      +
                    </button>
                  </div>

                  {entry.card.imageUrl && (
                    <img
                      src={entry.card.imageUrl}
                      alt=""
                      className="pointer-events-none h-7 w-5 rounded-[1px] object-cover"
                    />
                  )}

                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {entry.card.name}
                  </span>

                  {entry.card.pitch && <PitchDots pitch={entry.card.pitch} />}

                  <div className="max-w-[11rem] shrink-0">
                    <ZoneMoveButtons
                      entry={entry}
                      onChangeZone={onChangeZone}
                      variant="inline"
                    />
                  </div>

                  <button
                    type="button"
                    draggable={false}
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onClick={() => onRemove(entry.uniqueId)}
                    className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-crimson-bright"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PitchDots({ pitch }: { pitch: string }) {
  const n = parseInt(pitch) || 0;
  const color =
    n === 1
      ? "bg-red-500"
      : n === 2
        ? "bg-yellow-400"
        : n === 3
          ? "bg-blue-500"
          : "bg-muted";

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className={`inline-block h-2 w-2 rounded-full ${color}`} />
      ))}
    </div>
  );
}
