import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-note">{children}</p>;
}

export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="subtabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={active === t.id ? 'active' : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function statusPillClass(status: string): string {
  if (status === 'ok' || status === 'success' || status === 'enabled') return 'ok';
  if (status === 'deny' || status === 'denied' || status === 'outdated' || status === 'warn') return 'warn';
  if (status === 'error' || status === 'missing') return 'err';
  return '';
}
