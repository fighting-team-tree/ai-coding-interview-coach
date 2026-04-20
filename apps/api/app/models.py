from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SessionStatus(str, Enum):
    created = "created"
    submitted = "submitted"
    interviewing = "interviewing"
    evaluating = "evaluating"
    completed = "completed"


class FlowType(str, Enum):
    normal = "normal"
    plan_b = "plan_b"
    fallback = "fallback"


class ProblemExample(BaseModel):
    input: str
    output: str
    explanation: str


class Trap(BaseModel):
    signal: str
    hint: str
    interview_focus: str


class ProblemSummary(BaseModel):
    id: str
    title: str
    pattern: str
    difficulty: Literal["easy", "medium", "hard"]
    elevator_pitch: str


class Problem(ProblemSummary):
    prompt: str
    constraints: list[str]
    examples: list[ProblemExample]
    starter_code: str
    expected_complexity: str
    optimal_solution: str
    follow_up_goals: list[str]
    forbidden_boundaries: list[str]
    traps: list[Trap]


class JudgeResult(BaseModel):
    status: str
    passed: bool
    stdout: str = ""
    stderr: str = ""
    compile_output: str = ""
    execution_time_ms: int | None = None
    memory_kb: int | None = None
    mode: Literal["judge0", "demo"] = "demo"


class AstProfile(BaseModel):
    parse_ok: bool
    nested_loop_depth: int = 0
    has_risky_ops: list[str] = Field(default_factory=list)
    recursion_detected: bool = False
    cyclomatic_complexity: int = 1
    notes: list[str] = Field(default_factory=list)


class Turn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: Literal["assistant", "user"]
    content: str
    created_at: datetime = Field(default_factory=utc_now)


class FeedbackAxis(BaseModel):
    score: int
    rationale: str
    next_step: str


class FeedbackReport(BaseModel):
    session_id: str
    summary: str
    logical_structure: FeedbackAxis
    technical_accuracy: FeedbackAxis
    explanation_clarity: FeedbackAxis
    recommended_drills: list[str]
    generated_at: datetime = Field(default_factory=utc_now)


class InterviewSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: SessionStatus = SessionStatus.created
    problem_id: str | None = None
    code: str = ""
    flow_type: FlowType | None = None
    ast_profile: AstProfile | None = None
    judge_result: JudgeResult | None = None
    turns: list[Turn] = Field(default_factory=list)
    current_question: str | None = None
    report: FeedbackReport | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    def touch(self) -> None:
        self.updated_at = utc_now()


class CreateSessionRequest(BaseModel):
    problem_id: str | None = None


class SessionResponse(BaseModel):
    session: InterviewSession


class SubmitCodeRequest(BaseModel):
    code: str


class SubmitCodeResponse(BaseModel):
    session: InterviewSession
    opening_question: str


class TurnRequest(BaseModel):
    answer: str


class TurnResponse(BaseModel):
    session: InterviewSession
    next_question: str | None = None
    completed: bool


class ReportResponse(BaseModel):
    report: FeedbackReport
