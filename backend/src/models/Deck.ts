import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { User } from "./User";
import { DeckCard } from "./DeckCard";

export enum DeckFormat {
  CC = "CC",
  BLITZ = "BLITZ",
  COMMONER = "COMMONER",
  LL = "LL",
  SAGE = "SAGE",
}

export enum DeckVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

@Table({ tableName: "decks" })
export class Deck extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(220), allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare heroCardId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(DeckFormat)),
    allowNull: false,
    defaultValue: DeckFormat.CC,
  })
  declare format: DeckFormat;

  @Column({
    type: DataType.ENUM(...Object.values(DeckVisibility)),
    allowNull: false,
    defaultValue: DeckVisibility.PRIVATE,
  })
  declare visibility: DeckVisibility;

  @HasMany(() => DeckCard)
  declare cards: DeckCard[];
}
