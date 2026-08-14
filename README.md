# 汉字 · Fiszki

A minimal, local-first flashcard app for learning Chinese, built for my own study routine.
No spaced repetition and no card burying — every card stays available for every review.

## Features

- Words store three fields: 汉字 (character), pinyin and the Polish meaning
- Unlimited free-form tags per word (`czasowniki`, `miejsca`, …)
- Review in both directions: 中文 → polski and polski → 中文
- Filter a review session by tags (selecting several matches any of them)
- The `done` tag excludes a word from reviews; the "Umiem" button adds it during a session
- Chinese characters are rendered large during review
- Add, edit, search and delete words
- JSON backup: export the whole list to a file and import it back

## Data

Everything is stored in the browser's `localStorage` under `chinese-flashcards.words.v1`.
Nothing leaves the machine, but the data is tied to that browser profile — clearing browsing
data or switching browsers loses it, so use **Zapisz kopię** now and then and keep the JSON file safe.
Importing a backup merges it into the current list instead of replacing it.

## Running locally

```bash
npm install
npm run dev
```

The app is served at http://localhost:5180/.

```bash
npm run build    # type-check and build into dist/
npm run preview  # preview the production build
```

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4
