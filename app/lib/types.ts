export interface CardData {
  uniqueId: string;
  name: string;
  color: string | null;
  pitch: string | null;
  cost: string | null;
  power: string | null;
  defense: string | null;
  health: string | null;
  types: string[];
  cardKeywords: string[];
  functionalText: string | null;
  typeText: string | null;
  imageUrl: string | null;
  ccLegal: boolean;
  blitzLegal: boolean;
  commonerLegal: boolean;
  llLegal: boolean;
  ccBanned: boolean;
  blitzBanned: boolean;
  commonerBanned: boolean;
  llBanned: boolean;
  sageLegal: boolean;
  sageBanned: boolean;
  rarities: string[];
}

export interface DeckCardEntry {
  id: string;
  cardUniqueId: string;
  quantity: number;
  zone: CardZone;
  card?: CardData;
}

export interface DeckData {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  heroCardId: string | null;
  format: DeckFormat;
  visibility: DeckVisibility;
  cards: DeckCardEntry[];
  /** Present on list endpoints: total copies (sum of quantities). */
  cardCount?: number;
  user?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export type DeckFormat = "CC" | "BLITZ" | "COMMONER" | "LL" | "SAGE";
export type DeckVisibility = "PUBLIC" | "PRIVATE";
export type CardZone = "MAIN" | "EQUIPMENT" | "WEAPON" | "SIDEBOARD";

export interface ValidationError {
  code: string;
  severity: "error" | "warning";
  message: string;
  cardName?: string;
}

export interface CardUsageStat {
  heroCardId: string;
  cardUniqueId: string;
  format: string;
  deckCount: number;
  totalHeroDecks: number;
  usagePercentage: number;
}

export const FORMAT_LABELS: Record<DeckFormat, string> = {
  CC: "Classic Constructed",
  BLITZ: "Blitz",
  COMMONER: "Commoner",
  LL: "Living Legend",
  SAGE: "SAGE",
};

export const ZONE_LABELS: Record<CardZone, string> = {
  MAIN: "Main Deck",
  EQUIPMENT: "Equipment",
  WEAPON: "Weapons",
  SIDEBOARD: "Sideboard",
};
