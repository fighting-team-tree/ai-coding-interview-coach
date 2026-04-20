from fastapi import APIRouter, HTTPException

from app.services.problem_loader import get_problem, list_problem_summaries


router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("")
async def list_problems() -> list[dict]:
    return [problem.model_dump() for problem in list_problem_summaries()]


@router.get("/{problem_id}")
async def read_problem(problem_id: str) -> dict:
    try:
        return get_problem(problem_id).model_dump()
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

