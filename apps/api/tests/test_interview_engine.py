from __future__ import annotations

from app.models import AstProfile, InterviewSession, Problem, ProblemExample, Trap, Turn
from app.services.interview_engine import InterviewEngine


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
        follow_up_goals=["goal 1", "goal 2"],
        forbidden_boundaries=["정답 코드를 직접 제공하지 않는다."],
        traps=[
            Trap(
                signal="중첩 반복문 또는 모든 구간 합 탐색",
                hint=(
                    "현재 구현이 모든 시작점마다 끝점을 다시 탐색한다면 "
                    "입력이 10만일 때 어떤 일이 벌어질까요?"
                ),
                interview_focus="시간복잡도와 포인터 이동 조건",
            )
        ],
    )


def test_normal_flow_question_plan_avoids_meta_prefix() -> None:
    engine = InterviewEngine()
    problem = _build_problem()
    session = InterviewSession(
        ast_profile=AstProfile(
            parse_ok=True,
            nested_loop_depth=2,
            cyclomatic_complexity=4,
            has_risky_ops=[],
        )
    )
    session.branch_decision = engine.build_branch_decision(session)
    session.turns = [
        Turn(role="assistant", content="첫 질문"),
        Turn(role="user", content="첫 답변"),
        Turn(role="assistant", content="두 번째 질문"),
        Turn(role="user", content="두 번째 답변"),
    ]

    plan = engine.build_question_plan(problem=problem, session=session, answer="세 번째 답변")

    assert "직전 답변" not in plan.prompt
    assert "이어가겠습니다" not in plan.prompt
    assert plan.prompt == "이 접근이 흔들리는 입력이나 반례를 하나 들어보세요."


def test_plan_b_question_plan_uses_direct_interview_tone() -> None:
    engine = InterviewEngine()
    problem = _build_problem()
    session = InterviewSession(
        ast_profile=AstProfile(
            parse_ok=True,
            nested_loop_depth=1,
            cyclomatic_complexity=3,
            has_risky_ops=[],
        )
    )
    session.branch_decision = engine.build_branch_decision(session)

    plan = engine.build_question_plan(problem=problem, session=session, answer=None)

    assert session.branch_decision.flow_type == "plan_b"
    assert plan.prompt == "왜 Two Pointer 패턴을 선택했는지 brute force와 비교해서 설명해 주세요."
