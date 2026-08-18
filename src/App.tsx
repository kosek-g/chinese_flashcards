import { useState } from 'react'
import { clsx } from 'clsx'
import { setPassword } from './api'
import { Button } from './components/Button'
import { Card } from './components/Card'
import { UnlockScreen } from './components/UnlockScreen'
import { useWords } from './hooks/useWords'
import { WordsPage } from './pages/WordsPage'
import { ReviewPage } from './pages/ReviewPage'

type Tab = 'words' | 'review'

const TABS: { id: Tab; label: string }[] = [
  { id: 'review', label: 'Powtórka' },
  { id: 'words', label: 'Słowa' },
]

export default function App() {
  const { words, allTags, status, error, refresh, addWord, updateWord, deleteWord, markDone, importWords } =
    useWords()
  const [tab, setTab] = useState<Tab>('review')

  if (status === 'locked') {
    return (
      <UnlockScreen
        onUnlock={(password) => {
          setPassword(password)
          void refresh()
        }}
      />
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Ładowanie…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
          <Button onClick={() => void refresh()}>Spróbuj ponownie</Button>
        </Card>
      </div>
    )
  }

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

      {error && (
        <p className="mx-auto max-w-5xl px-6 pt-4 text-sm text-[var(--color-danger)]">{error}</p>
      )}

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
