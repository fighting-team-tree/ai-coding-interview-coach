from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from app.models import Problem, ProblemSummary


@lru_cache
def _load_problem_index() -> dict[str, Problem]:
    settings = get_settings()
    data_dir = Path(settings.data_dir)
    problems: dict[str, Problem] = {}
    for path in sorted(data_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        problem = Problem.model_validate(payload)
        problems[problem.id] = problem
    return problems


def list_problem_summaries() -> list[ProblemSummary]:
    return [
        ProblemSummary.model_validate(problem.model_dump())
        for problem in _load_problem_index().values()
    ]


def get_problem(problem_id: str) -> Problem:
    try:
        return _load_problem_index()[problem_id]
    except KeyError as exc:
        raise KeyError(f"Unknown problem: {problem_id}") from exc

