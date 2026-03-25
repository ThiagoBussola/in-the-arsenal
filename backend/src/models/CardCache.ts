import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "card_cache", updatedAt: false })
export class CardCache extends Model {
  @Column({ type: DataType.STRING(50), primaryKey: true })
  declare uniqueId: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  declare color: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  declare pitch: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  declare cost: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  declare power: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  declare defense: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  declare health: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare types: string[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare cardKeywords: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  declare functionalText: string | null;

  @Column({ type: DataType.STRING(200), allowNull: true })
  declare typeText: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare imageUrl: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare ccLegal: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare blitzLegal: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare commonerLegal: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare llLegal: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare ccBanned: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare blitzBanned: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare commonerBanned: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare llBanned: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare sageLegal: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare sageBanned: boolean;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare rarities: string[];

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare cachedAt: Date;
}
