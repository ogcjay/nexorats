import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -10%, hsl(186 100% 50% / 0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 20%, hsl(235 86% 65% / 0.1), transparent 50%)',
        }}
      />

      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="nx-brand-mark">NX</div>
            <div className="leading-tight">
              <span className="block text-[1.05rem] font-semibold tracking-tight">Nexora</span>
              <span className="text-[0.7rem] text-muted-foreground">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="nx-chip hidden sm:inline-flex">
              <span className="nx-chip-dot" />
              UNRELEASED
            </span>
            <ThemeToggle />
            <Link href="/dashboard" className="nx-btn-primary text-sm">
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Bot administration
          </p>
          <h1
            className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl"
            style={{ letterSpacing: '-0.035em' }}
          >
            Nexora
            <span className="block text-muted-foreground sm:mt-1">
              Control your Discord bot
              <span className="text-primary">.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A focused admin panel for guilds, modules, and live bot settings — built for the same
            charcoal-and-cyan stack as Nexora Studio.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="nx-btn-primary px-6 py-3">
              Enter dashboard
            </Link>
            <a
              href="https://github.com/ogcjay/nexorajs"
              className="nx-btn-ghost px-6 py-3"
              target="_blank"
              rel="noreferrer"
            >
              Source on GitHub
            </a>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted-foreground">
          <span>Nexora Dashboard · private preview</span>
          <span className="font-mono text-[0.65rem] tracking-wide opacity-80">v0.1.0 · UNRELEASED</span>
        </div>
      </footer>
    </div>
  );
}
