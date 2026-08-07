import { useState } from 'react';
import {
  fetchPerformance,
  formatBytes,
  formatMs,
  formatUptime,
  type StudioPerformanceSnapshot,
} from '../api';
import { EmptyState } from './ui';
import { usePoll } from './usePoll';

export function PerformanceView({ active }: { active: boolean }) {
  const [data, setData] = useState<StudioPerformanceSnapshot | null>(null);

  usePoll(
    async () => {
      setData(await fetchPerformance());
    },
    3000,
    active,
  );

  if (!data) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Performance</h2>
        </div>
        <div className="panel-body">
          <EmptyState>
            Performance endpoint not available yet. Start the bot with Studio API v0.3+.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="metrics metrics-4">
        <div className="metric">
          <h3>RSS</h3>
          <div className="value">{formatBytes(data.memory.rss)}</div>
        </div>
        <div className="metric">
          <h3>Heap used</h3>
          <div className="value">{formatBytes(data.memory.heapUsed)}</div>
        </div>
        <div className="metric">
          <h3>Heap total</h3>
          <div className="value">{formatBytes(data.memory.heapTotal)}</div>
        </div>
        <div className="metric">
          <h3>Uptime</h3>
          <div className="value">{formatUptime(data.uptimeMs)}</div>
          <div className="sub">since {new Date(data.startedAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>Slow commands</h2>
            <span className="muted">{data.slowCommands.length}</span>
          </div>
          <div className="panel-body tight">
            {data.slowCommands.length === 0 ? (
              <EmptyState>No slow commands recorded.</EmptyState>
            ) : (
              data.slowCommands.map((c) => (
                <div className="evt-row" key={c.name}>
                  <div>
                    <div className="evt-name">/{c.name}</div>
                    <div className="row-sub">{c.executions} executions</div>
                  </div>
                  <div className="cmd-meta">
                    <span className="pill warn">{formatMs(c.avgMs)} avg</span>
                    <span className="pill">{formatMs(c.lastMs)} last</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Slow plugins</h2>
            <span className="muted">{data.slowPlugins.length}</span>
          </div>
          <div className="panel-body tight">
            {data.slowPlugins.length === 0 ? (
              <EmptyState>No slow plugins recorded.</EmptyState>
            ) : (
              data.slowPlugins.map((p) => (
                <div className="evt-row" key={p.name}>
                  <div>
                    <div className="evt-name">{p.name}</div>
                    <div className="row-sub">{p.events} events</div>
                  </div>
                  <div className="cmd-meta">
                    <span className="pill warn">{formatMs(p.avgMs)} avg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="stack-gap">
        <div className="panel">
          <div className="panel-head">
            <h2>Top errors</h2>
            <span className="muted">{data.topErrors.length}</span>
          </div>
          <div className="panel-body tight">
            {data.topErrors.length === 0 ? (
              <EmptyState>No errors aggregated yet.</EmptyState>
            ) : (
              data.topErrors.map((e, i) => (
                <div className="evt-row" key={`${e.message}-${i}`}>
                  <div>
                    <div className="evt-name err">{e.message}</div>
                  </div>
                  <div className="cmd-meta">
                    <span className="pill err">{e.count}×</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
