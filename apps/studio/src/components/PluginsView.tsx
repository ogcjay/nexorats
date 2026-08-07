import { useState } from 'react';
import {
  fetchDepsHealth,
  fetchPluginInstallJob,
  installPlugin,
  type StudioDepsHealth,
  type StudioPluginInstallJob,
  type StudioSnapshot,
} from '../api';
import { EmptyState, statusPillClass, SubTabs } from './ui';
import { usePoll } from './usePoll';

type PluginsSub = 'installed' | 'deps' | 'install';

export function PluginsView({
  snapshot,
  active,
}: {
  snapshot: StudioSnapshot;
  active: boolean;
}) {
  const [sub, setSub] = useState<PluginsSub>('installed');
  const [deps, setDeps] = useState<StudioDepsHealth>({ items: [] });
  const [pkg, setPkg] = useState('');
  const [job, setJob] = useState<StudioPluginInstallJob | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  usePoll(
    async () => {
      setDeps(await fetchDepsHealth());
    },
    8000,
    active && sub === 'deps',
  );

  usePoll(
    async () => {
      if (!job || job.status === 'success' || job.status === 'error') return;
      const next = await fetchPluginInstallJob(job.id);
      if (next) setJob(next);
    },
    1500,
    active && sub === 'install' && !!job && (job.status === 'queued' || job.status === 'running'),
  );

  const onInstall = async () => {
    const name = pkg.trim();
    if (!name) return;
    setInstallError(null);
    const created = await installPlugin(name);
    if (!created) {
      setInstallError('Install request failed. Endpoint may be unavailable.');
      return;
    }
    setJob(created);
  };

  return (
    <>
      <SubTabs
        tabs={[
          { id: 'installed', label: 'Installed' },
          { id: 'deps', label: 'Deps Health' },
          { id: 'install', label: 'Install' },
        ]}
        active={sub}
        onChange={setSub}
      />

      {sub === 'installed' && (
        <div className="panel">
          <div className="panel-head">
            <h2>Installed plugins</h2>
            <span className="muted">{snapshot.plugins.length}</span>
          </div>
          <div className="panel-body tight">
            {snapshot.plugins.length === 0 ? (
              <EmptyState>
                No plugins loaded. Drop packages into ./plugins or use Install.
              </EmptyState>
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
      )}

      {sub === 'deps' && (
        <div className="panel">
          <div className="panel-head">
            <h2>Dependency health</h2>
            <span className="muted">{deps.items.length}</span>
          </div>
          <div className="panel-body tight">
            {deps.items.length === 0 ? (
              <EmptyState>{deps.note ?? 'No dependency health data yet.'}</EmptyState>
            ) : (
              deps.items.map((item) => (
                <div className="plug-row" key={item.name}>
                  <div>
                    <div className="plug-name">
                      <span>{item.name}</span>
                    </div>
                    <div className="row-sub">
                      {item.current ?? '?'}
                      {item.latest ? ` → ${item.latest}` : ''}
                      {item.note ? ` · ${item.note}` : ''}
                    </div>
                  </div>
                  <div className="cmd-meta">
                    <span className={`pill ${statusPillClass(item.status)}`}>{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {sub === 'install' && (
        <div className="panel">
          <div className="panel-head">
            <h2>Install plugin</h2>
          </div>
          <div className="panel-body">
            <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 12.5 }}>
              Installs an npm package into the bot project via the Studio API (localhost only).
            </p>
            <div className="filter-bar">
              <input
                type="text"
                placeholder="@nexora.ts/plugin-example"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onInstall();
                }}
              />
              <button type="button" className="btn btn-accent" onClick={() => void onInstall()}>
                Install
              </button>
            </div>
            {installError && (
              <p className="empty-note inline err" style={{ paddingLeft: 0 }}>
                {installError}
              </p>
            )}
            {job && (
              <div className="kv" style={{ marginTop: 14 }}>
                <div className="kv-row">
                  <span>Job</span>
                  <span>
                    <code>{job.id}</code>
                  </span>
                </div>
                <div className="kv-row">
                  <span>Package</span>
                  <span>{job.name}</span>
                </div>
                <div className="kv-row">
                  <span>Status</span>
                  <span className={`pill ${statusPillClass(job.status)}`}>{job.status}</span>
                </div>
                {job.message && (
                  <div className="kv-row">
                    <span>Message</span>
                    <span className="muted">{job.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
