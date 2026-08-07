import { cn } from '../lib/utils.js';
import type { ReactNode } from 'react';

export interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Settings card container for dashboard configuration panels */
export function SettingsCard({
  title,
  description,
  children,
  footer,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border/70 text-card-foreground',
        'bg-gradient-to-br from-[hsl(var(--card)_/_0.95)] to-[hsl(var(--background)_/_0.5)]',
        className,
      )}
    >
      <div className="flex flex-col gap-1 border-b border-border/50 px-6 py-5">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center border-t border-border/50 px-6 py-4">{footer}</div>
      )}
    </div>
  );
}
