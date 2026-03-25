"use client";

import { useTranslations } from "next-intl";
import type { ValidationError } from "../../lib/types";

interface ValidationPanelProps {
  errors: ValidationError[];
  loading?: boolean;
}

export function ValidationPanel({ errors, loading }: ValidationPanelProps) {
  const t = useTranslations("deckBuilder.validation");

  const actualErrors = errors.filter((e) => e.severity === "error");
  const warnings = errors.filter((e) => e.severity === "warning");

  return (
    <div className="space-y-2 rounded-sm border border-gold/15 bg-black/25 p-3 shadow-[inset_0_1px_0_rgba(201,168,76,0.06)]">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-xs font-semibold tracking-[0.15em] text-gold uppercase">
          {t("title")}
        </h4>
        {loading ? (
          <div className="h-3 w-3 animate-spin rounded-full border border-gold/30 border-t-gold" />
        ) : errors.length === 0 ? (
          <span className="text-[10px] font-medium text-green-400">✓ {t("valid")}</span>
        ) : (
          <span className="text-[10px] font-medium text-crimson-bright">
            {actualErrors.length} {t("errors")}{warnings.length > 0 ? `, ${warnings.length} ${t("warnings")}` : ""}
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {actualErrors.map((err, i) => (
            <div
              key={`e-${i}`}
              className="flex items-start gap-2 rounded-sm bg-crimson/5 px-2 py-1.5 text-[11px]"
            >
              <span className="mt-0.5 text-crimson-bright">✕</span>
              <span className="text-foreground/80">{err.message}</span>
            </div>
          ))}
          {warnings.map((warn, i) => (
            <div
              key={`w-${i}`}
              className="flex items-start gap-2 rounded-sm bg-yellow-900/10 px-2 py-1.5 text-[11px]"
            >
              <span className="mt-0.5 text-yellow-400">!</span>
              <span className="text-foreground/80">{warn.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
