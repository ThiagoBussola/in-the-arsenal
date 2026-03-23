import {
  ShieldIcon,
  SwordsIcon,
  ScrollTextIcon,
  HammerIcon,
  SparklesIcon,
  ChevronDownIcon,
} from "./icons";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-surface-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a
            href="/"
            className="font-heading text-lg font-semibold tracking-wider text-gold"
          >
            In the Arsenal
          </a>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a
              href="#about"
              className="transition-colors hover:text-foreground"
            >
              About
            </a>
            <a
              href="#pillars"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#"
              className="rounded-sm border border-gold/30 px-4 py-1.5 font-heading text-xs font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/60 hover:bg-gold/5"
            >
              Coming Soon
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="noise-overlay pointer-events-none absolute inset-0" />

        {/* Decorative rune circles */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full border border-gold/5 opacity-60" />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[400px] w-[400px] rounded-full border border-gold/8 opacity-40" />
        </div>

        {/* Glowing accent behind the title */}
        <div className="pointer-events-none absolute left-1/2 top-[40%] h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/10 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[80px]" />

        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8">
          {/* Emblem */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-surface/60 shadow-lg shadow-gold/5 backdrop-blur-sm">
            <ShieldIcon className="h-10 w-10 text-gold" />
          </div>

          {/* Title */}
          <h1 className="font-heading text-5xl font-bold leading-tight tracking-wide text-foreground sm:text-6xl lg:text-7xl">
            In the{" "}
            <span className="bg-gradient-to-r from-gold-bright via-gold to-gold-dim bg-clip-text text-transparent">
              Arsenal
            </span>
          </h1>

          {/* Decorative divider */}
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
            <SparklesIcon className="h-4 w-4 text-gold/60" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
          </div>

          {/* Subtitle */}
          <p className="text-balance max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Your Strategic Hub for{" "}
            <span className="text-crimson-bright font-medium">
              Flesh and Blood
            </span>{" "}
            TCG.
            <br />
            Decks, Lore, and Community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#pillars"
              className="group relative overflow-hidden rounded-sm border border-gold/40 bg-gold/10 px-8 py-3 font-heading text-sm font-semibold tracking-widest text-gold uppercase transition-all hover:border-gold/70 hover:bg-gold/15 hover:shadow-lg hover:shadow-gold/10"
            >
              <span className="relative z-10">Explore</span>
            </a>
            <a
              href="#"
              className="rounded-sm border border-surface-border px-8 py-3 font-heading text-sm font-semibold tracking-widest text-muted uppercase transition-all hover:border-gold/30 hover:text-foreground"
            >
              Coming Soon
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-muted/50">
          <span className="font-heading text-[10px] tracking-[0.3em] uppercase">
            Scroll
          </span>
          <ChevronDownIcon className="h-4 w-4 animate-bounce" />
        </div>
      </section>

      {/* ── About Section ── */}
      <section
        id="about"
        className="relative border-t border-surface-border/50 bg-surface px-6 py-24 sm:py-32"
      >
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-sm font-semibold tracking-[0.3em] text-gold uppercase">
            Forged in Rathe
          </h2>
          <p className="mt-6 text-balance text-3xl font-light leading-snug text-foreground sm:text-4xl">
            A hub built by players, for players.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted">
            In the Arsenal brings together expert content and powerful tools to
            sharpen your game. From deep meta analysis to streamlined deck
            building — everything you need to dominate the combat chain.
          </p>
        </div>
      </section>

      {/* ── Pillars Section ── */}
      <section
        id="pillars"
        className="relative border-t border-surface-border/50 bg-background px-6 py-24 sm:py-32"
      >
        <div className="noise-overlay pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-sm font-semibold tracking-[0.3em] text-gold uppercase">
              The Two Pillars
            </h2>
            <p className="text-balance mt-4 text-2xl font-light text-foreground sm:text-3xl">
              Knowledge and craft. Master both.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Card 1 — Content */}
            <div className="card-glow group relative overflow-hidden rounded-sm border border-surface-border bg-surface transition-all duration-300 hover:border-gold/20">
              <div className="absolute inset-0 bg-gradient-to-b from-crimson/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8 sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border border-surface-border bg-surface-raised">
                  <ScrollTextIcon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="font-heading text-xl font-semibold tracking-wide text-foreground">
                  Expert Analysis
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  Deep dives into the meta, deck guides, tournament coverage,
                  and lore curiosities from the world of Rathe. Stay ahead of
                  the combat chain.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <SwordsIcon className="h-4 w-4 text-gold/60" />
                  <span className="font-heading text-xs tracking-widest text-gold/60 uppercase">
                    Meta · Decks · Lore · Events
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 — Tools */}
            <div className="card-glow group relative overflow-hidden rounded-sm border border-surface-border bg-surface transition-all duration-300 hover:border-gold/20">
              <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8 sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border border-surface-border bg-surface-raised">
                  <HammerIcon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="font-heading text-xl font-semibold tracking-wide text-foreground">
                  Forge Your Deck
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  Build, share, and manage your decklists or wishlist for
                  trading and selling. Your arsenal, organized and ready for
                  battle.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-gold/60" />
                  <span className="font-heading text-xs tracking-widest text-gold/60 uppercase">
                    Decklists · Wishlists · Trading
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Teaser Banner ── */}
      <section className="relative border-t border-surface-border/50 bg-surface px-6 py-20">
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/8 blur-[80px]" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm tracking-[0.3em] text-gold/80 uppercase">
            The forge is heating up
          </p>
          <p className="mt-4 text-2xl font-light text-foreground sm:text-3xl">
            Something powerful is being crafted.
          </p>
          <p className="mt-4 text-base text-muted">
            We&apos;re building the tools and content that every Flesh and Blood
            player deserves. Stay tuned.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-sm border border-gold/20 bg-gold/5 px-6 py-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gold" />
            <span className="font-heading text-xs tracking-[0.2em] text-gold uppercase">
              In Development
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border/50 bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="font-heading text-xs tracking-widest text-muted/60 uppercase">
            In the Arsenal &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted/40">
            Flesh and Blood is a trademark of Legend Story Studios.
          </p>
        </div>
      </footer>
    </div>
  );
}
