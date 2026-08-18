import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Input } from '../components/Input'
import { TagInput } from '../components/TagInput'
import { downloadBackup, readBackup } from '../backup'
import { DONE_TAG, type Word, type WordDraft } from '../types'

const EMPTY_DRAFT: WordDraft = { hanzi: '', pinyin: '', polish: '', tags: [] }

interface Props {
  words: Word[]
  allTags: string[]
  onAdd: (draft: WordDraft) => void
  onUpdate: (id: string, draft: WordDraft) => void
  onDelete: (id: string) => void
  onImport: (words: Word[]) => Promise<void>
}

export function WordsPage({ words, allTags, onAdd, onUpdate, onDelete, onImport }: Props) {
  const [draft, setDraft] = useState<WordDraft>(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return words
      .filter((w) => {
        const matchesTag = tagFilter === null || w.tags.includes(tagFilter)
        const matchesQuery =
          query === '' ||
          w.hanzi.includes(query) ||
          w.pinyin.toLowerCase().includes(query) ||
          w.polish.toLowerCase().includes(query)
        return matchesTag && matchesQuery
      })
      .sort((a, b) => a.polish.localeCompare(b.polish, 'pl'))
  }, [words, search, tagFilter])

  const resetForm = () => {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleaned: WordDraft = {
      hanzi: draft.hanzi.trim(),
      pinyin: draft.pinyin.trim(),
      polish: draft.polish.trim(),
      tags: draft.tags,
    }
    if (!cleaned.hanzi || !cleaned.polish) return

    if (editingId) onUpdate(editingId, cleaned)
    else onAdd(cleaned)
    resetForm()
  }

  const startEdit = (word: Word) => {
    setEditingId(word.id)
    setDraft({ hanzi: word.hanzi, pinyin: word.pinyin, polish: word.polish, tags: word.tags })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackupFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = await readBackup(file)
      await onImport(imported)
      window.alert(`Wysłano ${imported.length} słów do bazy.`)
    } catch {
      window.alert('Nie udało się wczytać pliku kopii.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card className="h-fit lg:sticky lg:top-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {editingId ? 'Edytuj słowo' : 'Nowe słowo'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Znak (汉字)"
            value={draft.hanzi}
            onChange={(e) => setDraft({ ...draft, hanzi: e.target.value })}
            placeholder="半"
            className="font-cjk text-2xl"
            required
          />
          <Input
            label="Pinyin"
            value={draft.pinyin}
            onChange={(e) => setDraft({ ...draft, pinyin: e.target.value })}
            placeholder="bàn"
          />
          <Input
            label="Znaczenie (PL)"
            value={draft.polish}
            onChange={(e) => setDraft({ ...draft, polish: e.target.value })}
            placeholder="pół"
            required
          />
          <TagInput
            value={draft.tags}
            onChange={(tags) => setDraft({ ...draft, tags })}
            suggestions={allTags}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Tag „{DONE_TAG}” wyklucza słowo z powtórek.
          </p>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingId ? 'Zapisz zmiany' : 'Dodaj słowo'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Anuluj
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po znaku, pinyin lub znaczeniu…"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Chip active={tagFilter === null} onClick={() => setTagFilter(null)}>
                wszystkie
              </Chip>
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  active={tagFilter === tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            {visible.length} z {words.length} słów
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => downloadBackup(words)}
              disabled={words.length === 0}
            >
              Zapisz kopię
            </Button>
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Wczytaj kopię
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleBackupFile}
              className="hidden"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <Card className="text-center text-sm text-[var(--color-text-secondary)]">
            Brak słów do wyświetlenia.
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((word) => (
              <li
                key={word.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3 transition-colors hover:border-[var(--color-text-muted)]"
              >
                <span className="font-cjk text-4xl leading-none">{word.hanzi}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-sm text-[var(--color-text-secondary)]">{word.pinyin}</span>
                    <span className="text-base text-[var(--color-text-primary)]">{word.polish}</span>
                  </div>
                  {word.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {word.tags.map((tag) => (
                        <span
                          key={tag}
                          className={
                            tag === DONE_TAG
                              ? 'rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] text-[var(--color-success)]'
                              : 'rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]'
                          }
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(word)}>
                    Edytuj
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Usunąć „${word.hanzi}”?`)) onDelete(word.id)
                    }}
                  >
                    Usuń
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
