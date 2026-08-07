import { useEffect, useMemo, useState } from 'react';
import {
  fetchLiveConfig,
  flattenConfig,
  isSecretConfigKey,
  putLiveConfig,
  setNestedValue,
  type StudioLiveConfigPayload,
  type StudioSnapshot,
} from '../api';
import { EmptyState, SubTabs } from './ui';
import { usePoll } from './usePoll';

type ConfigSub = 'live' | 'raw';

export function ConfigView({
  snapshot,
  active,
}: {
  snapshot: StudioSnapshot;
  active: boolean;
}) {
  const [sub, setSub] = useState<ConfigSub>('live');
  const [live, setLive] = useState<StudioLiveConfigPayload>({ config: {}, allowlist: [] });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  usePoll(
    async () => {
      const next = await fetchLiveConfig();
      setLive(next);
    },
    5000,
    active && sub === 'live',
  );

  const editableKeys = useMemo(() => {
    return live.allowlist.filter((k) => !isSecretConfigKey(k));
  }, [live.allowlist]);

  const flatLive = useMemo(() => {
    const source =
      Object.keys(live.config).length > 0 ? live.config : (snapshot.config as Record<string, unknown>);
    return flattenConfig(source);
  }, [live.config, snapshot.config]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const key of editableKeys) {
      const v = flatLive[key];
      next[key] = v == null ? '' : String(v);
    }
    setDraft(next);
  }, [editableKeys, flatLive]);

  const onSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      let patch: Record<string, unknown> = {};
      for (const key of editableKeys) {
        const raw = draft[key] ?? '';
        const prev = flatLive[key];
        let parsed: unknown = raw;
        if (typeof prev === 'number') {
          const n = Number(raw);
          parsed = Number.isFinite(n) ? n : raw;
        } else if (typeof prev === 'boolean') {
          parsed = raw === 'true' || raw === '1';
        } else if (raw.startsWith('[') || raw.startsWith('{')) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
        }
        patch = setNestedValue(patch, key, parsed);
      }
      const result = await putLiveConfig(patch);
      if (result.ok) {
        setStatus({ ok: true, message: 'Config saved.' });
        if (result.config) setLive((prev) => ({ ...prev, config: result.config! }));
      } else {
        setStatus({ ok: false, message: result.error ?? 'Save failed.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SubTabs
        tabs={[
          { id: 'live', label: 'Live Config' },
          { id: 'raw', label: 'Raw JSON' },
        ]}
        active={sub}
        onChange={setSub}
      />

      {sub === 'raw' ? (
        <div className="panel">
          <div className="panel-head">
            <h2>Active configuration</h2>
            <span className="muted">secrets redacted</span>
          </div>
          <div className="panel-body">
            <pre className="pre">{JSON.stringify(snapshot.config, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <h2>Editable fields</h2>
            <div className="header-actions">
              {status && (
                <span className={`pill ${status.ok ? 'ok' : 'err'}`}>{status.message}</span>
              )}
              <button
                type="button"
                className="btn btn-accent"
                disabled={saving || editableKeys.length === 0}
                onClick={() => void onSave()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div className="panel-body">
            {live.note && editableKeys.length === 0 && (
              <EmptyState>{live.note}</EmptyState>
            )}
            {editableKeys.length === 0 ? (
              <EmptyState>
                No allowlisted config fields available. Secret keys are never editable.
              </EmptyState>
            ) : (
              <div className="config-form">
                {editableKeys.map((key) => (
                  <label key={key} className="config-field">
                    <span className="config-key">{key}</span>
                    <input
                      type="text"
                      value={draft[key] ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
