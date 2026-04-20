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

Read these when the task touches proposal or planning documents:
- `.codex/workflows/docs-authoring.md`
- `.codex/checklists/proposal-review.md`

## Project-Specific Rules

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
