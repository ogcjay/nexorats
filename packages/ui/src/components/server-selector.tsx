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
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border border-border/80 px-3 py-2.5 text-sm',
          'bg-[hsl(var(--card)_/_0.7)] transition-[border-color,background-color] duration-200',
          'hover:border-primary/35 hover:bg-accent/60',
        )}
      >
        {selected?.icon ? (
          <img src={selected.icon} alt="" className="h-8 w-8 rounded-lg" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 font-mono text-xs font-semibold text-primary">
            {selected?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <span className="flex-1 truncate text-left font-medium">
          {selected?.name ?? 'Select server'}
        </span>
        <svg
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border/80',
            'bg-popover shadow-glow animate-in fade-in-0 zoom-in-95',
          )}
          style={{ animation: 'nx-page-enter 0.2s ease-out both' }}
        >
          {servers.map((server) => (
            <button
              key={server.id}
              type="button"
              onClick={() => {
                onSelect(server.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150',
                'hover:bg-accent',
                server.id === selectedId && 'bg-primary/10 text-primary',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md font-mono text-[0.65rem] font-semibold',
                  server.id === selectedId
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {server.name.charAt(0)}
              </div>
              <span className="truncate">{server.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
