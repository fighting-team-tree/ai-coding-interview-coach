# AI Champion - Claude Code Instructions

## 프로젝트
코딩테스트 → AI 모의면접 브릿지 플랫폼. 사용자 여정(문제→제출→인터뷰→피드백)이 끊기지 않아야 한다.
AI Champion 2026 (8개월 장기전, 제안서 마감 2026-04-24, 결선 12월)

## 기술 스택
- **Web:** Next.js 15, React 19, TypeScript 5.6 strict | Vitest, Playwright
- **API:** FastAPI, Pydantic v2, pydantic-ai | pytest, ruff, uv
- **AI:** LangGraph, Claude API, Deepgram(STT), Cartesia(TTS), LanceDB, PostgreSQL
- **Infra:** Firebase Hosting, GitHub Actions CI | 모노레포: `apps/web`, `apps/api`

## 워크플로우 → `.claude/rules/workflow.md`
탐색 → 브리핑 → **AskUserQuestion으로 승인** → 실행. 계획과 실행은 별도 턴.

## 커밋 → `.claude/rules/commit.md`
`git status/diff` → 논리 단위 분리 → **AskUserQuestion으로 커밋 구성 승인** → 실행

## 코드 품질 → `.claude/rules/code-quality.md`
5차원 리뷰(Correctness·Readability·Architecture·Security·Performance), 지연 목표 1초, AAA 테스트

## 제안서
- `docs/proposal_template.md` 구조 **그대로** 사용 (자체 양식 금지)
- `docs/ai-champion-hwp/` HWP 원본 절대 수정 금지
- 투기적 기능은 "로드맵"으로 명시

## AI/LLM
환각 제어(Hybrid RAG + LangGraph), 무단 크롤링 금지, 비용 폭발·부정행위 리스크 사전 점검

## 출력 언어
기본 **한국어** (기술 용어 영어 허용). 사용자가 영어 요청 시 영어.

## Claude 전용 규칙
`.claude/rules/workflow.md` — 4단계 워크플로우 + AskUserQuestion 사용법
`.claude/rules/commit.md` — 커밋 워크플로우 + AskUserQuestion 승인 방법
`.claude/rules/code-quality.md` — 코드 리뷰 · 테스트 · 보안 기준
