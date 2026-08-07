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
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border/80',
        'bg-[hsl(var(--background)_/_0.92)] backdrop-blur-md',
        className,
      )}
    >
      {header && <div className="border-b border-border/70 p-4">{header}</div>}

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate?.(item.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                    'transition-[color,background-color,box-shadow,transform] duration-200',
                    active
                      ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                      : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
                  )}
                >
                  {item.icon && (
                    <span
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors duration-200',
                        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 font-mono text-[0.65rem]',
                        active
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && <div className="mt-auto border-t border-border/70 p-4">{footer}</div>}
    </aside>
  );
}
