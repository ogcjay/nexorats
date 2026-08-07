import { useState } from 'react';
import {
  commandKey,
  fetchCommandMetrics,
  formatCooldown,
  formatMs,
  typeLabel,
  type StudioCommandInfo,
  type StudioCommandMetrics,
  type StudioSnapshot,
} from '../api';
import { usePoll } from './usePoll';

export function CommandsView({
  snapshot,
  active,
}: {
  snapshot: StudioSnapshot;
  active: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [metrics, setMetrics] = useState<StudioCommandMetrics[]>([]);

  usePoll(
    async () => {
      setMetrics(await fetchCommandMetrics());
    },
    2500,
    active,
  );

  const metricsByName = new Map(metrics.map((m) => [m.name, m]));
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
  const selMetrics = sel ? metricsByName.get(sel.name) : undefined;

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
              const m = metricsByName.get(cmd.name);
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
                    {m && (
                      <>
                        <span className="pill">{m.executions}×</span>
                        <span className="pill">{formatMs(m.avgMs)} avg</span>
                        {m.denies > 0 && <span className="pill warn">{m.denies} deny</span>}
                        {m.errors > 0 && <span className="pill err">{m.errors} err</span>}
                      </>
                    )}
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
            <div className="detail-empty">
              Select a command to inspect options, cooldown, and live metrics.
            </div>
          ) : (
            <CommandDetail cmd={sel} metrics={selMetrics} />
          )}
        </div>
      </div>
    </div>
  );
}

function TypePill({ type }: { type: StudioCommandInfo['type'] }) {
  const cls = type === 'slash' ? 'strong' : type === 'group' ? 'accent' : '';
  return <span className={`pill ${cls}`}>{typeLabel(type)}</span>;
}

function CommandDetail({
  cmd,
  metrics,
}: {
  cmd: StudioCommandInfo;
  metrics?: StudioCommandMetrics;
}) {
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

      <div className="section-label">Live metrics</div>
      {!metrics ? (
        <p className="empty-note inline">No live metrics yet for this command.</p>
      ) : (
        <div className="kv">
          <div className="kv-row">
            <span>Executions</span>
            <span>{metrics.executions}</span>
          </div>
          <div className="kv-row">
            <span>Avg / last</span>
            <span>
              {formatMs(metrics.avgMs)} / {formatMs(metrics.lastMs)}
            </span>
          </div>
          <div className="kv-row">
            <span>Denies</span>
            <span className={metrics.denies > 0 ? 'warn' : undefined}>{metrics.denies}</span>
          </div>
          <div className="kv-row">
            <span>Errors</span>
            <span className={metrics.errors > 0 ? 'err' : undefined}>{metrics.errors}</span>
          </div>
          <div className="kv-row">
            <span>Last error</span>
            <span className="muted">{metrics.lastError ?? '—'}</span>
          </div>
          <div className="kv-row">
            <span>Last run</span>
            <span>
              {metrics.lastExecutedAt
                ? new Date(metrics.lastExecutedAt).toLocaleString()
                : '—'}
            </span>
          </div>
        </div>
      )}

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
