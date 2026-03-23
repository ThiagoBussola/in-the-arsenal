"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "../../i18n/navigation";

const localeLabels: Record<string, string> = {
  pt: "PT",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const otherLocale = locale === "pt" ? "en" : "pt";

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 rounded-sm border border-surface-border px-2.5 py-1 text-xs font-medium tracking-wider text-muted transition-all hover:border-gold/30 hover:text-foreground"
      aria-label={`Switch to ${localeLabels[otherLocale]}`}
    >
      <span className="text-gold">{localeLabels[locale]}</span>
      <span className="text-muted/40">/</span>
      <span>{localeLabels[otherLocale]}</span>
    </button>
  );
}
