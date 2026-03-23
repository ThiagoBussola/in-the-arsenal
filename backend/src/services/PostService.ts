import { postRepository, PostFilters } from "../repositories/PostRepository";
import { tagRepository } from "../repositories/TagRepository";
import { PostStatus } from "../models";
import { AppError } from "../middlewares/errorHandler";
import type {
  CreatePostInput,
  UpdatePostInput,
  PostQueryInput,
} from "../schemas/post.schema";

export class PostService {
  async create(authorId: string, input: CreatePostInput) {
    const existing = await postRepository.findBySlug(input.slug);
    if (existing) {
      throw new AppError(409, "A post with this slug already exists");
    }

    const post = await postRepository.create({
      ...input,
      authorId,
      publishedAt:
        input.status === PostStatus.PUBLISHED ? new Date() : undefined,
    } as any);

    if (input.tagNames?.length) {
      const tags = await tagRepository.findOrCreateByNames(input.tagNames);
      await postRepository.setTags(post.id, tags.map((t) => t.id));
    }

    return postRepository.findById(post.id);
  }

  async findById(id: string) {
    const post = await postRepository.findById(id);
    if (!post) throw new AppError(404, "Post not found");
    return post;
  }

  async findBySlug(slug: string) {
    const post = await postRepository.findBySlug(slug);
    if (!post) throw new AppError(404, "Post not found");
    return post;
  }

  async list(query: PostQueryInput) {
    const filters: PostFilters = {
      status: query.status as PostStatus | undefined,
      authorId: query.authorId,
      categoryId: query.categoryId,
      tagIds: query.tagIds,
      search: query.search,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page,
      limit: query.limit,
    };
    return postRepository.findAll(filters);
  }

  async update(id: string, authorId: string, role: string, input: UpdatePostInput) {
    const post = await postRepository.findById(id);
    if (!post) throw new AppError(404, "Post not found");
    if (post.authorId !== authorId && role !== "ADMIN") {
      throw new AppError(403, "You can only edit your own posts");
    }

    const updateData: any = { ...input };
    if (
      input.status === PostStatus.PUBLISHED &&
      post.status !== PostStatus.PUBLISHED
    ) {
      updateData.publishedAt = new Date();
    }

    await postRepository.update(id, updateData);

    if (input.tagNames) {
      const tags = await tagRepository.findOrCreateByNames(input.tagNames);
      await postRepository.setTags(id, tags.map((t) => t.id));
    }

    return postRepository.findById(id);
  }

  async delete(id: string, authorId: string, role: string) {
    const post = await postRepository.findById(id);
    if (!post) throw new AppError(404, "Post not found");
    if (post.authorId !== authorId && role !== "ADMIN") {
      throw new AppError(403, "You can only delete your own posts");
    }
    await postRepository.delete(id);
  }
}

export const postService = new PostService();
