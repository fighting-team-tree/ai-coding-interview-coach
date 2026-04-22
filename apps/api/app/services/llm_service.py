from __future__ import annotations

import logging
from dataclasses import dataclass

from pydantic import BaseModel

from app.config import get_settings
from app.models import (
    AstProfile,
    FeedbackAxis,
    FeedbackReport,
    InterviewSession,
    Problem,
    QuestionPlan,
)

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
        question_plan: QuestionPlan,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are an interview agent for coding test debriefs. "
            "Rewrite the provided interview plan into one concise follow-up question. "
            "Stay inside the supplied facts and guardrail. Never reveal the full answer."
        )
        user_prompt = f"""
Problem: {problem.title}
Pattern: {problem.pattern}
Expected complexity: {problem.expected_complexity}
Optimal solution: {problem.optimal_solution}
Facts: {problem.facts}
Forbidden boundaries: {problem.forbidden_boundaries}
Follow-up goals: {problem.follow_up_goals}
Detected AST profile: {ast_profile.model_dump()}
Current flow: {session.flow_type}
Selected question plan: {question_plan}
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
        question_plan: QuestionPlan,
    ) -> tuple[str, str]:
        settings = get_settings()
        if settings.is_demo_mode or Agent is None or not settings.interview_model:
            return question_plan.prompt, "deterministic"

        system_prompt, user_prompt = self._build_question_prompt(
            problem=problem,
            session=session,
            ast_profile=ast_profile,
            answer=answer,
            question_plan=question_plan,
        )

        try:
            agent = Agent(
                settings.interview_model,
                output_type=QuestionDraft,
                system_prompt=system_prompt,
            )
            result = await agent.run(user_prompt)
            return result.output.question.strip(), "llm"
        except Exception:
            logger.exception("Falling back to deterministic interview question generation")
            return question_plan.prompt, "deterministic"

    async def generate_report(
        self,
        *,
        problem: Problem,
        session: InterviewSession,
    ) -> tuple[FeedbackReport, str]:
        fallback = build_fallback_report(problem=problem, session=session)
        settings = get_settings()
        if settings.is_demo_mode or Agent is None or not settings.report_model:
            return fallback, "deterministic"

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
            ), "llm"
        except Exception:
            logger.exception("Falling back to heuristic report generation")
            return fallback, "deterministic"


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
            "모델 미연동 안전 모드: 대화 로그 휴리스틱을 기반으로 자동 생성된 리포트입니다. "
            "복잡도 트레이드오프와 구현 근거 설명을 조금 더 다듬어야 합니다."
        ),
        logical_structure=FeedbackAxis(
            score=logic_score,
            rationale=(
                "접근 방식을 전반적으로 설명했지만, 가정이 결론으로 이어지는 과정을 "
                "더 명시적으로 연결할 여지가 있습니다."
            ),
            next_step=(
                "접근 · 복잡도 · 엣지 케이스 · 트레이드오프 순서의 고정 구조로 답변을 "
                "반복 연습해 보세요."
            ),
        ),
        technical_accuracy=FeedbackAxis(
            score=technical_score,
            rationale=(
                "의도한 풀이 경로에 가까웠지만, 복잡도 표현을 더 또렷하게 "
                "다듬을 여지가 있습니다."
            ),
            next_step=(
                "AST 프로파일에서 감지된 위험 연산을 왜 선택한 자료 구조가 "
                "피해 가는지 말로 설명해 보세요."
            ),
        ),
        explanation_clarity=FeedbackAxis(
            score=clarity_score,
            rationale=(
                "답변은 이해 가능했지만, 핵심 용어를 더 일찍 · 더 직접적으로 "
                "말할 수 있습니다."
            ),
            next_step=(
                "구현 세부사항 전에 목표 복잡도를 먼저 선언하고, 문장 길이를 "
                "짧게 유지해 보세요."
            ),
        ),
        recommended_drills=[
            f"{problem.pattern} 풀이를 60초 이내로 재설명해 보세요.",
            (
                "매 연습 세션 뒤 엣지 케이스 1개, 공간 복잡도 1개에 대한 "
                "꼬리 질문에 답해 보세요."
            ),
            "제출한 풀이를 무차별 대입 기준선과 소리 내어 비교해 보세요.",
        ],
    )
