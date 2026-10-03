import { normalizeTag, type Word, type WordDraft } from '../src/types'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  APP_PASSWORD: string
  AZURE_SPEECH_KEY?: string
  AZURE_SPEECH_REGION?: string
  AZURE_SPEECH_VOICE?: string
  AZURE_SPEECH_RATE?: string
}

interface WordRow {
  id: string
  hanzi: string
  pinyin: string
  polish: string
  tags: string
  created_at: number
}

interface ReviewDayRow {
  day: string
  reviewed: number
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'
const DEFAULT_RATE = '-10%'
const AUDIO_HEADERS = { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000' }

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

async function listReviewDays(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT day, reviewed FROM review_days ORDER BY day',
  ).all<ReviewDayRow>()
  return json(results)
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '&') return '&amp;'
    if (char === "'") return '&apos;'
    return '&quot;'
  })
}

async function audioCacheKey(voice: string, rate: string, text: string): Promise<Request> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${voice}|${rate}|${text}`),
  )
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return new Request(`https://speech.cache/${hash}.mp3`)
}

/** Proxies Azure neural TTS so the key stays server-side, and caches every clip at the edge. */
async function synthesize(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
    return json({ error: 'Speech is not configured' }, 503)
  }

  const payload = await readJson(request)
  const text = (payload as { text?: unknown } | undefined)?.text
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_FIELD_LENGTH) {
    return json({ error: 'Invalid text' }, 400)
  }

  const voice = env.AZURE_SPEECH_VOICE ?? DEFAULT_VOICE
  const rate = env.AZURE_SPEECH_RATE ?? DEFAULT_RATE
  const cacheKey = await audioCacheKey(voice, rate, text)
  const cached = await caches.default.match(cacheKey)
  if (cached) return cached

  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">` +
    `<voice name="${voice}"><prosody rate="${rate}">${escapeXml(text)}</prosody></voice></speak>`

  const upstream = await fetch(
    `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        // Azure answers 400 to any request without a User-Agent, and Workers sends none.
        'User-Agent': 'chinese-flashcards',
      },
      body: ssml,
    },
  )

  if (!upstream.ok) {
    console.error('Azure speech failed', upstream.status)
    return json({ error: 'Speech service unavailable' }, 502)
  }

  const audio = new Response(upstream.body, { headers: AUDIO_HEADERS })
  ctx.waitUntil(caches.default.put(cacheKey, audio.clone()))
  return audio
}

/** Each reviewed card bumps its day, so an interrupted session still counts. */
async function recordReview(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request)
  const day = (payload as { day?: unknown } | undefined)?.day
  if (typeof day !== 'string' || !DAY_PATTERN.test(day)) return json({ error: 'Invalid day' }, 400)

  await env.DB.prepare(
    'INSERT INTO review_days (day, reviewed) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET reviewed = reviewed + 1',
  )
    .bind(day)
    .run()
  return json({ ok: true })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401)

    const [resource, id] = url.pathname.split('/').filter(Boolean).slice(1)

    try {
      if (resource === 'reviews') {
        if (request.method === 'GET') return await listReviewDays(env)
        if (request.method === 'POST') return await recordReview(request, env)
        return json({ error: 'Method not allowed' }, 405)
      }

      if (resource === 'speech') {
        if (request.method === 'POST') return await synthesize(request, env, ctx)
        return json({ error: 'Method not allowed' }, 405)
      }

      if (resource !== 'words') return json({ error: 'Not found' }, 404)

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
