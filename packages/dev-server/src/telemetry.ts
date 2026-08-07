/**
 * Bridge to `@nexora.ts/core` Studio telemetry.
 * Core may lag during development — all accessors degrade gracefully.
 */

import * as Core from '@nexora.ts/core';

export interface StudioEventHandlerSpan {
  id: string;
  plugin?: string;
  source?: string;
  durationMs: number;
  error?: string;
}

export interface StudioEventTrace {
  id: string;
  event: string;
  timestamp: string;
  totalMs: number;
  handlers: StudioEventHandlerSpan[];
  error?: string;
}

export type PipelineStepKind =
  | 'rateLimit'
  | 'permission'
  | 'validation'
  | 'guard'
  | 'middleware'
  | 'command'
  | 'logger'
  | 'reply'
  | 'other';

export interface StudioPipelineStep {
  name: string;
  kind: PipelineStepKind;
  status: 'ok' | 'deny' | 'error' | 'skipped';
  durationMs: number;
  detail?: string;
}

export interface StudioPipelineTrace {
  id: string;
  command: string;
  userId?: string;
  guildId?: string | null;
  timestamp: string;
  totalMs: number;
  steps: StudioPipelineStep[];
  outcome: 'ok' | 'denied' | 'error';
  error?: string;
}

export interface StudioCommandMetrics {
  name: string;
  executions: number;
  errors: number;
  denies: number;
  totalMs: number;
  lastMs?: number;
  lastError?: string;
  lastExecutedAt?: string;
  avgMs: number;
}

export interface StudioPerformanceSnapshot {
  startedAt: string;
  uptimeMs: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  slowCommands: Array<{ name: string; avgMs: number; lastMs: number; executions: number }>;
  slowPlugins: Array<{ name: string; avgMs: number; events: number }>;
  topErrors: Array<{ message: string; count: number }>;
}

export interface StudioTelemetryApi {
  getEventTraces: (limit?: number) => StudioEventTrace[];
  getPipelineTraces: (limit?: number) => StudioPipelineTrace[];
  getCommandMetrics: () => StudioCommandMetrics[];
  getPerformance: () => StudioPerformanceSnapshot;
}

export interface TelemetryUnavailable {
  available: false;
  note: string;
  traces?: never;
  pipelines?: never;
  metrics?: never;
}

type CoreWithTelemetry = typeof Core & {
  studioTelemetry?: StudioTelemetryApi;
  getStudioTelemetry?: () => StudioTelemetryApi | null | undefined;
};

/** Resolve process-local Studio telemetry from core (if exported). */
export function resolveStudioTelemetry(): StudioTelemetryApi | null {
  const mod = Core as CoreWithTelemetry;
  try {
    if (mod.studioTelemetry && typeof mod.studioTelemetry.getEventTraces === 'function') {
      return mod.studioTelemetry;
    }
    if (typeof mod.getStudioTelemetry === 'function') {
      const instance = mod.getStudioTelemetry();
      if (instance && typeof instance.getEventTraces === 'function') {
        return instance;
      }
    }
  } catch {
    /* core symbol mismatch / incomplete build */
  }
  return null;
}

export function emptyPerformanceFallback(): StudioPerformanceSnapshot {
  const mem = process.memoryUsage();
  return {
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptimeMs: Math.floor(process.uptime() * 1000),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    slowCommands: [],
    slowPlugins: [],
    topErrors: [],
  };
}

export function telemetrySummary(tel: StudioTelemetryApi | null): {
  eventTraces: number;
  pipelineTraces: number;
  commandMetrics: number;
  available: boolean;
} {
  if (!tel) {
    return { eventTraces: 0, pipelineTraces: 0, commandMetrics: 0, available: false };
  }
  try {
    return {
      available: true,
      eventTraces: tel.getEventTraces().length,
      pipelineTraces: tel.getPipelineTraces().length,
      commandMetrics: tel.getCommandMetrics().length,
    };
  } catch {
    return { eventTraces: 0, pipelineTraces: 0, commandMetrics: 0, available: false };
  }
}

/** Fingerprint for WS push coalescing */
export function telemetryFingerprint(tel: StudioTelemetryApi | null): string {
  if (!tel) return '0';
  try {
    const events = tel.getEventTraces(5);
    const pipes = tel.getPipelineTraces(5);
    const lastE = events[0];
    const lastP = pipes[0];
    return [
      events.length,
      pipes.length,
      lastE?.id ?? '',
      lastP?.id ?? '',
      lastE?.timestamp ?? '',
      lastP?.timestamp ?? '',
    ].join('|');
  } catch {
    return 'err';
  }
}
