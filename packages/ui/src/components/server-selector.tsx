import { cn } from '../lib/utils.js';
import { useState } from 'react';

export interface ServerSelectorProps {
  servers: { id: string; name: string; icon?: string | null }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/** Discord server/guild selector dropdown */
export function ServerSelector({ servers, selectedId, onSelect, className }: ServerSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = servers.find((s) => s.id === selectedId);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm hover:bg-accent"
      >
        {selected?.icon ? (
          <img src={selected.icon} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {selected?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <span className="flex-1 text-left font-medium">{selected?.name ?? 'Select server'}</span>
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          {servers.map((server) => (
            <button
              key={server.id}
              type="button"
              onClick={() => {
                onSelect(server.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent',
                server.id === selectedId && 'bg-accent',
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {server.name.charAt(0)}
              </div>
              <span>{server.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
