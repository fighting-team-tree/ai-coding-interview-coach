from __future__ import annotations

from app.config import get_settings
from app.models import (
    BranchDecision,
    EvidenceRef,
    FlowType,
    InterviewSession,
    Problem,
    QuestionPlan,
    SessionStatus,
    Turn,
)
from app.services.llm_service import LLMService


class InterviewEngine:
    def __init__(self) -> None:
        self.llm_service = LLMService()

    def _primary_signal(self, session: InterviewSession, flow: FlowType) -> str:
        profile = session.ast_profile
        if profile is None:
            return "AST profile unavailable"
        if flow == FlowType.fallback and not profile.parse_ok:
            return profile.notes[0] if profile.notes else "Code parsing failed"
        if flow == FlowType.fallback and profile.cyclomatic_complexity >= 15:
            return f"Cyclomatic complexity {profile.cyclomatic_complexity} triggered fallback"
        if flow == FlowType.normal:
            if profile.has_risky_ops:
                return f"Risky operation detected: {profile.has_risky_ops[0]}"
            return f"Nested loop depth {profile.nested_loop_depth} requires complexity defense"
        return "Low-risk AST profile unlocked scale-up interview mode"

    def build_branch_decision(self, session: InterviewSession) -> BranchDecision:
        profile = session.ast_profile
        if profile is None:
            flow = FlowType.fallback
            reason_codes = ["missing_profile"]
        else:
            reason_codes: list[str] = []
            if not profile.parse_ok:
                reason_codes.append("parse_failed")
            if profile.cyclomatic_complexity >= 15:
                reason_codes.append("high_complexity")
            if profile.has_risky_ops:
                reason_codes.append("risky_ops_detected")
            else:
                reason_codes.append("no_risky_ops")
            if profile.nested_loop_depth >= 2:
                reason_codes.append("nested_loops_detected")
            else:
                reason_codes.append("low_loop_depth")
            if profile.recursion_detected:
                reason_codes.append("recursion_detected")

            if not profile.parse_ok or profile.cyclomatic_complexity >= 15:
                flow = FlowType.fallback
            elif not profile.has_risky_ops and profile.nested_loop_depth <= 1:
                flow = FlowType.plan_b
            else:
                flow = FlowType.normal

        return BranchDecision(
            flow_type=flow,
            reason_codes=reason_codes,
            primary_signal=self._primary_signal(session, flow),
        )

    def _pick_fact(self, problem: Problem, turn_index: int) -> str:
        if not problem.facts:
            return problem.optimal_solution
        return problem.facts[min(turn_index, len(problem.facts) - 1)]

    def _pick_goal(self, problem: Problem, turn_index: int) -> str:
        if not problem.follow_up_goals:
            return "지원자의 reasoning과 trade-off 설명을 확인한다."
        return problem.follow_up_goals[min(turn_index, len(problem.follow_up_goals) - 1)]

    def _ast_reference(self, session: InterviewSession) -> EvidenceRef:
        profile = session.ast_profile
        if profile is None:
            return EvidenceRef(kind="ast", label="AST profile", detail="No AST profile captured")
        if not profile.parse_ok:
            return EvidenceRef(
                kind="ast",
                label="AST parse status",
                detail=profile.notes[0] if profile.notes else "Parse failed",
            )
        if profile.has_risky_ops:
            return EvidenceRef(
                kind="ast",
                label="Detected risky op",
                detail=profile.has_risky_ops[0],
            )
        if profile.nested_loop_depth >= 2:
            return EvidenceRef(
                kind="ast",
                label="Nested loop depth",
                detail=f"Detected nested loop depth {profile.nested_loop_depth}",
            )
        return EvidenceRef(
            kind="ast",
            label="Low-risk AST profile",
            detail=(
                f"nested_loop_depth={profile.nested_loop_depth}, "
                f"cyclomatic_complexity={profile.cyclomatic_complexity}"
            ),
        )

    def build_question_plan(
        self, *, problem: Problem, session: InterviewSession, answer: str | None
    ) -> QuestionPlan:
        turn_index = len([turn for turn in session.turns if turn.role == "assistant"])
        guardrail = (
            problem.forbidden_boundaries[0]
            if problem.forbidden_boundaries
            else "Stay inside the problem facts and avoid giving the full answer."
        )
        branch = session.branch_decision or self.build_branch_decision(session)
        fact = self._pick_fact(problem, turn_index)
        goal = self._pick_goal(problem, turn_index)
        ast_ref = self._ast_reference(session)

        evidence_refs = [
            EvidenceRef(kind="branch", label="Selected flow", detail=branch.primary_signal),
            EvidenceRef(kind="fact", label="Problem fact", detail=fact),
            EvidenceRef(kind="goal", label="Follow-up goal", detail=goal),
            ast_ref,
            EvidenceRef(kind="boundary", label="Forbidden boundary", detail=guardrail),
        ]

        if branch.flow_type == FlowType.fallback:
            prompts = [
                (
                    "코드 세부 구현보다 먼저, 어떤 접근으로 문제를 풀려고 했는지 "
                    "한 문장으로 설명해볼래요?"
                ),
                (
                    "그 접근의 시간복잡도를 어떻게 계산했는지, "
                    "가장 큰 반복이 어디서 생기는지 짚어볼래요?"
                ),
                "이 풀이에서 끝까지 지키려던 핵심 불변식이나 상태 정의는 무엇이었나요?",
                "같은 문제를 다시 푼다면 어떤 더 단순한 구조로 재작성할지 설명해볼래요?",
            ]
            intent = "핵심 개념 복구 질문"
        elif branch.flow_type == FlowType.plan_b:
            prompts = [
                (
                    f"{problem.pattern} 패턴을 택한 이유를, "
                    "brute force 대비 장점 중심으로 설명해볼래요?"
                ),
                "입력 크기가 10배 커지면 병목이 어디에 생길지 먼저 말해볼래요?",
                (
                    "같은 정답을 내더라도 공간복잡도나 구현 복잡도 측면에서 "
                    "trade-off가 있는 대안은 무엇인가요?"
                ),
                (
                    "이 풀이를 코드 리뷰 자리에서 방어한다면 "
                    "가장 먼저 강조할 근거 한 가지는 무엇인가요?"
                ),
            ]
            intent = "Scale-up 압박 질문"
        else:
            trap_focus = (
                problem.traps[min(turn_index, len(problem.traps) - 1)]
                if problem.traps
                else None
            )
            trap_signal = trap_focus.signal if trap_focus else "구현 복잡도 또는 자료구조 선택"
            trap_hint = (
                trap_focus.hint
                if trap_focus
                else "현재 구현에서 가장 비용이 큰 연산이 어디인지 먼저 짚어볼래요?"
            )
            trap_focus_label = (
                trap_focus.interview_focus if trap_focus else "복잡도와 구현 선택의 근거"
            )
            evidence_refs.insert(
                2,
                EvidenceRef(kind="trap", label="Active trap", detail=trap_signal),
            )
            prompts = [
                (
                    f"현재 코드에서 `{trap_signal}` 신호가 보입니다. "
                    "여기서 복잡도가 어떻게 바뀌는지 설명해볼래요?"
                ),
                trap_hint,
                f"{trap_focus_label} 관점에서 지금 접근의 가장 취약한 케이스는 무엇인가요?",
                "이 코드를 다시 제출한다면 어떤 한 줄 또는 한 구조를 가장 먼저 바꾸겠나요?",
            ]
            intent = "취약점 기반 꼬리질문"

        prompt = prompts[min(turn_index, len(prompts) - 1)]
        if answer and branch.flow_type != FlowType.fallback and turn_index > 0:
            prompt = f"직전 답변을 바탕으로 이어가겠습니다. {prompt}"

        return QuestionPlan(
            prompt=prompt,
            intent=intent,
            evidence_refs=evidence_refs,
            guardrail_note=f"질문 가드레일: {guardrail}",
        )

    async def start_interview(self, *, problem: Problem, session: InterviewSession) -> str:
        session.branch_decision = self.build_branch_decision(session)
        session.flow_type = session.branch_decision.flow_type
        session.status = SessionStatus.interviewing
        question_plan = self.build_question_plan(problem=problem, session=session, answer=None)
        opening_question, mode = await self.llm_service.generate_question(
            problem=problem,
            session=session,
            ast_profile=session.ast_profile,
            answer=None,
            question_plan=question_plan,
        )
        session.question_mode = mode
        session.current_question = opening_question
        session.turns.append(
            Turn(
                role="assistant",
                content=opening_question,
                intent=question_plan.intent,
                evidence_refs=question_plan.evidence_refs,
                guardrail_note=question_plan.guardrail_note,
            )
        )
        return opening_question

    async def handle_turn(
        self, *, problem: Problem, session: InterviewSession, answer: str
    ) -> str | None:
        session.turns.append(Turn(role="user", content=answer, intent="candidate answer"))

        assistant_turns = len([turn for turn in session.turns if turn.role == "assistant"])
        if assistant_turns >= get_settings().max_interview_turns:
            session.status = SessionStatus.evaluating
            session.current_question = None
            return None

        question_plan = self.build_question_plan(problem=problem, session=session, answer=answer)
        next_question, mode = await self.llm_service.generate_question(
            problem=problem,
            session=session,
            ast_profile=session.ast_profile,
            answer=answer,
            question_plan=question_plan,
        )
        session.question_mode = mode
        session.current_question = next_question
        session.turns.append(
            Turn(
                role="assistant",
                content=next_question,
                intent=question_plan.intent,
                evidence_refs=question_plan.evidence_refs,
                guardrail_note=question_plan.guardrail_note,
            )
        )
        return next_question

    async def finalize(self, *, problem: Problem, session: InterviewSession) -> None:
        session.report, mode = await self.llm_service.generate_report(
            problem=problem, session=session
        )
        session.report_mode = mode
        session.status = SessionStatus.completed


interview_engine = InterviewEngine()
