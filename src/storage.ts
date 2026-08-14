import type { Word } from './types'

const STORAGE_KEY = 'chinese-flashcards.words.v1'

export function loadWords(): Word[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Word[]) : []
  } catch {
    return []
  }
}

export function saveWords(words: Word[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
}
