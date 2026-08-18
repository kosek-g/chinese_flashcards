import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, UnauthorizedError } from '../api'
import { DONE_TAG, type Word, type WordDraft } from '../types'

export type Status = 'loading' | 'ready' | 'locked' | 'error'

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nieznany błąd.'
}

export function useWords() {
  const [words, setWords] = useState<Word[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      setWords(await api.list())
      setError('')
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        setStatus('locked')
      } else {
        setError(toMessage(err))
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const mutate = useCallback(async (action: () => Promise<void>) => {
    try {
      await action()
      setError('')
    } catch (err) {
      if (err instanceof UnauthorizedError) setStatus('locked')
      else setError(toMessage(err))
    }
  }, [])

  const addWord = useCallback(
    (draft: WordDraft) =>
      mutate(async () => {
        const created = await api.create(draft)
        setWords((prev) => [created, ...prev])
      }),
    [mutate],
  )

  const updateWord = useCallback(
    (id: string, draft: WordDraft) =>
      mutate(async () => {
        const updated = await api.update(id, draft)
        setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      }),
    [mutate],
  )

  const deleteWord = useCallback(
    (id: string) =>
      mutate(async () => {
        await api.remove(id)
        setWords((prev) => prev.filter((w) => w.id !== id))
      }),
    [mutate],
  )

  const markDone = useCallback(
    (word: Word) =>
      mutate(async () => {
        if (word.tags.includes(DONE_TAG)) return
        const updated = await api.update(word.id, { ...word, tags: [...word.tags, DONE_TAG] })
        setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      }),
    [mutate],
  )

  const importWords = useCallback(
    (incoming: Word[]) =>
      mutate(async () => {
        setWords(await api.import(incoming))
      }),
    [mutate],
  )

  const allTags = useMemo(
    () => [...new Set(words.flatMap((w) => w.tags))].sort((a, b) => a.localeCompare(b)),
    [words],
  )

  return { words, allTags, status, error, refresh, addWord, updateWord, deleteWord, markDone, importWords }
}
