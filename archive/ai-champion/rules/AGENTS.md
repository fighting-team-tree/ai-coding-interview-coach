# AGENTS.md

<!-- ALINE:ONECONTEXT:START -->
## Aline OneContext - Proactive History Search

When the user asks about existing code, features, past decisions, debugging context,
or anything that might have been discussed in previous conversations, proactively
use the `onecontext` skill (`/onecontext`) to search Aline history before answering.
Don't wait for the user to explicitly ask you to search history.

Scenarios to proactively search:
- User asks "why was X implemented this way?" or references past decisions
- User is debugging and needs historical context about a feature or bug
- User references a function/feature/variable that may have been discussed before
- User asks about past conversations, changes, or project history
<!-- ALINE:ONECONTEXT:END -->

## Codex Bootstrap

This repository is currently document-first. Before proposing or editing files, load
the minimum relevant guidance from `.codex/`.

Always read these first for meaningful work:
- `.codex/context/project.md`
- `.codex/workflows/execution-policy.md`

Read this whenever the task touches commit preparation or commit execution:
- `.codex/workflows/commit-policy.md`

Read these when the task touches proposal or planning documents:
- `.codex/workflows/docs-authoring.md`
- `.codex/checklists/proposal-review.md`

## Agent Skills Mapping

The `addyosmani/agent-skills` pack is installed in this workspace under `.codex/skills`.
Use it as Codex-native workflow guidance, not as Claude-only metadata.

- Treat `skills/` as the primary integration surface. When a task clearly matches one of those skills, open the relevant `SKILL.md` and follow it.
- Do not assume `.claude/commands/` are executable in Codex. They are intent labels for Claude Code, not native Codex slash commands.
- Interpret the command names as workflow triggers in Codex:
  - `spec` -> `spec-driven-development`
  - `plan` -> `planning-and-task-breakdown`
  - `build` -> `incremental-implementation` + `test-driven-development`
  - `test` -> `test-driven-development`
  - `review` -> `code-review-and-quality`
  - `ship` -> `shipping-and-launch`
- Prefer adding the matching skill workflow to the current task rather than echoing command names back to the user.
- Treat `agents/` as reusable review personas and role prompts, not as automatically executable Codex sub-agents. They may inform local reasoning or spawned sub-agents when delegation is explicitly appropriate, but they are not a 1:1 runtime mapping.
- Treat `hooks/` as tool-specific lifecycle integration examples. Do not assume they are portable to this repository's Codex hook system without explicit adaptation.
- When a task is non-trivial and no clearer repository-specific rule overrides it, default to this sequence:
  - `spec-driven-development`
  - `planning-and-task-breakdown`
  - `incremental-implementation`
  - `test-driven-development`
  - `code-review-and-quality`

## Project-Specific Rules

- **Design Mandate:** ALL agents must prioritize `DESIGN.md` for any UI/UX modifications. The "Linear Style" (dark-mode-first, precision engineering) is the standard for this project.
- Prioritize product and architecture coherence over speculative implementation.
- Treat the journey from coding test submission to interview practice as the top-level user flow.
- Proposal and planning output must align with `docs/proposal_template.md`.
- Preserve original files under `docs/ai-champion-hwp/`. Edit derived Markdown or top-level planning docs first.
- For code changes under `apps/web`, run `npm run verify:web` before treating the task as complete.
- For code changes under `apps/api`, run `npm run verify:api` before treating the task as complete.
- For cross-stack changes, run both or the root `npm run verify`.

## Approval Policy

For major edits, multi-file changes, structural changes, or any commit:
1. Inspect the current state first.
2. Present a short implementation plan with target files and intended outcomes.
3. Wait for explicit approval.
4. Execute only after approval.

Do not combine plan briefing and execution in the same turn when the change is substantial.

## Commit Rules

- Codex should default to Korean commit message descriptions unless the user explicitly asks for English.
- Preferred commit message format is Conventional Commits style: `<type>: 한국어 설명`.
- Before any commit, inspect `git status` and diff, group changes logically, and present commit options to the user.
- Commit approval must use a text-based selection step with numbered options because Codex Default mode cannot use the Plan mode question tool.
- Do not run `git add` or `git commit` until the user explicitly selects an option.
