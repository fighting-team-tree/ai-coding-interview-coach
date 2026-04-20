from __future__ import annotations

import logging
from dataclasses import dataclass

from pydantic import BaseModel

from app.config import get_settings
from app.models import AstProfile, FeedbackAxis, FeedbackReport, InterviewSession, Problem

try:
    from pydantic_ai import Agent
except Exception:  # pragma: no cover - optional import
    Agent = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class QuestionDraft(BaseModel):
    question: str


class ReportDraft(BaseModel):
    summary: str
    logical_structure: FeedbackAxis
    technical_accuracy: FeedbackAxis
    explanation_clarity: FeedbackAxis
    recommended_drills: list[str]


@dataclass
class LLMService:
    def _build_question_prompt(
        self,
        *,
        problem: Problem,
        session: InterviewSession,
        ast_profile: AstProfile,
        answer: str | None,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are an interview agent for coding test debriefs. "
            "Stay inside the provided problem facts. Never reveal the full answer. "
            "Ask one concise follow-up question at a time."
        )
        user_prompt = f"""
Problem: {problem.title}
Pattern: {problem.pattern}
Expected complexity: {problem.expected_complexity}
Optimal solution: {problem.optimal_solution}
Forbidden boundaries: {problem.forbidden_boundaries}
Follow-up goals: {problem.follow_up_goals}
Detected AST profile: {ast_profile.model_dump()}
Current flow: {session.flow_type}
Answer from candidate: {answer or "No answer yet. Generate the opening question."}
Prior turns: {[turn.model_dump() for turn in session.turns[-4:]]}
"""
        return system_prompt, user_prompt

    def _build_report_prompt(
        self,
        *,
        problem: Problem,
        session: InterviewSession,
    ) -> tuple[str, str]:
        system_prompt = (
            "You evaluate interview explanations for algorithm problems. "
            "Return actionable feedback across logical structure, "
            "technical accuracy, and explanation clarity."
        )
        user_prompt = f"""
Problem: {problem.title}
Pattern: {problem.pattern}
Expected complexity: {problem.expected_complexity}
Interview transcript: {[turn.model_dump() for turn in session.turns]}
AST profile: {session.ast_profile.model_dump() if session.ast_profile else {}}
Judge result: {session.judge_result.model_dump() if session.judge_result else {}}
"""
        return system_prompt, user_prompt

    async def generate_question(
        self,
        *,
        problem: Problem,
        session: InterviewSession,
        ast_profile: AstProfile,
        answer: str | None,
        fallback_question: str,
    ) -> str:
        settings = get_settings()
        if Agent is None or not settings.interview_model:
            return fallback_question

        system_prompt, user_prompt = self._build_question_prompt(
            problem=problem,
            session=session,
            ast_profile=ast_profile,
            answer=answer,
        )

        try:
            agent = Agent(
                settings.interview_model,
                output_type=QuestionDraft,
                system_prompt=system_prompt,
            )
            result = await agent.run(user_prompt)
            return result.output.question.strip()
        except Exception:
            logger.exception("Falling back to deterministic interview question generation")
            return fallback_question

    async def generate_report(
        self,
        *,
        problem: Problem,
        session: InterviewSession,
    ) -> FeedbackReport:
        fallback = build_fallback_report(problem=problem, session=session)
        settings = get_settings()
        if Agent is None or not settings.report_model:
            return fallback

        system_prompt, user_prompt = self._build_report_prompt(problem=problem, session=session)

        try:
            agent = Agent(
                settings.report_model,
                output_type=ReportDraft,
                system_prompt=system_prompt,
            )
            result = await agent.run(user_prompt)
            draft = result.output
            return FeedbackReport(
                session_id=session.id,
                summary=draft.summary,
                logical_structure=draft.logical_structure,
                technical_accuracy=draft.technical_accuracy,
                explanation_clarity=draft.explanation_clarity,
                recommended_drills=draft.recommended_drills,
            )
        except Exception:
            logger.exception("Falling back to heuristic report generation")
            return fallback


def build_fallback_report(*, problem: Problem, session: InterviewSession) -> FeedbackReport:
    answers = [turn.content for turn in session.turns if turn.role == "user"]
    answer_length = sum(len(answer.split()) for answer in answers)
    risky_ops = len(session.ast_profile.has_risky_ops) if session.ast_profile else 0

    logic_score = 6 if answer_length >= 60 else 4
    technical_score = (
        7 if risky_ops == 0 and session.judge_result and session.judge_result.passed else 5
    )
    clarity_score = 6 if len(answers) >= 2 else 4

    return FeedbackReport(
        session_id=session.id,
        summary=(
            "Fallback report generated from transcript heuristics because model-based "
            "evaluation was unavailable. "
            "Further depth is needed on complexity trade-offs and implementation rationale."
        ),
        logical_structure=FeedbackAxis(
            score=logic_score,
            rationale=(
                "The explanation covered the broad approach but could connect "
                "assumptions to consequences more explicitly."
            ),
            next_step=(
                "Practice answering in a fixed structure: approach, "
                "complexity, edge cases, and trade-off."
            ),
        ),
        technical_accuracy=FeedbackAxis(
            score=technical_score,
            rationale=(
                "The candidate stayed close to the expected solution path, "
                "with some room to sharpen complexity language."
            ),
            next_step=(
                "Rehearse why the chosen data structure avoids the suboptimal "
                "operations flagged by the AST profile."
            ),
        ),
        explanation_clarity=FeedbackAxis(
            score=clarity_score,
            rationale=(
                "The response was understandable, but key terms could be stated "
                "more directly and earlier."
            ),
            next_step=(
                "Use shorter sentences and say the complexity target before "
                "discussing implementation details."
            ),
        ),
        recommended_drills=[
            f"Re-explain {problem.pattern} solutions in under 60 seconds.",
            (
                "Answer one follow-up question on edge cases and one on space "
                "complexity after each coding practice session."
            ),
            "Compare the submitted approach against a brute-force baseline out loud.",
        ],
    )
