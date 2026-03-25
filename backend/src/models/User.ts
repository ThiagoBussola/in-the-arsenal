import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BeforeCreate,
  BeforeUpdate,
} from "sequelize-typescript";
import bcrypt from "bcrypt";
import { Post } from "./Post";
import { RefreshToken } from "./RefreshToken";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

@Table({ tableName: "users" })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare passwordHash: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, unique: true })
  declare googleId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.USER,
  })
  declare role: UserRole;

  @Column({ type: DataType.DATE, allowNull: true })
  declare emailConfirmedAt: Date | null;

  @HasMany(() => Post)
  declare posts: Post[];

  @HasMany(() => RefreshToken)
  declare refreshTokens: RefreshToken[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed("passwordHash") && instance.passwordHash) {
      instance.passwordHash = await bcrypt.hash(instance.passwordHash, 12);
    }
  }

  async verifyPassword(plain: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plain, this.passwordHash);
  }

  toSafeJSON() {
    const { passwordHash, ...safe } = this.toJSON();
    return safe;
  }
}
