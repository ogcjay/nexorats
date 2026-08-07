import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

/** npm-safe package name (no shell metacharacters). */
export const PACKAGE_NAME_RE =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export type InstallJobStatus = 'queued' | 'running' | 'success' | 'error';

export interface PluginInstallJob {
  id: string;
  name: string;
  status: InstallJobStatus;
  packageManager: 'pnpm' | 'npm';
  cwd: string;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
  log: string[];
  error?: string;
}

const jobs = new Map<string, PluginInstallJob>();
const MAX_JOBS = 50;
const MAX_LOG_LINES = 200;

let jobSeq = 0;

export function isSafePackageName(name: string): boolean {
  if (typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 214) return false;
  if (name.includes('..') || name.includes('\\') || name.includes('\0')) return false;
  // Reject shell metacharacters explicitly
  if (/[;|&$`<>(){}[\]!#"'\s]/.test(name)) return false;
  return PACKAGE_NAME_RE.test(name);
}

async function detectPackageManager(cwd: string): Promise<'pnpm' | 'npm'> {
  try {
    await access(join(cwd, 'pnpm-lock.yaml'));
    return 'pnpm';
  } catch {
    /* no pnpm lock */
  }
  try {
    await access(join(cwd, 'package-lock.json'));
    return 'npm';
  } catch {
    /* fall through */
  }
  // Prefer pnpm in monorepos when available via env
  if (process.env.npm_config_user_agent?.includes('pnpm')) return 'pnpm';
  return 'pnpm';
}

function pruneJobs(): void {
  if (jobs.size <= MAX_JOBS) return;
  const ordered = [...jobs.entries()].sort((a, b) =>
    a[1].startedAt.localeCompare(b[1].startedAt),
  );
  const removeCount = jobs.size - MAX_JOBS;
  for (let i = 0; i < removeCount; i++) {
    const id = ordered[i]?.[0];
    if (id) jobs.delete(id);
  }
}

function appendLog(job: PluginInstallJob, line: string): void {
  job.log.push(line);
  if (job.log.length > MAX_LOG_LINES) {
    job.log.shift();
  }
}

function runInstall(job: PluginInstallJob): void {
  job.status = 'running';
  const args =
    job.packageManager === 'pnpm'
      ? ['add', job.name]
      : ['install', job.name, '--save'];

  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(job.packageManager, args, {
      cwd: job.cwd,
      env: process.env,
      shell: false,
      windowsHide: true,
    });
  } catch (error) {
    job.status = 'error';
    job.finishedAt = new Date().toISOString();
    job.error = error instanceof Error ? error.message : String(error);
    appendLog(job, `spawn failed: ${job.error}`);
    return;
  }

  child.stdout.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split(/\r?\n/)) {
      if (line) appendLog(job, line);
    }
  });
  child.stderr.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split(/\r?\n/)) {
      if (line) appendLog(job, line);
    }
  });
  child.on('error', (error) => {
    job.status = 'error';
    job.finishedAt = new Date().toISOString();
    job.error = error.message;
    appendLog(job, `error: ${error.message}`);
  });
  child.on('close', (code) => {
    job.exitCode = code;
    job.finishedAt = new Date().toISOString();
    if (code === 0) {
      job.status = 'success';
    } else {
      job.status = 'error';
      job.error = `Exit code ${code}`;
    }
  });
}

export async function queuePluginInstall(
  name: string,
  cwd: string = process.cwd(),
): Promise<PluginInstallJob | { error: string }> {
  if (!isSafePackageName(name)) {
    return {
      error:
        'Invalid package name. Must match npm name rules; shell metacharacters are rejected.',
    };
  }

  // Soft preference: warn but allow non-nexora (Studio may install community plugins)
  const packageManager = await detectPackageManager(cwd);
  jobSeq += 1;
  const id = `install-${Date.now()}-${jobSeq}`;
  const job: PluginInstallJob = {
    id,
    name,
    status: 'queued',
    packageManager,
    cwd,
    startedAt: new Date().toISOString(),
    log: [],
  };
  jobs.set(id, job);
  pruneJobs();

  // Async start — do not block HTTP response
  queueMicrotask(() => runInstall(job));

  return job;
}

export function getPluginInstallJob(id: string): PluginInstallJob | null {
  return jobs.get(id) ?? null;
}

export function publicInstallJob(job: PluginInstallJob): Omit<PluginInstallJob, never> {
  return {
    id: job.id,
    name: job.name,
    status: job.status,
    packageManager: job.packageManager,
    cwd: job.cwd,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    exitCode: job.exitCode,
    log: [...job.log],
    error: job.error,
  };
}
