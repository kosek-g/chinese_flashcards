import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadWords, saveWords } from '../storage'
import { DONE_TAG, type Word, type WordDraft } from '../types'

export function useWords() {
  const [words, setWords] = useState<Word[]>(loadWords)

  useEffect(() => {
    saveWords(words)
  }, [words])

  const addWord = useCallback((draft: WordDraft) => {
    setWords((prev) => [{ ...draft, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev])
  }, [])

  const updateWord = useCallback((id: string, draft: WordDraft) => {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, ...draft } : w)))
  }, [])

  const deleteWord = useCallback((id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const markDone = useCallback((id: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id && !w.tags.includes(DONE_TAG) ? { ...w, tags: [...w.tags, DONE_TAG] } : w)),
    )
  }, [])

  /** Merges a backup into the current list; words sharing an id are overwritten. */
  const importWords = useCallback((incoming: Word[]) => {
    setWords((prev) => {
      const byId = new Map(prev.map((w) => [w.id, w]))
      for (const word of incoming) byId.set(word.id, word)
      return [...byId.values()]
    })
  }, [])

  const allTags = useMemo(
    () => [...new Set(words.flatMap((w) => w.tags))].sort((a, b) => a.localeCompare(b)),
    [words],
  )

  return { words, allTags, addWord, updateWord, deleteWord, markDone, importWords }
}
