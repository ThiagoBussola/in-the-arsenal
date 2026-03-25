"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  publishedAt: string;
  tags: Array<{ id: string; name: string }>;
}

export function PostCard({
  title,
  slug,
  excerpt,
  coverImage,
  authorName,
  publishedAt,
  tags,
}: PostCardProps) {
  const t = useTranslations("blog");

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block overflow-hidden rounded-sm border border-surface-border bg-surface transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5"
    >
      {coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      {!coverImage && (
        <div className="flex aspect-video items-center justify-center bg-surface-raised">
          <span className="font-heading text-4xl text-gold/20">ITA</span>
        </div>
      )}

      <div className="p-6">
        <h3 className="mb-2 font-heading text-lg font-semibold tracking-wide text-foreground transition-colors group-hover:text-gold">
          {title}
        </h3>

        {excerpt && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted">
            {excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted/70">
          <span>
            {t("by")} {authorName}
          </span>
          <time dateTime={publishedAt}>
            {new Date(publishedAt).toLocaleDateString()}
          </time>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-sm bg-surface-raised px-2 py-0.5 text-xs text-gold/70"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
