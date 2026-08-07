/** Scheduled job definition */
export interface ScheduledJob {
  id: string;
  name: string;
  cron?: string;
  intervalMs?: number;
  delayMs?: number;
  execute: () => Promise<void> | void;
  running: boolean;
}

/** Cron expression parser (simplified — minute hour dom month dow) */
function parseCronField(field: string, min: number, max: number): number[] {
  if (field === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  }
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    const values: number[] = [];
    for (let i = min; i <= max; i += step) values.push(i);
    return values;
  }
  return field.split(',').map((v) => parseInt(v, 10));
}

function cronMatches(cron: string, date: Date): boolean {
  const parts = cron.split(' ');
  if (parts.length !== 5) return false;

  const [minute, hour, dom, month, dow] = parts;
  if (!minute || !hour || !dom || !month || !dow) return false;

  const checks = [
    { field: parseCronField(minute, 0, 59), value: date.getMinutes() },
    { field: parseCronField(hour, 0, 23), value: date.getHours() },
    { field: parseCronField(dom, 1, 31), value: date.getDate() },
    { field: parseCronField(month, 1, 12), value: date.getMonth() + 1 },
    { field: parseCronField(dow, 0, 6), value: date.getDay() },
  ];

  return checks.every(({ field, value }) => field.includes(value));
}

/**
 * Job scheduler supporting cron, interval, and delayed tasks.
 *
 * @example
 * const scheduler = new Scheduler();
 * scheduler.scheduleInterval('heartbeat', 'Heartbeat', 30_000, async () => {
 *   console.log('tick');
 * });
 * scheduler.scheduleCron('daily', 'Daily reset', '0 0 * * *', async () => {
 *   await reset();
 * });
 */
export class Scheduler {
  private readonly jobs = new Map<string, ScheduledJob>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval | typeof setTimeout>>();
  private cronInterval: ReturnType<typeof setInterval> | null = null;
  private lastCronMinute = -1;

  /**
   * Schedule a cron job (minute hour dom month dow).
   *
   * @param id - Unique job id
   * @param name - Human-readable label
   * @param cron - Five-field cron expression
   * @param execute - Job callback
   * @example
   * scheduler.scheduleCron('daily', 'Daily reset', '0 0 * * *', async () => {
   *   await reset();
   * });
   */
  scheduleCron(id: string, name: string, cron: string, execute: () => Promise<void> | void): void {
    this.jobs.set(id, { id, name, cron, execute, running: false });
    this.ensureCronTicker();
  }

  /**
   * Schedule an interval job.
   *
   * @param id - Unique job id
   * @param name - Human-readable label
   * @param intervalMs - Interval in milliseconds
   * @param execute - Job callback
   * @example
   * scheduler.scheduleInterval('heartbeat', 'Heartbeat', 30_000, () => console.log('tick'));
   */
  scheduleInterval(
    id: string,
    name: string,
    intervalMs: number,
    execute: () => Promise<void> | void,
  ): void {
    this.jobs.set(id, { id, name, intervalMs, execute, running: false });

    const timer = setInterval(() => this.runJob(id), intervalMs);
    this.timers.set(id, timer);
  }

  /**
   * Schedule a one-time delayed task.
   *
   * @param id - Unique job id
   * @param name - Human-readable label
   * @param delayMs - Delay in milliseconds
   * @param execute - Job callback
   * @example
   * scheduler.scheduleDelayed('remind', 'Remind', 5_000, () => console.log('done'));
   */
  scheduleDelayed(
    id: string,
    name: string,
    delayMs: number,
    execute: () => Promise<void> | void,
  ): void {
    this.jobs.set(id, { id, name, delayMs, execute, running: false });

    const timer = setTimeout(async () => {
      await this.runJob(id);
      this.cancel(id);
    }, delayMs);
    this.timers.set(id, timer);
  }

  /**
   * Cancel a scheduled job.
   *
   * @param id - Job id previously passed to schedule*
   * @returns `true` if a job was removed
   */
  cancel(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer as ReturnType<typeof setInterval>);
      clearTimeout(timer as ReturnType<typeof setTimeout>);
      this.timers.delete(id);
    }
    return this.jobs.delete(id);
  }

  /** Stop all jobs and cleanup */
  destroy(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer as ReturnType<typeof setInterval>);
      clearTimeout(timer as ReturnType<typeof setTimeout>);
    }
    this.timers.clear();
    this.jobs.clear();

    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
    }
  }

  /**
   * Look up a job by id.
   *
   * @param id - Job id
   */
  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  /** All registered jobs */
  getAllJobs(): ScheduledJob[] {
    return [...this.jobs.values()];
  }

  private ensureCronTicker(): void {
    if (this.cronInterval) return;

    this.cronInterval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      if (currentMinute === this.lastCronMinute) return;
      this.lastCronMinute = currentMinute;

      for (const job of this.jobs.values()) {
        if (job.cron && cronMatches(job.cron, now)) {
          void this.runJob(job.id);
        }
      }
    }, 10_000);
  }

  private async runJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job || job.running) return;

    job.running = true;
    try {
      await job.execute();
    } catch (error) {
      console.error(`Scheduler job "${job.name}" failed:`, error);
    } finally {
      job.running = false;
    }
  }
}
