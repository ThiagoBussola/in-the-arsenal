import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import { Post } from "./Post";
import { Tag } from "./Tag";

@Table({ tableName: "post_tags", timestamps: false })
export class PostTag extends Model {
  @ForeignKey(() => Post)
  @Column({ type: DataType.UUID, allowNull: false })
  declare postId: string;

  @ForeignKey(() => Tag)
  @Column({ type: DataType.UUID, allowNull: false })
  declare tagId: string;
}
