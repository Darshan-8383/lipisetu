# LipiSetu — Sanskrit Inscription Translation System

**लिपिसेतु — Ancient Inscription → Digital Understanding**

LipiSetu ("Script Bridge") helps you understand ancient Sanskrit inscriptions found on temple
walls, pillars, copper plates and other historical structures. Upload a photo of an inscription,
and the system extracts the Sanskrit text, translates it into **English and Kannada**, and can
generate a beautiful **translated image** you can download and share. It also includes a complete
**Sanskrit learning module** with alphabet, words, sentences, vocabulary and an interactive quiz.

## Features

- **Inscription Translator** — a guided 6-step pipeline:
  1. Upload an inscription photo (drag & drop, or try a built-in heritage sample)
  2. Enhance the image (grayscale, contrast stretch, brightness, sharpen, threshold)
  3. OCR — extract Sanskrit (Devanagari) text, powered by **OCR** running in your browser
  4. Edit/verify the extracted text (with IAST transliteration)
  5. Translate to **English + Kannada** with scholarly notes
  6. Generate a **translated image** — an AI "museum plaque" (AI image model) and a
     deterministic "Clean Card" (canvas-composed, always available) — then download it
- **AI Assistant** — a floating "Ask AI" chat (bottom-right on every page) powered by OCR. It answers questions about Sanskrit grammar, inscription formulas and the app, and automatically sees the Sanskrit text/translation you are working on in the translator ("explain this word by word"). Uses the same `NEXT_PUBLIC_GEMINI_API_KEY` — no extra setup.
- **Accounts** — register/login with email & password (scrypt-hashed, DB-backed sessions)
- **Personal history** — every saved translation is private to your account (strict per-user isolation)
- **Sanskrit learning module** (open to guests): alphabet, basic words, simple sentences,
  vocabulary (incl. common inscription formulas), and an interactive quiz with saved scores
- **Guest mode** — browse and translate without an account; login is only required to save
  results and view history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API routes (serverless functions on Vercel) |
| Database | PostgreSQL + Prisma ORM (Neon / Vercel Postgres / Supabase — any Postgres) |
| AI | **OCR** (OCR + translation + image generation) — called directly from the browser |
| Auth | Custom email/password auth (scrypt + httpOnly session cookies) |

### Why does OCR run in the browser?

All API calls are made **directly from the user's browser** to Google, using a
`NEXT_PUBLIC_` API key:

- Your API key works from supported regions (e.g. India) — running calls client-side means
  the deployed server's region never matters.
- The key is a free-tier client key by design; your **database URL stays 100% server-side**.
- If the key is ever abused, rotate it at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

The app also has a *built-in* server-side engine as an automatic fallback, but that engine is
only configured on the original development environment — on Vercel the primary (browser-side
OCR) engine is what runs. If the OCR engine is unavailable, the UI shows a clear explanation.

## Quick Start (local)

```bash
# 1. Install dependencies (Node.js 20+ required)
npm install

# 2. Configure environment
cp .env.example .env
#    → set DATABASE_URL (e.g. a free Neon Postgres connection string)
#    → set NEXT_PUBLIC_GEMINI_API_KEY (free key from https://aistudio.google.com/apikey)

# 3. Create the database tables
npm run db:push

# 4. Run
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

### Step 1 — Get a PostgreSQL connection string

The easiest free option is **Neon** (also powers Vercel Postgres):

1. Go to [neon.tech](https://neon.tech) → sign up (free, no credit card)
2. Create a project (any name, e.g. `lipisetu`)
3. Copy the **connection string** — it looks like:
   `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`

> Alternative: Vercel Dashboard → **Storage** → Create Database (Neon) → it can set
> `DATABASE_URL` automatically. Supabase connection strings work too.

### Step 2 — Get an API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free)
2. Create an API key and copy it

### Step 3 — Deploy

**Option A — GitHub (recommended)**

1. Unzip this project, then push it to a GitHub repository:
   ```bash
   git init && git add -A && git commit -m "LipiSetu"
   git remote add origin https://github.com/<you>/lipisetu.git
   git push -u origin main
   ```
2. In [vercel.com](https://vercel.com) → **Add New → Project** → import the repository
3. Framework preset is auto-detected (**Next.js**) — leave build settings as-is
4. Open **Environment Variables** and add:

   | Name | Value | Environments |
   |---|---|---|
   | `DATABASE_URL` | your Neon connection string | Production, Preview, Development |
   | `NEXT_PUBLIC_GEMINI_API_KEY` | your Gemini API key | Production, Preview, Development |
   | `NEXT_PUBLIC_GEMINI_MODEL` *(optional)* | `gemini-3.5-flash-lite` | all |

5. Click **Deploy** 🎉 — the build automatically:
   - runs `prisma generate`
   - runs `prisma db push` (creates/updates the tables in your database)
   - runs `next build`

**Option B — Vercel CLI**

```bash
npm i -g vercel
cd lipisetu
vercel          # link the project
vercel env add DATABASE_URL            # paste your Neon string
vercel env add NEXT_PUBLIC_GEMINI_API_KEY   # paste your Gemini key
vercel --prod
```

> **Note:** `NEXT_PUBLIC_*` variables are inlined at build time. If you change the Gemini key
> later, run **Deployments → Redeploy**. The database URL can change anytime without redeploying
> for reads, but a redeploy is a good idea after schema changes.

### Step 4 — Use it

Open your `https://<project>.vercel.app` URL:

1. **Register** a free account (or continue as guest)
2. Go to **Inscription Translator** → upload a photo or pick a heritage sample
3. Follow the pipeline: Enhance → OCR → Translate → Translated Image
4. **Save** the result — it appears in your private **History**
5. Explore the **Learn** section (alphabet, words, sentences, vocabulary, quiz)

## Environment Variables Reference

| Variable | Required | Where | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Server (secret) | PostgreSQL connection string (Neon/Vercel Postgres/Supabase) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅ | Client (public) | API key for OCR, translation and image generation |
| `NEXT_PUBLIC_GEMINI_MODEL` | — | Client | Preferred model id; auto-discovery falls back to the best available model |

## Project Structure

```
prisma/schema.prisma        # User, Session, Translation, QuizAttempt models
src/app/                    # Next.js App Router
  page.tsx                  # Single-page app shell
  api/
    auth/                   # register, login, logout, me
    ocr/                    # built-in fallback OCR (server engine)
    translate/              # built-in fallback translation (server engine)
    translations/           # save / list / get / delete results (auth required)
    quiz/attempts/          # quiz score history
src/components/lipisetu/    # All views: home, auth, dashboard, translator,
                            # result panel, history, detail, profile, learn/*
src/lib/
  gemini.ts                 # Browser-side OCR integration (model discovery,
                            # OCR, translation, image generation)
  translation-card.ts       # Canvas "Clean Card" translated-image composer
  image-enhance.ts          # Client-side image enhancement engine
  auth.ts                   # scrypt hashing + session cookies
  db.ts                     # Prisma client singleton
public/samples/             # Built-in heritage inscription samples
```

## API Overview

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | — | Create account (name, email, password) |
| `POST /api/auth/login` | — | Login (identifier = email, password) |
| `POST /api/auth/logout` | — | Clear session |
| `GET  /api/auth/me` | — | Current user (null when logged out) |
| `POST /api/ocr` | — | Fallback OCR (returns 503 when the built-in engine is not configured on the deployment) |
| `POST /api/translate` | — | Fallback translation (same 503 behavior) |
| `GET/POST /api/translations` | ✅ | List / save your translation results |
| `GET/DELETE /api/translations/[id]` | ✅ | Fetch / delete one of your results |
| `GET/POST /api/quiz/attempts` | ✅ | Quiz score history |

All OCR-powered processing happens in your browser — no image data is sent to the
LipiSetu server, only saved results are stored in your database.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "The built-in engine is not configured on this deployment" | Expected on Vercel — the built-in engine is a development-environment fallback. Make sure your **API key** is set (`NEXT_PUBLIC_GEMINI_API_KEY`) or use Profile → AI Engine. |
| "User location is not supported for the API use" | Google blocks API calls from unsupported regions. Open the site from a supported region (e.g. India), or use a VPN, or check the key's restrictions. |
| "Invalid API key" / 401 from the API | Generate a fresh key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and update `NEXT_PUBLIC_GEMINI_API_KEY` (then redeploy), or paste it in Profile → AI Engine. |
| Database errors (`P1001`, connection refused) | Check `DATABASE_URL`. For Neon, include `?sslmode=require` and make sure the project isn't paused. |
| `P2021: table does not exist` | The tables aren't in your database — redeploy (the build runs `prisma db push`), or run `npm run db:push` locally against your Neon URL. |
| Saving results says "Please login" | Saving and history require an account — register or login first. |
| Slow first request after idle | Serverless cold start + Neon autosuspend (free tier) — the first request wakes both up. |

## Security Notes

- `DATABASE_URL` is a **server-side secret** — never expose it to the client. Vercel keeps
  server env vars off the client bundle automatically.
- The API key is a client-side (`NEXT_PUBLIC_`) free-tier key by design. Treat it as public:
  restrict it (HTTP referrers) in Google AI Studio if possible, and rotate it if abused.
- Passwords are scrypt-hashed with per-user salts; sessions are httpOnly cookies backed by the
  database and expire after 30 days.

## Credits

Built as the **LipiSetu** project — bridging ancient epigraphy and modern understanding.
Sample inscriptions included for demonstration; learn more about Indian epigraphy at
[asi.nic.in](https://asi.nic.in).
