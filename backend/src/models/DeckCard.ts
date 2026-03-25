import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Deck } from "./Deck";

export enum CardZone {
  MAIN = "MAIN",
  EQUIPMENT = "EQUIPMENT",
  WEAPON = "WEAPON",
  SIDEBOARD = "SIDEBOARD",
}

@Table({ tableName: "deck_cards" })
export class DeckCard extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Deck)
  @Column({ type: DataType.UUID, allowNull: false })
  declare deckId: string;

  @BelongsTo(() => Deck)
  declare deck: Deck;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare cardUniqueId: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({
    type: DataType.ENUM(...Object.values(CardZone)),
    allowNull: false,
    defaultValue: CardZone.MAIN,
  })
  declare zone: CardZone;
}
