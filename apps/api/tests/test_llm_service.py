from __future__ import annotations

import asyncio
from types import SimpleNamespace

from app.models import (
    AstProfile,
    FeedbackAxis,
    FeedbackReport,
    InterviewSession,
    Problem,
    ProblemExample,
    QuestionPlan,
    Trap,
)
from app.services.judge0_client import Judge0Client
from app.services.llm_service import LLMService


def _build_problem() -> Problem:
    return Problem(
        id="two-pointer-window",
        title="연속 부분 수열의 최소 길이",
        pattern="Two Pointer",
        difficulty="medium",
        elevator_pitch="대표 데모",
        prompt="prompt",
        constraints=["constraint"],
        examples=[ProblemExample(input="1", output="1", explanation="example")],
        starter_code="print('starter')",
        expected_complexity="O(N)",
        optimal_solution="sliding window",
        facts=["positive numbers", "window shrink"],
        follow_up_goals=["goal"],
        forbidden_boundaries=["정답 코드를 직접 제공하지 않는다."],
        traps=[
            Trap(
                signal="중첩 반복문 또는 모든 구간 합 탐색",
                hint="hint",
                interview_focus="focus",
            )
        ],
    )


def _demo_settings() -> SimpleNamespace:
    return SimpleNamespace(
        app_env="demo",
        is_demo_mode=True,
        interview_model="openai:gpt-4.1-mini",
        report_model="openai:gpt-4.1-mini",
        judge0_base_url="https://judge0.example.com",
        judge0_api_token="token",
    )


def test_llm_service_skips_model_calls_in_demo_mode(monkeypatch) -> None:
    monkeypatch.setattr("app.services.llm_service.get_settings", _demo_settings)

    service = LLMService()
    problem = _build_problem()
    session = InterviewSession(problem_id=problem.id)
    plan = QuestionPlan(
        prompt="질문을 그대로 사용합니다.",
        intent="intent",
        guardrail_note="guardrail",
    )

    question, mode = asyncio.run(
        service.generate_question(
            problem=problem,
            session=session,
            ast_profile=AstProfile(parse_ok=True),
            answer=None,
            question_plan=plan,
        )
    )

    assert mode == "deterministic"
    assert question == "질문을 그대로 사용합니다."


def test_report_generation_uses_fallback_in_demo_mode(monkeypatch) -> None:
    monkeypatch.setattr("app.services.llm_service.get_settings", _demo_settings)

    service = LLMService()
    problem = _build_problem()
    session = InterviewSession(
        problem_id=problem.id,
        report=FeedbackReport(
            session_id="session",
            summary="summary",
            logical_structure=FeedbackAxis(score=1, rationale="r", next_step="n"),
            technical_accuracy=FeedbackAxis(score=1, rationale="r", next_step="n"),
            explanation_clarity=FeedbackAxis(score=1, rationale="r", next_step="n"),
            recommended_drills=[],
        ),
    )

    report, mode = asyncio.run(service.generate_report(problem=problem, session=session))

    assert mode == "deterministic"
    assert "모델 미연동 안전 모드" in report.summary


def test_judge0_client_returns_demo_result_when_app_env_is_demo(monkeypatch) -> None:
    monkeypatch.setattr("app.services.judge0_client.get_settings", _demo_settings)

    result = asyncio.run(Judge0Client().execute_python("print('hi')"))

    assert result.mode == "demo"
    assert result.status == "데모 실행 모드"
    assert result.passed is False
