import { useState } from 'react';
import {
  fetchApiRoutes,
  isLocalhostOrigin,
  type StudioApiRoute,
  type StudioApiRoutesPayload,
} from '../api';
import { EmptyState } from './ui';
import { usePoll } from './usePoll';

export function ApiExplorer({ active }: { active: boolean }) {
  const [payload, setPayload] = useState<StudioApiRoutesPayload>({ routes: [] });
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/studio/health');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePoll(
    async () => {
      setPayload(await fetchApiRoutes());
    },
    8000,
    active,
  );

  const tryRequest = async () => {
    setError(null);
    setResult(null);
    if (!isLocalhostOrigin()) {
      setError('API Explorer only runs on localhost.');
      return;
    }
    const target = path.trim();
    if (!target.startsWith('/')) {
      setError('Path must start with /');
      return;
    }
    setBusy(true);
    try {
      const init: RequestInit = { method };
      if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = body;
      }
      const res = await fetch(target, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      setResult({ status: res.status, body: pretty || '(empty)' });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const pickRoute = (route: StudioApiRoute) => {
    setMethod(route.method.toUpperCase());
    setPath(route.path);
  };

  return (
    <div className="split">
      <div className="panel">
        <div className="panel-head">
          <h2>Routes</h2>
          <span className="muted">{payload.routes.length}</span>
        </div>
        <div className="panel-body tight">
          {payload.routes.length === 0 ? (
            <EmptyState>{payload.note ?? 'No API routes listed yet.'}</EmptyState>
          ) : (
            payload.routes.map((r, i) => (
              <button
                type="button"
                key={`${r.method}-${r.path}-${i}`}
                className="cmd-row"
                onClick={() => pickRoute(r)}
              >
                <div className="cmd-name">
                  <span className="pill accent">{r.method}</span>
                  <span>{r.path}</span>
                </div>
                {r.description && <div className="cmd-desc">{r.description}</div>}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Try request</h2>
          {!isLocalhostOrigin() && <span className="pill warn">localhost only</span>}
        </div>
        <div className="panel-body">
          <div className="api-try-row">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/studio/…"
            />
            <button
              type="button"
              className="btn btn-accent"
              disabled={busy}
              onClick={() => void tryRequest()}
            >
              Send
            </button>
          </div>
          {method !== 'GET' && method !== 'HEAD' && (
            <textarea
              className="api-body"
              rows={4}
              placeholder='{"key":"value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
          {error && <p className="empty-note inline err">{error}</p>}
          {result && (
            <>
              <div className="section-label">
                Response{' '}
                <span className={`pill ${result.status < 400 ? 'ok' : 'err'}`}>
                  {result.status}
                </span>
              </div>
              <pre className="pre">{result.body}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
