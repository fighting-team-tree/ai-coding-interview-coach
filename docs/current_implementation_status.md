# 현재 구현 상태 요약

기준일: 2026-04-23

## 한 줄 요약

현재 저장소는 `코딩 테스트 제출 -> 코드 기반 질문 분기 -> 3축 피드백` 코어 데모를 실제로 실행 가능한 수준까지 구현했다. 반면 운영형 서비스에 필요한 영속 저장, 기관 대시보드, 강사 override, 음성 파이프라인 등은 아직 문서상 확장 범위에 머물러 있다.

## 현재 구현된 것

### 1. 웹 코어 흐름

- 홈에서 대표 시연 문제로 진입할 수 있다.
- 대표 문제 화면에서 서로 다른 demo variant를 로드할 수 있다.
- 코드 제출 이후 질문 흐름, 질문 근거, AST 요약, 3축 피드백을 한 화면에서 확인할 수 있다.
- 홈 카피는 현재 `통제형 기술면접 평가 시스템`과 기관 운영 관점을 직접 노출하는 방향으로 정렬되어 있다.

관련 구현:
- `apps/web/app/page.tsx`
- `apps/web/components/problem-workspace.tsx`
- `apps/web/lib/problem-catalog.ts`

### 2. 백엔드 인터뷰 엔진

- 문제 목록/상세 조회 API가 있다.
- 세션 생성, 코드 제출, 턴 진행, 리포트 조회/완료 API가 있다.
- AST 기반 신호로 `normal / plan_b / fallback` 분기를 선택한다.
- Judge0 미연동 시 demo mode로, LLM 미연동 시 deterministic mode로 세션을 완주할 수 있다.

관련 구현:
- `apps/api/app/routers/problems.py`
- `apps/api/app/routers/sessions.py`
- `apps/api/app/services/ast_analysis.py`
- `apps/api/app/services/interview_engine.py`
- `apps/api/app/services/llm_service.py`

### 3. 문제 데이터 자산

- 현재 5개 문제 패턴 데이터가 들어 있다.
- 각 문제는 `facts`, `follow_up_goals`, `forbidden_boundaries`, `traps`, `demo_variants`를 포함한다.
- 대표 문제는 느린 풀이, 안정적인 풀이, 오류 코드 3종 비교 시연이 가능하다.

관련 구현:
- `data/problems/*.json`

### 4. 자동 검증

- `npm run verify` 통과
  - 웹: ESLint, TypeScript, Vitest, Next build
  - API: Ruff, compileall, pytest
- `npm run qa:e2e`는 프로덕션 빌드 후 Playwright로 홈 -> 대표 문제 -> 3축 피드백 흐름을 검증한다.

## 아직 구현되지 않은 것

아래는 문서에는 있으나 현재 저장소 기준으로는 아직 미래 범위인 항목이다.

- 영속 세션 저장소
  - 현재는 `InMemorySessionStore` + TTL 기반이다.
- 기관 운영 대시보드
- 강사 override / human review 도구
- cohort analytics
- 강사용 Fact/Trap authoring 도구
- 음성 STT/TTS 면접 파이프라인
- LangGraph 기반 오케스트레이션
  - 현재는 custom state engine이다.
- SNS 공유 리포트 카드

## 현재 문서 해석 원칙

- `docs/구현_제안서.md`, `docs/platform_plan_v2.md`는 현재 구현과 가장 가까운 제출용 기준 문서다.
- `docs/platform_plan.md`는 장기 비전 문서로 읽어야 하며, 현재 구현 범위를 설명하는 문서로 쓰면 과장될 수 있다.
- 대외 설명 시에는 `현재 구현됨`과 `Post-MVP 확장`을 반드시 분리해서 말해야 한다.
