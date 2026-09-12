# LinguaLearn v3

**One language-learning platform. Four courses. Twenty stages each.**

French 🇫🇷 · Spanish 🇪🇸 · Japanese 🇯🇵 · Italian 🇮🇹

A Duolingo-style PWA built with Vite and vanilla JavaScript — ONE reusable
exercise engine that renders every course from declarative data, with
independent per-course progress, XP, hearts, streaks, and achievements.

## First-visit onboarding (French welcome wizard)

Brand-new learners see a 6-step onboarding wizard (entirely in French)
before the language dashboard:

1. **Bienvenue** — mascot welcome
2. **Motivation** — "C'est parti pour apprendre en s'amusant !"
3. **Source survey** — "Comment avez-vous entendu parler de nous ?"
4. **Motivation survey** — "Pourquoi souhaitez-vous apprendre une nouvelle langue ?"
5. **Value proposition** — three benefits with decorative icons
6. **Objectif quotidien** — 5 / 10 / 15 min per day

### How it works

- **Flag**: `localStorage.hasSeenOnboarding === 'true'` — set only when
  the final "Continuer" is clicked (with a daily goal chosen). Reloading
  mid-wizard restarts at step 1; the flag then persists across visits
  until localStorage is cleared.
- **No flash**: `main.js` adds `html.ob-boot-lock` synchronously before
  the app boots, hiding the shell until `AppController` releases it
  (immediately when onboarding already completed, or when the wizard
  finishes).
- **Blocked storage**: the wizard degrades gracefully — the learner can
  still complete onboarding and use the app; only the across-reload
  persistence is lost.
- **Files**: `src/js/components/Onboarding.js` (wizard + state) and
  `src/css/onboarding.css` (scoped `.ob-*` styles — never touches the
  dashboard's CSS).
- **Answers** (`source`, `motivation`, `dailyGoal`) are held in memory
  during the wizard; selections survive back/forward navigation.

### Resetting the flag for testing

Browser devtools console:

```js
localStorage.removeItem('hasSeenOnboarding');
// or via the exposed debug handle:
Onboarding.resetFlag();
```

Then reload. (The Playwright e2e suite seeds the flag with
`addInitScript` for app-flow tests; the wizard has its own test.)

## Quick start

```bash
npm install
npm run dev      # dev server at http://localhost:5173
```

## Architecture

```
ONE APP
  ↓
COURSE SELECTOR (CourseSelector — 4 course cards with live progress)
  ↓
French / Spanish / Japanese / Italian   (src/js/data/courses.js)
  ↓
20 STAGES per course (stage 20 = final challenge + celebration)
  ↓
Reusable exercise engine (Question.js — 14 exercise types)
  ↓
Progress tracking (AppState — per-course records)
  ↓
XP / Hearts / Streak / Achievements — independent per course
```

### The scalable data layer (`src/js/data/courses.js`)

```js
COURSES = {
  french:   { id, name, nativeName, flag: '🇫🇷', locale: 'fr-FR',
              fontClass, stages: [...20 stages] },
  spanish:  { ..., locale: 'es-ES' },
  japanese: { ..., locale: 'ja-JP', fontClass: 'font-japanese' },
  italian:  { ..., locale: 'it-IT' },
}
```

Each stage declares `vocabulary` (foreign, english, emoji, example) and
`exercises` — typed records the engine renders by `type`:

| Exercise type | UI |
|---|---|
| `multiple-choice` | classic options |
| `listening` | TTS audio prompt (auto-plays; typed or options) |
| `translate` | free-typed translation |
| `typing` | free-typed production in the target language |
| `word-bank` / `sentence-build` | tap-to-order word chips |
| `fill-blank` | sentence with a revealed blank |
| `matching` | tap-pair grid |
| `conversation` | dialogue bubbles + reply choice |
| `conjugation` | subject+verb chip + form choice |
| `sentence-completion` | complete-the-form |
| `direction` / `clock` / `map` | scenario-based choice |

**No language-specific components exist.** Adding a fifth course is a data
file — the engine, dashboard, results, celebration, and progress systems
all render it automatically.

### French — the flagship course

Fully detailed across all 20 stages (Greetings → Introductions → Numbers →
Family → Food → Drinks → Colors → Animals → Home → Daily Activities →
Present Tense → Common Verbs → Time → Places → Directions → Shopping →
Restaurant → Travel → Real Conversations → Final Challenge): 131 vocabulary
entries, 129 exercises, every exercise type in use. Spanish, Japanese
(hiragana/katakana/kanji with a Japanese font stack), and Italian follow
the same 20-stage architecture with beginner content adapted to each
language.

### Per-course progress

```js
courseProgress = {
  french:   { currentStage, xp, level, hearts, streak, lessonsCompleted,
              lessonStars, learnedWords, dailyProgress, totals... },
  spanish:  { ... }, japanese: { ... }, italian: { ... }
}
```

- Switching courses (dashboard switcher, welcome screen, settings) only
  moves the active pointer — nothing is ever reset.
- Lesson ids are namespaced (`french:1`, `spanish:1`) so numeric ids
  can never collide across courses.
- A flat snapshot of the ACTIVE course is kept in sync for the
  cloud-sync merge-max contract and older consumers.
- Legacy single-language records are migrated automatically on load.

### Audio

Web Speech API; the locale is auto-detected from the course
(`fr-FR`, `es-ES`, `ja-JP`, `it-IT`). When TTS is unavailable the listening
UI shows the text so the exercise stays answerable.

## Testing (no-dependency runner)

The repo runs on Node 12+ (including Android/Termux) via a lightweight
test runner built on `node:assert` with its own DOM shim — the same test
files also run under vitest where available.

```bash
npm test              # unit tests (runner.mjs)
npm run test:runtime  # full-app runtime harness (boots src/js/main.js)
npm run test:cross    # cross-course isolation + legacy migration
npm run test:all      # everything
npm run lint          # eslint (src, netlify, tests/unit)
npm run build         # production build to dist/
```

## Project structure

```
index.html                 # app shell (header + screen containers)
src/
  css/main.css             # design tokens + component styles (+ course/exercise/celebration UI)
  css/onboarding.css       # scoped wizard styles (.ob-* + boot lock — no dashboard impact)
  js/
    main.js                # entry: boots AppController (+ onboarding boot lock)
    app/AppController.js   # screen orchestration, course switching, celebration wiring
    app/AppState.js        # PER-COURSE progress records + persistence + streaks
    data/courses.js        # ★ the 4-course catalog (all content)
    data/lessonData.js     # compat re-export (LESSON_DATA / LANGUAGE_INFO)
    components/
      Onboarding.js        # first-visit 6-step French wizard (localStorage-gated)
      CourseSelector.js    # course cards (welcome + switcher + profile)
      Welcome.js           # thin wrapper over CourseSelector
      Dashboard.js         # 20-stage path, stars, locks, per-course sidebar
      Lesson.js            # stage runner: hearts, XP, TTS, SRS integration
      Question.js          # ★ THE reusable exercise engine (14 types)
      Results.js           # lesson results + final-challenge celebration
      ReviewModal.js, LeaderboardModal.js
    storage/StorageManager.js   # IndexedDB + localStorage fallback
    utils/               # achievements, modal, spacedRepetition, tts
tests/
  runner.mjs             # lightweight vitest-compatible runner
  dom-shim.mjs           # dependency-free DOM implementation
  runtime-harness.mjs    # boots the real app + drives the full flow
  cross-language-test.mjs
  unit/*.test.js         # courses, courseProgress, merge, modal, SRS, welcome
```

## Deployment (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
