import type { Word, WordDraft } from './types'

const PASSWORD_KEY = 'chinese-flashcards.password'

export class UnauthorizedError extends Error {}

export function getPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) ?? ''
}

export function setPassword(password: string): void {
  localStorage.setItem(PASSWORD_KEY, password)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getPassword()}`,
    },
  })

  if (response.status === 401) throw new UnauthorizedError('Nieprawidłowe hasło.')
  if (!response.ok) throw new Error(`Błąd serwera (${response.status}).`)
  return (await response.json()) as T
}

export const api = {
  list: () => request<Word[]>('/words'),
  create: (draft: WordDraft) => request<Word>('/words', { method: 'POST', body: JSON.stringify(draft) }),
  update: (id: string, draft: WordDraft) =>
    request<Word>(`/words/${id}`, { method: 'PUT', body: JSON.stringify(draft) }),
  remove: (id: string) => request<{ ok: true }>(`/words/${id}`, { method: 'DELETE' }),
  import: (words: Word[]) => request<Word[]>('/words/import', { method: 'POST', body: JSON.stringify(words) }),
}
