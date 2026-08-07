/**
 * Process-local Studio telemetry — ring buffers for event/pipeline traces
 * and command metrics. Recording happens only when handlers run (near-zero idle).
 */

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
  slowCommands: Array<{
    name: string;
    avgMs: number;
    lastMs: number;
    executions: number;
  }>;
  /** Best-effort aggregates from event traces that carry a plugin name */
  slowPlugins: Array<{ name: string; avgMs: number; events: number }>;
  topErrors: Array<{ message: string; count: number }>;
}

export interface RecordCommandResultInput {
  name: string;
  durationMs: number;
  outcome: 'ok' | 'denied' | 'error';
  error?: string;
  executedAt?: string;
}

const DEFAULT_TRACE_CAP = 100;
const SLOW_LIST_LIMIT = 10;
const TOP_ERRORS_LIMIT = 10;

let idSeq = 0;

/** Compact monotonic id for hot-path recording */
export function nextTelemetryId(prefix = 't'): string {
  idSeq = (idSeq + 1) >>> 0;
  return `${prefix}_${Date.now().toString(36)}_${idSeq.toString(36)}`;
}

function pushRing<T>(buf: T[], item: T, cap: number): void {
  if (buf.length >= cap) {
    buf.shift();
  }
  buf[buf.length] = item;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Mutable accumulator used while a command pipeline runs */
export class PipelineTraceBuilder {
  readonly steps: StudioPipelineStep[] = [];
  readonly startedAt = Date.now();
  readonly timestamp = new Date().toISOString();

  constructor(
    readonly command: string,
    readonly userId?: string,
    readonly guildId?: string | null,
  ) {}

  push(step: StudioPipelineStep): void {
    this.steps[this.steps.length] = step;
  }

  async timed<T>(
    name: string,
    kind: PipelineStepKind,
    fn: () => T | Promise<T>,
    mapStatus?: (result: T) => {
      status: StudioPipelineStep['status'];
      detail?: string;
    },
  ): Promise<T> {
    const t0 = performance.now();
    try {
      const result = await fn();
      const mapped = mapStatus?.(result);
      this.push({
        name,
        kind,
        status: mapped?.status ?? 'ok',
        durationMs: performance.now() - t0,
        detail: mapped?.detail,
      });
      return result;
    } catch (error) {
      this.push({
        name,
        kind,
        status: 'error',
        durationMs: performance.now() - t0,
        detail: errorMessage(error),
      });
      throw error;
    }
  }

  finish(outcome: StudioPipelineTrace['outcome'], error?: string): StudioPipelineTrace {
    return {
      id: nextTelemetryId('pipe'),
      command: this.command,
      userId: this.userId,
      guildId: this.guildId,
      timestamp: this.timestamp,
      totalMs: Date.now() - this.startedAt,
      steps: this.steps,
      outcome,
      error,
    };
  }
}

export class StudioTelemetry {
  private readonly eventTraces: StudioEventTrace[] = [];
  private readonly pipelineTraces: StudioPipelineTrace[] = [];
  private readonly commandMetrics = new Map<string, StudioCommandMetrics>();
  private readonly errorCounts = new Map<string, number>();
  /** plugin → { totalMs, events } from event handler spans */
  private readonly pluginStats = new Map<string, { totalMs: number; events: number }>();
  private readonly startedAt = new Date();
  private readonly startedAtMs = Date.now();
  private eventCap = DEFAULT_TRACE_CAP;
  private pipelineCap = DEFAULT_TRACE_CAP;

  setTraceCaps(eventCap: number, pipelineCap: number): void {
    this.eventCap = Math.max(1, eventCap | 0);
    this.pipelineCap = Math.max(1, pipelineCap | 0);
  }

  recordEventTrace(trace: Omit<StudioEventTrace, 'id'> & { id?: string }): StudioEventTrace {
    const full: StudioEventTrace = {
      ...trace,
      id: trace.id ?? nextTelemetryId('evt'),
    };
    pushRing(this.eventTraces, full, this.eventCap);

    if (full.error) {
      this.bumpError(full.error);
    }

    for (let i = 0; i < full.handlers.length; i++) {
      const span = full.handlers[i]!;
      if (span.error) this.bumpError(span.error);
      if (span.plugin) {
        const prev = this.pluginStats.get(span.plugin);
        if (prev) {
          prev.totalMs += span.durationMs;
          prev.events += 1;
        } else {
          this.pluginStats.set(span.plugin, {
            totalMs: span.durationMs,
            events: 1,
          });
        }
      }
    }

    return full;
  }

  recordPipelineTrace(
    trace: Omit<StudioPipelineTrace, 'id'> & { id?: string },
  ): StudioPipelineTrace {
    const full: StudioPipelineTrace = {
      ...trace,
      id: trace.id ?? nextTelemetryId('pipe'),
    };
    pushRing(this.pipelineTraces, full, this.pipelineCap);
    if (full.error) this.bumpError(full.error);
    return full;
  }

  recordCommandResult(input: RecordCommandResultInput): StudioCommandMetrics {
    const existing = this.commandMetrics.get(input.name);
    const executedAt = input.executedAt ?? new Date().toISOString();

    if (!existing) {
      const created: StudioCommandMetrics = {
        name: input.name,
        executions: input.outcome === 'denied' ? 0 : 1,
        errors: input.outcome === 'error' ? 1 : 0,
        denies: input.outcome === 'denied' ? 1 : 0,
        totalMs: input.outcome === 'denied' ? 0 : input.durationMs,
        lastMs: input.durationMs,
        lastError: input.outcome === 'error' ? input.error : undefined,
        lastExecutedAt: executedAt,
        avgMs: input.outcome === 'denied' ? 0 : input.durationMs,
      };
      this.commandMetrics.set(input.name, created);
      if (input.error) this.bumpError(input.error);
      return created;
    }

    if (input.outcome === 'denied') {
      existing.denies += 1;
      existing.lastMs = input.durationMs;
      existing.lastExecutedAt = executedAt;
    } else {
      existing.executions += 1;
      existing.totalMs += input.durationMs;
      existing.lastMs = input.durationMs;
      existing.lastExecutedAt = executedAt;
      existing.avgMs =
        existing.executions > 0 ? existing.totalMs / existing.executions : 0;
      if (input.outcome === 'error') {
        existing.errors += 1;
        existing.lastError = input.error;
        if (input.error) this.bumpError(input.error);
      }
    }

    return existing;
  }

  getEventTraces(limit?: number): StudioEventTrace[] {
    return sliceTail(this.eventTraces, limit);
  }

  getPipelineTraces(limit?: number): StudioPipelineTrace[] {
    return sliceTail(this.pipelineTraces, limit);
  }

  getCommandMetrics(): StudioCommandMetrics[] {
    const out: StudioCommandMetrics[] = [];
    for (const m of this.commandMetrics.values()) {
      out[out.length] = { ...m };
    }
    return out;
  }

  getPerformance(): StudioPerformanceSnapshot {
    const mem = process.memoryUsage();

    const slowCommands = this.getCommandMetrics()
      .filter((m) => m.executions > 0)
      .map((m) => ({
        name: m.name,
        avgMs: m.avgMs,
        lastMs: m.lastMs ?? 0,
        executions: m.executions,
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, SLOW_LIST_LIMIT);

    const slowPlugins: StudioPerformanceSnapshot['slowPlugins'] = [];
    for (const [name, stats] of this.pluginStats) {
      slowPlugins[slowPlugins.length] = {
        name,
        avgMs: stats.events > 0 ? stats.totalMs / stats.events : 0,
        events: stats.events,
      };
    }
    slowPlugins.sort((a, b) => b.avgMs - a.avgMs);
    if (slowPlugins.length > SLOW_LIST_LIMIT) {
      slowPlugins.length = SLOW_LIST_LIMIT;
    }

    const topErrors: StudioPerformanceSnapshot['topErrors'] = [];
    for (const [message, count] of this.errorCounts) {
      topErrors[topErrors.length] = { message, count };
    }
    topErrors.sort((a, b) => b.count - a.count);
    if (topErrors.length > TOP_ERRORS_LIMIT) {
      topErrors.length = TOP_ERRORS_LIMIT;
    }

    return {
      startedAt: this.startedAt.toISOString(),
      uptimeMs: Date.now() - this.startedAtMs,
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      slowCommands,
      slowPlugins,
      topErrors,
    };
  }

  /** Clear all buffers (tests / Studio reset) */
  reset(): void {
    this.eventTraces.length = 0;
    this.pipelineTraces.length = 0;
    this.commandMetrics.clear();
    this.errorCounts.clear();
    this.pluginStats.clear();
  }

  private bumpError(message: string): void {
    const key = message.slice(0, 200);
    this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);
  }
}

function sliceTail<T>(buf: readonly T[], limit?: number): T[] {
  if (limit == null || limit >= buf.length) {
    return buf.slice();
  }
  if (limit <= 0) return [];
  return buf.slice(buf.length - limit);
}

/** Process-local singleton used by Studio and core instrumentation */
export const studioTelemetry = new StudioTelemetry();

export function getStudioTelemetry(): StudioTelemetry {
  return studioTelemetry;
}
