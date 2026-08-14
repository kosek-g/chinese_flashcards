import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
