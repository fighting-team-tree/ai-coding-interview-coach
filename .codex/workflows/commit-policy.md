# Commit Policy

## 1. Purpose

This repository requires an approval-first workflow for any commit performed by Codex.
Commits are not executed immediately after implementation, even when the user asks to "commit it".

## 2. Default Commit Language

Codex should default to Korean for commit message descriptions unless the user explicitly asks for English.

Preferred format:
- `<type>: 한국어 설명`

Examples:
- `feat: 면접 세션 시작 API 추가`
- `fix: 제출 결과 요약 카드 정렬 오류 수정`
- `docs: 구현 제안서 일정 근거 보강`

Conventional Commit types should stay in English when possible:
- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## 3. Required Commit Workflow

Before any commit, Codex must:
1. inspect `git status` and the relevant diff
2. split changes into logical commit units
3. propose one or more commit options to the user
4. wait for explicit approval
5. run `git add` and `git commit` only after approval

Do not combine commit planning and commit execution in the same turn.

## 4. Approval Format

When asking for commit approval, Codex should present compact numbered options in the assistant message.

Recommended format:

```text
커밋을 어떻게 진행할까요?
1. `feat: ...`
   - 포함 파일: ...
2. `docs: ...`
   - 포함 파일: ...
3. 커밋하지 않고 유지
```

Rules:
- Put the recommended option first.
- Include the full proposed commit message for each option.
- Include the main files or file groups included in each option.
- Include a non-commit option when that is a realistic choice.
- Wait for the user's explicit selection before executing any commit command.

## 5. Tooling Limitation

Codex in Default mode cannot rely on the Plan mode `request_user_input` tool.
Therefore, this repository uses a text-based selection workflow instead of a built-in UI question tool.

The intent should still match a structured approval step:
- present mutually exclusive options
- make the recommended option obvious
- wait for an explicit user choice

## 6. Non-Negotiable Rules

- Never commit by default.
- Never hide the commit message until after `git commit`.
- Never mix unrelated changes into a single commit unless the user approves that grouping.
- Check for secrets, `.env` files, and unintended generated artifacts before proposing a commit.
