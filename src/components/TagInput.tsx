import { useId, useState, type KeyboardEvent } from 'react'
import { normalizeTag } from '../types'

interface Props {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export function TagInput({ value, onChange, suggestions = [] }: Props) {
  const listId = useId()
  const [input, setInput] = useState('')

  const commit = (raw: string) => {
    const tag = normalizeTag(raw)
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
        Tagi
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-xs text-[var(--color-text-primary)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Usuń tag ${tag}`}
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-danger)]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          list={listId}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(input)}
          placeholder={value.length ? '' : 'np. czasowniki, miejsca, done'}
          className="min-w-32 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
        <datalist id={listId}>
          {suggestions.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>
    </div>
  )
}
