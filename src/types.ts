export interface Word {
  id: string
  hanzi: string
  pinyin: string
  polish: string
  tags: string[]
  createdAt: number
}

export type WordDraft = Omit<Word, 'id' | 'createdAt'>

/** Direction of a review session: what is shown first. */
export type Direction = 'zh-pl' | 'pl-zh'

/** Whether the Chinese side is read on screen or played aloud. */
export type ReviewMode = 'text' | 'speech'

/** Words carrying this tag are never shown during review. */
export const DONE_TAG = 'done'

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-')
}
