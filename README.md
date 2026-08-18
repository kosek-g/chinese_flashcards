# 汉字 · Fiszki

A minimal flashcard app for learning Chinese, built for my own study routine.
No spaced repetition and no card burying — every card stays available for every review.

Runs on Cloudflare: a Worker serves the React SPA and a small JSON API backed by a D1 database,
so the same word list is available on every device, including mobile.

## Features

- Words store three fields: 汉字 (character), pinyin and the Polish meaning
- Unlimited free-form tags per word (`czasowniki`, `miejsca`, …)
- Review in both directions: 中文 → polski and polski → 中文
- Filter a review session by tags (selecting several matches any of them)
- The `done` tag excludes a word from reviews; the "Umiem" button adds it during a session
- Chinese characters are rendered large during review
- Add, edit, search and delete words
- JSON backup: export the whole list to a file, or upload a file back into the database

## Architecture

| Part | Location |
|------|----------|
| React SPA | `src/` |
| Worker API (`/api/words`) | `worker/index.ts` |
| D1 schema | `migrations/` |
| Cloudflare config | `wrangler.jsonc` |

The API is protected by a single shared password held in the `APP_PASSWORD` Worker secret.
The browser sends it as a bearer token and keeps it in `localStorage`, so the unlock screen
only appears once per device.

## Local development

```bash
npm install
npx wrangler d1 migrations apply chinese-flashcards --local   # once
npm run dev
```

The app is served at http://localhost:5180/ with a local D1 database.
The local password comes from `.dev.vars` (git-ignored).

## Deploying

```bash
npx wrangler login
npx wrangler d1 create chinese-flashcards        # copy the id into wrangler.jsonc
npm run db:migrate                               # apply migrations to the remote database
npx wrangler secret put APP_PASSWORD             # set the shared password
npm run deploy
```

Later deploys are just `npm run deploy`.

## Backups

Time Travel gives D1 point-in-time recovery for the last few days, but the **Zapisz kopię**
button is still the simplest safety net — it downloads the whole list as JSON.
**Wczytaj kopię** uploads a file back into the database, matching existing words by id.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Cloudflare Workers · D1
