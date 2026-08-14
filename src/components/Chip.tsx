import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-surface-0)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        className,
      )}
    >
      {children}
    </button>
  )
}
