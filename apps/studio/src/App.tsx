import { useEffect, useMemo, useState } from 'react';
import {
  connectStudioLive,
  fetchLogs,
  fetchSnapshot,
  formatUptime,
  type LiveConnectionState,
  type LogEntry,
  type StudioEventTrace,
  type StudioSnapshot,
  type StudioTelemetryPayload,
} from './api';
import { ApiExplorer } from './components/ApiExplorer';
import { CommandsView } from './components/CommandsView';
import { ConfigView } from './components/ConfigView';
import { DatabaseView } from './components/DatabaseView';
import { EventsView } from './components/EventInspector';
import { GraphView } from './components/GraphView';
import { PerformanceView } from './components/PerformanceView';
import { PipelineViewer } from './components/PipelineViewer';
import { PluginsView } from './components/PluginsView';

type Tab =
  | 'overview'
  | 'commands'
  | 'events'
  | 'pipelines'
  | 'plugins'
  | 'performance'
  | 'graph'
  | 'api'
  | 'database'
  | 'config'
  | 'logs'
  | 'docs';

type NavGroup = { label: string; tabs: { id: Tab; label: string }[] };

const NAV: NavGroup[] = [
  {
    label: 'Inspect',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'commands', label: 'Commands' },
      { id: 'events', label: 'Events' },
      { id: 'pipelines', label: 'Pipelines' },
      { id: 'plugins', label: 'Plugins' },
    ],
  },
  {
    label: 'Runtime',
    tabs: [
      { id: 'performance', label: 'Performance' },
      { id: 'graph', label: 'Graph' },
      { id: 'api', label: 'API Explorer' },
      { id: 'database', label: 'Database' },
    ],
  },
  {
    label: 'System',
    tabs: [
      { id: 'config', label: 'Configuration' },
      { id: 'logs', label: 'Logs' },
      { id: 'docs', label: 'Documentation' },
    ],
  },
];

const ALL_TABS = NAV.flatMap((g) => g.tabs);

const SUBTITLES: Record<Tab, string> = {
  overview: 'Live bot metrics from the Studio API.',
  commands: 'Registry plus live executions, latency, and denies.',
  events: 'Event Inspector — live traces and registered listeners.',
  pipelines: 'Middleware pipeline traces for recent interactions.',
  plugins: 'Plugins, dependency health, and package install.',
  performance: 'Memory, slow commands/plugins, and top errors.',
  graph: 'Plugin and service dependency graph.',
  api: 'Discover and try Studio / bot API routes (localhost).',
  database: 'Read-only table list and row preview.',
  config: 'Allowlisted live config — secrets never editable.',
  logs: 'Buffered runtime logs from this bot process.',
  docs: 'Framework documentation and local ports.',
};

function liveLabel(state: LiveConnectionState): string {
  if (state === 'live') return 'Live';
  if (state === 'reconnecting') return 'Reconnecting';
  return 'Offline';
}

export function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState<LiveConnectionState>('offline');
  const [pageKey, setPageKey] = useState(0);
  const [eventSeeds, setEventSeeds] = useState<StudioEventTrace[] | undefined>();

  const selectTab = (id: Tab) => {
    setTab(id);
    setPageKey((k) => k + 1);
  };

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [snap, logLines] = await Promise.all([fetchSnapshot(), fetchLogs()]);
      setSnapshot(snap);
      setLogs(logLines);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const [snap, logLines] = await Promise.all([fetchSnapshot(), fetchLogs()]);
        if (cancelled) return;
        setSnapshot(snap);
        setLogs(logLines);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    void tick();

    let pollId: number | undefined;
    const startPoll = () => {
      if (pollId != null) return;
      pollId = window.setInterval(() => void tick(), 2500);
    };
    const stopPoll = () => {
      if (pollId != null) {
        window.clearInterval(pollId);
        pollId = undefined;
      }
    };

    startPoll();

    const onTelemetry = (payload: StudioTelemetryPayload) => {
      if (cancelled) return;
      if (payload.events) setEventSeeds(payload.events);
    };

    const disposeWs = connectStudioLive({
      onState: (state) => {
        if (cancelled) return;
        setLive(state);
        if (state === 'live') stopPoll();
        else startPoll();
      },
      onSnapshot: (snap) => {
        if (cancelled) return;
        setSnapshot(snap);
        setError(null);
      },
      onLogs: (logLines) => {
        if (cancelled) return;
        setLogs(logLines);
      },
      onTelemetry,
      onError: (message) => {
        if (cancelled) return;
        setError(message);
      },
    });

    return () => {
      cancelled = true;
      stopPoll();
      disposeWs();
    };
  }, []);

  const showMetrics = tab !== 'docs' && tab !== 'api' && tab !== 'graph';
  const title = useMemo(() => ALL_TABS.find((t) => t.id === tab)?.label ?? 'Studio', [tab]);
  const counts = snapshot?.meta.counts;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <strong>
            Nexora <em>Studio</em>
          </strong>
          <span>Local Developer Center</span>
        </div>

        <nav className="nav">
          {NAV.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-label">{group.label}</div>
              {group.tabs.map((item) => {
                const count =
                  item.id === 'commands'
                    ? (counts?.commands ?? snapshot?.commands.length)
                    : item.id === 'events'
                      ? (counts?.events ?? snapshot?.events.length)
                      : item.id === 'plugins'
                        ? (counts?.plugins ?? snapshot?.plugins.length)
                        : item.id === 'logs'
                          ? logs.length
                          : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={tab === item.id ? 'active' : undefined}
                    onClick={() => selectTab(item.id)}
                  >
                    <span>{item.label}</span>
                    {count != null && <span className="count">{count}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-live">
            <div className="live-badge" data-state={live} title="Studio WebSocket">
              <span className="live-dot" />
              <span>{liveLabel(live)}</span>
            </div>
          </div>
          {snapshot?.meta.ports ? (
            <>
              <div className="foot-row">
                <span>api</span>
                <span>:{snapshot.meta.ports.api}</span>
              </div>
              <div className="foot-row">
                <span>ui</span>
                <span>:{snapshot.meta.ports.studio}</span>
              </div>
              <div className="foot-row">
                <span>version</span>
                <span>v{snapshot.meta.apiVersion}</span>
              </div>
            </>
          ) : (
            <div className="foot-row">
              <span>api</span>
              <span>waiting…</span>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="chrome">
          <div className="chrome-title">
            <h1>{title}</h1>
            <p>{SUBTITLES[tab]}</p>
          </div>
          <div className="header-actions">
            <div className="badge">
              <span className={`dot ${snapshot?.bot.online ? 'ok' : ''}`} />
              {snapshot?.bot.online ? (
                <span className="tag">{snapshot.bot.tag ?? 'bot'}</span>
              ) : snapshot ? (
                <span className="phase">{snapshot.bot.phase}</span>
              ) : (
                <span className="phase">connecting…</span>
              )}
            </div>
            <div className="live-badge" data-state={live} title="Studio WebSocket">
              <span className="live-dot" />
              <span>{liveLabel(live)}</span>
            </div>
            <button type="button" className="btn" disabled={refreshing} onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="main-body">
          {error && (
            <div className="error-banner">
              {error}
              <div className="muted" style={{ marginTop: '6px' }}>
                Start your bot with <code>createDevServer(bot)</code> (API on :3920). Studio UI: :3002.
              </div>
            </div>
          )}

          {snapshot && showMetrics && (
            <div className="metrics">
              <Metric
                label="Commands"
                value={String(counts?.commands ?? snapshot.commands.length)}
                sub={counts?.slash != null ? `${counts.slash} slash` : undefined}
              />
              <Metric label="Events" value={String(counts?.events ?? snapshot.events.length)} />
              <Metric label="Plugins" value={String(counts?.plugins ?? snapshot.plugins.length)} />
              <Metric label="Guilds" value={String(snapshot.bot.guilds)} />
              <Metric label="Uptime" value={formatUptime(snapshot.bot.uptimeMs)} />
            </div>
          )}

          <div className="page-enter" key={pageKey}>
            {tab === 'overview' && snapshot && <Overview snapshot={snapshot} />}
            {tab === 'commands' && snapshot && (
              <CommandsView snapshot={snapshot} active={tab === 'commands'} />
            )}
            {tab === 'events' && snapshot && (
              <EventsView snapshot={snapshot} active={tab === 'events'} seedTraces={eventSeeds} />
            )}
            {tab === 'pipelines' && <PipelineViewer active={tab === 'pipelines'} />}
            {tab === 'plugins' && snapshot && (
              <PluginsView snapshot={snapshot} active={tab === 'plugins'} />
            )}
            {tab === 'performance' && <PerformanceView active={tab === 'performance'} />}
            {tab === 'graph' && <GraphView active={tab === 'graph'} />}
            {tab === 'api' && <ApiExplorer active={tab === 'api'} />}
            {tab === 'database' && <DatabaseView active={tab === 'database'} />}
            {tab === 'config' && snapshot && (
              <ConfigView snapshot={snapshot} active={tab === 'config'} />
            )}
            {tab === 'logs' && <LogsView logs={logs} />}
            {tab === 'docs' && <DocsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric">
      <h3>{label}</h3>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Overview({ snapshot }: { snapshot: StudioSnapshot }) {
  const c = snapshot.meta.counts;
  return (
    <>
      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>Bot status</h2>
            <span className={`pill ${snapshot.bot.online ? 'ok' : 'warn'}`}>
              {snapshot.bot.online ? 'online' : 'offline'}
            </span>
          </div>
          <div className="panel-body">
            <ul className="list">
              <li>
                <span>Tag</span>
                <span>{snapshot.bot.tag ?? '—'}</span>
              </li>
              <li>
                <span>User ID</span>
                <span>{snapshot.bot.id ? <code>{snapshot.bot.id}</code> : '—'}</span>
              </li>
              <li>
                <span>Phase</span>
                <span>{snapshot.bot.phase}</span>
              </li>
              <li>
                <span>Uptime</span>
                <span>{formatUptime(snapshot.bot.uptimeMs)}</span>
              </li>
              <li>
                <span>Started</span>
                <span>
                  {snapshot.bot.startedAt
                    ? new Date(snapshot.bot.startedAt).toLocaleString()
                    : '—'}
                </span>
              </li>
              <li>
                <span>Guilds</span>
                <span>{snapshot.bot.guilds}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Runtime</h2>
          </div>
          <div className="panel-body">
            <ul className="list">
              <li>
                <span>Slash commands</span>
                <span>{c?.slash ?? '—'}</span>
              </li>
              <li>
                <span>Command groups</span>
                <span>{c?.groups ?? '—'}</span>
              </li>
              <li>
                <span>Context menus</span>
                <span>{c?.contextMenus ?? '—'}</span>
              </li>
              <li>
                <span>Message commands</span>
                <span>{c?.messageCommands ?? '—'}</span>
              </li>
              <li>
                <span>Events</span>
                <span>{c?.events ?? snapshot.events.length}</span>
              </li>
              <li>
                <span>Plugins</span>
                <span>{c?.plugins ?? snapshot.plugins.length}</span>
              </li>
              <li>
                <span>Studio API</span>
                <span>: {snapshot.meta.ports.api}</span>
              </li>
              <li>
                <span>Studio UI</span>
                <span>
                  : {snapshot.meta.ports.studio}
                  {snapshot.meta.ui ? ` · ${snapshot.meta.ui}` : ''}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="stack-gap">
        <div className="panel">
          <div className="panel-head">
            <h2>Database</h2>
            <span className={`pill ${snapshot.database.connected ? 'ok' : 'warn'}`}>
              {snapshot.database.connected ? 'connected' : 'offline'}
            </span>
          </div>
          <div className="panel-body">
            <ul className="list">
              <li>
                <span>Provider</span>
                <span>{snapshot.database.provider ?? '—'}</span>
              </li>
              <li>
                <span>Status</span>
                <span className={snapshot.database.connected ? 'ok' : 'warn'}>
                  {snapshot.database.connected ? 'Connected' : 'Not probed / offline'}
                </span>
              </li>
              {snapshot.database.message && (
                <li>
                  <span>Detail</span>
                  <span className="muted">{snapshot.database.message}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function logTime(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) {
    const match = /(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)/.exec(timestamp);
    return match ? match[1]! : timestamp;
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function displayLevel(entry: LogEntry): string {
  if (entry.meta?.type === 'command') return 'cmd';
  return entry.level;
}

function formatLogMeta(meta?: Record<string, unknown>): string {
  if (!meta) return '';
  const parts: string[] = [];
  if (typeof meta.user === 'string') parts.push(meta.user);
  if (typeof meta.name === 'string' && meta.type === 'command') parts.push(`/${meta.name}`);
  if (typeof meta.duration === 'number') parts.push(`${meta.duration}ms`);
  else if (typeof meta.duration === 'string') parts.push(meta.duration);
  if (typeof meta.file === 'string') parts.push(meta.file);
  if (parts.length === 0) return '';
  return ` · ${parts.join(' · ')}`;
}

function LogsView({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="panel logs-panel">
      <div className="panel-head">
        <h2>Live logs</h2>
        <span className="muted">{logs.length} buffered</span>
      </div>
      <div className="panel-body logs">
        {logs.length === 0 ? (
          <p className="empty-note">
            Waiting for log events from <code>@nexora.ts/logger</code> (via{' '}
            <code>createLiveLogger</code>)…
          </p>
        ) : (
          [...logs].reverse().map((line, index) => {
            const level = displayLevel(line);
            return (
              <div
                className={`log-line ${line.level === 'error' ? 'is-err' : line.level === 'warn' ? 'is-warn' : level === 'cmd' ? 'is-cmd' : ''}`}
                key={`${line.timestamp}-${index}`}
              >
                <span className="ts" title={line.timestamp}>
                  {logTime(line.timestamp)}
                </span>
                <span
                  className={`lvl ${line.level === 'error' ? 'err' : line.level === 'warn' ? 'warn' : level === 'cmd' ? 'cmd' : ''}`}
                >
                  {level}
                </span>
                <span className="msg">
                  {line.context ? `[${line.context}] ` : ''}
                  {line.message}
                  <span className="meta">{formatLogMeta(line.meta)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DocsView() {
  return (
    <>
      <div className="panel">
        <div className="docs-hero">
          <h3>Nexora.js documentation</h3>
          <p className="muted" style={{ margin: '0 0 16px', maxWidth: '46ch', fontSize: '13px' }}>
            Studio is your local control panel. Framework guides, recipes, and API references live on
            GitBook.
          </p>
          <p>
            <a
              className="docs-link"
              href="https://cjays-organization.gitbook.io/nexora.ts"
              target="_blank"
              rel="noreferrer"
            >
              cjays-organization.gitbook.io/nexora.ts →
            </a>
          </p>
        </div>
      </div>
      <div className="stack-gap">
        <div className="panel">
          <div className="panel-head">
            <h2>Local ports</h2>
          </div>
          <div className="panel-body">
            <ul className="list">
              <li>
                <span>Nexora Studio</span>
                <span>
                  <code>http://localhost:3002</code>
                </span>
              </li>
              <li>
                <span>Studio API</span>
                <span>
                  <code>http://127.0.0.1:3920</code>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
