"use client";

import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/app/[locale]/LanguageSwitcher";
import { Link } from "@/i18n/navigation";

export function AuthScaffold({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="hero-gradient absolute inset-0 opacity-95" />
      <div className="noise-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-64 w-96 -translate-x-1/2 rounded-full bg-crimson/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-48 w-72 -translate-x-1/2 rounded-full bg-gold/8 blur-[90px]" />

      <nav className="relative z-20 border-b border-surface-border/50 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-heading text-sm font-semibold tracking-wider text-gold transition-colors hover:text-gold-bright"
          >
            In the Arsenal
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
