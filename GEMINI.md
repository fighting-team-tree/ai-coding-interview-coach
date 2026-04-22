# Gemini CLI - Mandates for AI CHAMPION

## Project Objective
- **AI Champion 2026:** 코딩테스트 → AI 모의면접 브릿지 플랫폼 개발.
- **Key Flow:** 사용자 여정(문제 제출 → AI 인터뷰 → 피드백 리포트)의 끊김 없는 연결.
- **Target:** 심사위원 및 기술면접 준비생. "Control-room tone"의 전문적인 인터페이스 지향.

## Tech Stack
- **Web:** Next.js 15, React 19, TypeScript 5.6 strict | Vitest, Playwright
- **API:** FastAPI, Pydantic v2, pydantic-ai | pytest, ruff, uv
- **AI:** LangGraph, Claude API, Deepgram(STT), Cartesia(TTS), LanceDB
- **Infra:** Firebase Hosting, GitHub Actions CI
- **Monorepo:** `apps/web`, `apps/api`

## Design Priority (CRITICAL)
- **DESIGN.md:** 모든 UI/UX 작업은 `DESIGN.md` (Linear 스타일)을 최우선으로 준수.
- **.impeccable.md:** 브랜드 페르소나와 "정확한, 통제된, 자신감 있는" 디자인 톤 유지.
- **Aesthetic:** 다크 테마 기반, 고정밀 그리드, 투명 테두리(`rgba`), Inter Variable 폰트 사용.

## Operational Workflow
1. **Research:** `DESIGN.md`와 기존 코드를 분석하고 가정을 검증.
2. **Strategy:** 구현 계획을 수립하고 사용자에게 브리핑.
3. **Execution:**
   - 대규모/파일 다수 수정 시 `generalist` 또는 `codebase_investigator` 활용.
   - UI 수정 시 반드시 `DESIGN.md` 규칙 체크리스트 준수.
4. **Validation:**
   - Web: `npm run verify:web`
   - API: `npm run verify:api`
   - Cross-stack: `npm run verify`

## Commit Workflow (CRITICAL)

에이전트는 커밋 수행 시 다음 규칙을 엄격히 준수해야 함:

1. **승인 후 실행 (Approval-First):** 사용자의 명시적 승인 없이 `git commit`을 실행하지 않음. "커밋해줘"라는 요청에도 계획 브리핑이 선행되어야 함.
2. **메시지 형식:** `type: 한국어 설명` (예: `feat: 디자인 가이드라인 추가`). 타입(feat, fix, docs, chore 등)은 영문 Conventional Commits를 따름.
3. **턴 분리:** 커밋 계획 제안과 실제 실행은 반드시 서로 다른 대화 턴에서 이루어져야 함. 계획을 제안한 답변에서 바로 커밋 도구를 호출하지 말 것.
4. **선택지 제공:** 커밋 제안 시 반드시 **`ask_user` 도구**를 사용하여 다음 정보를 포함한 선택지를 제시함:
   - 제안하는 커밋 메시지 전문
   - 해당 커밋에 포함된 파일 목록
   - (필요 시) 논리적 단위로 분할된 여러 개의 커밋 옵션
5. **사전 검증:** 커밋 제안 전 `.env`, 시크릿 정보, 의도치 않은 생성 파일이 포함되었는지 `git status`와 `git diff`로 정밀 확인.
6. **추천 옵션:** 가장 적합하다고 판단되는 구성을 첫 번째 옵션으로 배치하고 "(권장)" 표시를 함.

## Approval Policy
- 주요 기능 구현, 파일 구조 변경, 모든 커밋 실행 전에는 반드시 구현 계획을 제시하고 사용자 승인을 받을 것.
- 계획과 실행은 별도 턴으로 진행. (Commit Workflow 포함)

## Communication
- 모든 설명, 질문, 상태 업데이트는 **한국어**로 진행.
- 기술 용어는 영어 또는 표준 표기법 유지.
- `GEMINI.md` 지침은 모든 작업의 근간이며 최우선 순위를 가짐.
