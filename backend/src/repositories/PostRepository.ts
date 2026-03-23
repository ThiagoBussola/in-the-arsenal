import { Op, WhereOptions } from "sequelize";
import { Post, PostStatus, User, Category, Tag } from "../models";

export interface PostFilters {
  status?: PostStatus;
  authorId?: string;
  categoryId?: string;
  tagIds?: string[];
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class PostRepository {
  async findById(id: string): Promise<Post | null> {
    return Post.findByPk(id, {
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Category },
        { model: Tag, through: { attributes: [] } },
      ],
    });
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return Post.findOne({
      where: { slug },
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Category },
        { model: Tag, through: { attributes: [] } },
      ],
    });
  }

  async findAll(filters: PostFilters = {}): Promise<{
    rows: Post[];
    count: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions = {};

    if (filters.status) where.status = filters.status;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    if (filters.search) {
      (where as any)[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { excerpt: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.fromDate || filters.toDate) {
      const dateFilter: any = {};
      if (filters.fromDate) dateFilter[Op.gte] = filters.fromDate;
      if (filters.toDate) dateFilter[Op.lte] = filters.toDate;
      where.publishedAt = dateFilter;
    }

    const includeTag = filters.tagIds?.length
      ? { model: Tag, through: { attributes: [] }, where: { id: { [Op.in]: filters.tagIds } } }
      : { model: Tag, through: { attributes: [] } };

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Category },
        includeTag,
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return { rows, count, page, totalPages: Math.ceil(count / limit) };
  }

  async create(data: Partial<Post>): Promise<Post> {
    return Post.create(data as any);
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    const post = await Post.findByPk(id);
    if (!post) return null;
    return post.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const count = await Post.destroy({ where: { id } });
    return count > 0;
  }

  async setTags(postId: string, tagIds: string[]): Promise<void> {
    const post = await Post.findByPk(postId);
    if (post) await (post as any).$set("tags", tagIds);
  }
}

export const postRepository = new PostRepository();
