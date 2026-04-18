# Document Authoring Rules

## 1. Scope

These rules apply when editing or generating content under `docs/` or when creating proposal, planning, or architecture documents for this repository.

## 2. Template Precedence

When writing or revising an implementation proposal, always anchor the output to:
- `docs/proposal_template.md`

Do not invent a new arbitrary proposal structure.
Map content into the template's four sections:
1. general information
2. technical specification
3. implementation method and plan
4. expected impact

## 3. Source Priority

Use source material in this order:
1. `docs/proposal_template.md` for required structure
2. `.codex/context/project.md` for non-negotiable product and competition context
3. existing planning docs such as `docs/platform_plan_v2.md` for content direction
4. derived Markdown artifacts under `docs/ai-champion-hwp-md/` when form-specific phrasing is needed

Avoid letting any single brainstorming note override the main project direction.

## 4. File Handling Rules

- Preserve originals in `docs/ai-champion-hwp/`
- Prefer editing Markdown files over binary originals
- If a proposal draft is being refined, keep the working edits in top-level docs unless the user explicitly asks for a form-specific output

## 5. Content Rules

- Keep the product framed as a coding-test-to-interview bridge
- Make hallucination control explicit in architecture descriptions
- Tie technical choices to judging criteria and business plausibility
- Avoid hackathon-only framing unless the user explicitly wants a short-term MVP angle
- Keep terminology consistent across documents

Preferred recurring terms:
- coding test to interview bridge
- mock interview
- follow-up questioning
- hallucination control
- three-axis evaluation
- long-horizon competition

## 6. Proposal-Specific Constraints

When the task is proposal-facing, remember:
- the official template has a strict section structure
- the final document should remain concise enough to fit the competition's page constraints
- examples and explanatory helper text from the template should not leak into the final submission copy

## 7. Writing Style

- Default to Korean unless the user asks for English
- Prefer concrete claims over inflated marketing language
- Make tradeoffs explicit
- Do not promise unbuilt capabilities as if they already exist
- When uncertainty exists, frame it as a planned capability or roadmap item
