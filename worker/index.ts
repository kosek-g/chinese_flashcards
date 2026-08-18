import { normalizeTag, type Word, type WordDraft } from '../src/types'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  APP_PASSWORD: string
}

interface WordRow {
  id: string
  hanzi: string
  pinyin: string
  polish: string
  tags: string
  created_at: number
}

const MAX_FIELD_LENGTH = 200
const MAX_TAGS = 50
const MAX_IMPORT_SIZE = 5000
const IMPORT_BATCH_SIZE = 500

const INSERT_SQL =
  'INSERT OR REPLACE INTO words (id, hanzi, pinyin, polish, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

function toWord(row: WordRow): Word {
  let tags: string[] = []
  try {
    const parsed: unknown = JSON.parse(row.tags)
    if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === 'string')
  } catch {
    // A corrupt tags column should not take the whole word down.
  }
  return {
    id: row.id,
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    polish: row.polish,
    tags,
    createdAt: row.created_at,
  }
}

function parseDraft(value: unknown): WordDraft | null {
  if (typeof value !== 'object' || value === null) return null
  const { hanzi, pinyin, polish, tags } = value as Record<string, unknown>
  if (typeof hanzi !== 'string' || typeof polish !== 'string') return null

  const draft: WordDraft = {
    hanzi: hanzi.trim().slice(0, MAX_FIELD_LENGTH),
    pinyin: (typeof pinyin === 'string' ? pinyin : '').trim().slice(0, MAX_FIELD_LENGTH),
    polish: polish.trim().slice(0, MAX_FIELD_LENGTH),
    tags: Array.isArray(tags)
      ? [
          ...new Set(
            tags
              .filter((tag): tag is string => typeof tag === 'string')
              .map(normalizeTag)
              .filter((tag) => tag.length > 0),
          ),
        ].slice(0, MAX_TAGS)
      : [],
  }

  return draft.hanzi && draft.polish ? draft : null
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

function isAuthorized(request: Request, env: Env): boolean {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!env.APP_PASSWORD || !token) return false

  const encoder = new TextEncoder()
  const provided = encoder.encode(token)
  const expected = encoder.encode(env.APP_PASSWORD)
  if (provided.byteLength !== expected.byteLength) return false
  return crypto.subtle.timingSafeEqual(provided, expected)
}

async function listWords(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM words ORDER BY created_at DESC').all<WordRow>()
  return json(results.map(toWord))
}

async function createWord(request: Request, env: Env): Promise<Response> {
  const draft = parseDraft(await readJson(request))
  if (!draft) return json({ error: 'Invalid word' }, 400)

  const word: Word = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() }
  await env.DB.prepare(INSERT_SQL)
    .bind(word.id, word.hanzi, word.pinyin, word.polish, JSON.stringify(word.tags), word.createdAt)
    .run()
  return json(word, 201)
}

async function updateWord(id: string, request: Request, env: Env): Promise<Response> {
  const draft = parseDraft(await readJson(request))
  if (!draft) return json({ error: 'Invalid word' }, 400)

  const row = await env.DB.prepare(
    'UPDATE words SET hanzi = ?, pinyin = ?, polish = ?, tags = ? WHERE id = ? RETURNING *',
  )
    .bind(draft.hanzi, draft.pinyin, draft.polish, JSON.stringify(draft.tags), id)
    .first<WordRow>()

  return row ? json(toWord(row)) : json({ error: 'Not found' }, 404)
}

async function deleteWord(id: string, env: Env): Promise<Response> {
  const { meta } = await env.DB.prepare('DELETE FROM words WHERE id = ?').bind(id).run()
  return meta.changes > 0 ? json({ ok: true }) : json({ error: 'Not found' }, 404)
}

async function importWords(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request)
  if (!Array.isArray(payload)) return json({ error: 'Expected an array of words' }, 400)
  if (payload.length > MAX_IMPORT_SIZE) return json({ error: 'Too many words' }, 413)

  const statements = payload.flatMap((item: unknown) => {
    const draft = parseDraft(item)
    if (!draft) return []
    const { id, createdAt } = item as Record<string, unknown>
    return [
      env.DB.prepare(INSERT_SQL).bind(
        typeof id === 'string' && id ? id : crypto.randomUUID(),
        draft.hanzi,
        draft.pinyin,
        draft.polish,
        JSON.stringify(draft.tags),
        typeof createdAt === 'number' ? createdAt : Date.now(),
      ),
    ]
  })

  for (let i = 0; i < statements.length; i += IMPORT_BATCH_SIZE) {
    await env.DB.batch(statements.slice(i, i + IMPORT_BATCH_SIZE))
  }
  return listWords(env)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401)

    const [resource, id] = url.pathname.split('/').filter(Boolean).slice(1)
    if (resource !== 'words') return json({ error: 'Not found' }, 404)

    try {
      if (id === undefined) {
        if (request.method === 'GET') return await listWords(env)
        if (request.method === 'POST') return await createWord(request, env)
      } else if (id === 'import') {
        if (request.method === 'POST') return await importWords(request, env)
      } else {
        if (request.method === 'PUT') return await updateWord(id, request, env)
        if (request.method === 'DELETE') return await deleteWord(id, env)
      }
      return json({ error: 'Method not allowed' }, 405)
    } catch (error) {
      console.error('Request failed', error)
      return json({ error: 'Server error' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
