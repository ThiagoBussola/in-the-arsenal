"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "../../lib/api";
import { PostCard } from "../../components/blog/PostCard";
import { useAuth } from "../../lib/auth-context";
import { ScrollTextIcon, SparklesIcon } from "../../icons";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { NavAuth } from "../NavAuth";

interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  publishedAt: string;
  createdAt: string;
  user: { id: string; name: string };
  tags: Array<{ id: string; name: string }>;
}

/** Backend returns `{ rows, count, page, totalPages }`; older clients may expect `posts` / `total`. */
function normalizePostsResponse(data: unknown): {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
} {
  if (!data || typeof data !== "object") {
    return { posts: [], total: 0, page: 1, totalPages: 1 };
  }
  const d = data as Record<string, unknown>;
  const raw = d.posts ?? d.rows;
  const list = Array.isArray(raw) ? raw : [];
  const posts = list.map((item) => {
    const p = item as Record<string, unknown> & {
      author?: { id: string; name: string };
      user?: { id: string; name: string };
    };
    const user = p.user ?? p.author;
    return {
      ...p,
      user:
        user && typeof user === "object" && "name" in user
          ? (user as { id: string; name: string })
          : { id: String(p.authorId ?? ""), name: "—" },
    } as PostSummary;
  });
  const total =
    typeof d.count === "number"
      ? d.count
      : typeof d.total === "number"
        ? d.total
        : 0;
  const page = typeof d.page === "number" ? d.page : 1;
  const totalPages = typeof d.totalPages === "number" ? d.totalPages : 1;
  return { posts, total, page, totalPages };
}

export default function BlogListPage() {
  const t = useTranslations("blog");
  const tNav = useTranslations("nav");
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "PUBLISHED");
      params.set("page", String(page));
      params.set("limit", "12");
      if (search.trim()) params.set("search", search.trim());

      const data = await apiFetch<unknown>(`/posts?${params.toString()}`);
      const norm = normalizePostsResponse(data);
      setPosts(norm.posts);
      setTotal(norm.total);
      setTotalPages(norm.totalPages);
    } catch {
      setPosts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const isSearchActive = search.trim().length > 0;
  const safePosts = posts ?? [];
  const showEmpty = !loading && safePosts.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-surface-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-auto min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <Link
            href="/"
            className="font-heading text-base font-semibold tracking-wider text-gold transition-colors hover:text-gold-bright sm:text-lg"
          >
            In the Arsenal
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted sm:gap-4">
            <Link
              href="/"
              className="hidden transition-colors hover:text-foreground sm:inline"
            >
              {tNav("home")}
            </Link>
            <Link href="/blog" className="text-foreground">
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

      <header className="relative overflow-hidden border-b border-surface-border/40">
        <div className="hero-gradient absolute inset-0 opacity-80" />
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute right-[15%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-gold/10 blur-[80px]" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-2 flex items-center gap-3">
            <ScrollTextIcon className="h-8 w-8 text-gold" />
            <SparklesIcon className="h-4 w-4 text-gold/50" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-10 mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-muted">
            {!loading && total > 0
              ? t("postCount", { count: total })
              : "\u00a0"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
              className="w-full min-w-[200px] rounded-sm border border-surface-border bg-surface/80 px-4 py-2 text-sm text-foreground backdrop-blur-sm placeholder:text-muted/60 outline-none transition-colors focus:border-gold/50 sm:w-72"
            />
            {user && (
              <Link
                href="/blog/editor"
                className="whitespace-nowrap rounded-sm border border-gold/40 bg-gold/10 px-4 py-2 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/70 hover:bg-gold/15"
              >
                {t("editor.newPost")}
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        ) : showEmpty ? (
          <div className="card-glow relative overflow-hidden rounded-sm border border-surface-border bg-surface/60 px-8 py-20 text-center backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.04] to-transparent" />
            <div className="relative">
              <ScrollTextIcon className="mx-auto mb-6 h-14 w-14 text-gold/35" />
              <h2 className="font-heading text-xl font-semibold tracking-wide text-foreground">
                {isSearchActive ? t("noResults") : t("emptyPublications")}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                {isSearchActive
                  ? t("emptySearchHint")
                  : t("emptyPublicationsHint")}
              </p>
              {!isSearchActive && user && (
                <Link
                  href="/blog/editor"
                  className="mt-8 inline-flex rounded-sm border border-gold/40 bg-gold/10 px-6 py-2.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:bg-gold/15"
                >
                  {t("emptyCta")}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {safePosts.map((post) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  authorName={post.user?.name || "—"}
                  publishedAt={post.publishedAt || post.createdAt}
                  tags={post.tags || []}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-sm border border-surface-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold/30 hover:text-foreground disabled:opacity-30"
                >
                  &laquo;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                        p === page
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-surface-border text-muted hover:border-gold/30 hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-sm border border-surface-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold/30 hover:text-foreground disabled:opacity-30"
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-surface-border/50 bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="font-heading text-xs tracking-widest text-muted/60 uppercase">
            In the Arsenal &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted/50">{t("footerNote")}</p>
        </div>
      </footer>
    </div>
  );
}
