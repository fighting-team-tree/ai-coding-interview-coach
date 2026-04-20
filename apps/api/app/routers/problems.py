from fastapi import APIRouter, HTTPException

from app.models import Problem, ProblemSummary
from app.services.problem_loader import get_problem, list_problem_summaries

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=list[ProblemSummary])
async def list_problems() -> list[ProblemSummary]:
    return list_problem_summaries()


@router.get("/{problem_id}", response_model=Problem)
async def read_problem(problem_id: str) -> Problem:
    try:
        return get_problem(problem_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
