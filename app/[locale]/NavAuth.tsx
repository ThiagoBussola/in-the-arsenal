"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "../lib/auth-context";

export function NavAuth() {
  const t = useTranslations("nav");
  const { user, loading, logout } = useAuth();

  const displayName =
    user &&
    (typeof user.name === "string" && user.name.trim().length > 0
      ? user.name.trim()
      : user.email);

  if (loading) {
    return (
      <div
        className="h-8 w-28 animate-pulse rounded-sm bg-surface-raised/90"
        aria-busy="true"
        aria-label={t("loading")}
      />
    );
  }

  if (user) {
    return (
      <div className="flex max-w-[min(100%,14rem)] items-center gap-3 sm:gap-4">
        <span
          className="truncate text-sm font-medium text-gold"
          title={displayName ?? undefined}
        >
          {displayName ?? t("account")}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className="shrink-0 text-sm text-muted transition-colors hover:text-foreground"
        >
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="rounded-sm border border-gold/30 px-4 py-1.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/60 hover:bg-gold/5"
    >
      {t("login")}
    </Link>
  );
}
