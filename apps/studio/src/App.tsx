import { useEffect, useMemo, useState } from 'react';
import {
  fetchLogs,
  fetchSnapshot,
  formatUptime,
  type LogEntry,
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

export function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
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

    void refresh();
    const id = window.setInterval(() => void refresh(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const title = useMemo(() => TABS.find((t) => t.id === tab)?.label ?? 'Studio', [tab]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <strong>Nexora Studio</strong>
          <span>Local Developer Center</span>
        </div>
        <nav className="nav">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'active' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <div>
            <h1>{title}</h1>
            <p>
              Project-specific runtime insights — not a public docs site. Secrets are redacted.
            </p>
          </div>
          <div className="badge">
            <span className={`dot ${snapshot?.bot.online ? 'ok' : ''}`} />
            {snapshot?.bot.online
              ? `Online · ${snapshot.bot.tag ?? 'bot'}`
              : snapshot
                ? `Phase: ${snapshot.bot.phase}`
                : 'Connecting…'}
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <div className="muted" style={{ marginTop: '0.4rem' }}>
              Start your bot with <code>createDevServer(bot)</code> (API on :3920). Studio UI:
              :3002.
            </div>
          </div>
        )}

        {tab === 'overview' && snapshot && <Overview snapshot={snapshot} />}
        {tab === 'commands' && snapshot && <Commands snapshot={snapshot} />}
        {tab === 'events' && snapshot && <Events snapshot={snapshot} />}
        {tab === 'plugins' && snapshot && <Plugins snapshot={snapshot} />}
        {tab === 'config' && snapshot && <ConfigView snapshot={snapshot} />}
        {tab === 'logs' && <LogsView logs={logs} />}
        {tab === 'docs' && <DocsView />}
      </main>
    </div>
  );
}

function Overview({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <>
      <div className="grid">
        <StatCard label="Commands" value={String(snapshot.commands.length)} />
        <StatCard label="Events" value={String(snapshot.events.length)} />
        <StatCard label="Plugins" value={String(snapshot.plugins.length)} />
        <StatCard label="Guilds" value={String(snapshot.bot.guilds)} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="panel">
          <div className="panel-head">
            <h2>Bot status</h2>
          </div>
          <div className="panel-body">
            <ul className="list">
              <li>
                <span>Phase</span>
                <span>{snapshot.bot.phase}</span>
              </li>
              <li>
                <span>Uptime</span>
                <span>{formatUptime(snapshot.bot.uptimeMs)}</span>
              </li>
              <li>
                <span>Studio API</span>
                <span>: {snapshot.meta.ports.api}</span>
              </li>
              <li>
                <span>Studio UI</span>
                <span>: {snapshot.meta.ports.studio}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Database</h2>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <h3>{label}</h3>
      <div className="value">{value}</div>
    </div>
  );
}

function Commands({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Command tree</h2>
        <span className="muted">{snapshot.commands.length} found</span>
      </div>
      <div className="panel-body">
        {snapshot.commands.length === 0 ? (
          <p className="muted">No commands registered yet.</p>
        ) : (
          <ul className="tree">
            <li>
              <span>/</span>
              <span className="muted">root</span>
            </li>
            {snapshot.commands.map((cmd) => (
              <li key={cmd.name}>
                <span>├── {cmd.name}</span>
                <span className="muted">{cmd.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Events({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Registered events</h2>
        <span className="muted">{snapshot.events.length}</span>
      </div>
      <div className="panel-body">
        <ul className="list">
          {snapshot.events.map((evt, index) => (
            <li key={`${evt.name}-${index}`}>
              <span>{evt.name}</span>
              <span className="muted">{evt.once ? 'once' : 'on'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Plugins({ snapshot }: { snapshot: StudioSnapshot }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Installed plugins</h2>
      </div>
      <div className="panel-body">
        {snapshot.plugins.length === 0 ? (
          <p className="muted">No plugins loaded. Drop packages into ./plugins or use nexora add.</p>
        ) : (
          <ul className="list">
            {snapshot.plugins.map((plugin) => (
              <li key={plugin.name}>
                <span>
                  <span className={plugin.enabled ? 'ok' : 'warn'}>
                    {plugin.enabled ? '✓' : '✗'}
                  </span>{' '}
                  {plugin.name}{' '}
                  <span className="muted">v{plugin.version}</span>
                </span>
                <span className="muted">
                  {plugin.commands} cmds · {plugin.events} events
                </span>
              </li>
            ))}
          </ul>
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

function LogsView({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Live logs</h2>
        <span className="muted">{logs.length} buffered</span>
      </div>
      <div className="panel-body logs">
        {logs.length === 0 ? (
          <p className="muted">Waiting for log events…</p>
        ) : (
          [...logs].reverse().map((line, index) => (
            <div className="log-line" key={`${line.timestamp}-${index}`}>
              <span className="muted">{line.timestamp}</span>
              <span className={line.level === 'error' ? 'err' : line.level === 'warn' ? 'warn' : ''}>
                {line.level}
              </span>
              <span>
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
    <div className="panel">
      <div className="panel-head">
        <h2>Documentation</h2>
      </div>
      <div className="panel-body">
        <p>
          <strong>Nexora Studio</strong> is your local control panel for <em>this</em> project.
        </p>
        <p className="muted">
          Public framework documentation is hosted separately on GitHub Pages for everyone:
        </p>
        <p>
          <a
            className="docs-link"
            href="https://ogcjay.github.io/nexorajs/"
            target="_blank"
            rel="noreferrer"
          >
            https://ogcjay.github.io/nexorajs/
          </a>
        </p>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Typical local ports when developing:
        </p>
        <ul className="list">
          <li>
            <span>Dashboard</span>
            <span>http://localhost:3000</span>
          </li>
          <li>
            <span>Public docs (optional preview)</span>
            <span>http://localhost:5173 / VitePress</span>
          </li>
          <li>
            <span>Nexora Studio</span>
            <span>http://localhost:3002</span>
          </li>
          <li>
            <span>Studio API</span>
            <span>http://127.0.0.1:3920</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
