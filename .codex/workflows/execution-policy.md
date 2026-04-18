# Execution Policy

## 1. Purpose

This repository follows an approval-first workflow for meaningful changes.
The default is not "edit immediately" when the task affects multiple files, repository structure, or commit boundaries.

## 2. Required Workflow for Substantial Work

Use this sequence:
1. Research and inspect the current state.
2. Brief the user with a short implementation plan.
3. Wait for explicit approval.
4. Execute the agreed changes.
5. Report the outcome and verification status.

## 3. What Counts as Substantial Work

Treat the following as substantial:
- multi-file edits
- directory structure changes
- proposal rewrites
- architecture or product-direction changes
- commit preparation or commit execution
- anything that changes project conventions or agent instructions

## 4. Implementation Plan Minimum Format

Before execution, the brief should cover:
- what will change
- which files will be touched
- what the expected output or outcome is
- any assumptions or tradeoffs that matter

Use `.codex/templates/implementation-plan.md` as the default structure when a more formal plan is useful.

## 5. Commit Policy

Never commit by default.
Before any commit:
1. inspect `git status` and the relevant diff
2. group changes into logical commit units
3. propose commit messages using Conventional Commit style when possible
4. wait for explicit approval
5. only then run `git add` and `git commit`

Do not combine commit planning and commit execution in the same turn.

## 6. What Can Be Done Without Separate Approval

The following usually do not need a separate approval turn:
- reading files
- searching the repository
- answering based on current docs
- small exploratory checks

If the work crosses into actual edits with notable impact, stop and brief first.

## 7. Editing Priorities in This Repository

When the task is ambiguous, prefer:
1. clarifying the product story
2. improving proposal quality
3. tightening architecture rationale
4. only then adding speculative technical artifacts
