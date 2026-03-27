import { DeckFormat, CardZone } from "../models";
import { CardCache } from "../models";
import {
  extractDeckIdentity,
  extractHeroDeckIdentity,
  classifyDeckIdentityViolation,
} from "../rules/fabDeckIdentity";
import {
  classifyHandSlotItem,
  isHandLoadoutValid,
  summarizeHandLoadout,
  type HandSlotKind,
} from "../rules/arenaWeaponLoadout";

export interface ValidationError {
  code: string;
  severity: "error" | "warning";
  message: string;
  cardName?: string;
}

interface DeckEntry {
  card: CardCache;
  quantity: number;
  zone: CardZone;
}

interface FormatRules {
  minDeckSize: number;
  maxPoolSize: number;
  maxCopies: number;
  requireYoungHero: boolean;
  legalField: keyof CardCache;
  bannedField: keyof CardCache;
  rarityRestriction?: "commoner" | "sage";
}

const FORMAT_RULES: Record<DeckFormat, FormatRules> = {
  [DeckFormat.CC]: {
    minDeckSize: 60,
    maxPoolSize: 80,
    maxCopies: 3,
    requireYoungHero: false,
    legalField: "ccLegal" as keyof CardCache,
    bannedField: "ccBanned" as keyof CardCache,
  },
  [DeckFormat.BLITZ]: {
    minDeckSize: 40,
    maxPoolSize: 40,
    maxCopies: 3,
    requireYoungHero: true,
    legalField: "blitzLegal" as keyof CardCache,
    bannedField: "blitzBanned" as keyof CardCache,
  },
  [DeckFormat.COMMONER]: {
    minDeckSize: 40,
    maxPoolSize: 40,
    maxCopies: 3,
    requireYoungHero: true,
    legalField: "commonerLegal" as keyof CardCache,
    bannedField: "commonerBanned" as keyof CardCache,
    rarityRestriction: "commoner",
  },
  [DeckFormat.LL]: {
    minDeckSize: 60,
    maxPoolSize: 80,
    maxCopies: 3,
    requireYoungHero: false,
    legalField: "llLegal" as keyof CardCache,
    bannedField: "llBanned" as keyof CardCache,
  },
  [DeckFormat.SAGE]: {
    minDeckSize: 40,
    maxPoolSize: 55,
    maxCopies: 2,
    requireYoungHero: true,
    legalField: "sageLegal" as keyof CardCache,
    bannedField: "sageBanned" as keyof CardCache,
    rarityRestriction: "sage",
  },
};

const EQUIPMENT_SLOTS = ["Head", "Chest", "Arms", "Legs"] as const;

const ALLOWED_COMMONER_RARITIES = ["Common", "Rare", "C", "R"];
const ALLOWED_SAGE_RARITIES = ["Common", "Rare", "Basic", "C", "R"];
const LEGENDARY_RARITIES = ["Legendary", "L", "Fabled", "F"];

export class DeckValidationService {
  validate(
    format: DeckFormat,
    hero: CardCache | null,
    entries: DeckEntry[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const rules = FORMAT_RULES[format];

    this.validateHero(hero, rules, errors);
    this.validateCardCount(entries, rules, errors);
    this.validateCopyLimits(entries, rules, errors);
    this.validateFormatLegality(entries, rules, errors);
    this.validateClassRestrictions(hero, entries, errors);
    this.validateEquipmentSlots(entries, errors);
    this.validateArenaGearZones(entries, errors);
    this.validateWeaponLoadout(entries, errors);

    if (rules.rarityRestriction) {
      this.validateRarityRestrictions(entries, rules.rarityRestriction, errors);
    }

    return errors;
  }

  private validateHero(
    hero: CardCache | null,
    rules: FormatRules,
    errors: ValidationError[]
  ) {
    if (!hero) {
      errors.push({
        code: "NO_HERO",
        severity: "error",
        message: "A hero must be selected",
      });
      return;
    }

    const isHero = hero.types.includes("Hero");
    if (!isHero) {
      errors.push({
        code: "INVALID_HERO",
        severity: "error",
        message: `${hero.name} is not a Hero card`,
        cardName: hero.name,
      });
      return;
    }

    const isYoung = hero.types.includes("Young");
    if (rules.requireYoungHero && !isYoung) {
      errors.push({
        code: "HERO_NOT_YOUNG",
        severity: "error",
        message: `This format requires a Young hero. ${hero.name} is not Young.`,
        cardName: hero.name,
      });
    }

    if (!rules.requireYoungHero && isYoung) {
      errors.push({
        code: "HERO_IS_YOUNG",
        severity: "error",
        message: `This format requires an adult hero. ${hero.name} is a Young hero.`,
        cardName: hero.name,
      });
    }
  }

  private validateCardCount(
    entries: DeckEntry[],
    rules: FormatRules,
    errors: ValidationError[]
  ) {
    const mainCards = entries
      .filter((e) => e.zone === CardZone.MAIN || e.zone === CardZone.SIDEBOARD)
      .reduce((sum, e) => sum + e.quantity, 0);

    const equipWeapons = entries
      .filter((e) => e.zone === CardZone.EQUIPMENT || e.zone === CardZone.WEAPON)
      .reduce((sum, e) => sum + e.quantity, 0);

    const totalPool = mainCards + equipWeapons;

    if (totalPool > rules.maxPoolSize) {
      errors.push({
        code: "POOL_TOO_LARGE",
        severity: "error",
        message: `Card pool has ${totalPool} cards, maximum is ${rules.maxPoolSize}`,
      });
    }

    const mainDeckCards = entries
      .filter((e) => e.zone === CardZone.MAIN)
      .reduce((sum, e) => sum + e.quantity, 0);

    if (mainDeckCards < rules.minDeckSize) {
      errors.push({
        code: "DECK_TOO_SMALL",
        severity: "warning",
        message: `Main deck has ${mainDeckCards} cards, minimum is ${rules.minDeckSize}`,
      });
    }
  }

  private copyLimitGroupKey(card: CardCache): string {
    const p = (card.pitch ?? "").trim();
    return `${card.name}\u0001${p}`;
  }

  private validateCopyLimits(
    entries: DeckEntry[],
    rules: FormatRules,
    errors: ValidationError[]
  ) {
    const countByGroup = new Map<
      string,
      { name: string; pitch: string | null; count: number }
    >();

    for (const entry of entries) {
      if (
        entry.zone !== CardZone.MAIN &&
        entry.zone !== CardZone.SIDEBOARD
      ) {
        continue;
      }
      const key = this.copyLimitGroupKey(entry.card);
      const prev = countByGroup.get(key);
      const nextCount = (prev?.count ?? 0) + entry.quantity;
      countByGroup.set(key, {
        name: entry.card.name,
        pitch: entry.card.pitch,
        count: nextCount,
      });
    }

    for (const { name, pitch, count } of countByGroup.values()) {
      if (count > rules.maxCopies) {
        const pitchPart = pitch?.trim()
          ? ` (pitch ${pitch})`
          : "";
        errors.push({
          code: "TOO_MANY_COPIES",
          severity: "error",
          message: `${name}${pitchPart} has ${count} copies in main/sideboard, maximum is ${rules.maxCopies} per pitch`,
          cardName: name,
        });
      }
    }
  }

  private validateFormatLegality(
    entries: DeckEntry[],
    rules: FormatRules,
    errors: ValidationError[]
  ) {
    for (const entry of entries) {
      const card = entry.card;
      const isLegal = (card as any)[rules.legalField];
      const isBanned = (card as any)[rules.bannedField];

      if (!isLegal) {
        errors.push({
          code: "NOT_LEGAL",
          severity: "error",
          message: `${card.name} is not legal in this format`,
          cardName: card.name,
        });
      }

      if (isBanned) {
        errors.push({
          code: "BANNED",
          severity: "error",
          message: `${card.name} is banned in this format`,
          cardName: card.name,
        });
      }
    }
  }

  private validateClassRestrictions(
    hero: CardCache | null,
    entries: DeckEntry[],
    errors: ValidationError[]
  ) {
    if (!hero) return;

    const heroIdentity = extractHeroDeckIdentity(hero);

    for (const entry of entries) {
      const cardTypes = entry.card.types;
      if (cardTypes.includes("Generic")) continue;

      const cardIdentity = extractDeckIdentity(entry.card);
      if (cardIdentity.classes.length === 0 && cardIdentity.talents.length === 0) {
        continue;
      }

      const violation = classifyDeckIdentityViolation(heroIdentity, cardIdentity);
      if (!violation) continue;

      if (violation.kind === "class") {
        errors.push({
          code: "CLASS_MISMATCH",
          severity: "error",
          message: `${entry.card.name} requires class "${violation.missing}" which this hero does not have`,
          cardName: entry.card.name,
        });
      } else {
        errors.push({
          code: "TALENT_MISMATCH",
          severity: "error",
          message: `${entry.card.name} requires talent "${violation.missing}" which this hero does not have`,
          cardName: entry.card.name,
        });
      }
    }
  }

  /** Aligns with frontend `inferArenaZoneFromCard` — weapons vs armor slots. */
  private inferArenaZoneFromCard(card: CardCache): CardZone | null {
    const types = Array.isArray(card.types) ? card.types : [];
    const isHero = types.includes("Hero");
    const tt = (card.typeText ?? "").toLowerCase();
    const isWeapon =
      types.includes("Weapon") || (!isHero && /\bweapon\b/i.test(tt));
    const isEquipment =
      types.includes("Equipment") ||
      (!isHero && !isWeapon && /\bequipment\b/i.test(tt));
    if (isWeapon) return CardZone.WEAPON;
    if (isEquipment) return CardZone.EQUIPMENT;
    return null;
  }

  private validateArenaGearZones(
    entries: DeckEntry[],
    errors: ValidationError[]
  ) {
    for (const e of entries) {
      const arenaType = this.inferArenaZoneFromCard(e.card);
      if (e.zone === CardZone.EQUIPMENT && arenaType === CardZone.WEAPON) {
        errors.push({
          code: "WEAPON_WRONG_ZONE",
          severity: "error",
          message: `${e.card.name} is a weapon and must be in the weapon zone, not equipment slots.`,
          cardName: e.card.name,
        });
      }
      if (e.zone === CardZone.WEAPON && arenaType === CardZone.EQUIPMENT) {
        errors.push({
          code: "EQUIPMENT_WRONG_ZONE",
          severity: "error",
          message: `${e.card.name} belongs in equipment slots, not the weapon zone.`,
          cardName: e.card.name,
        });
      }
      if (
        (e.zone === CardZone.WEAPON || e.zone === CardZone.EQUIPMENT) &&
        !arenaType
      ) {
        errors.push({
          code: "INVALID_ARENA_ZONE_CARD",
          severity: "error",
          message: `${e.card.name} is not hero equipment or a weapon.`,
          cardName: e.card.name,
        });
      }
    }
  }

  private validateEquipmentSlots(
    entries: DeckEntry[],
    errors: ValidationError[]
  ) {
    const equipment = entries.filter((e) => e.zone === CardZone.EQUIPMENT);

    const slotCounts = new Map<string, string[]>();
    for (const eq of equipment) {
      const types = eq.card.types;
      for (const slot of EQUIPMENT_SLOTS) {
        if (types.some((t) => t.toLowerCase().includes(slot.toLowerCase()))) {
          const list = slotCounts.get(slot) || [];
          list.push(eq.card.name);
          slotCounts.set(slot, list);
        }
      }
    }

    for (const [slot, cards] of slotCounts) {
      if (cards.length > 1) {
        errors.push({
          code: "DUPLICATE_EQUIPMENT_SLOT",
          severity: "error",
          message: `Multiple ${slot} equipment: ${cards.join(", ")}. Only 1 per slot allowed.`,
        });
      }
    }
  }

  /** Arena: at most one 2H alone, or up to two 1H, or one 1H + one off-hand — no mixing 2H with other hand items. */
  private validateWeaponLoadout(
    entries: DeckEntry[],
    errors: ValidationError[]
  ) {
    const handItems: Array<{ kind: HandSlotKind; quantity: number }> = [];
    for (const e of entries) {
      if (e.quantity <= 0) continue;
      if (e.zone !== CardZone.WEAPON && e.zone !== CardZone.EQUIPMENT) continue;
      const kind = classifyHandSlotItem(e.card);
      if (!kind) continue;
      handItems.push({ kind, quantity: e.quantity });
    }

    const { T, H, O } = summarizeHandLoadout(handItems);
    if (isHandLoadoutValid({ T, H, O })) return;

    if (T >= 1 && (H >= 1 || O >= 1)) {
      errors.push({
        code: "INVALID_WEAPON_LOADOUT",
        severity: "error",
        message:
          "A two-handed weapon cannot be equipped with another weapon or an off-hand item. Move one to the sideboard.",
      });
      return;
    }
    if (T > 1) {
      errors.push({
        code: "INVALID_WEAPON_LOADOUT",
        severity: "error",
        message: `At most one two-handed weapon in the arena; the loadout uses ${T} two-handed slots.`,
      });
      return;
    }
    if (O > 1) {
      errors.push({
        code: "INVALID_WEAPON_LOADOUT",
        severity: "error",
        message: `At most one off-hand item in the arena; found ${O}.`,
      });
      return;
    }
    errors.push({
      code: "INVALID_WEAPON_LOADOUT",
      severity: "error",
      message: `Too many one-handed weapons and off-hand items (${H + O} hand slots); max 2 combined (e.g. two 1H, or 1H + shield).`,
    });
  }

  private validateRarityRestrictions(
    entries: DeckEntry[],
    restriction: "commoner" | "sage",
    errors: ValidationError[]
  ) {
    if (restriction === "commoner") {
      for (const entry of entries) {
        const r = entry.card.rarities;
        if (r.length === 0) continue;
        const hasAllowed = r.some((v) =>
          ALLOWED_COMMONER_RARITIES.some((a) => v.toLowerCase() === a.toLowerCase())
        );
        if (!hasAllowed) {
          errors.push({
            code: "RARITY_NOT_ALLOWED",
            severity: "error",
            message: `${entry.card.name} is not Common or Rare (required for Commoner)`,
            cardName: entry.card.name,
          });
        }
      }
    }

    if (restriction === "sage") {
      let legendaryCount = 0;

      for (const entry of entries) {
        const r = entry.card.rarities;
        if (r.length === 0) continue;

        const isLegendary = r.some((v) =>
          LEGENDARY_RARITIES.some((l) => v.toLowerCase() === l.toLowerCase())
        );

        if (isLegendary) {
          legendaryCount++;
          if (entry.quantity > 1) {
            errors.push({
              code: "LEGENDARY_COPY_LIMIT",
              severity: "error",
              message: `${entry.card.name} is Legendary and can only have 1 copy in SAGE`,
              cardName: entry.card.name,
            });
          }
          continue;
        }

        const hasAllowed = r.some((v) =>
          ALLOWED_SAGE_RARITIES.some((a) => v.toLowerCase() === a.toLowerCase())
        );
        if (!hasAllowed) {
          errors.push({
            code: "RARITY_NOT_ALLOWED",
            severity: "error",
            message: `${entry.card.name} is not Common, Rare, or Basic (required for SAGE)`,
            cardName: entry.card.name,
          });
        }
      }

      if (legendaryCount > 1) {
        errors.push({
          code: "TOO_MANY_LEGENDARIES",
          severity: "error",
          message: `SAGE allows at most 1 Legendary card, found ${legendaryCount}`,
        });
      }
    }
  }
}

export const deckValidationService = new DeckValidationService();
