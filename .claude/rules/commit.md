# Commit Rules (Claude Code)

## 커밋 워크플로우

1. `git status` + `git diff` 로 변경 내용 파악
2. 논리적 단위로 커밋 분리 (Conventional Commits: feat, fix, docs, refactor, test, chore)
3. **`AskUserQuestion` 도구**로 커밋 구성 선택지 제시 → 명시적 승인 대기
4. 승인 후 기계적으로 실행

## AskUserQuestion 활용 방법

커밋 승인 요청 시 아래 형식으로 질문 구성:

- **question:** "커밋을 어떻게 나눌까요?" 또는 "이 커밋 구성으로 진행할까요?"
- **options:** 각 옵션의 `preview`에 **커밋 메시지 전문 + 포함 파일 목록** 표시
- 추천 옵션은 첫 번째에 배치하고 "(Recommended)" 표시

### preview 작성 예시

```
커밋 1: feat: 인터뷰 세션 시작 API 추가
  - apps/api/app/routers/interview.py
  - apps/api/app/services/interview_service.py
  - apps/api/tests/test_interview.py

커밋 2: feat(web): 인터뷰 시작 UI 컴포넌트 추가
  - apps/web/components/InterviewStart.tsx
  - apps/web/app/interview/page.tsx
```

커밋이 1개뿐이어도 동일하게 메시지 전문을 preview에 포함한다.

## 규칙

- 승인 없이 커밋 실행 절대 금지
- 사용자가 "커밋해줘"라고 해도 AskUserQuestion으로 계획 확인 먼저
- 커밋 메시지: `<type>: <한국어 또는 영어 설명>` (영어 타입, 설명은 한국어 허용)
- `.env`, 시크릿, 대용량 바이너리 포함 여부 반드시 확인
