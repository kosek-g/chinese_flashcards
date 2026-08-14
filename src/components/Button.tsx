import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200 ease-out',
        'active:scale-95 active:duration-75',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60',
        'disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        variant === 'primary' && [
          'bg-[var(--color-accent)] text-[var(--color-surface-0)]',
          'hover:bg-[var(--color-accent-hover)] hover:shadow-[0_0_16px_var(--color-accent-muted)]',
          'hover:scale-[1.02]',
        ],
        variant === 'ghost' && [
          'bg-transparent text-[var(--color-text-secondary)] border border-transparent',
          'hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]',
        ],
        variant === 'danger' && [
          'bg-transparent text-[var(--color-danger)] border border-transparent',
          'hover:bg-[var(--color-danger)]/10 hover:border-[var(--color-danger)]/30',
        ],
        className,
      )}
    >
      {children}
    </button>
  )
}
