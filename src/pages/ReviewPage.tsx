import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { DONE_TAG, type Direction, type Word } from '../types'

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface Props {
  words: Word[]
  allTags: string[]
  onMarkDone: (word: Word) => void
}

export function ReviewPage({ words, allTags, onMarkDone }: Props) {
  const [direction, setDirection] = useState<Direction>('zh-pl')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deck, setDeck] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const reviewTags = useMemo(() => allTags.filter((tag) => tag !== DONE_TAG), [allTags])

  const eligible = useMemo(
    () =>
      words.filter(
        (w) =>
          !w.tags.includes(DONE_TAG) &&
          (selectedTags.length === 0 || selectedTags.some((tag) => w.tags.includes(tag))),
      ),
    [words, selectedTags],
  )

  const wordsById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  // Words deleted mid-session are dropped from the deck.
  const activeDeck = useMemo(() => deck?.filter((id) => wordsById.has(id)) ?? null, [deck, wordsById])

  const current = activeDeck && index < activeDeck.length ? wordsById.get(activeDeck[index]) : undefined
  const finished = activeDeck !== null && index >= activeDeck.length

  const start = () => {
    setDeck(shuffle(eligible.map((w) => w.id)))
    setIndex(0)
    setRevealed(false)
  }

  const next = () => {
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  useEffect(() => {
    if (deck === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      e.preventDefault()
      if (revealed) next()
      else setRevealed(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deck, revealed])

  if (deck === null) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Kierunek
            </h2>
            <div className="flex gap-2">
              <Button
                variant={direction === 'zh-pl' ? 'primary' : 'ghost'}
                onClick={() => setDirection('zh-pl')}
                className="flex-1"
              >
                中文 → polski
              </Button>
              <Button
                variant={direction === 'pl-zh' ? 'primary' : 'ghost'}
                onClick={() => setDirection('pl-zh')}
                className="flex-1"
              >
                polski → 中文
              </Button>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Tagi
            </h2>
            {reviewTags.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">Brak tagów.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <Chip active={selectedTags.length === 0} onClick={() => setSelectedTags([])}>
                  wszystkie
                </Chip>
                {reviewTags.map((tag) => (
                  <Chip
                    key={tag}
                    active={selectedTags.includes(tag)}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Wybranie kilku tagów pokazuje słowa z dowolnym z nich. Słowa z tagiem „{DONE_TAG}” są pomijane.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-5">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {eligible.length} słów do powtórki
            </span>
            <Button onClick={start} disabled={eligible.length === 0}>
              Rozpocznij
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (finished || !current) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="flex flex-col items-center gap-5 py-12 text-center">
          <p className="text-2xl">Koniec sesji</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Powtórzone słowa: {activeDeck?.length ?? 0}
          </p>
          <div className="flex gap-2">
            <Button onClick={start}>Jeszcze raz</Button>
            <Button variant="ghost" onClick={() => setDeck(null)}>
              Zmień ustawienia
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const showChineseFirst = direction === 'zh-pl'

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>
          {index + 1} / {activeDeck?.length}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setDeck(null)}>
          Zakończ
        </Button>
      </div>

      <Card className="flex min-h-80 flex-col items-center justify-center gap-6 py-12 text-center">
        {showChineseFirst ? (
          <>
            <div>
              <p className="font-cjk text-8xl leading-tight">{current.hanzi}</p>
              {current.pinyin && (
                <p className="mt-3 text-3xl text-[var(--color-text-secondary)]">{current.pinyin}</p>
              )}
            </div>
            {revealed && (
              <p className="border-t border-[var(--color-border)] pt-6 text-4xl">{current.polish}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-4xl">{current.polish}</p>
            {revealed && (
              <div className="border-t border-[var(--color-border)] pt-6">
                <p className="font-cjk text-8xl leading-tight">{current.hanzi}</p>
                {current.pinyin && (
                  <p className="mt-3 text-3xl text-[var(--color-text-secondary)]">{current.pinyin}</p>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <div className="flex items-center gap-2">
        {revealed ? (
          <Button onClick={next} className="flex-1">
            Następne
          </Button>
        ) : (
          <Button onClick={() => setRevealed(true)} className="flex-1">
            Pokaż odpowiedź
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            onMarkDone(current)
            next()
          }}
          title={`Dodaje tag „${DONE_TAG}” i wyklucza słowo z powtórek`}
        >
          Umiem
        </Button>
      </div>
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Spacja / Enter — pokaż odpowiedź i przejdź dalej
      </p>
    </div>
  )
}
