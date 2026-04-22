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
- `.codex/hooks/settings.toml` is the source of truth for platform and shell policy
- `.codex/hooks/render_hooks.py` renders the active `.codex/hooks.json`
- `.codex/hooks.json` injects the verification policy at session start
- the `Stop` hook checks whether the relevant verification commands succeeded before the task ends

Render the hook file after changing shell policy or moving between operating systems:

```bash
python .codex/hooks/render_hooks.py
```

Windows shell defaults to `auto`, which prefers `pwsh`, then `powershell`, then `cmd`.
You can override it when needed:

```bash
python .codex/hooks/render_hooks.py --windows-shell pwsh
python .codex/hooks/render_hooks.py --windows-shell cmd
```

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
- `INTERVIEW_MODEL`
- `REPORT_MODEL`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`

## Competition video pipeline

대회 제출용 자동 데모 영상 파이프라인을 추가했습니다.

```bash
npm run video:check
npm run video:competition -- --scenario ai-champion-core --mode demo
```

- raw clip 생성: `tools/competition-video/record.mjs`
- mp4 조합: `tools/competition-video/compose.mjs`
- 시나리오 정의: `tools/competition-video/scenarios/`
- 자세한 사용법: `tools/competition-video/README.md`
