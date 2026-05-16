# Wild Stories TV (WSTV)

Wild Stories TV is a Next.js prompt studio for building, validating, and packaging AI-generated wildlife reels. The repo is set up for a production workflow where GitHub pull requests generate preview deployments and `main` drives production on Vercel.

## Project overview

WSTV helps produce a structured wildlife-reel workflow around:

- concept and wildlife matchup setup
- prompt generation and packaging
- platform-ready publishing copy
- evidence and publish-readiness review

This repository uses GitHub Actions for validation and Vercel for preview and production deployments.

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- Playwright
- Vercel

## Node.js requirement

- Node.js 20.x
- npm 10+ recommended

The CI workflow runs on Node.js 20, so matching that version locally will give the closest results.

## Getting started

1. Clone the repo.
2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the values you actually need for local development.
4. Install dependencies:

   ```bash
   npm ci
   ```

   If you are intentionally updating the lockfile, use:

   ```bash
   npm install
   ```

## Environment setup

- Start from `.env.example`
- Copy it to `.env.local`
- Never commit real secrets
- Keep production secrets in Vercel project environment variables, not in the repository

### Environment variables

- `NEXT_PUBLIC_APP_NAME` — optional public label
- `NEXT_PUBLIC_API_URL` — optional public API override
- `GEMINI_API_KEY` — required for Gemini-backed generation flows
- `GEMINI_MODEL` — optional model override
- `ANTHROPIC_API_KEY` — optional, only if Anthropic-backed features are used
- `CLAUDE_MODEL` — optional model override
- `BLOB_READ_WRITE_TOKEN` — required for blob-backed preset and media flows
- `PRESET_LIBRARY_AUTH_SECRET` — required in production for preset-library auth

Cloud preset libraries require `BLOB_READ_WRITE_TOKEN` and
`PRESET_LIBRARY_AUTH_SECRET`. Without them,
`/api/preset-library/session` returns `503` with `available:false`, and local
presets remain active.

## Local development

Run the app locally with:

```bash
npm run dev
```

The standard production-oriented validation commands are:

```bash
npm run lint
npm run test:run
npm run coverage
npm run build
npm run test:e2e
```

## CI

GitHub Actions runs the following jobs with stable names that are suitable for branch protection:

- `lint`
- `test`
- `build`
- `coverage`
- `e2e`

The CI workflow uses:

- `npm ci` for reproducible installs
- Playwright browser installation for browser smoke coverage
- pull-request validation before merge
- production validation on pushes to `main`

## Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo: `wildlife-cinematic-pro/wild-stories-tv-wstv`
3. Let Vercel auto-detect **Next.js**
4. Add the required environment variables in the Vercel dashboard
5. Deploy

Deployment behavior:

- push to `main` -> production deploy
- pull request -> preview deploy

CI and deployment notes:

- GitHub Actions CI runs first
- Vercel deploys from GitHub integration after the push or PR event
- CI does **not** automatically block deploy unless branch protection and required checks are enabled

## Production Safety

Recommended GitHub branch protection for `main`:

1. **Require a pull request before merging**
2. **Require status checks to pass before merging**
3. Select these required checks:
   - `lint`
   - `test`
   - `build`
   - `e2e`
4. **Require branches to be up to date before merging**
5. **Require conversation resolution before merging**
6. **Block force pushes**
7. **Block branch deletion**

Optional but recommended:

- squash merge only
- linear history
- dismiss stale approvals when new commits are pushed

These settings make `main` safer because only reviewed, green builds can merge and trigger production deployment.
