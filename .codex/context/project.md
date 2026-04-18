# AI_CHAMPION Project Context

## 1. Product Goal

AI_CHAMPION is not a generic coding-test platform.
Its core goal is to bridge the gap between solving an algorithm problem and explaining that solution in a technical interview.

The primary user journey is:
1. Solve a coding-test problem.
2. Submit code.
3. Enter an AI-driven mock interview with follow-up questions.
4. Receive actionable feedback on explanation quality.

Any proposal, architecture, or implementation idea should be checked against whether this journey remains continuous and convincing.

## 2. Competition Context

- Competition: 2026 AI Champion
- Nature: long-horizon startup competition, not a short hackathon
- Near-term milestone: implementation proposal submission by April 24, 2026
- Longer horizon: April to November product build-out, beta, validation, and refinement
- Final goal: credible deep-tech product and business story for the grand final

This means the project should avoid shallow hackathon shortcuts and instead communicate a plausible path toward a real product.

## 3. Non-Negotiable Product Principles

- The system must feel like interview preparation, not just problem solving.
- Hallucination control is mandatory, not optional.
- The architecture should assume factual guardrails, constrained prompting, and state control.
- Evaluation should center on three axes:
  - logical structure
  - technical accuracy
  - explanation clarity

## 4. Technical Direction

Target stack and architecture assumptions:
- Frontend: Next.js + React
- Backend: FastAPI with async and streaming-friendly design
- Orchestration: LangGraph-style interview state control
- Models and voice pipeline: LLM + STT + TTS with streaming-first assumptions
- Data layer: problem knowledge, traps, and interview guidance stored in a retrievable structured form

Design priorities:
- Minimize unnecessary client/server serialization
- Prefer streaming pipelines over batch responses
- Optimize for low-latency interview interaction
- Avoid relying entirely on external black-box evaluation APIs

## 5. Business and Risk Guardrails

- Position the product as a scalable B2B or B2B2C opportunity, not only a direct-to-consumer toy
- Do not suggest legally risky data acquisition such as unauthorized crawling
- Assume cheating, malicious submissions, unsafe code, and API-cost blowups are real design concerns
- Favor architectures that can mature into sandboxing, code analysis, and measurable evaluation

## 6. Current Repository Reality

At the moment, this repository is primarily a planning and proposal workspace.
The most important artifacts are under `docs/`, especially:
- `docs/proposal_template.md`
- `docs/platform_plan.md`
- `docs/platform_plan_v2.md`
- `docs/platform_plan_analysis.md`
- `docs/구현_제안서.md`

Original HWP/HWPX files under `docs/ai-champion-hwp/` should be treated as source artifacts to preserve.
Derived Markdown files under `docs/ai-champion-hwp-md/` are safer working surfaces when adaptation is needed.

## 7. Preferred Language for Output

Unless the user asks otherwise, planning and proposal content for this repository should default to Korean, with technical terms left in English when they are clearer or standard.
