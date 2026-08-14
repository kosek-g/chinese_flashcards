import type { Word } from './types'

export function downloadBackup(words: Word[]): void {
  const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fiszki-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function isWord(value: unknown): value is Word {
  const w = value as Partial<Word> | null
  return (
    typeof w === 'object' &&
    w !== null &&
    typeof w.id === 'string' &&
    typeof w.hanzi === 'string' &&
    typeof w.pinyin === 'string' &&
    typeof w.polish === 'string' &&
    Array.isArray(w.tags)
  )
}

export async function readBackup(file: File): Promise<Word[]> {
  const parsed: unknown = JSON.parse(await file.text())
  if (!Array.isArray(parsed)) throw new Error('Nieprawidłowy format pliku.')
  return parsed.filter(isWord)
}
