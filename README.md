# Disruptor

Deployable web app combining:

- **AI Disruption Heatmap** — industry disruption scores, jobs view, AI deep dives
- **Investment Analyzer** — S-1 IPO filings, earnings transcripts, presentations

---

## Deploy (3 steps)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create disruptor --public --source=. --push
```

Or create a repo on GitHub manually, then `git remote add origin <url> && git push -u origin main`.

### Step 2 — Deploy on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import your GitHub repo
3. Leave all settings as default — `vercel.json` handles the build
4. Add these **Environment Variables** before deploying:

| Variable | Required for | Where to get it |
|----------|-------------|-----------------|
| `OPENROUTER_API_KEY` | AI deep dives | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `GEMINI_API_KEY` | S-1 / earnings analysis | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free) |
| `DATABASE_URL` | Investment history | [neon.tech](https://neon.tech) free Postgres (use the **pooled** connection string) |

5. Click **Deploy**

### Step 3 — Initialize database

After deploy, push the schema to your production database:

```bash
DATABASE_URL="your-neon-pooled-url" pnpm db:push
```

Your app is live at `https://your-project.vercel.app`.

---

## What works without a database

The **heatmap** (all pages except Investment) works immediately with just the LLM keys. Investment analysis needs `DATABASE_URL`.

## Vercel plan note

S-1 analysis runs 7 LLM calls (~10–30 seconds). You need **Vercel Pro** for the 60-second function timeout. The Hobby plan limits functions to 10 seconds.

---

## Local development

```bash
pnpm install
cp .env.example .env   # add your keys
pnpm db:push

pnpm dev:api   # http://localhost:5080
pnpm dev:app   # http://localhost:5180
```

## CLI deploy (alternative)

```bash
npx vercel login
npx vercel --prod
```

## App routes

| URL | Feature |
|-----|---------|
| `/` | Disruption heatmap |
| `/jobs` | Job exposure view |
| `/investment` | Analyze S-1 / earnings docs |
| `/investment/history` | Past analyses |

## Environment variables

```bash
OPENROUTER_API_KEY=sk-or-v1-...     # deep dives
GEMINI_API_KEY=AIza...              # investment pipeline
DATABASE_URL=postgresql://...       # Neon pooled URL
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet   # optional
GEMINI_MODEL=gemini-2.0-flash                  # optional
```
