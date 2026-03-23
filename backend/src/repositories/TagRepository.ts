import { Tag } from "../models";

export class TagRepository {
  async findAll(): Promise<Tag[]> {
    return Tag.findAll({ order: [["name", "ASC"]] });
  }

  async findById(id: string): Promise<Tag | null> {
    return Tag.findByPk(id);
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return Tag.findOne({ where: { slug } });
  }

  async findOrCreateByNames(
    names: string[]
  ): Promise<Tag[]> {
    const tags: Tag[] = [];
    for (const name of names) {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const [tag] = await Tag.findOrCreate({
        where: { slug },
        defaults: { name, slug } as any,
      });
      tags.push(tag);
    }
    return tags;
  }

  async create(data: { name: string; slug: string }): Promise<Tag> {
    return Tag.create(data as any);
  }

  async delete(id: string): Promise<boolean> {
    const count = await Tag.destroy({ where: { id } });
    return count > 0;
  }
}

export const tagRepository = new TagRepository();
