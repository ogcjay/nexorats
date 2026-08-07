import { useEffect, useState } from 'react';
import {
  fetchEventTraces,
  formatMs,
  type StudioEventTrace,
  type StudioSnapshot,
} from '../api';
import { EmptyState, SubTabs } from './ui';
import { usePoll } from './usePoll';

type EventsSub = 'registered' | 'live';

export function EventsView({
  snapshot,
  active,
  seedTraces,
}: {
  snapshot: StudioSnapshot;
  active: boolean;
  seedTraces?: StudioEventTrace[];
}) {
  const [sub, setSub] = useState<EventsSub>('live');
  const [traces, setTraces] = useState<StudioEventTrace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (seedTraces && seedTraces.length > 0) {
      setTraces(seedTraces);
    }
  }, [seedTraces]);

  usePoll(
    async () => {
      const next = await fetchEventTraces(60);
      if (next.length > 0) setTraces(next);
    },
    2000,
    active && sub === 'live',
  );

  const sel = traces.find((t) => t.id === selected) ?? null;

  return (
    <>
      <SubTabs
        tabs={[
          { id: 'live', label: 'Event Inspector' },
          { id: 'registered', label: 'Registered' },
        ]}
        active={sub}
        onChange={setSub}
      />

      {sub === 'registered' ? (
        <div className="panel">
          <div className="panel-head">
            <h2>Registered events</h2>
            <span className="muted">{snapshot.events.length}</span>
          </div>
          <div className="panel-body tight">
            {snapshot.events.length === 0 ? (
              <EmptyState>No events registered.</EmptyState>
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
      ) : (
        <div className="split">
          <div className="panel">
            <div className="panel-head">
              <h2>Recent traces</h2>
              <span className="muted">{traces.length}</span>
            </div>
            <div className="panel-body tight">
              {traces.length === 0 ? (
                <EmptyState>
                  No live event traces yet. Waiting for Discord events or telemetry endpoint.
                </EmptyState>
              ) : (
                traces.map((trace) => (
                  <button
                    type="button"
                    key={trace.id}
                    className={`cmd-row ${selected === trace.id ? 'active' : ''}`}
                    onClick={() => setSelected(trace.id)}
                  >
                    <div className="cmd-name">
                      <span>{trace.event}</span>
                      {trace.error && <span className="pill err">error</span>}
                    </div>
                    <div className="cmd-meta">
                      <span className="pill">{formatMs(trace.totalMs)}</span>
                      <span className="pill">{trace.handlers.length} handlers</span>
                    </div>
                    <div className="cmd-desc">
                      {new Date(trace.timestamp).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Trace tree</h2>
            </div>
            <div className="panel-body">
              {!sel ? (
                <div className="detail-empty">Select a trace to inspect handlers.</div>
              ) : (
                <EventTraceDetail trace={sel} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EventTraceDetail({ trace }: { trace: StudioEventTrace }) {
  return (
    <>
      <div className="detail-title">{trace.event}</div>
      <div className="detail-sub">{new Date(trace.timestamp).toLocaleString()}</div>
      <div className="tag-row">
        <span className="pill strong">{formatMs(trace.totalMs)} total</span>
        <span className="pill">{trace.handlers.length} handlers</span>
        {trace.error && <span className="pill err">error</span>}
      </div>
      {trace.error && <p className="empty-note inline err">{trace.error}</p>}
      <div className="section-label">Handlers</div>
      {trace.handlers.length === 0 ? (
        <p className="empty-note inline">No handler spans recorded.</p>
      ) : (
        <ul className="trace-tree">
          <li className="trace-root">
            <span className="trace-label">{trace.event}</span>
            <span className="trace-ms">{formatMs(trace.totalMs)}</span>
          </li>
          {trace.handlers.map((h, i) => {
            const isLast = i === trace.handlers.length - 1;
            const label = h.plugin ?? h.source ?? h.id;
            return (
              <li key={h.id} className={`trace-child ${isLast ? 'last' : ''}`}>
                <span className="trace-branch">{isLast ? '└──' : '├──'}</span>
                <span className={`trace-label ${h.error ? 'err' : ''}`}>{label}</span>
                <span className="trace-ms">{formatMs(h.durationMs)}</span>
                {h.error && <span className="pill err">err</span>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
