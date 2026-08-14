import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <input
        {...rest}
        className={clsx(
          'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm',
          'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'transition-colors focus:border-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-muted)]',
          className,
        )}
      />
    </div>
  )
}
