# Code Quality Rules (Claude Code)

## 5차원 코드 리뷰

1. **Correctness** — 엣지 케이스, 레이스 컨디션, 경계값 오류
2. **Readability** — 명명, 제어 흐름, 모듈 구성
3. **Architecture** — 패턴 준수, 모듈 경계, 의존성
4. **Security** — 입력 검증, 시크릿 노출, 인증/인가
5. **Performance** — N+1 쿼리, 언바운드 루프, 비동기 처리

결과 분류: **Critical → Important → Suggestion**

## 성능 목표

STT 300ms + LLM 500–800ms + TTS 90ms ≤ **1초 합계**

## 테스트

- Arrange-Act-Assert 패턴
- 버그 수정: Prove-It 패턴 (테스트 실패 먼저 → 수정)
- 레벨: Unit → Integration → E2E
- 커버: 정상 경로, 빈 입력, 경계값, 에러 경로

## 보안

- 입력 검증: allowlist 기반
- 시크릿: 환경변수만, 코드 하드코딩 금지
- CORS 명시적 설정
- 의존성 감사: `npm audit`, `pip audit`
- 인증/인가, IDOR, rate limiting 확인
