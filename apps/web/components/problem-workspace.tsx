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
    label: "복잡도 설명 코칭",
    focus: "풀이 근거 확인",
    description: "현재 풀이의 시간복잡도와 개선 가능성을 말로 설명하게 합니다.",
  },
  plan_b: {
    label: "확장 판단 코칭",
    focus: "대안 판단 확인",
    description: "풀이가 안정적이면 입력 변화와 자료구조 선택을 방어하게 합니다.",
  },
  fallback: {
    label: "기초 개념 복구",
    focus: "핵심 개념 복기",
    description: "코드보다 접근 전제와 최소 입력 추적부터 다시 확인합니다.",
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

const EXECUTION_MODE_LABEL = {
  judge0: "실행 확인",
  demo: "코드 확인",
} as const;

const EVIDENCE_LABEL = {
  fact: "문제 조건",
  trap: "주의 포인트",
  ast: "코드 분석",
  goal: "질문 의도",
  boundary: "질문 제한",
  branch: "선택 근거",
} as const;

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

const SESSION_CONTEXT = {
  learner: "김도윤 수강생",
  cohort: "백엔드 취업반 대표 세션",
  coachGoal: "정답 여부보다 풀이 근거와 설명 습관을 확인",
} as const;

function sanitizeBuyerFacingText(content: string | null | undefined): string {
  if (!content) {
    return "";
  }

  return content
    .replace(
      "모델 미연동 안전 모드: 대화 로그 휴리스틱을 기반으로 자동 생성된 리포트입니다. ",
      "현재 세션을 바탕으로 자동 정리된 리포트입니다. ",
    )
    .replace("데모 환경에서는 제출 코드를 실제 실행하지 않고 결정론적 시연 흐름만 사용합니다.", "제출 코드를 기준으로 질문 흐름과 피드백을 정리했습니다.")
    .replace("데모 실행 모드", "현재 세션 기준")
    .replace("내장 실행 모드", "코드 확인 완료")
    .replace("제출 코드를 실제 실행하지 않고", "제출 코드를 기준으로")
    .replace("결정론적 시연 흐름만 사용합니다.", "질문 흐름과 피드백을 정리했습니다.")
    .replace("실제로 실행하지 않았습니다", "현재 세션 기준으로 정리했습니다")
    .trim();
}

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
  const primaryCoachSignal = session?.branch_decision?.primary_signal ?? "코드 제출 후 확인";
  const firstRecommendedDrill = report?.recommended_drills[0] ?? "세션 완료 후 다음 연습 항목 확인";
  const buyerFacingReportSummary = sanitizeBuyerFacingText(report?.summary);
  const buyerFacingJudgeStatus = sanitizeBuyerFacingText(session?.judge_result?.status);
  const buyerFacingJudgeOutput = sanitizeBuyerFacingText(
    session?.judge_result?.stdout || session?.judge_result?.stderr,
  );

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
      title: "1. 코드 제출",
      value: selectedVariant ? "대표 제출 선택" : "대표 풀이",
    },
    {
      title: "2. 코칭 질문",
      value: activeFlow?.focus ?? "코드 제출 후 시작",
    },
    {
      title: "3. 코칭 메모",
      value: weakestAxis ? `${weakestAxis.label} 보완` : "3축 피드백 대기",
    },
  ] as const;

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 text-[#f7f8f8]">
      <section className="linear-card p-8 flex flex-col lg:flex-row gap-12 border-border-subtle">
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-brand-indigo/10 border-brand-indigo/20 text-brand-indigo">
              {SESSION_CONTEXT.cohort}
            </span>
            <span className="pill bg-transparent border-border-subtle text-text-secondary">
              {SESSION_CONTEXT.learner}
            </span>
          </div>
          <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">{problem.pattern}</div>
          <h1 className="text-4xl font-[510] tracking-tight text-[#f7f8f8]">{problem.title}</h1>
          <p className="text-lg text-text-secondary leading-relaxed tracking-[-0.01em]">{problem.elevator_pitch}</p>
          <p className="text-sm text-text-secondary leading-relaxed">과제: {problem.prompt}</p>
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
          <details className="mt-4 rounded-lg border border-border-subtle bg-white/[0.02] px-4 py-3 text-sm text-text-secondary">
            <summary className="cursor-pointer text-text-tertiary">문제 조건 보기</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-text-quaternary">
              {problem.constraints.map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </details>
        </div>

        <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="linear-card p-5 bg-panel-dark border-border-subtle shadow-subtle flex flex-col gap-3">
            <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">대표 세션 경로</div>
            <h2 className="text-xl font-[510] tracking-[-0.015em] text-[#f7f8f8]">{activeFlow?.label ?? "코드 제출 대기"}</h2>
            <p className="text-sm text-text-tertiary leading-relaxed">
              {session.branch_decision?.primary_signal ??
                SESSION_CONTEXT.coachGoal}
            </p>
            <div className="flex flex-col gap-4 mt-4 border-t border-border-subtle pt-4">
              {sessionRail.map((item) => (
                <div key={item.title} className="flex flex-col gap-1">
                  <span className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">{item.title}</span>
                  <strong className="text-sm font-[510] text-[#f7f8f8]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        <div className="linear-card flex flex-col lg:col-span-7 h-full min-h-[600px] border-border-subtle bg-panel-dark overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-border-subtle bg-[rgba(255,255,255,0.01)]">
              <div>
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase mb-1">학습자 풀이 코드</div>
                <h2 className="text-lg font-[510] tracking-[-0.01em] text-[#f7f8f8]">코드를 제출하면 개인화 질문이 시작됩니다</h2>
              </div>
            <button className="btn-primary" onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? "제출 중..." : "코드 제출"}
            </button>
          </div>

          {problem.demo_variants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
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
                      <span className="badge-subtle bg-[#5e6ad2]/20 text-[#7170ff] border-[#5e6ad2]/30">대표 제출</span>
                      ) : null}
                    </div>
                    <strong className="text-[14px] font-[510] text-[#f7f8f8]">{FLOW_META[variant.expected_flow].label}</strong>
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
                <strong className="text-text-primary font-medium">{buyerFacingJudgeStatus}</strong>
                <span
                  className={`badge-subtle ${
                    session.judge_result.passed ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {EXECUTION_MODE_LABEL[session.judge_result.mode]}
                </span>
              </div>
              <p className="text-text-secondary whitespace-pre-wrap">
                {buyerFacingJudgeOutput ||
                  "실행 출력이 없습니다."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5 h-full">
          <div
            className="linear-card flex flex-col h-full border-border-subtle bg-[#0f1011] overflow-hidden max-h-[850px]"
            data-video-interview-panel
          >
            <div className="flex justify-between items-start p-5 border-b border-border-subtle bg-[rgba(255,255,255,0.01)] shrink-0">
              <div>
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase mb-1">훈련 대화</div>
                <h2 className="text-lg font-[510] tracking-[-0.01em] text-[#f7f8f8]">코드 기반 코칭 질문</h2>
              </div>
              <span className={`pill ${statusMeta.tone === 'success' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : statusMeta.tone === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : statusMeta.tone === 'active' ? 'bg-[#5e6ad2]/10 text-[#7170ff] border-[#5e6ad2]/20' : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle'}`}>{statusMeta.label}</span>
            </div>

            <div className={`mx-5 mt-5 mb-1 p-4 rounded-lg border text-sm shrink-0 ${session.flow_type ? 'bg-[#5e6ad2]/10 border-[#5e6ad2]/20 text-[#d0d6e0]' : 'bg-[rgba(255,255,255,0.02)] border-border-subtle text-text-tertiary'}`}>
              <div className="flex justify-between items-center mb-2">
                <strong className="font-[510] text-[#f7f8f8]">{activeFlow?.label ?? "코드 제출 대기"}</strong>
              </div>
              <p className="leading-relaxed">
                {session.branch_decision?.primary_signal ??
                  "코드를 제출하면 첫 코칭 질문이 시작됩니다."}
              </p>
            </div>

            <div
              ref={chatLogRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px]"
              data-video-chat-log
            >
              {session.turns.length === 0 ? (
                <p className="text-text-tertiary text-sm text-center mt-10">학습자 코드를 제출하면 첫 코칭 질문이 시작됩니다.</p>
              ) : (
                session.turns.map((turn) => (
                  <div key={turn.id} className={`flex flex-col gap-1.5 p-4 rounded-lg text-[15px] leading-relaxed ${turn.role === 'assistant' ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[#f7f8f8]' : 'bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[#f7f8f8] ml-8'}`}>
                    <div className="text-[11px] font-[510] uppercase tracking-wider text-text-tertiary">
                      {turn.role === "assistant" ? "코칭 질문" : "학습자 답변"}
                    </div>
                    <div>{turn.content}</div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-border-subtle bg-[#08090a] flex flex-col gap-3 shrink-0">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="풀이 근거와 시간복잡도를 짧게 설명해보세요."
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

          <details className="linear-card border-border-subtle bg-panel-dark p-5 text-sm text-text-secondary">
            <summary className="cursor-pointer text-[#f7f8f8] font-[510]">
              <h2 className="inline text-lg font-[510] tracking-[-0.01em]">질문을 뒷받침하는 최소 근거</h2>
            </summary>
            <div className="mt-4 flex flex-col gap-4 border-t border-border-subtle pt-4">
              <div>
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">강사가 확인할 기준</div>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-text-tertiary">
                  {problem.facts.slice(0, 2).map((fact) => (
                    <li key={fact} className="flex items-start gap-2 before:content-['·'] before:text-text-quaternary">{fact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">확인 포인트</div>
                <p className="mt-2 text-[13px] text-text-tertiary leading-relaxed">
                  {latestAssistantTurn?.intent ?? "코드 제출 전"}
                </p>
              </div>
              {latestAssistantTurn?.evidence_refs.length ? (
                <ul className="flex flex-col gap-3">
                  {latestAssistantTurn.evidence_refs.map((ref) => (
                    <li key={`${ref.kind}-${ref.label}-${ref.detail}`} className="flex flex-col gap-2 rounded-md border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
                      <span className={`badge-subtle self-start text-[10px] uppercase tracking-wider ${ref.kind === 'trap' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ref.kind === 'ast' ? 'bg-[#5e6ad2]/10 text-[#7170ff] border-[#5e6ad2]/20' : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-border-subtle'}`}>{EVIDENCE_LABEL[ref.kind]}</span>
                      <strong className="text-[14px] font-[510] text-[#f7f8f8]">{ref.label}</strong>
                      <p className="text-[13px] text-text-tertiary leading-relaxed">{ref.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-text-tertiary">코드 제출 후 표시됩니다.</p>
              )}
            </div>
          </details>
        </div>
      </section>

      {report ? (
        <section className="flex flex-col gap-8 mt-12" data-video-report>
          <div className="linear-card p-8 bg-[rgba(255,255,255,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-border-subtle">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-[#8a8f98] uppercase">세션 결과</div>
              <h2 className="text-2xl font-[510] tracking-[-0.015em] text-[#f7f8f8]">3축 피드백 → 코칭 메모</h2>
              <p className="text-[15px] text-text-secondary leading-relaxed line-clamp-2">{buyerFacingReportSummary}</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-panel-dark rounded-xl p-6 min-w-[160px] border border-border-subtle shadow-inset shrink-0">
              <div className="text-4xl font-[510] text-[#f7f8f8] tracking-[-0.02em] mb-1">{reportAverage}/10</div>
              <p className="text-sm text-text-secondary">전체 준비도</p>
              <span className="text-[12px] text-status-emerald mt-2">우선 코칭: {weakestAxis?.label ?? "없음"}</span>
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
                <p className="text-[14px] text-text-secondary leading-relaxed mt-2 flex-1 line-clamp-3">{axis.rationale}</p>
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-2">
                  <strong className="text-[11px] uppercase tracking-wider text-text-tertiary">다음 연습</strong>
                  <p className="text-[13px] text-[#f7f8f8] leading-relaxed">{axis.next_step}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="linear-card p-8 border-[#10b981]/20 bg-[#10b981]/5 flex flex-col gap-6">
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="text-[10px] font-[510] tracking-[0.05em] text-status-emerald uppercase">
                강사 코칭 메모
              </div>
              <h3 className="text-xl font-[510] tracking-[-0.01em] text-[#f7f8f8]">
                강사가 다음에 물어볼 것
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-5">
                <div className="text-[10px] font-[510] uppercase tracking-[0.12em] text-text-tertiary">우선 코칭 축</div>
                <strong className="mt-3 block text-[15px] font-[510] text-[#f7f8f8]">
                  {weakestAxis ? `${weakestAxis.label} 보완` : "리포트 확인"}
                </strong>
                <p className="mt-2 text-[13px] leading-[1.5] text-text-secondary">
                  {weakestAxis?.axis.next_step ?? "세션 결과가 생성되면 가장 약한 축을 먼저 확인합니다."}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-5">
                <div className="text-[10px] font-[510] uppercase tracking-[0.12em] text-text-tertiary">근거 메모</div>
                <strong className="mt-3 block text-[15px] font-[510] text-[#f7f8f8]">질문 흐름을 만든 신호</strong>
                <p className="mt-2 text-[13px] leading-[1.5] text-text-secondary">{primaryCoachSignal}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-5">
                <div className="text-[10px] font-[510] uppercase tracking-[0.12em] text-text-tertiary">다음 과제</div>
                <strong className="mt-3 block text-[15px] font-[510] text-[#f7f8f8]">수강생에게 남길 연습</strong>
                <p className="mt-2 text-[13px] leading-[1.5] text-text-secondary">{firstRecommendedDrill}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
            <button className="btn-primary px-6 py-2.5" onClick={retryBootstrap}>
              같은 문제 다시 진행하기
            </button>
            <Link className="btn-ghost px-6 py-2.5" href="/">
              다른 문제 보기
            </Link>
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
