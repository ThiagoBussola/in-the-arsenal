import { User } from "../models";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string | null;
    googleId?: string | null;
    role?: string;
    emailConfirmedAt?: Date | null;
  }): Promise<User> {
    return User.create(data as any);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const count = await User.destroy({ where: { id } });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
