"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { MarkdownRenderer } from "../../../components/blog/MarkdownRenderer";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { NavAuth } from "../../NavAuth";
import { Link } from "@/i18n/navigation";

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  publishedAt: string;
  createdAt: string;
  user: { id: string; name: string };
  category: { id: string; name: string } | null;
  tags: Array<{ id: string; name: string }>;
}

export default function BlogPostPage() {
  const t = useTranslations("blog");
  const tNav = useTranslations("nav");
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch<PostDetail>(`/posts/slug/${slug}`)
      .then((data) => setPost(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-surface-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-wider text-gold transition-colors hover:text-gold-bright"
          >
            In the Arsenal
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link
              href="/blog"
              className="transition-colors hover:text-foreground"
            >
              {tNav("blog")}
            </Link>
            <Link
              href="/decks"
              className="transition-colors hover:text-foreground"
            >
              {tNav("decks")}
            </Link>
            <LanguageSwitcher />
            <NavAuth />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        ) : error || !post ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted">Post not found</p>
            <Link
              href="/blog"
              className="mt-4 inline-block text-sm text-gold transition-colors hover:text-gold-bright hover:underline"
            >
              {t("backToBlog")}
            </Link>
          </div>
        ) : (
          <article>
            {post.coverImage && (
              <div className="mb-8 overflow-hidden rounded-sm border border-surface-border">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            <header className="mb-8">
              <h1 className="mb-4 font-heading text-4xl font-bold leading-tight tracking-wide text-foreground">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span>
                  {t("by")}{" "}
                  <span className="text-foreground">{post.user.name}</span>
                </span>
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>
                    {t("publishedAt")}{" "}
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </time>
                )}
                {post.category && (
                  <span className="rounded-sm bg-surface-raised px-2 py-0.5 text-xs text-gold/70">
                    {post.category.name}
                  </span>
                )}
              </div>

              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-sm bg-surface px-2 py-0.5 text-xs text-muted"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <MarkdownRenderer content={post.content} />

            <div className="mt-12 border-t border-surface-border pt-6">
              <Link
                href="/blog"
                className="text-sm text-gold transition-colors hover:text-gold-bright hover:underline"
              >
                &larr; {t("backToBlog")}
              </Link>
            </div>
          </article>
        )}
      </main>

      <footer className="border-t border-surface-border/50 bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="font-heading text-xs tracking-widest text-muted/60 uppercase">
            In the Arsenal &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
