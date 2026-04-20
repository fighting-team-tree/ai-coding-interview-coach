# AI_CHAMPION MVP Scaffold

This repository now includes a runnable MVP scaffold for the coding-test-to-interview bridge:

- `apps/web`: Next.js frontend for problem selection, code submission, interview chat, and report review
- `apps/api`: FastAPI backend with problem loading, AST analysis, Judge0 integration hooks, and a Pydantic AI-driven interview engine
- `data/problems`: curated problem and trap data used to ground the interview flows
- `docs/demo_script.md`: a deterministic recording plan for the demo video

## Recommended local setup

### 1. Backend

```bash
cd apps/api
uv sync --dev
copy .env.example .env
uv run uvicorn app.main:app --reload --port 8000
```

From the repository root you can also use:

```bash
npm run setup:api
npm run dev:api
```

### 2. Frontend

```bash
cd apps/web
npm install
copy .env.example .env.local
npm run dev
```

Frontend defaults to `http://localhost:8000` for the API.

## Verification commands

Run the stack-specific verification commands before finishing code changes:

```bash
npm run verify:web
npm run verify:api
```

Or run both from the repository root:

```bash
npm run verify
```

`verify:web` runs ESLint, TypeScript, Vitest, and a production build.
`verify:api` runs Ruff, Python bytecode compilation, and pytest.

## Codex hook enforcement

This repository now ships project-level Codex hook config in `.codex/`.

- `.codex/config.toml` enables `codex_hooks`
- `.codex/hooks.json` injects the verification policy at session start
- the `Stop` hook checks whether the relevant verification commands succeeded before the task ends

Important limitation:

- OpenAI Codex hooks are currently disabled on native Windows. To get actual hook enforcement, run Codex from WSL/Linux against this same repository.
- Windows users still get the same verification commands and the Linux CI workflow in `.github/workflows/verify.yml`.

## Deploy notes

- Frontend is configured as a static Next.js export so it can be deployed to Firebase Hosting free tier.
- Backend remains a standalone Python service and should be deployed outside Firebase.
- Firebase config lives at the repository root in `firebase.json`.

## Key environment variables

Backend:

- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `FRONTEND_ORIGIN`
- `JUDGE0_BASE_URL`
- `JUDGE0_API_TOKEN`
- `PYDANTIC_AI_MODEL`
- `LLM_API_KEY`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`
