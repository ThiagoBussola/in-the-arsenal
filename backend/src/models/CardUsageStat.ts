import { Table, Column, Model, DataType } from "sequelize-typescript";
import { DeckFormat } from "./Deck";

@Table({ tableName: "card_usage_stats", timestamps: false })
export class CardUsageStat extends Model {
  @Column({ type: DataType.STRING(50), primaryKey: true })
  declare heroCardId: string;

  @Column({ type: DataType.STRING(50), primaryKey: true })
  declare cardUniqueId: string;

  @Column({
    type: DataType.ENUM(...Object.values(DeckFormat)),
    primaryKey: true,
  })
  declare format: DeckFormat;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare deckCount: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare totalHeroDecks: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 0 })
  declare usagePercentage: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare updatedAt: Date;
}
