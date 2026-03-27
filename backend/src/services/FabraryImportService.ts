import { CardCache, CardZone, DeckFormat } from "../models";
import {
  cardService,
  normalizeCardSearchName,
} from "./CardService";
import { rebalanceFabraryArenaWeaponZones } from "../rules/arenaWeaponLoadout";

const PITCH_FROM_COLOR: Record<string, string> = {
  red: "1",
  yellow: "2",
  blue: "3",
};

const FORMAT_FROM_LABEL: Record<string, DeckFormat> = {
  "classic constructed": DeckFormat.CC,
  blitz: DeckFormat.BLITZ,
  commoner: DeckFormat.COMMONER,
  "living legend": DeckFormat.LL,
  sage: DeckFormat.SAGE,
  "silver age": DeckFormat.SAGE,
  "project blueprint": DeckFormat.SAGE,
};

export interface FabraryParsedLine {
  quantity: number;
  name: string;
  pitch: string | null;
  raw: string;
}

export interface FabraryImportResult {
  deckName: string | null;
  heroName: string | null;
  format: DeckFormat | null;
  heroCard: Record<string, unknown> | null;
  entries: Array<{
    uniqueId: string;
    quantity: number;
    zone: CardZone;
    card: Record<string, unknown>;
  }>;
  unresolved: Array<{ line: string; reason: string }>;
}

function normalizeFormatLine(line: string): string {
  return line.replace(/^format:\s*/i, "").trim();
}

function parseDeckListLine(line: string): FabraryParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^(\d+)x\s+(.+)$/i);
  if (!m) return null;

  const quantity = parseInt(m[1], 10);
  let rest = m[2].trim();

  let pitch: string | null = null;
  const colorMatch = rest.match(/^(.+?)\s*\((red|yellow|blue)\)\s*$/i);
  if (colorMatch) {
    rest = colorMatch[1].trim();
    const c = colorMatch[2].toLowerCase() as keyof typeof PITCH_FROM_COLOR;
    pitch = PITCH_FROM_COLOR[c] || null;
  }

  return { quantity, name: rest, pitch, raw: trimmed };
}

function inferZone(card: CardCache): CardZone {
  const types = card.types || [];
  if (types.includes("Weapon")) return CardZone.WEAPON;
  if (types.includes("Equipment")) return CardZone.EQUIPMENT;
  return CardZone.MAIN;
}

/** Injectable for tests; production uses GoAgain + card_cache via `cardService`. */
export type FabraryResolveCard = (
  name: string,
  pitch: string | null,
) => Promise<CardCache | null>;

export class FabraryImportService {
  constructor(
    private readonly resolveCardForImport: FabraryResolveCard = (name, pitch) =>
      cardService.resolveForFabraryImport(name, pitch),
  ) {}
  parseClipboardText(text: string): {
    deckName: string | null;
    heroName: string | null;
    format: DeckFormat | null;
    arenaLines: FabraryParsedLine[];
    deckLines: FabraryParsedLine[];
  } {
    const lines = text.split(/\r?\n/);
    let deckName: string | null = null;
    let heroName: string | null = null;
    let format: DeckFormat | null = null;

    const arenaLines: FabraryParsedLine[] = [];
    const deckLines: FabraryParsedLine[] = [];

    let section: "none" | "arena" | "deck" = "none";

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      if (/^feito com/i.test(t) || /^see the full deck/i.test(t) || /^deck completo/i.test(t)) {
        break;
      }
      if (t.startsWith("http")) continue;

      const nameM = t.match(/^name:\s*(.+)$/i);
      if (nameM) {
        deckName = nameM[1].trim();
        continue;
      }

      const heroM = t.match(/^hero:\s*(.+)$/i);
      if (heroM) {
        heroName = heroM[1].trim();
        continue;
      }

      const fmtM = t.match(/^format:\s*(.+)$/i);
      if (fmtM) {
        const key = normalizeFormatLine(t).toLowerCase();
        format = FORMAT_FROM_LABEL[key] || null;
        continue;
      }

      if (/^arena cards/i.test(t)) {
        section = "arena";
        continue;
      }
      // FaBrary / locale variants; "Main deck" appears on some exports.
      if (/^deck cards|^main deck\b|^cartas do deck|^baralho principal/i.test(t)) {
        section = "deck";
        continue;
      }

      const parsed = parseDeckListLine(t);
      if (!parsed) continue;

      if (section === "arena") arenaLines.push(parsed);
      else if (section === "deck") deckLines.push(parsed);
    }

    return { deckName, heroName, format, arenaLines, deckLines };
  }

  async importFromText(text: string): Promise<FabraryImportResult> {
    const parsed = this.parseClipboardText(text);
    const unresolved: FabraryImportResult["unresolved"] = [];
    const entries: FabraryImportResult["entries"] = [];

    const resolveKey = (name: string, pitch: string | null) =>
      `${normalizeCardSearchName(name).toLowerCase()}\0${pitch ?? ""}`;

    const tuples: Array<{ name: string; pitch: string | null }> = [];
    if (parsed.heroName) tuples.push({ name: parsed.heroName, pitch: null });
    for (const pl of parsed.arenaLines) {
      tuples.push({ name: pl.name, pitch: pl.pitch });
    }
    for (const pl of parsed.deckLines) {
      tuples.push({ name: pl.name, pitch: pl.pitch });
    }

    const uniqueByKey = new Map<string, { name: string; pitch: string | null }>();
    for (const t of tuples) {
      const k = resolveKey(t.name, t.pitch);
      if (!uniqueByKey.has(k)) uniqueByKey.set(k, t);
    }

    const resolvedMemo = new Map<string, CardCache | null>();
    await Promise.all(
      [...uniqueByKey.entries()].map(async ([key, { name, pitch }]) => {
        const card = await this.resolveCardForImport(name, pitch);
        resolvedMemo.set(key, card);
      }),
    );

    const getResolved = (name: string, pitch: string | null) =>
      resolvedMemo.get(resolveKey(name, pitch)) ?? null;

    let heroCard: Record<string, unknown> | null = null;

    if (parsed.heroName) {
      const hero = getResolved(parsed.heroName, null);
      if (hero) {
        heroCard = hero.toJSON() as Record<string, unknown>;
      } else {
        unresolved.push({
          line: `Hero: ${parsed.heroName}`,
          reason: "Hero not found in card database (run FabCube sync first)",
        });
      }
    }

    const pushResolvedLine = (
      pl: FabraryParsedLine,
      forceZone: CardZone | null,
      target: FabraryImportResult["entries"],
    ) => {
      const card = getResolved(pl.name, pl.pitch);
      if (!card) {
        unresolved.push({
          line: pl.raw,
          reason: pl.pitch
            ? `No card "${pl.name}" with matching pitch`
            : `No unique match for "${pl.name}"`,
        });
        return;
      }
      const zone = forceZone ?? inferZone(card);
      target.push({
        uniqueId: card.uniqueId,
        quantity: pl.quantity,
        zone,
        card: card.toJSON() as Record<string, unknown>,
      });
    };

    const arenaChunk: FabraryImportResult["entries"] = [];
    for (const pl of parsed.arenaLines) {
      pushResolvedLine(pl, null, arenaChunk);
    }
    rebalanceFabraryArenaWeaponZones(arenaChunk);
    entries.push(...arenaChunk);

    for (const pl of parsed.deckLines) {
      pushResolvedLine(pl, CardZone.MAIN, entries);
    }

    return {
      deckName: parsed.deckName,
      heroName: parsed.heroName,
      format: parsed.format,
      heroCard,
      entries,
      unresolved,
    };
  }
}

export const fabraryImportService = new FabraryImportService();
