from fastapi import APIRouter, HTTPException

from app.models import (
    CreateSessionRequest,
    InterviewSession,
    ReportResponse,
    SessionResponse,
    SessionStatus,
    SubmitCodeRequest,
    SubmitCodeResponse,
    TurnRequest,
    TurnResponse,
)
from app.services.ast_analysis import analyze_code
from app.services.interview_engine import interview_engine
from app.services.judge0_client import Judge0Client
from app.services.problem_loader import get_problem
from app.session_store import session_store

router = APIRouter(prefix="/sessions", tags=["sessions"])
judge_client: Judge0Client | None = None


def get_judge_client() -> Judge0Client:
    global judge_client
    if judge_client is None:
        judge_client = Judge0Client()
    return judge_client


def get_session_or_404(session_id: str) -> InterviewSession:
    try:
        return session_store.get(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc


def get_problem_or_404(problem_id: str) -> object:
    try:
        return get_problem(problem_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Problem not found") from exc


@router.post("", response_model=SessionResponse)
async def create_session(payload: CreateSessionRequest) -> SessionResponse:
    if payload.problem_id is not None:
        get_problem_or_404(payload.problem_id)
    session = InterviewSession(problem_id=payload.problem_id)
    session_store.create(session)
    return SessionResponse(session=session)


@router.post("/{session_id}/submit", response_model=SubmitCodeResponse)
async def submit_code(session_id: str, payload: SubmitCodeRequest) -> SubmitCodeResponse:
    session = get_session_or_404(session_id)

    if session.status is not SessionStatus.created:
        raise HTTPException(status_code=400, detail="Session has already started")

    if not session.problem_id:
        raise HTTPException(
            status_code=400, detail="Session must be bound to a problem before submission"
        )

    problem = get_problem_or_404(session.problem_id)
    session.code = payload.code
    session.status = SessionStatus.submitted
    session.ast_profile = analyze_code(payload.code)
    session.judge_result = await get_judge_client().execute_python(payload.code)

    opening_question = await interview_engine.start_interview(problem=problem, session=session)
    session_store.save(session)
    return SubmitCodeResponse(session=session, opening_question=opening_question)


@router.post("/{session_id}/turns", response_model=TurnResponse)
async def submit_turn(session_id: str, payload: TurnRequest) -> TurnResponse:
    session = get_session_or_404(session_id)

    if not session.problem_id:
        raise HTTPException(status_code=400, detail="Session problem not set")
    if session.status is not SessionStatus.interviewing:
        raise HTTPException(status_code=400, detail="Session is not accepting interview turns")

    problem = get_problem_or_404(session.problem_id)
    next_question = await interview_engine.handle_turn(
        problem=problem, session=session, answer=payload.answer
    )
    session_store.save(session)
    return TurnResponse(
        session=session, next_question=next_question, completed=next_question is None
    )


@router.post("/{session_id}/finalize", response_model=ReportResponse)
async def finalize_session(session_id: str) -> ReportResponse:
    session = get_session_or_404(session_id)

    if not session.problem_id:
        raise HTTPException(status_code=400, detail="Session problem not set")
    if session.status is SessionStatus.completed and session.report is not None:
        return ReportResponse(report=session.report)
    if session.status is not SessionStatus.evaluating:
        raise HTTPException(status_code=400, detail="Session is not ready to finalize")

    problem = get_problem_or_404(session.problem_id)
    await interview_engine.finalize(problem=problem, session=session)
    session_store.save(session)
    return ReportResponse(report=session.report)


@router.get("/{session_id}", response_model=SessionResponse)
async def read_session(session_id: str) -> SessionResponse:
    session = get_session_or_404(session_id)
    return SessionResponse(session=session)


@router.get("/{session_id}/report", response_model=ReportResponse)
async def read_report(session_id: str) -> ReportResponse:
    session = get_session_or_404(session_id)

    if session.report is None:
        raise HTTPException(status_code=404, detail="Report not ready")
    return ReportResponse(report=session.report)
