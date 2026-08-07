'use client';

import { useState, type ReactNode } from 'react';
import { GuildSidebar, ServerSelector, SettingsCard, Switch } from '@nexora.ts/ui';
import {
  LayoutDashboard,
  Settings,
  Puzzle,
  BarChart3,
  ScrollText,
  Users,
  Activity,
  Sparkles,
  Clock3,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const MOCK_SERVERS = [
  { id: '1', name: 'My Discord Server', icon: null },
  { id: '2', name: 'Gaming Community', icon: null },
];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'modules', label: 'Modules', icon: <Puzzle className="h-4 w-4" /> },
  { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

const TAB_META: Record<string, { title: string; description: string; icon: ReactNode }> = {
  overview: {
    title: 'Overview',
    description: 'Guild health and quick controls',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  modules: {
    title: 'Modules',
    description: 'Enable and configure bot plugins for this server',
    icon: <Puzzle className="h-4 w-4" />,
  },
  statistics: {
    title: 'Statistics',
    description: 'Command usage and engagement over time',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  logs: {
    title: 'Logs',
    description: 'Moderation and automation event stream',
    icon: <ScrollText className="h-4 w-4" />,
  },
  users: {
    title: 'Users',
    description: 'Member insights and permission profiles',
    icon: <Users className="h-4 w-4" />,
  },
  settings: {
    title: 'Guild Settings',
    description: 'Core bot behavior for the selected server',
    icon: <Settings className="h-4 w-4" />,
  },
};

function ComingSoonPanel({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="nx-placeholder">
      <div className="nx-placeholder-icon">{icon}</div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="nx-chip">
          <span className="nx-chip-dot" />
          In progress
        </span>
        <span className="nx-chip">UNRELEASED surface</span>
      </div>
      <p className="max-w-lg text-sm text-muted-foreground">
        This section is wired into the shell for local monorepo previews. Live guild data and
        persistence land with the public dashboard release.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedServer, setSelectedServer] = useState('1');
  const [activeTab, setActiveTab] = useState('overview');
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [modLogEnabled, setModLogEnabled] = useState(false);

  const meta = TAB_META[activeTab] ?? TAB_META.overview;
  const selectedName =
    MOCK_SERVERS.find((s) => s.id === selectedServer)?.name ?? 'Selected server';

  return (
    <div className="nx-shell">
      <GuildSidebar
        items={SIDEBAR_ITEMS}
        activeId={activeTab}
        onNavigate={setActiveTab}
        className="hidden w-[15.5rem] shrink-0 md:flex"
        header={
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-0.5">
              <div className="nx-brand-mark !h-7 !w-7 !text-[0.65rem]">NX</div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold tracking-tight">Nexora</p>
                <p className="truncate text-[0.65rem] text-muted-foreground">Admin panel</p>
              </div>
            </div>
            <ServerSelector
              servers={MOCK_SERVERS}
              selectedId={selectedServer}
              onSelect={setSelectedServer}
            />
          </div>
        }
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[0.65rem] text-muted-foreground">v0.1.0 · preview</span>
            <ThemeToggle />
          </div>
        }
      />

      <div className="nx-main">
        <header className="nx-topbar">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {meta.title}
              </h1>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                {selectedName}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="nx-chip hidden sm:inline-flex">
              <span className="nx-chip-dot" />
              Preview
            </span>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Mobile server + nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-border/60 px-4 py-3 md:hidden">
          <ServerSelector
            servers={MOCK_SERVERS}
            selectedId={selectedServer}
            onSelect={setSelectedServer}
            className="min-w-[12rem] flex-1"
          />
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 py-2 md:hidden">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nx-content">
          <div key={activeTab} className="nx-page space-y-8">
            {activeTab === 'overview' && (
              <>
                <section className="relative overflow-hidden rounded-[calc(var(--radius)+2px)] border border-border/70 px-6 py-7 sm:px-8">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(125deg, hsl(186 100% 50% / 0.1), transparent 42%), linear-gradient(220deg, hsl(235 86% 65% / 0.08), transparent 45%)',
                    }}
                  />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {selectedName}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        Server overview
                      </h2>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Snapshot of bot activity for this guild. Metrics are mock data until the
                        dashboard API ships.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                      <span>Bot online · mock</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Key signals
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="nx-metric">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Members
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">1,234</p>
                      <p className="mt-1 text-xs text-emerald-400/90">+12% this week</p>
                    </div>
                    <div className="nx-metric">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Commands
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">856</p>
                      <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
                    </div>
                    <div className="nx-metric">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        Uptime
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">99.9%</p>
                      <p className="mt-1 text-xs text-muted-foreground">4 modules active</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Quick settings
                  </h3>
                  <SettingsCard
                    title="Common controls"
                    description="Toggles that apply immediately to this guild"
                  >
                    <div className="space-y-5">
                      <Switch
                        label="Welcome messages"
                        description="Greet new members when they join the server"
                        checked={welcomeEnabled}
                        onCheckedChange={setWelcomeEnabled}
                      />
                      <Switch
                        label="Moderation log"
                        description="Mirror moderation actions to a configured channel"
                        checked={modLogEnabled}
                        onCheckedChange={setModLogEnabled}
                      />
                    </div>
                  </SettingsCard>
                </section>
              </>
            )}

            {activeTab === 'modules' && (
              <ComingSoonPanel
                title="Modules"
                description="Install, enable, and tune plugins per guild — welcome flows, moderation, leveling, and more."
                icon={<Puzzle className="h-5 w-5" />}
              />
            )}

            {activeTab === 'settings' && (
              <ComingSoonPanel
                title="Guild settings"
                description="Prefix, locale, permission defaults, and channel bindings for this server."
                icon={<Shield className="h-5 w-5" />}
              />
            )}

            {!['overview', 'modules', 'settings'].includes(activeTab) && (
              <ComingSoonPanel
                title={meta.title}
                description={meta.description}
                icon={meta.icon}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
