from __future__ import annotations

from app.config import get_settings
from app.models import FlowType, InterviewSession, Problem, SessionStatus, Turn
from app.services.llm_service import LLMService


class InterviewEngine:
    def __init__(self) -> None:
        self.llm_service = LLMService()

    def decide_flow(self, session: InterviewSession) -> FlowType:
        profile = session.ast_profile
        if profile is None or not profile.parse_ok or profile.cyclomatic_complexity >= 15:
            return FlowType.fallback
        if not profile.has_risky_ops and profile.nested_loop_depth <= 1:
            return FlowType.plan_b
        return FlowType.normal

    def build_fallback_question(
        self, *, problem: Problem, session: InterviewSession, answer: str | None
    ) -> str:
        turn_index = len([turn for turn in session.turns if turn.role == "assistant"])
        if session.flow_type == FlowType.fallback:
            prompts = [
                (
                    "코드 세부 구현보다 먼저, 어떤 접근으로 문제를 풀려고 했는지 "
                    "한 문장으로 설명해볼래요?"
                ),
                (
                    "그 접근에서 시간복잡도가 어떻게 되는지, "
                    "가장 큰 반복이 어디서 생기는지 짚어볼래요?"
                ),
                (
                    "파싱되지 않거나 복잡한 코드일수록 핵심 불변식이 중요합니다. "
                    "이 코드에서 끝까지 유지하려던 조건은 무엇이었나요?"
                ),
                "이제 다시 작성한다면 어떤 더 단순한 구조로 문제를 풀겠는지 설명해볼래요?",
            ]
        elif session.flow_type == FlowType.plan_b:
            prompts = [
                (
                    f"{problem.pattern} 패턴을 잘 선택했습니다. 이제 이 풀이가 왜 "
                    "brute force보다 낫다고 면접관에게 설명해볼래요?"
                ),
                "입력 크기가 10배 커지면 병목이 어디에 생길지 먼저 말해볼래요?",
                (
                    "같은 정답을 내더라도 공간복잡도나 구현 복잡도 측면에서 "
                    "trade-off가 있는 대안은 무엇인가요?"
                ),
                (
                    "이 풀이를 실무 코드리뷰 자리에서 방어한다면, "
                    "가장 먼저 강조할 장점 한 가지는 무엇인가요?"
                ),
            ]
        else:
            trap_focus = problem.traps[min(turn_index, len(problem.traps) - 1)]
            prompts = [
                (
                    f"현재 코드에서 `{trap_focus.signal}` 구간이 눈에 띕니다. "
                    "여기서 시간복잡도가 어떻게 변하는지 설명해볼래요?"
                ),
                trap_focus.hint,
                (
                    f"{trap_focus.interview_focus} 관점에서, "
                    "지금 접근의 가장 취약한 케이스는 무엇인가요?"
                ),
                "마지막으로, 이 코드를 다시 제출한다면 어떤 한 줄 또는 한 구조를 먼저 바꿀 건가요?",
            ]
        return prompts[min(turn_index, len(prompts) - 1)]

    async def start_interview(self, *, problem: Problem, session: InterviewSession) -> str:
        session.flow_type = self.decide_flow(session)
        session.status = SessionStatus.interviewing
        opening_question = await self.llm_service.generate_question(
            problem=problem,
            session=session,
            ast_profile=session.ast_profile,
            answer=None,
            fallback_question=self.build_fallback_question(
                problem=problem, session=session, answer=None
            ),
        )
        session.current_question = opening_question
        session.turns.append(Turn(role="assistant", content=opening_question))
        return opening_question

    async def handle_turn(
        self, *, problem: Problem, session: InterviewSession, answer: str
    ) -> str | None:
        session.turns.append(Turn(role="user", content=answer))

        assistant_turns = len([turn for turn in session.turns if turn.role == "assistant"])
        if assistant_turns >= get_settings().max_interview_turns:
            session.status = SessionStatus.evaluating
            session.current_question = None
            return None

        next_question = await self.llm_service.generate_question(
            problem=problem,
            session=session,
            ast_profile=session.ast_profile,
            answer=answer,
            fallback_question=self.build_fallback_question(
                problem=problem, session=session, answer=answer
            ),
        )
        session.current_question = next_question
        session.turns.append(Turn(role="assistant", content=next_question))
        return next_question

    async def finalize(self, *, problem: Problem, session: InterviewSession) -> None:
        session.report = await self.llm_service.generate_report(problem=problem, session=session)
        session.status = SessionStatus.completed


interview_engine = InterviewEngine()
