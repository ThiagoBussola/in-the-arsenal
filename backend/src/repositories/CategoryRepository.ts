import { Category } from "../models";

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    return Category.findAll({ order: [["name", "ASC"]] });
  }

  async findById(id: string): Promise<Category | null> {
    return Category.findByPk(id);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return Category.findOne({ where: { slug } });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Category> {
    return Category.create(data as any);
  }

  async update(
    id: string,
    data: Partial<Category>
  ): Promise<Category | null> {
    const category = await Category.findByPk(id);
    if (!category) return null;
    return category.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const count = await Category.destroy({ where: { id } });
    return count > 0;
  }
}

export const categoryRepository = new CategoryRepository();
