import { useState } from 'react';
import {
  fetchDbQuery,
  fetchDbTables,
  type StudioDbQueryPayload,
  type StudioDbTablesPayload,
} from '../api';
import { EmptyState } from './ui';
import { usePoll } from './usePoll';

export function DatabaseView({ active }: { active: boolean }) {
  const [tables, setTables] = useState<StudioDbTablesPayload>({ available: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<StudioDbQueryPayload | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  usePoll(
    async () => {
      const next = await fetchDbTables();
      setTables(next);
    },
    6000,
    active,
  );

  const loadPreview = async (table: string) => {
    setSelected(table);
    setLoadingPreview(true);
    try {
      setPreview(await fetchDbQuery(table, 25));
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!tables.available) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Database</h2>
          <span className="pill warn">unavailable</span>
        </div>
        <div className="panel-body">
          <EmptyState>
            {tables.message ??
              'Database explorer is not available. Connect a DB adapter or wait for Studio API support.'}
          </EmptyState>
        </div>
      </div>
    );
  }

  const list = tables.tables ?? [];

  return (
    <div className="split">
      <div className="panel">
        <div className="panel-head">
          <h2>Tables</h2>
          <span className="muted">{list.length}</span>
        </div>
        <div className="panel-body tight">
          {list.length === 0 ? (
            <EmptyState>No tables discovered.</EmptyState>
          ) : (
            list.map((table) => (
              <button
                type="button"
                key={table}
                className={`cmd-row ${selected === table ? 'active' : ''}`}
                onClick={() => void loadPreview(table)}
              >
                <div className="cmd-name">
                  <code>{table}</code>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Row preview</h2>
          <span className="muted">read-only · limit 25</span>
        </div>
        <div className="panel-body">
          {!selected ? (
            <div className="detail-empty">Select a table to preview rows.</div>
          ) : loadingPreview ? (
            <EmptyState>Loading…</EmptyState>
          ) : !preview || preview.available === false ? (
            <EmptyState>{preview?.message ?? 'Preview unavailable for this table.'}</EmptyState>
          ) : (preview.rows?.length ?? 0) === 0 ? (
            <EmptyState>Table is empty.</EmptyState>
          ) : (
            <div className="db-scroll">
              <table className="opt-table db-table">
                <thead>
                  <tr>
                    {(preview.columns ?? Object.keys(preview.rows![0]!)).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows!.map((row, i) => (
                    <tr key={i}>
                      {(preview.columns ?? Object.keys(row)).map((col) => (
                        <td key={col}>
                          <code>{formatCell(row[col])}</code>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
