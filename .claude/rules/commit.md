# Commit Rules (Claude Code)

## 커밋 워크플로우

1. `git status` + `git diff` 로 변경 내용 파악
2. 논리적 단위로 커밋 분리 (Conventional Commits: feat, fix, docs, refactor, test, chore)
3. **텍스트 기반 번호형 선택지**로 커밋 구성 제시 → 명시적 승인 대기
4. 승인 후 기계적으로 실행

## 승인 요청 방법

커밋 승인 요청 시 아래 형식으로 질문 구성:

- 질문 문장: "커밋을 어떻게 나눌까요?" 또는 "이 커밋 구성으로 진행할까요?"
- 옵션 표기: `1.`, `2.` 형태의 번호형 목록 사용
- 각 옵션에는 **커밋 메시지 전문 + 포함 파일 목록** 표시
- 추천 옵션은 첫 번째에 두고 `(추천)` 또는 `(Recommended)` 표기

### preview 작성 예시

```
커밋 1: docs: 모두의 창업 신청서 방향 재정리
  - docs/modoo_startup/outline.md
  - README.md
  - AGENTS.md

커밋 2: chore: 로컬 AI 작업 규칙을 문서 중심으로 조정
  - .claude/rules/workflow.md
  - .claude/rules/code-quality.md
  - .codex/hooks/gate_common.py
```

커밋이 1개뿐이어도 동일하게 메시지 전문을 preview에 포함한다.

## 규칙

- 승인 없이 커밋 실행 절대 금지
- 사용자가 "커밋해줘"라고 해도 텍스트 기반 승인 확인 먼저
- 커밋 메시지: `<type>: <한국어 또는 영어 설명>` (영어 타입, 설명은 한국어 허용)
- `.env`, 시크릿, 대용량 바이너리 포함 여부 반드시 확인
- 문서 중심 변경은 `docs`, `README`, 로컬 규칙 파일을 기준으로 논리적 단위로 묶는다.
