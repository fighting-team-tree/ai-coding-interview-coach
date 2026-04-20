from __future__ import annotations

import asyncio
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.models import FeedbackAxis, FeedbackReport, InterviewSession, JudgeResult, SessionStatus
from app.routers import sessions as sessions_router
from app.services.judge0_client import Judge0Client
from app.session_store import session_store


async def _fake_execute_python(_: str) -> JudgeResult:
    return JudgeResult(
        status="Accepted",
        passed=True,
        stdout="ok",
        mode="demo",
    )


async def _fake_start_interview(*, problem, session) -> str:
    session.status = SessionStatus.interviewing
    return f"{problem.title} opening question"


async def _fake_handle_turn(*, problem, session, answer: str) -> str | None:
    session.status = SessionStatus.evaluating
    session.current_question = None
    assert answer
    return None


async def _fake_finalize(*, problem, session) -> None:
    session.report = FeedbackReport(
        session_id=session.id,
        summary=f"Report for {problem.id}",
        logical_structure=FeedbackAxis(
            score=7, rationale="Clear flow", next_step="Be more concise."
        ),
        technical_accuracy=FeedbackAxis(
            score=8, rationale="Technically sound", next_step="Name trade-offs."
        ),
        explanation_clarity=FeedbackAxis(
            score=6, rationale="Mostly clear", next_step="Lead with complexity."
        ),
        recommended_drills=["Practice 60-second explanations."],
    )
    session.status = SessionStatus.completed


def test_session_endpoints_cover_submission_flow(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(sessions_router, "get_judge_client", lambda: sessions_router.judge_client)
    monkeypatch.setattr(
        sessions_router,
        "judge_client",
        SimpleNamespace(execute_python=_fake_execute_python),
    )
    monkeypatch.setattr(sessions_router.interview_engine, "start_interview", _fake_start_interview)
    monkeypatch.setattr(sessions_router.interview_engine, "handle_turn", _fake_handle_turn)
    monkeypatch.setattr(sessions_router.interview_engine, "finalize", _fake_finalize)

    create_response = client.post("/sessions", json={"problem_id": "two-pointer-window"})
    assert create_response.status_code == 200
    session_id = create_response.json()["session"]["id"]

    submit_response = client.post(f"/sessions/{session_id}/submit", json={"code": "print('hello')"})
    submit_payload = submit_response.json()
    assert submit_response.status_code == 200
    assert submit_payload["session"]["status"] == "interviewing"
    assert submit_payload["opening_question"] == "연속 부분 수열의 최소 길이 opening question"

    turn_response = client.post(
        f"/sessions/{session_id}/turns", json={"answer": "I used two pointers."}
    )
    turn_payload = turn_response.json()
    assert turn_response.status_code == 200
    assert turn_payload["completed"] is True
    assert turn_payload["next_question"] is None

    finalize_response = client.post(f"/sessions/{session_id}/finalize")
    finalize_payload = finalize_response.json()
    assert finalize_response.status_code == 200
    assert finalize_payload["report"]["summary"] == "Report for two-pointer-window"

    report_response = client.get(f"/sessions/{session_id}/report")
    assert report_response.status_code == 200


def test_submit_unknown_session_returns_not_found(client: TestClient) -> None:
    response = client.post("/sessions/missing-session/submit", json={"code": "print('hi')"})

    assert response.status_code == 404


def test_create_session_rejects_unknown_problem(client: TestClient) -> None:
    response = client.post("/sessions", json={"problem_id": "missing-problem"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Problem not found"


def test_submit_returns_not_found_for_session_bound_to_missing_problem(
    client: TestClient,
) -> None:
    session = InterviewSession(problem_id="missing-problem")
    session_store.create(session)

    response = client.post(f"/sessions/{session.id}/submit", json={"code": "print('hi')"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Problem not found"


def test_finalize_requires_session_to_be_evaluating(client: TestClient) -> None:
    create_response = client.post("/sessions", json={"problem_id": "two-pointer-window"})
    session_id = create_response.json()["session"]["id"]

    response = client.post(f"/sessions/{session_id}/finalize")

    assert response.status_code == 400
    assert response.json()["detail"] == "Session is not ready to finalize"


def test_evaluating_session_rejects_additional_turns(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(sessions_router, "get_judge_client", lambda: sessions_router.judge_client)
    monkeypatch.setattr(
        sessions_router,
        "judge_client",
        SimpleNamespace(execute_python=_fake_execute_python),
    )
    monkeypatch.setattr(sessions_router.interview_engine, "start_interview", _fake_start_interview)
    monkeypatch.setattr(sessions_router.interview_engine, "handle_turn", _fake_handle_turn)

    create_response = client.post("/sessions", json={"problem_id": "two-pointer-window"})
    session_id = create_response.json()["session"]["id"]
    client.post(f"/sessions/{session_id}/submit", json={"code": "print('hello')"})

    first_turn = client.post(f"/sessions/{session_id}/turns", json={"answer": "First answer"})
    assert first_turn.status_code == 200
    assert first_turn.json()["completed"] is True

    extra_turn = client.post(f"/sessions/{session_id}/turns", json={"answer": "Extra answer"})

    assert extra_turn.status_code == 400
    assert extra_turn.json()["detail"] == "Session is not accepting interview turns"


def test_judge0_demo_mode_does_not_mark_submission_as_passed() -> None:
    result = asyncio.run(Judge0Client().execute_python("print('hi')"))

    assert result.mode == "demo"
    assert result.passed is False
    assert result.status == "Demo mode: Judge0 not configured"
