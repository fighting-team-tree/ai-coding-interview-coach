"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";

import {
  ApiError,
  FeedbackReport,
  ProblemDetail,
  Session,
  createSession,
  finalizeSession,
  getSession,
  getProblem,
  getSessionReport,
  submitAnswer,
  submitCode,
} from "@/lib/api";
import type { SessionStatus } from "@/lib/api";

type WorkspaceProps = {
  problemId: string;
};

const MAX_INTERVIEW_TURNS = 4;

const FLOW_META = {
  normal: {
    label: "일반 심화 질문",
    focus: "취약점 기반 꼬리질문",
    description: "탐지된 trap과 AST 신호를 근거로 코드의 약한 지점을 압박합니다.",
  },
  plan_b: {
    label: "확장 검증 질문",
    focus: "확장 조건 검증",
    description: "코드 리스크가 낮을 때 더 큰 입력, 트레이드오프, 리뷰 방어 질문으로 확장합니다.",
  },
  fallback: {
    label: "개념 복구 질문",
    focus: "핵심 개념 복구 질문",
    description: "파싱 실패나 복잡도 과다 상황에서 구현보다 접근과 불변식부터 복구합니다.",
  },
} as const;

const STATUS_META: Record<
  SessionStatus,
  { label: string; tone: "neutral" | "active" | "warning" | "success" }
> = {
  created: { label: "세션 생성됨", tone: "neutral" },
  submitted: { label: "코드 분석 중", tone: "warning" },
  interviewing: { label: "면접 진행 중", tone: "active" },
  evaluating: { label: "리포트 생성 중", tone: "warning" },
  completed: { label: "피드백 완료", tone: "success" },
};

const MODE_LABEL = {
  pending: "대기",
  llm: "LLM 연동",
  deterministic: "규칙 기반",
} as const;

const EXECUTION_MODE_LABEL = {
  judge0: "실행 서버",
  demo: "샘플 실행",
} as const;

const EVIDENCE_LABEL = {
  fact: "사실",
  trap: "함정",
  ast: "코드 신호",
  goal: "질문 목표",
  boundary: "질문 경계",
  branch: "분기 근거",
} as const;

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

type EvidenceKind = keyof typeof EVIDENCE_LABEL;

type ControlledExample = {
  question: string;
  kind: EvidenceKind;
  source: string;
};

const CONTROL_COMPARISON: Record<
  keyof typeof FLOW_META,
  { generic: string[]; controlled: ControlledExample[] }
> = {
  normal: {
    generic: [
      "파이썬 데코레이터를 쓰면 더 Pythonic한 풀이가 될까요?",
      "이 코드 리뷰 좀 해주세요. 전반적으로 어떻게 생각하세요?",
      "다른 언어로 구현한다면 어떤 언어가 좋을까요?",
    ],
    controlled: [
      {
        question: "지금 구현의 최악 시간복잡도를 수식으로 설명해 주세요.",
        kind: "ast",
        source: "중첩 루프 깊이 신호",
      },
      {
        question: "입력 전제에서 이 접근이 성립하는 핵심 이유를 말씀해 주세요.",
        kind: "fact",
        source: "문제 Fact 범위",
      },
      {
        question: "더 나은 접근이 가능한지, 있다면 왜인지 한 문장으로 설명해 주세요.",
        kind: "goal",
        source: "Follow-up Goal",
      },
    ],
  },
  plan_b: {
    generic: [
      "이 코드를 리팩토링한다면 어떻게 할까요?",
      "테스트 코드도 작성해 주실 수 있나요?",
      "이 풀이를 블로그에 쓴다면 어떻게 소개하시겠어요?",
    ],
    controlled: [
      {
        question: "입력 규모가 10배 커지면 현재 구현은 어디에서 먼저 한계를 만날까요?",
        kind: "goal",
        source: "스케일업 압박",
      },
      {
        question: "메모리 제약이 달라지면 이 자료 구조를 어떻게 방어하시겠어요?",
        kind: "boundary",
        source: "Forbidden Boundary",
      },
      {
        question: "시니어 리뷰어가 이 코드를 거절한다면 가장 유력한 이유는 무엇일까요?",
        kind: "goal",
        source: "리뷰 방어 훈련",
      },
    ],
  },
  fallback: {
    generic: [
      "왜 에러가 났을까요?",
      "파이썬 문법을 더 공부해야 할까요?",
      "디버깅은 어떻게 하시나요?",
    ],
    controlled: [
      {
        question: "코드는 잠시 접어두고, 이 문제 접근의 핵심 불변식을 한 문장으로 말씀해 주세요.",
        kind: "goal",
        source: "핵심 개념 복구",
      },
      {
        question: "지금 시도한 방법이 풀이로서 가능한 전제 조건을 설명해 주세요.",
        kind: "fact",
        source: "문제 Fact",
      },
      {
        question: "최소 입력 케이스를 소리 내어 추적해 보세요.",
        kind: "goal",
        source: "접근 복구 연습",
      },
    ],
  },
};

export function ProblemWorkspace({ problemId }: WorkspaceProps) {
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveringReport, setRecoveringReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantTurnIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        setProblem(null);
        setSession(null);
        setReport(null);
        setSelectedVariantId(null);

        const problemData = await getProblem(problemId);
        if (cancelled) {
          return;
        }

        setProblem(problemData);
        const defaultVariant = problemData.demo_variants[0] ?? null;
        setSelectedVariantId(defaultVariant?.id ?? null);
        setCode(defaultVariant?.code ?? problemData.starter_code);

        const sessionData = await createSession(problemId);
        if (cancelled) {
          return;
        }

        setSession(sessionData.session);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [problemId, reloadToken]);

  const assistantTurns = session?.turns.filter((turn) => turn.role === "assistant").length ?? 0;
  const latestAssistantTurn =
    [...(session?.turns ?? [])].reverse().find((turn) => turn.role === "assistant") ?? null;
  const activeFlow = session?.flow_type ? FLOW_META[session.flow_type] : null;
  const selectedVariant =
    problem?.demo_variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const statusMeta = session ? STATUS_META[session.status] : STATUS_META.created;
  const reportAxes = report
    ? [
        { label: "정의", axis: report.logical_structure },
        { label: "해결", axis: report.technical_accuracy },
        { label: "설명", axis: report.explanation_clarity },
      ]
    : [];
  const reportAverage = reportAxes.length
    ? (reportAxes.reduce((sum, item) => sum + item.axis.score, 0) / reportAxes.length).toFixed(1)
    : null;
  const weakestAxis = reportAxes.reduce<(typeof reportAxes)[number] | null>((weakest, current) => {
    if (!weakest || current.axis.score < weakest.axis.score) {
      return current;
    }
    return weakest;
  }, null);

  function retryBootstrap() {
    setReloadToken((current) => current + 1);
  }

  useEffect(() => {
    lastAssistantTurnIdRef.current = null;
  }, [session?.id]);

  useEffect(() => {
    if (!latestAssistantTurn) {
      return;
    }

    if (latestAssistantTurn.id === lastAssistantTurnIdRef.current) {
      return;
    }

    const behavior = lastAssistantTurnIdRef.current ? "smooth" : "auto";
    lastAssistantTurnIdRef.current = latestAssistantTurn.id;
    chatLogRef.current?.scrollTo({
      top: chatLogRef.current.scrollHeight,
      behavior,
    });
  }, [latestAssistantTurn]);

  function handleLoadVariant(variantId: string) {
    if (!problem) {
      return;
    }

    const variant = problem.demo_variants.find((item) => item.id === variantId);
    if (!variant) {
      return;
    }

    setSelectedVariantId(variant.id);
    setCode(variant.code);
  }

  async function recoverReport(sessionId: string, preferFinalize = false) {
    setRecoveringReport(true);
    setError(null);
    try {
      let recoveredReport: FeedbackReport | null = null;

      if (!preferFinalize) {
        try {
          const existingReport = await getSessionReport(sessionId);
          recoveredReport = existingReport.report;
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 404) {
            throw err;
          }
        }
      }

      if (!recoveredReport) {
        const finalized = await finalizeSession(sessionId);
        recoveredReport = finalized.report;
      }

      setReport(recoveredReport);
      const refreshedSession = await getSession(sessionId);
      setSession(refreshedSession.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report recovery failed");
    } finally {
      setRecoveringReport(false);
    }
  }

  async function handleSubmitCode() {
    if (!session) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitCode(session.id, code);
      setSession(response.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendAnswer() {
    if (!session || !answer.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitAnswer(session.id, answer.trim());
      setSession(response.session);
      setAnswer("");
      if (response.completed) {
        await recoverReport(response.session.id, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Answer submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && (!problem || !session)) {
    return (
      <div className="linear-card flex flex-col items-center justify-center p-12 text-center border-red-500/20 bg-red-500/5 max-w-lg mx-auto mt-12">
        <div className="text-[10px] font-[510] tracking-[0.05em] text-red-400 uppercase mb-2">불러오기 오류</div>
        <h1 className="text-2xl font-[510] tracking-tight text-[#f7f8f8] mb-4">워크스페이스를 불러오지 못했습니다.</h1>
        <p className="text-text-tertiary text-sm mb-6">{error}</p>
        <button className="btn-primary" onClick={retryBootstrap}>
          다시 시도
        </button>
      </div>
    );
  }

  if (loading || !problem || !session) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="linear-card p-8 flex flex-col items-center max-w-sm w-full text-center bg-panel-dark">
          <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase mb-2">불러오는 중</div>
          <h2 className="text-xl font-[510] tracking-tight text-[#f7f8f8] mb-2">워크스페이스 준비 중</h2>
          <p className="text-text-tertiary text-sm">문제와 세션을 초기화하고 있습니다.</p>
          <div className="flex gap-1.5 mt-6 items-center justify-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-[pulse_1s_infinite]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-[pulse_1s_infinite_0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-[pulse_1s_infinite_0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  const sessionRail = [
    {
      title: "질문 흐름",
      value: session.branch_decision
        ? FLOW_META[session.branch_decision.flow_type].label
        : "코드 제출 대기",
      detail:
        session.branch_decision?.primary_signal ??
        "코드를 제출하면 코드 신호를 분석해 질문 방식이 자동으로 결정됩니다.",
    },
    {
      title: "질문 엔진",
      value: MODE_LABEL[session.question_mode],
      detail: "코드에서 발견된 신호를 근거로 질문을 생성합니다.",
    },
    {
      title: "리포트 엔진",
      value: MODE_LABEL[session.report_mode],
      detail: "세션이 끝나면 정의·해결·설명 3축 피드백으로 정리됩니다.",
    },
  ] as const;

  const previewFacts = problem.facts.slice(0, 2);
  const previewBoundaries = problem.forbidden_boundaries.slice(0, 2);

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 text-[#f7f8f8]">
      <section className="linear-card p-8 flex flex-col lg:flex-row gap-12 border-border-subtle">
        <div className="flex-1 space-y-5">
          <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">{problem.pattern}</div>
          <h1 className="text-4xl font-[510] tracking-tight text-[#f7f8f8]">{problem.title}</h1>
          <p className="text-lg text-text-secondary leading-relaxed tracking-[-0.01em]">{problem.elevator_pitch}</p>
          <p className="text-sm text-text-tertiary leading-relaxed">{problem.prompt}</p>
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className={`pill ${problem.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' : problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'}`}>
              {DIFFICULTY_LABEL[problem.difficulty]}
            </span>
            <span className="pill bg-transparent border-border-subtle text-text-secondary">권장 복잡도 {problem.expected_complexity}</span>
            <span className={`pill ${statusMeta.tone === 'success' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : statusMeta.tone === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : statusMeta.tone === 'active' ? 'bg-[#5e6ad2]/10 text-[#7170ff] border-[#5e6ad2]/20' : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle'}`}>{statusMeta.label}</span>
            <span className="pill bg-transparent border-border-subtle text-text-secondary">
              면접 턴 {assistantTurns} / {MAX_INTERVIEW_TURNS}
            </span>
          </div>
          <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1.5 marker:text-text-quaternary mt-6">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>

        <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="linear-card p-5 bg-panel-dark border-border-subtle shadow-subtle flex flex-col gap-3">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">세션 브리프</div>
            <h2 className="text-xl font-[510] tracking-[-0.015em] text-[#f7f8f8]">{activeFlow?.label ?? "코드 제출 대기"}</h2>
            <p className="text-sm text-text-tertiary leading-relaxed">
              {session.branch_decision?.primary_signal ??
                "코드를 제출하면 인터뷰 흐름과 피드백 방식이 정해집니다."}
            </p>
            <div className="flex flex-col gap-4 mt-4 border-t border-border-subtle pt-4">
              {sessionRail.map((item) => (
                <div key={item.title} className="flex flex-col gap-1">
                  <span className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">{item.title}</span>
                  <strong className="text-sm font-[510] text-[#f7f8f8]">{item.value}</strong>
                  <small className="text-[13px] text-text-tertiary leading-snug">{item.detail}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="linear-card p-5 bg-[rgba(255,255,255,0.02)] border-border-subtle flex flex-col gap-4">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">질문이 참고하는 범위</div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <strong className="text-sm font-[510] text-[#f7f8f8]">Fact</strong>
                <ul className="flex flex-col gap-1.5 mt-2 text-[13px] text-text-secondary">
                  {previewFacts.map((fact) => (
                    <li key={fact} className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">{fact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-sm font-[510] text-[#f7f8f8]">Boundary</strong>
                <ul className="flex flex-col gap-1.5 mt-2 text-[13px] text-text-secondary">
                  {previewBoundaries.map((boundary) => (
                    <li key={boundary} className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">{boundary}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {session.ast_profile && session.branch_decision && activeFlow ? (
        <section className="linear-card p-6 flex flex-col gap-6 border-border-subtle mt-4">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">코드 신호 → 분기 결정 → 질문 초점</div>
            <h2 className="text-xl font-[510] tracking-[-0.015em] text-[#f7f8f8]">왜 이 질문 흐름이 선택되었는지</h2>
            <p className="text-sm text-text-tertiary leading-relaxed">
              AST가 뽑은 코드 신호가 어떻게 분기를 결정하고, 어떤 질문 초점으로
              이어지는지 한 줄에서 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:items-center p-4 bg-panel-dark rounded-lg border border-border-subtle shadow-inset">
            <div className="flex-1 flex flex-col gap-2 bg-[rgba(255,255,255,0.02)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">1. 코드 신호 (AST)</div>
              <ul className="flex flex-col gap-1 text-[13px] text-text-secondary mt-1">
                <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">중첩 루프 깊이: {session.ast_profile.nested_loop_depth}</li>
                <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">
                  위험 연산:{" "}
                  {session.ast_profile.has_risky_ops.length > 0
                    ? session.ast_profile.has_risky_ops.join(", ")
                    : "없음"}
                </li>
                <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">순환 복잡도: {session.ast_profile.cyclomatic_complexity}</li>
                <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">파싱: {session.ast_profile.parse_ok ? "성공" : "실패"}</li>
              </ul>
            </div>
            <div className="text-text-quaternary font-bold hidden md:block" aria-hidden="true">
              →
            </div>
            <div className="text-text-quaternary font-bold md:hidden rotate-90 mx-auto" aria-hidden="true">
              →
            </div>
            <div className="flex-1 flex flex-col gap-2 bg-[rgba(255,255,255,0.02)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">2. 분기 결정</div>
              <strong className="text-sm font-[510] text-[#f7f8f8]">{activeFlow.label}</strong>
              <small className="text-[13px] text-text-tertiary">{session.branch_decision.primary_signal}</small>
              {session.branch_decision.reason_codes.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {session.branch_decision.reason_codes.map((code) => (
                    <span key={code} className="pill bg-[rgba(255,255,255,0.03)] border-border-subtle text-text-tertiary">
                      {code}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="text-text-quaternary font-bold hidden md:block" aria-hidden="true">
              →
            </div>
            <div className="text-text-quaternary font-bold md:hidden rotate-90 mx-auto" aria-hidden="true">
              →
            </div>
            <div className="flex-1 flex flex-col gap-2 bg-[rgba(255,255,255,0.02)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">3. 질문 초점</div>
              <strong className="text-sm font-[510] text-[#f7f8f8]">{activeFlow.focus}</strong>
              <small className="text-[13px] text-text-tertiary">{activeFlow.description}</small>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        <div className="linear-card flex flex-col lg:col-span-7 h-full min-h-[600px] border-border-subtle bg-panel-dark overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-border-subtle bg-[rgba(255,255,255,0.01)]">
            <div>
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase mb-1">풀이 코드 입력</div>
              <h2 className="text-lg font-[510] tracking-[-0.01em] text-[#f7f8f8]">코드를 제출하면 분기 시연이 시작됩니다</h2>
            </div>
            <button className="btn-primary" onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? "제출 중..." : "코드 제출"}
            </button>
          </div>

          <p className="text-sm text-text-secondary px-5 pt-4 leading-relaxed">
            대표 문제에서는 같은 문제에 다른 코드를 넣었을 때 질문 흐름이 어떻게 달라지는지를
            짧고 선명하게 보여주는 것이 핵심입니다.
          </p>

          {problem.demo_variants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pt-3 pb-5">
              {problem.demo_variants.map((variant, index) => {
                const selected = selectedVariant?.id === variant.id;
                const isRecommended = index === 0;
                return (
                  <button
                    key={variant.id}
                    className={`flex flex-col text-left p-4 rounded-lg border transition-all duration-150 ease-standard text-sm ${selected ? 'border-[#5e6ad2] bg-[#5e6ad2]/10 shadow-[0_0_0_1px_rgba(94,106,210,0.2)]' : 'border-border-subtle bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)]'}`}
                    onClick={() => handleLoadVariant(variant.id)}
                    type="button"
                  >
                    <div className="flex justify-between items-start mb-2 w-full">
                      <span className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">{variant.label}</span>
                      {isRecommended ? (
                        <span className="badge-subtle bg-[#5e6ad2]/20 text-[#7170ff] border-[#5e6ad2]/30">여기서 시작</span>
                      ) : null}
                    </div>
                    <strong className="text-[14px] font-[510] text-[#f7f8f8]">{FLOW_META[variant.expected_flow].label}</strong>
                    <span className="text-[13px] text-text-secondary mt-1 block">{variant.purpose}</span>
                    <small className="text-[11px] text-text-quaternary mt-3 block font-mono tracking-tight">{variant.expected_signals.join(" / ")}</small>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex-1 min-h-[420px] relative border-t border-border-subtle bg-[#08090a]">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
            />
          </div>

          {session.judge_result ? (
            <div className="m-5 p-4 rounded-lg bg-[#0f1011] border border-border-subtle shadow-inset font-mono text-sm">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                <strong className="text-text-primary font-medium">{session.judge_result.status}</strong>
                <span
                  className={`badge-subtle ${
                    session.judge_result.passed ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {EXECUTION_MODE_LABEL[session.judge_result.mode]}
                </span>
              </div>
              <p className="text-text-secondary whitespace-pre-wrap">
                {session.judge_result.stdout ||
                  session.judge_result.stderr ||
                  "실행 출력이 없습니다."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5 h-full">
          <div className="linear-card flex flex-col h-full border-border-subtle bg-[#0f1011] overflow-hidden max-h-[850px]">
            <div className="flex justify-between items-start p-5 border-b border-border-subtle bg-[rgba(255,255,255,0.01)] shrink-0">
              <div>
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase mb-1">질문 흐름</div>
                <h2 className="text-lg font-[510] tracking-[-0.01em] text-[#f7f8f8]">코드 근거 기반 면접 시연</h2>
              </div>
              <span className={`pill ${statusMeta.tone === 'success' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : statusMeta.tone === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : statusMeta.tone === 'active' ? 'bg-[#5e6ad2]/10 text-[#7170ff] border-[#5e6ad2]/20' : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle'}`}>{statusMeta.label}</span>
            </div>

            <div className={`mx-5 mt-5 mb-1 p-4 rounded-lg border text-sm shrink-0 ${session.flow_type ? 'bg-[#5e6ad2]/10 border-[#5e6ad2]/20 text-[#d0d6e0]' : 'bg-[rgba(255,255,255,0.02)] border-border-subtle text-text-tertiary'}`}>
              <div className="flex justify-between items-center mb-2">
                <strong className="font-[510] text-[#f7f8f8]">{activeFlow?.label ?? "코드 제출 대기"}</strong>
                {session.question_mode === "deterministic" ? (
                  <span className="badge-subtle bg-[rgba(255,255,255,0.1)] border-border-subtle text-text-primary">시연 안정 모드</span>
                ) : null}
              </div>
              <p className="leading-relaxed">
                {session.branch_decision?.primary_signal ??
                  "코드를 제출하면 코드 신호를 기준으로 질문 흐름이 자동 선택됩니다."}
              </p>
            </div>

            <div ref={chatLogRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px]">
              {session.turns.length === 0 ? (
                <p className="text-text-tertiary text-sm text-center mt-10">코드를 제출하면 첫 질문이 시작됩니다.</p>
              ) : (
                session.turns.map((turn) => (
                  <div key={turn.id} className={`flex flex-col gap-1.5 p-4 rounded-lg text-[15px] leading-relaxed ${turn.role === 'assistant' ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[#f7f8f8]' : 'bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[#f7f8f8] ml-8'}`}>
                    <div className="text-[11px] font-[510] uppercase tracking-wider text-text-tertiary">
                      {turn.role === "assistant" ? "면접 질문" : "내 답변"}
                    </div>
                    <div>{turn.content}</div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-border-subtle bg-[#08090a] flex flex-col gap-3 shrink-0">
              <div className="flex flex-wrap justify-between items-center gap-2 text-[12px] text-text-tertiary">
                <span>이번 답변에 담아보세요</span>
                <div className="flex gap-2">
                  <span className="pill bg-[rgba(255,255,255,0.03)] border-border-subtle text-text-tertiary text-[10px] px-2 py-0.5">접근</span>
                  <span className="pill bg-[rgba(255,255,255,0.03)] border-border-subtle text-text-tertiary text-[10px] px-2 py-0.5">복잡도</span>
                  <span className="pill bg-[rgba(255,255,255,0.03)] border-border-subtle text-text-tertiary text-[10px] px-2 py-0.5">불변식</span>
                  <span className="pill bg-[rgba(255,255,255,0.03)] border-border-subtle text-text-tertiary text-[10px] px-2 py-0.5">트레이드오프</span>
                </div>
              </div>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="풀이 접근, 시간복잡도, 핵심 판단 기준과 왜 그런 선택을 했는지 설명해보세요."
                rows={3}
                disabled={session.status === "completed" || submitting || !session.current_question}
                className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-md p-3 text-[15px] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] transition-shadow resize-y min-h-[80px]"
              />
              <button
                className="btn-primary w-full justify-center py-2 mt-1"
                onClick={handleSendAnswer}
                disabled={submitting || recoveringReport || !session.current_question}
              >
                {submitting ? "전송 중..." : "답변 보내기"}
              </button>
            </div>
          </div>

          <div className="linear-card p-6 border-border-subtle bg-panel-dark">
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">질문 근거</div>
              <h2 className="text-lg font-[510] tracking-[-0.01em] text-[#f7f8f8]">왜 이런 질문이 나왔는지</h2>
            </div>

            <div className="flex flex-col gap-6 mt-5">
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">이번 턴의 확인 포인트</div>
                <strong className="text-[14px] text-[#f7f8f8] font-[510]">{latestAssistantTurn?.intent ?? "코드 제출 전"}</strong>
                <p className="text-[13px] text-text-tertiary leading-relaxed mt-1">
                  {latestAssistantTurn?.guardrail_note ??
                    "첫 질문이 시작되면 질문 근거와 제한 범위가 함께 표시됩니다."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">지금 쓰인 근거</div>
                {latestAssistantTurn?.evidence_refs.length ? (
                  <ul className="flex flex-col gap-3 mt-2">
                    {latestAssistantTurn.evidence_refs.map((ref) => (
                      <li key={`${ref.kind}-${ref.label}-${ref.detail}`} className="flex flex-col gap-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-md p-3">
                        <span className={`badge-subtle self-start text-[10px] uppercase tracking-wider ${ref.kind === 'trap' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ref.kind === 'ast' ? 'bg-[#5e6ad2]/10 text-[#7170ff] border-[#5e6ad2]/20' : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle'}`}>{EVIDENCE_LABEL[ref.kind]}</span>
                        <div className="flex flex-col gap-1 mt-1">
                          <strong className="text-[14px] text-[#f7f8f8] font-[510]">{ref.label}</strong>
                          <p className="text-[13px] text-text-tertiary leading-relaxed">{ref.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-tertiary text-sm mt-1">코드를 제출하면 턴별 질문 근거가 여기에 표시됩니다.</p>
                )}
              </div>

              {session.ast_profile ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">코드 분석 요약</div>
                  <ul className="flex flex-col gap-1 text-[13px] text-text-secondary mt-1">
                    <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">파싱 성공: {String(session.ast_profile.parse_ok)}</li>
                    <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">중첩 루프 깊이: {session.ast_profile.nested_loop_depth}</li>
                    <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">순환 복잡도: {session.ast_profile.cyclomatic_complexity}</li>
                    <li className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">위험 연산: {session.ast_profile.has_risky_ops.join(", ") || "없음"}</li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {session.branch_decision ? (
        <section className="linear-card p-8 mt-8 border-border-subtle bg-[#0f1011]">
          <div className="flex flex-col gap-3 max-w-3xl mb-8">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">범용 LLM vs 통제형 질문 생성</div>
            <h2 className="text-xl font-[510] tracking-[-0.01em] text-[#f7f8f8]">같은 코드 입력에 대해 질문이 어떻게 달라지는가</h2>
            <p className="text-sm text-text-tertiary leading-relaxed">
              자유 프롬프트 기반 범용 LLM은 주제 이탈 위험이 크고 근거 추적이 어렵습니다.
              본 시스템은 문제별 Fact/Trap/Forbidden Boundary 범위 안에서만 질문을
              생성하므로, 모든 질문에 대해 코드·문제 근거를 역추적할 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="flex flex-col gap-4 p-5 rounded-xl border border-border-subtle bg-[rgba(255,255,255,0.02)]">
              <header className="flex flex-col gap-2 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <span className="badge-subtle bg-yellow-500/10 text-yellow-400 border-yellow-500/20 self-start text-[11px]">범용 대화형 LLM</span>
                <small className="text-[13px] text-text-tertiary">주제 이탈 · 근거 없음 · 검수 불가</small>
              </header>
              <ul className="flex flex-col gap-3 text-[14px] text-text-secondary list-disc pl-4 marker:text-[rgba(255,255,255,0.2)]">
                {CONTROL_COMPARISON[session.branch_decision.flow_type].generic.map((question) => (
                  <li key={question} className="leading-relaxed">{question}</li>
                ))}
              </ul>
            </article>
            <article className="flex flex-col gap-4 p-5 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 shadow-[0_0_15px_rgba(16,185,129,0.03)_inset]">
              <header className="flex flex-col gap-2 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <span className="badge-subtle bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 self-start text-[11px]">통제형 기술면접</span>
                <small className="text-[13px] text-[#10b981]/70">Fact/Trap 범위 내 · 근거 명시 · 재현 가능</small>
              </header>
              <ul className="flex flex-col gap-5 text-[14px] text-[#f7f8f8]">
                {CONTROL_COMPARISON[session.branch_decision.flow_type].controlled.map((example) => (
                  <li key={example.question} className="flex flex-col gap-2 pb-4 border-b border-[rgba(255,255,255,0.05)] last:border-0 last:pb-0">
                    <strong className="font-normal leading-relaxed">{example.question}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-subtle bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle text-[10px] px-2 py-0.5">
                        {EVIDENCE_LABEL[example.kind]}
                      </span>
                      <small className="text-[12px] text-text-tertiary">{example.source}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {report ? (
        <section className="flex flex-col gap-8 mt-12">
          {session.report_mode === "deterministic" ? (
            <div className="linear-card p-5 bg-[#5e6ad2]/10 border-[#5e6ad2]/20 flex flex-col gap-2 text-sm text-[#d0d6e0]">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#7170ff] uppercase">외부 의존성 대응 모드</div>
              <p className="leading-relaxed">
                외부 LLM이 없어도 대화 로그 휴리스틱 기반으로 3축 리포트가 자동 생성됩니다.
                제안서 2.7에서 정의한 <strong className="font-[510] text-[#f7f8f8]">&apos;외부 의존성 하의 데모 안정성&apos;</strong>{" "}
                요건 — 외부 API 불안정 상황에서도 세션을 완주하는 fallback 구조가 실제로
                작동 중입니다.
              </p>
            </div>
          ) : null}

          <div className="linear-card p-8 bg-[rgba(255,255,255,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-border-subtle">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">Stage 03</div>
              <h2 className="text-2xl font-[510] tracking-[-0.015em] text-[#f7f8f8]">3축 피드백</h2>
              <p className="text-[15px] text-text-secondary leading-relaxed">{report.summary}</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-panel-dark rounded-xl p-6 min-w-[160px] border border-border-subtle shadow-inset shrink-0">
              <div className="text-4xl font-[510] text-[#f7f8f8] tracking-[-0.02em] mb-1">{reportAverage}/10</div>
              <p className="text-sm text-text-secondary">전체 준비도</p>
              <span className="text-[12px] text-text-quaternary mt-2">가장 약한 축: {weakestAxis?.label ?? "없음"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportAxes.map(({ label, axis }) => (
              <article key={label} className="linear-card p-6 flex flex-col gap-4 border-border-subtle bg-panel-dark hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xl font-[510] text-[#f7f8f8]">{axis.score}/10</div>
                  <strong className="text-[15px] text-text-secondary font-[510]">{label}</strong>
                </div>
                <div className="h-1.5 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5e6ad2] rounded-full" style={{ width: `${axis.score * 10}%` }} />
                </div>
                <p className="text-[14px] text-text-secondary leading-relaxed mt-2 flex-1">{axis.rationale}</p>
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-2">
                  <strong className="text-[11px] uppercase tracking-wider text-text-tertiary">다음 연습</strong>
                  <p className="text-[13px] text-[#f7f8f8] leading-relaxed">{axis.next_step}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
            <button className="btn-primary px-6 py-2.5" onClick={retryBootstrap}>
              같은 문제 다시 시연하기
            </button>
            <Link className="btn-ghost px-6 py-2.5" href="/">
              다른 시연 문제 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="linear-card p-6 border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] flex flex-col gap-3">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">시연 요약</div>
              <h3 className="text-lg font-[510] text-[#f7f8f8] tracking-[-0.01em]">이번 시연에서 어떤 흐름이 선택됐는지</h3>
              <p className="text-sm text-[#d0d6e0] leading-relaxed mt-1">
                분기:{" "}
                {session.branch_decision
                  ? FLOW_META[session.branch_decision.flow_type].label
                  : "대기"}{" "}
                / 질문 엔진: {MODE_LABEL[session.question_mode]} / 리포트 엔진:{" "}
                {MODE_LABEL[session.report_mode]}
              </p>
              <p className="text-[13px] text-text-tertiary leading-relaxed mt-2">
                어떤 코드 신호 때문에 이 질문 흐름이 선택됐는지, 그리고 피드백이 어떤 방식으로
                정리됐는지 빠르게 복기할 수 있습니다.
              </p>
            </div>

            <div className="linear-card p-6 border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] flex flex-col gap-3">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">다음 검증 포인트</div>
              <h3 className="text-lg font-[510] text-[#f7f8f8] tracking-[-0.01em]">다음 시연에서 먼저 확인할 약점 축</h3>
              <p className="text-sm text-[#d0d6e0] leading-relaxed mt-1">
                약한 축: {weakestAxis?.label ?? "미확정"} / 대표 신호:{" "}
                {session.branch_decision?.primary_signal ?? "대기"}
              </p>
              <ul className="list-disc pl-5 text-[13px] text-text-tertiary space-y-1.5 marker:text-text-quaternary mt-3">
                {report.recommended_drills.map((drill) => (
                  <li key={drill} className="leading-relaxed">{drill}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {!report && session.status === "evaluating" ? (
        <section className="linear-card p-6 mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-yellow-500/80 uppercase">리포트 복구</div>
            <h2 className="text-lg font-[510] text-yellow-400">리포트 생성이 지연되거나 실패했을 수 있습니다.</h2>
            <p className="text-sm text-yellow-500/70">
              이미 생성된 리포트를 다시 읽거나, 마무리 요청을 한 번 더 보내 복구할 수 있습니다.
            </p>
          </div>
          <button
            className="btn-primary shrink-0 bg-yellow-500 text-black hover:bg-yellow-400 border-transparent"
            onClick={() => recoverReport(session.id)}
            disabled={recoveringReport || submitting}
          >
            {recoveringReport ? "복구 중..." : "리포트 복구"}
          </button>
        </section>
      ) : null}

      {error ? (
        <div className="mt-6 p-4 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center justify-center">
          {error}
        </div>
      ) : null}
    </div>
  );
}
