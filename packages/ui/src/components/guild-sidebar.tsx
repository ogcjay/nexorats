import { cn } from '../lib/utils.js';
import type { ReactNode } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
}

export interface GuildSidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Dashboard guild sidebar navigation */
export function GuildSidebar({
  items,
  activeId,
  onNavigate,
  header,
  footer,
  className,
}: GuildSidebarProps) {
  return (
    <aside className={cn('flex h-full w-64 flex-col border-r border-border bg-card', className)}>
      {header && <div className="border-b border-border p-4">{header}</div>}

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeId === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {footer && <div className="border-t border-border p-4">{footer}</div>}
    </aside>
  );
}
