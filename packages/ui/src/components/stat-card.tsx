import { cn } from '../lib/utils.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

/** Statistics card for dashboard overview */
export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/70 p-5 text-card-foreground',
        'bg-gradient-to-br from-[hsl(var(--card)_/_0.95)] to-[hsl(var(--background)_/_0.4)]',
        'transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-primary/30',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2.5">
        <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <p
            className={cn(
              'mt-2 text-xs font-medium',
              trend.value >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
