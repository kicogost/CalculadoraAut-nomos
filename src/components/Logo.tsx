import { cx } from './ui';

/**
 * Provisio mark — a whole bar with one piece lifted clear and parked aside in
 * lime: the money you provision before it's spent. Brand colours are fixed.
 */
export function ProvisioMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="18" width="16" height="22" rx="4" fill="#15171C" />
      <rect x="23" y="6" width="16" height="14" rx="4" fill="#C6F24E" />
      <rect x="23" y="6" width="16" height="14" rx="4" fill="none" stroke="#15171C" strokeWidth="1.5" />
    </svg>
  );
}

/** Mark + "Provisio" wordmark. Pass `year` to show the ejercicio subtitle. */
export function BrandLockup({ year, className }: { year?: number; className?: string }) {
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <ProvisioMark className="h-8 w-8" />
      <div className="leading-tight">
        <div className="font-display text-base font-semibold tracking-tight text-ink">Provisio</div>
        {year != null && <div className="text-xs text-muted">Ejercicio {year}</div>}
      </div>
    </div>
  );
}
