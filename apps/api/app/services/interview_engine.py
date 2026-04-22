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
            return "코드 분석 정보가 없습니다."
        if flow == FlowType.fallback and not profile.parse_ok:
            return profile.notes[0] if profile.notes else "코드를 해석할 수 없습니다."
        if flow == FlowType.fallback and profile.cyclomatic_complexity >= 15:
            return (
                "분기 수가 많아 접근 설명부터 다시 확인합니다. "
                f"({profile.cyclomatic_complexity})"
            )
        if flow == FlowType.normal:
            if profile.has_risky_ops:
                return f"비용이 큰 연산이 감지되었습니다. ({profile.has_risky_ops[0]})"
            return (
                "중첩 반복문이 감지되어 복잡도 설명이 필요합니다. "
                f"(깊이 {profile.nested_loop_depth})"
            )
        return "위험 신호가 적어 더 넓은 질문으로 이어집니다."

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
            return "지원자의 판단 근거와 트레이드오프 설명을 확인합니다."
        return problem.follow_up_goals[min(turn_index, len(problem.follow_up_goals) - 1)]

    def _ast_reference(self, session: InterviewSession) -> EvidenceRef:
        profile = session.ast_profile
        if profile is None:
            return EvidenceRef(kind="ast", label="코드 분석", detail="분석 결과가 아직 없습니다.")
        if not profile.parse_ok:
            return EvidenceRef(
                kind="ast",
                label="파싱 상태",
                detail=profile.notes[0] if profile.notes else "코드를 해석하지 못했습니다.",
            )
        if profile.has_risky_ops:
            return EvidenceRef(
                kind="ast",
                label="비용이 큰 연산",
                detail=profile.has_risky_ops[0],
            )
        if profile.nested_loop_depth >= 2:
            return EvidenceRef(
                kind="ast",
                label="중첩 루프 깊이",
                detail=f"중첩 루프 깊이 {profile.nested_loop_depth}가 감지되었습니다.",
            )
        return EvidenceRef(
            kind="ast",
            label="안정적인 코드 신호",
            detail=(
                f"중첩 루프 깊이 {profile.nested_loop_depth}, "
                f"순환 복잡도 {profile.cyclomatic_complexity}"
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
            EvidenceRef(kind="branch", label="선택된 흐름", detail=branch.primary_signal),
            EvidenceRef(kind="fact", label="문제 조건", detail=fact),
            EvidenceRef(kind="goal", label="다음 질문 방향", detail=goal),
            ast_ref,
            EvidenceRef(kind="boundary", label="질문 제한", detail=guardrail),
        ]

        if branch.flow_type == FlowType.fallback:
            prompts = [
                (
                    "이 문제를 어떤 접근으로 풀려고 했는지 한 문장으로 설명해 주세요."
                ),
                (
                    "가장 비용이 큰 반복이 어디인지 기준으로 시간복잡도를 설명해 주세요."
                ),
                "이 풀이에서 끝까지 유지해야 하는 핵심 상태나 불변식은 무엇인가요?",
                "같은 문제를 다시 푼다면 어떤 구조로 더 단순하게 다시 짜겠어요?",
            ]
            intent = "핵심 개념 복구"
        elif branch.flow_type == FlowType.plan_b:
            prompts = [
                (
                    f"왜 {problem.pattern} 패턴을 선택했는지 brute force와 비교해서 설명해 주세요."
                ),
                "입력 크기가 10배 커지면 어디가 먼저 병목이 될까요?",
                (
                    "같은 정답을 내더라도 공간복잡도나 구현 복잡도 측면에서 어떤 대안이 있나요?"
                ),
                (
                    "코드 리뷰에서 이 풀이를 방어해야 한다면 가장 먼저 어떤 근거를 말하겠어요?"
                ),
            ]
            intent = "확장 상황 확인"
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
                EvidenceRef(kind="trap", label="이번 질문의 확인 포인트", detail=trap_signal),
            )
            prompts = [
                trap_hint,
                f"{trap_focus_label} 기준으로 지금 접근의 가장 약한 지점을 설명해 주세요.",
                "이 접근이 흔들리는 입력이나 반례를 하나 들어보세요.",
                "이 코드를 다시 제출한다면 어떤 한 줄 또는 한 구조를 가장 먼저 바꾸겠나요?",
            ]
            intent = "풀이 약점 확인"

        prompt = prompts[min(turn_index, len(prompts) - 1)]

        return QuestionPlan(
            prompt=prompt,
            intent=intent,
            evidence_refs=evidence_refs,
            guardrail_note=f"질문은 이 범위를 벗어나지 않습니다: {guardrail}",
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
