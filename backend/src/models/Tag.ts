import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from "sequelize-typescript";
import { Post } from "./Post";
import { PostTag } from "./PostTag";

@Table({ tableName: "tags" })
export class Tag extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(60), allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.STRING(80), allowNull: false, unique: true })
  declare slug: string;

  @BelongsToMany(() => Post, () => PostTag)
  declare posts: Post[];
}
