import { useState } from 'react'
import { clsx } from 'clsx'
import { useWords } from './hooks/useWords'
import { WordsPage } from './pages/WordsPage'
import { ReviewPage } from './pages/ReviewPage'

type Tab = 'words' | 'review'

const TABS: { id: Tab; label: string }[] = [
  { id: 'review', label: 'Powtórka' },
  { id: 'words', label: 'Słowa' },
]

export default function App() {
  const { words, allTags, addWord, updateWord, deleteWord, markDone, importWords } = useWords()
  const [tab, setTab] = useState<Tab>('review')

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-cjk text-2xl">汉字</span>
            <h1 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Fiszki
            </h1>
          </div>
          <nav className="flex gap-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  tab === id
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === 'review' ? (
          <ReviewPage words={words} allTags={allTags} onMarkDone={markDone} />
        ) : (
          <WordsPage
            words={words}
            allTags={allTags}
            onAdd={addWord}
            onUpdate={updateWord}
            onDelete={deleteWord}
            onImport={importWords}
          />
        )}
      </main>
    </div>
  )
}
