"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, authHeaders } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { MarkdownRenderer } from "../../../components/blog/MarkdownRenderer";
import { EditorToolbar } from "../../../components/blog/EditorToolbar";
import { AIWritingAssistant } from "../../../components/blog/AIWritingAssistant";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { NavAuth } from "../../NavAuth";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogEditorPage() {
  const t = useTranslations("blog.editor");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, accessToken, loading: authLoading } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/posts/categories")
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId || !accessToken) return;
    apiFetch<any>(`/posts/${editId}`, {
      headers: authHeaders(accessToken),
    })
      .then((post) => {
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setCoverImage(post.coverImage || "");
        setCategoryId(post.categoryId || "");
        setTagsInput(post.tags?.map((t: any) => t.name).join(", ") || "");
        setContent(post.content || "");
      })
      .catch(() => {});
  }, [editId, accessToken]);

  useEffect(() => {
    if (!editId && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 220)
      );
    }
  }, [title, editId]);

  const handleInsert = useCallback(
    (before: string, after: string = "") => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = content.substring(start, end);
      const newContent =
        content.substring(0, start) +
        before +
        selected +
        after +
        content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        ta.focus();
        const cursor = start + before.length + selected.length;
        ta.setSelectionRange(cursor, cursor);
      }, 0);
    },
    [content]
  );

  const handleAIInsert = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      if (!ta) {
        setContent((prev) => prev + text);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent =
        content.substring(0, start) + text + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        ta.focus();
        const cursor = start + text.length;
        ta.setSelectionRange(cursor, cursor);
      }, 0);
    },
    [content]
  );

  const getSelectedText = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return "";
    return content.substring(ta.selectionStart, ta.selectionEnd);
  }, [content]);

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!accessToken) return;
    setSaving(true);
    setMessage("");

    const tagNames = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body: any = {
      title,
      slug,
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      categoryId: categoryId || undefined,
      tagNames,
      status,
    };

    try {
      if (editId) {
        await apiFetch(`/posts/${editId}`, {
          method: "PATCH",
          headers: authHeaders(accessToken),
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/posts", {
          method: "POST",
          headers: authHeaders(accessToken),
          body: JSON.stringify(body),
        });
      }
      setMessage(status === "PUBLISHED" ? t("published") : t("saved"));
    } catch (err: any) {
      setMessage(err.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-lg text-muted">You must be signed in to write posts.</p>
        <a
          href="../auth/login"
          className="mt-4 text-gold hover:text-gold-bright transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-surface-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a
            href="/"
            className="font-heading text-lg font-semibold tracking-wider text-gold"
          >
            In the Arsenal
          </a>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="../blog" className="transition-colors hover:text-foreground">
              {tNav("blog")}
            </a>
            <LanguageSwitcher />
            <NavAuth />
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
            {editId ? t("editPost") : t("newPost")}
          </h1>
          <div className="flex items-center gap-3">
            {message && (
              <span className="text-sm text-gold">{message}</span>
            )}
            <button
              onClick={() => save("DRAFT")}
              disabled={saving || !title || !content}
              className="rounded-sm border border-surface-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-foreground disabled:opacity-50"
            >
              {saving ? t("saving") : t("saveDraft")}
            </button>
            <button
              onClick={() => save("PUBLISHED")}
              disabled={saving || !title || !content}
              className="rounded-sm border border-gold/40 bg-gold/10 px-4 py-2 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/70 hover:bg-gold/15 disabled:opacity-50"
            >
              {saving ? t("publishing") : t("publish")}
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("postTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("postTitle")}
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted/60 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("slug")}
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={t("slugPlaceholder")}
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted/60 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("category")}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold/50"
            >
              <option value="">{t("selectCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("excerpt")}
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={t("excerptPlaceholder")}
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted/60 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("coverImage")}
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder={t("coverImagePlaceholder")}
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted/60 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("tagsPlaceholder")}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="meta, deck guide, lore"
              className="w-full rounded-sm border border-surface-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder-muted/60 outline-none focus:border-gold/50"
            />
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 border-b border-surface-border">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !showPreview
                ? "border-b-2 border-gold text-gold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("write")}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              showPreview
                ? "border-b-2 border-gold text-gold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("preview")}
          </button>

          <div className="ml-auto">
            <AIWritingAssistant
              content={content}
              getSelectedText={getSelectedText}
              onInsert={handleAIInsert}
              accessToken={accessToken}
            />
          </div>
        </div>

        {showPreview ? (
          <div className="min-h-[500px] rounded-sm border border-surface-border bg-surface p-8">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-muted/60">{t("contentPlaceholder")}</p>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-surface-border">
            <EditorToolbar onInsert={handleInsert} />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("contentPlaceholder")}
              className="min-h-[500px] w-full resize-y bg-surface p-4 font-mono text-sm text-foreground placeholder-muted/60 outline-none"
            />
          </div>
        )}
      </main>
    </div>
  );
}
