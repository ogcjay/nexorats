import { useState } from 'react';
import {
  fetchPipelines,
  formatMs,
  type StudioPipelineStep,
  type StudioPipelineTrace,
} from '../api';
import { EmptyState, statusPillClass } from './ui';
import { usePoll } from './usePoll';

const STEP_ORDER = [
  'rateLimit',
  'permission',
  'validation',
  'guard',
  'middleware',
  'command',
  'logger',
  'reply',
] as const;

export function PipelineViewer({ active }: { active: boolean }) {
  const [pipelines, setPipelines] = useState<StudioPipelineTrace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  usePoll(
    async () => {
      const next = await fetchPipelines(60);
      setPipelines(next);
    },
    2000,
    active,
  );

  const sel = pipelines.find((p) => p.id === selected) ?? null;

  return (
    <div className="split">
      <div className="panel">
        <div className="panel-head">
          <h2>Recent pipelines</h2>
          <span className="muted">{pipelines.length}</span>
        </div>
        <div className="panel-body tight">
          {pipelines.length === 0 ? (
            <EmptyState>
              No pipeline traces yet. Execute a slash command or wait for the telemetry API.
            </EmptyState>
          ) : (
            pipelines.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`cmd-row ${selected === p.id ? 'active' : ''}`}
                onClick={() => setSelected(p.id)}
              >
                <div className="cmd-name">
                  <span>/{p.command}</span>
                  <span className={`pill ${statusPillClass(p.outcome)}`}>{p.outcome}</span>
                </div>
                <div className="cmd-meta">
                  <span className="pill">{formatMs(p.totalMs)}</span>
                  <span className="pill">{p.steps.length} steps</span>
                </div>
                <div className="cmd-desc">{new Date(p.timestamp).toLocaleString()}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Pipeline steps</h2>
        </div>
        <div className="panel-body">
          {!sel ? (
            <div className="detail-empty">Select a pipeline to inspect steps.</div>
          ) : (
            <PipelineDetail trace={sel} />
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineDetail({ trace }: { trace: StudioPipelineTrace }) {
  const steps = orderSteps(trace.steps);
  return (
    <>
      <div className="detail-title">/{trace.command}</div>
      <div className="detail-sub">{new Date(trace.timestamp).toLocaleString()}</div>
      <div className="tag-row">
        <span className={`pill ${statusPillClass(trace.outcome)}`}>{trace.outcome}</span>
        <span className="pill strong">{formatMs(trace.totalMs)}</span>
        {trace.guildId && (
          <span className="pill">
            guild <code>{trace.guildId}</code>
          </span>
        )}
        {trace.userId && (
          <span className="pill">
            user <code>{trace.userId}</code>
          </span>
        )}
      </div>
      {trace.error && <p className="empty-note inline err">{trace.error}</p>}
      <div className="section-label">Steps</div>
      <ol className="pipeline-steps">
        {steps.map((step, i) => (
          <li key={`${step.kind}-${step.name}-${i}`} className={`pipe-step status-${step.status}`}>
            <div className="pipe-rail">
              <span className={`pipe-dot status-${step.status}`} />
              {i < steps.length - 1 && <span className="pipe-line" />}
            </div>
            <div className="pipe-body">
              <div className="pipe-title">
                <span className="pipe-kind">{step.kind}</span>
                <span className="pipe-name">{step.name}</span>
                <span className={`pill ${statusPillClass(step.status)}`}>{step.status}</span>
                <span className="muted">{formatMs(step.durationMs)}</span>
              </div>
              {step.detail && <div className="row-sub">{step.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function orderSteps(steps: StudioPipelineStep[]): StudioPipelineStep[] {
  return [...steps].sort((a, b) => {
    const ai = STEP_ORDER.indexOf(a.kind as (typeof STEP_ORDER)[number]);
    const bi = STEP_ORDER.indexOf(b.kind as (typeof STEP_ORDER)[number]);
    const aRank = ai === -1 ? 99 : ai;
    const bRank = bi === -1 ? 99 : bi;
    return aRank - bRank;
  });
}
