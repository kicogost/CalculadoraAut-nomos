import type { ReactNode } from 'react';
import { useId, useState } from 'react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl bg-surface border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{children}</h2>
      {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-accent-ink hover:brightness-110',
    secondary: 'bg-surface-2 text-ink hover:bg-border',
    ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2',
    danger: 'bg-danger-soft text-danger hover:brightness-95',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'tnum', props.className)} />;
}

/** A small "?" affordance that explains how a figure was derived. */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="Más información"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-muted hover:text-ink"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-64 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-ink shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'positive' | 'warn' | 'danger' | 'accent';
}) {
  const tones = {
    neutral: 'bg-surface-2 text-muted',
    positive: 'bg-positive-soft text-positive',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    accent: 'bg-accent-soft text-accent',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
