import Link from 'next/link';
import { Moon, Sun, Bot } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Nexora</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Discord Bot Management
            <span className="text-primary"> Reimagined</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Production-ready Discord bots with integrated dashboard, plugin system, and developer
            tools. Start in under five minutes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/nexora/nexora"
              className="rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Documentation
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
