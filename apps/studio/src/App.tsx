import { useEffect, useMemo, useState } from 'react';
import {
  commandKey,
  connectStudioLive,
  fetchLogs,
  fetchSnapshot,
  formatCooldown,
  formatUptime,
  typeLabel,
  type LiveConnectionState,
  type LogEntry,
  type StudioCommandInfo,
  type StudioSnapshot,
} from './api';

type Tab =
  | 'overview'
  | 'commands'
  | 'events'
  | 'plugins'
  | 'config'
  | 'logs'
  | 'docs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'commands', label: 'Commands' },
  { id: 'events', label: 'Events' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'config', label: 'Configuration' },
  { id: 'logs', label: 'Logs' },
  { id: 'docs', label: 'Documentation' },
];

const SUBTITLES: Record<Tab, string> = {
  overview: 'Live bot metrics from the Studio API.',
  commands: 'Registered slash, group, context, and message commands.',
  events: 'Discord event listeners attached to this process.',
  plugins: 'Loaded plugins and their contribution counts.',
  config: 'Active configuration — tokens and secrets redacted.',
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

  const title = useMemo(() => TABS.find((t) => t.id === tab)?.label ?? 'Studio', [tab]);
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
          <div className="nav-label">Inspect</div>
          {TABS.map((item) => {
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

          {snapshot && tab !== 'docs' && (
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
            {tab === 'commands' && snapshot && <Commands snapshot={snapshot} />}
            {tab === 'events' && snapshot && <Events snapshot={snapshot} />}
            {tab === 'plugins' && snapshot && <Plugins snapshot={snapshot} />}
            {tab === 'config' && snapshot && <ConfigView snapshot={snapshot} />}
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

function TypePill({ type }: { type: StudioCommandInfo['type'] }) {
  const cls = type === 'slash' ? 'strong' : type === 'group' ? 'accent' : '';
  return <span className={`pill ${cls}`}>{typeLabel(type)}</span>;
}

function Commands({ snapshot }: { snapshot: StudioSnapshot }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();
  const filtered = snapshot.commands.filter((c) => {
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  });
  const sel = snapshot.commands.find((c) => commandKey(c) === selected) ?? null;

  return (
    <div className="split">
      <div className="panel">
        <div className="panel-head">
          <h2>Command registry</h2>
          <span className="muted">
            {filtered.length}
            {q ? ` / ${snapshot.commands.length}` : ''}
          </span>
        </div>
        <div className="panel-body filter-pad">
          <div className="filter-bar">
            <input
              type="search"
              placeholder="Filter by name, type…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="panel-body tight">
          {filtered.length === 0 ? (
            <div className="detail-empty">No commands match.</div>
          ) : (
            filtered.map((cmd) => {
              const key = commandKey(cmd);
              return (
                <button
                  type="button"
                  key={key}
                  className={`cmd-row ${selected === key ? 'active' : ''}`}
                  onClick={() => setSelected(key)}
                >
                  <div className="cmd-name">
                    <TypePill type={cmd.type} />
                    <span>/{cmd.name}</span>
                  </div>
                  <div className="cmd-meta">
                    {cmd.guildOnly && <span className="pill warn">guild</span>}
                    {cmd.adminOnly && <span className="pill warn">admin</span>}
                    {cmd.guardsCount > 0 && (
                      <span className="pill">{cmd.guardsCount} guards</span>
                    )}
                    {cmd.optionsCount > 0 && (
                      <span className="pill">{cmd.optionsCount} opts</span>
                    )}
                    {cmd.subcommands != null && (
                      <span className="pill">{cmd.subcommands} subs</span>
                    )}
                    {cmd.cooldownMs ? (
                      <span className="pill">{formatCooldown(cmd.cooldownMs)}</span>
                    ) : null}
                  </div>
                  <div className="cmd-desc">{cmd.description || 'No description'}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Details</h2>
        </div>
        <div className="panel-body">
          {!sel ? (
            <div className="detail-empty">Select a command to inspect options, cooldown, and flags.</div>
          ) : (
            <CommandDetail cmd={sel} />
          )}
        </div>
      </div>
    </div>
  );
}

function CommandDetail({ cmd }: { cmd: StudioCommandInfo }) {
  return (
    <>
      <div className="detail-title">/{cmd.name}</div>
      <div className="detail-sub">{cmd.description}</div>
      <div className="tag-row">
        <TypePill type={cmd.type} />
        {cmd.guildOnly && <span className="pill warn">guildOnly</span>}
        {cmd.adminOnly && <span className="pill warn">adminOnly</span>}
        {cmd.guardsCount > 0 && <span className="pill">{cmd.guardsCount} guards</span>}
      </div>
      <div className="kv">
        <div className="kv-row">
          <span>Source</span>
          <span>{cmd.source ? <code>{cmd.source}</code> : '—'}</span>
        </div>
        <div className="kv-row">
          <span>Cooldown</span>
          <span>{formatCooldown(cmd.cooldownMs)}</span>
        </div>
        <div className="kv-row">
          <span>Options</span>
          <span>{cmd.optionsCount}</span>
        </div>
        {cmd.subcommands != null && (
          <div className="kv-row">
            <span>Subcommands</span>
            <span>{cmd.subcommands}</span>
          </div>
        )}
        {cmd.aliases?.length ? (
          <div className="kv-row">
            <span>Aliases</span>
            <span>{cmd.aliases.join(', ')}</span>
          </div>
        ) : null}
      </div>
      <div className="section-label">Options</div>
      {cmd.options.length === 0 ? (
        <p className="empty-note inline">No options.</p>
      ) : (
        <table className="opt-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Req</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {cmd.options.map((opt) => (
              <tr key={opt.name}>
                <td>
                  <code>{opt.name}</code>
                </td>
                <td>{opt.type}</td>
                <td>{opt.required ? 'yes' : '—'}</td>
                <td className="muted">{opt.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function Events({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Registered events</h2>
        <span className="muted">{snapshot.events.length}</span>
      </div>
      <div className="panel-body tight">
        {snapshot.events.length === 0 ? (
          <p className="empty-note">No events registered.</p>
        ) : (
          snapshot.events.map((evt, index) => (
            <div className="evt-row" key={`${evt.name}-${index}`}>
              <div>
                <div className="evt-name">{evt.name}</div>
                {evt.source && <div className="row-sub">{evt.source}</div>}
              </div>
              <div className="cmd-meta">
                <span className={`pill ${evt.once ? 'warn' : 'strong'}`}>
                  {evt.once ? 'once' : 'on'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Plugins({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Installed plugins</h2>
        <span className="muted">{snapshot.plugins.length}</span>
      </div>
      <div className="panel-body tight">
        {snapshot.plugins.length === 0 ? (
          <p className="empty-note">
            No plugins loaded. Drop packages into ./plugins or use nexora add.
          </p>
        ) : (
          snapshot.plugins.map((plugin) => (
            <div className="plug-row" key={plugin.name}>
              <div>
                <div className="plug-name">
                  <span className={`dot ${plugin.enabled ? 'ok' : ''}`} />
                  <span>{plugin.name}</span>
                  <span className="muted">v{plugin.version}</span>
                </div>
                {plugin.description && <div className="row-sub">{plugin.description}</div>}
              </div>
              <div className="cmd-meta">
                <span className="pill">{plugin.commands} cmds</span>
                <span className="pill">{plugin.events} events</span>
                <span className={`pill ${plugin.enabled ? 'ok' : 'warn'}`}>
                  {plugin.enabled ? 'enabled' : 'disabled'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ConfigView({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Active configuration</h2>
        <span className="muted">secrets redacted</span>
      </div>
      <div className="panel-body">
        <pre className="pre">{JSON.stringify(snapshot.config, null, 2)}</pre>
      </div>
    </div>
  );
}

function logTime(timestamp: string): string {
  const match = /(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)/.exec(timestamp);
  return match ? match[1] : timestamp;
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
          <p className="empty-note">Waiting for log events…</p>
        ) : (
          [...logs].reverse().map((line, index) => (
            <div
              className={`log-line ${line.level === 'error' ? 'is-err' : line.level === 'warn' ? 'is-warn' : ''}`}
              key={`${line.timestamp}-${index}`}
            >
              <span className="ts" title={line.timestamp}>
                {logTime(line.timestamp)}
              </span>
              <span
                className={`lvl ${line.level === 'error' ? 'err' : line.level === 'warn' ? 'warn' : ''}`}
              >
                {line.level}
              </span>
              <span className="msg">
                {line.context ? `[${line.context}] ` : ''}
                {line.message}
              </span>
            </div>
          ))
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
              <li>
                <span>Dashboard</span>
                <span className="muted">
                  <code>http://localhost:3000</code> · unreleased
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
