import { useEffect, useRef } from 'react';

/**
 * Poll `fn` while `enabled`. Interval only runs for the active view.
 */
export function usePoll(fn: () => void | Promise<void>, intervalMs: number, enabled: boolean): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      void fnRef.current();
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs, enabled]);
}
