import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from "sequelize-typescript";
import { User } from "./User";
import { Category } from "./Category";
import { Tag } from "./Tag";
import { PostTag } from "./PostTag";

export enum PostStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

@Table({ tableName: "posts" })
export class Post extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING(280), allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare excerpt: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare coverImage: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(PostStatus)),
    allowNull: false,
    defaultValue: PostStatus.DRAFT,
  })
  declare status: PostStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare publishedAt: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare authorId: string;

  @BelongsTo(() => User)
  declare author: User;

  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: true })
  declare categoryId: string | null;

  @BelongsTo(() => Category)
  declare category: Category;

  @BelongsToMany(() => Tag, () => PostTag)
  declare tags: Tag[];
}
