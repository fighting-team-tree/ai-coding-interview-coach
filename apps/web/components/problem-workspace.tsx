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
      setSession((current) => (current ? { ...current, status: "completed" } : current));
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
      <div className="card error-state">
        <div className="eyebrow">불러오기 오류</div>
        <h1>워크스페이스를 불러오지 못했습니다.</h1>
        <p className="muted">{error}</p>
        <button className="primary" onClick={retryBootstrap}>
          다시 시도
        </button>
      </div>
    );
  }

  if (loading || !problem || !session) {
    return (
      <div className="workspace-loading">
        <div className="card workspace-loading-card">
          <div className="eyebrow">불러오는 중</div>
          <h2>워크스페이스 준비 중</h2>
          <p className="muted">문제와 세션을 초기화하고 있습니다.</p>
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  const proofMeta = [
    {
      title: "질문 흐름",
      value: session.branch_decision
        ? FLOW_META[session.branch_decision.flow_type].label
        : "코드 제출 대기",
      description:
        session.branch_decision?.primary_signal ??
        "코드를 제출하면 코드 신호를 분석해 질문 방식이 자동으로 결정됩니다.",
    },
    {
      title: "AI 면접관",
      value: MODE_LABEL[session.question_mode],
      description:
        "코드에서 발견된 신호를 근거로 질문을 생성합니다. 근거 없는 질문은 하지 않습니다.",
    },
    {
      title: "피드백 준비",
      value: MODE_LABEL[session.report_mode],
      description:
        "면접이 끝나면 정의·해결·설명 3가지 기준으로 피드백이 생성됩니다.",
    },
  ];

  return (
    <div className="workspace">
      <section className="card workspace-hero">
        <div className="workspace-hero-copy">
          <div className="eyebrow">{problem.pattern}</div>
          <h1>{problem.title}</h1>
          <p className="muted">{problem.prompt}</p>
          <div className="pill-row overview-row">
            <span className={`difficulty-pill ${problem.difficulty}`}>
              {DIFFICULTY_LABEL[problem.difficulty]}
            </span>
            <span className="pill">권장 복잡도 {problem.expected_complexity}</span>
            <span className={`status-chip ${statusMeta.tone}`}>{statusMeta.label}</span>
            <span className="pill">
              면접 턴 {assistantTurns} / {MAX_INTERVIEW_TURNS}
            </span>
          </div>
          <ul className="constraint-list compact-list">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>

        <aside className="workspace-brief">
          <div className="brief-block">
            <div className="eyebrow">이 문제에서 보게 될 것</div>
            <p>{problem.elevator_pitch}</p>
          </div>
          <div className="brief-block">
            <div className="eyebrow">질문이 참고하는 기준</div>
            <ul className="mini-list">
              {problem.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
          <div className="brief-block">
            <div className="eyebrow">질문이 벗어나지 않는 범위</div>
            <ul className="mini-list">
              {problem.forbidden_boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="analysis-grid">
        {proofMeta.map((card) => (
          <article key={card.title} className="card analysis-card compact">
            <div className="eyebrow">{card.title}</div>
            <h2>{card.value}</h2>
            <p className="muted">{card.description}</p>
          </article>
        ))}
      </section>

      {session.ast_profile && session.branch_decision && activeFlow ? (
        <section className="card trace-strip">
          <div className="trace-head">
            <div className="eyebrow">코드 신호 → 분기 결정 → 질문 초점</div>
            <h2>왜 이 질문 흐름이 선택되었는지</h2>
            <p className="muted">
              AST가 뽑은 코드 신호가 어떻게 분기를 결정하고, 어떤 질문 초점으로
              이어지는지 한 줄에서 확인할 수 있습니다.
            </p>
          </div>
          <div className="trace-body">
            <div className="trace-step">
              <div className="eyebrow">1. 코드 신호 (AST)</div>
              <ul className="mini-list">
                <li>중첩 루프 깊이: {session.ast_profile.nested_loop_depth}</li>
                <li>
                  위험 연산:{" "}
                  {session.ast_profile.has_risky_ops.length > 0
                    ? session.ast_profile.has_risky_ops.join(", ")
                    : "없음"}
                </li>
                <li>순환 복잡도: {session.ast_profile.cyclomatic_complexity}</li>
                <li>파싱: {session.ast_profile.parse_ok ? "성공" : "실패"}</li>
              </ul>
            </div>
            <div className="trace-arrow" aria-hidden="true">
              →
            </div>
            <div className="trace-step">
              <div className="eyebrow">2. 분기 결정</div>
              <strong>{activeFlow.label}</strong>
              <small>{session.branch_decision.primary_signal}</small>
              {session.branch_decision.reason_codes.length ? (
                <div className="pill-row">
                  {session.branch_decision.reason_codes.map((code) => (
                    <span key={code} className="pill muted-pill">
                      {code}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="trace-arrow" aria-hidden="true">
              →
            </div>
            <div className="trace-step">
              <div className="eyebrow">3. 질문 초점</div>
              <strong>{activeFlow.focus}</strong>
              <small>{activeFlow.description}</small>
            </div>
          </div>
        </section>
      ) : null}

      <section className="workspace-main-grid">
        <div className="card code-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">풀이 코드 입력</div>
              <h2>코드를 제출하면 분기 시연이 시작됩니다</h2>
            </div>
            <button className="primary" onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? "제출 중..." : "코드 제출"}
            </button>
          </div>
          <p className="panel-copy">
            대표 문제에서는 같은 문제에 다른 코드를 넣었을 때 질문 흐름이 어떻게 달라지는지를
            보여주는 것이 핵심입니다.
          </p>

          {problem.demo_variants.length > 0 ? (
            <div className="variant-grid">
              {problem.demo_variants.map((variant, index) => {
                const selected = selectedVariant?.id === variant.id;
                const isRecommended = index === 0;
                return (
                  <button
                    key={variant.id}
                    className={`variant-card ${selected ? "selected" : ""}`}
                    onClick={() => handleLoadVariant(variant.id)}
                    type="button"
                  >
                    <div className="variant-card-head">
                      <span className="eyebrow">{variant.label}</span>
                      {isRecommended && (
                        <span className="variant-recommended-badge">여기서 시작</span>
                      )}
                    </div>
                    <strong>{FLOW_META[variant.expected_flow].label}</strong>
                    <span>{variant.purpose}</span>
                    <small>{variant.expected_signals.join(" / ")}</small>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="editor-frame">
            <Editor
              height="420px"
              defaultLanguage="python"
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>

          {session.judge_result ? (
            <div className="judge-box">
              <div className="judge-head">
                <strong>{session.judge_result.status}</strong>
                <span className={`mode-chip ${session.judge_result.passed ? "success" : "warning"}`}>
                  {EXECUTION_MODE_LABEL[session.judge_result.mode]}
                </span>
              </div>
              <p>
                {session.judge_result.stdout ||
                  session.judge_result.stderr ||
                  "실행 출력이 없습니다."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="card interview-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">질문 시연</div>
              <h2>코드 근거 기반 면접 시연</h2>
            </div>
            <span className={`status-chip ${statusMeta.tone}`}>{statusMeta.label}</span>
          </div>

          <div className={`flow-banner ${session.flow_type ?? "idle"}`}>
            <div className="flow-banner-head">
              <strong>{activeFlow?.label ?? "코드 제출 대기"}</strong>
              {session.question_mode === "deterministic" ? (
                <span className="mode-chip deterministic">
                  규칙 기반 질문 (시연 안정성 모드)
                </span>
              ) : null}
            </div>
            <p>
              {session.branch_decision?.primary_signal ??
                "코드를 제출하면 코드 신호를 기준으로 질문 흐름이 자동 선택됩니다."}
            </p>
          </div>

          <div ref={chatLogRef} className="chat-log">
            {session.turns.length === 0 ? (
              <p className="muted">코드를 제출하면 면접관이 첫 질문을 시작합니다.</p>
            ) : (
              session.turns.map((turn) => (
                <div key={turn.id} className={`message ${turn.role}`}>
                  <div className="message-role">{turn.role === "assistant" ? "AI 면접관" : "내 답변"}</div>
                  <div>{turn.content}</div>
                  {turn.role === "assistant" && turn.intent ? (
                    <div className="message-intent">{turn.intent}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="answer-box">
            <div className="answer-guide">
              <span>이번 답변에 담아보세요</span>
              <div className="answer-pill-row">
                <span className="pill muted-pill">접근</span>
                <span className="pill muted-pill">복잡도</span>
                <span className="pill muted-pill">불변식</span>
                <span className="pill muted-pill">트레이드오프</span>
              </div>
            </div>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="풀이 접근, 시간복잡도, 핵심 판단 기준과 왜 그런 선택을 했는지 설명해보세요."
              rows={5}
              disabled={session.status === "completed" || submitting || !session.current_question}
            />
            <button
              className="primary"
              onClick={handleSendAnswer}
              disabled={submitting || recoveringReport || !session.current_question}
            >
              {submitting ? "전송 중..." : "답변 보내기"}
            </button>
          </div>
        </div>

        <div className="card evidence-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">질문 근거</div>
              <h2>왜 이런 질문이 나왔는지</h2>
            </div>
          </div>

          <div className="evidence-stack">
            <div className="evidence-block">
              <div className="eyebrow">이번 턴의 확인 포인트</div>
              <strong>{latestAssistantTurn?.intent ?? "코드 제출 전"}</strong>
              <p className="muted">
                {latestAssistantTurn?.guardrail_note ??
                  "첫 질문이 시작되면 질문 근거와 제한 범위가 함께 표시됩니다."}
              </p>
            </div>

            <div className="evidence-block">
              <div className="eyebrow">지금 쓰인 근거</div>
              {latestAssistantTurn?.evidence_refs.length ? (
                <ul className="evidence-list">
                  {latestAssistantTurn.evidence_refs.map((ref) => (
                    <li key={`${ref.kind}-${ref.label}-${ref.detail}`}>
                      <span className={`evidence-tag ${ref.kind}`}>{EVIDENCE_LABEL[ref.kind]}</span>
                      <div>
                        <strong>{ref.label}</strong>
                        <p>{ref.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">코드를 제출하면 턴별 질문 근거가 여기에 표시됩니다.</p>
              )}
            </div>

            {session.ast_profile ? (
              <div className="evidence-block">
                <div className="eyebrow">코드 분석 요약</div>
                <ul className="mini-list">
                  <li>파싱 성공: {String(session.ast_profile.parse_ok)}</li>
                  <li>중첩 루프 깊이: {session.ast_profile.nested_loop_depth}</li>
                  <li>순환 복잡도: {session.ast_profile.cyclomatic_complexity}</li>
                  <li>위험 연산: {session.ast_profile.has_risky_ops.join(", ") || "없음"}</li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {session.branch_decision ? (
        <section className="card compare-card">
          <div className="compare-head">
            <div className="eyebrow">범용 LLM vs 통제형 질문 생성</div>
            <h2>같은 코드 입력에 대해 질문이 어떻게 달라지는가</h2>
            <p className="muted">
              자유 프롬프트 기반 범용 LLM은 주제 이탈 위험이 크고 근거 추적이 어렵습니다.
              본 시스템은 문제별 Fact/Trap/Forbidden Boundary 범위 안에서만 질문을
              생성하므로, 모든 질문에 대해 코드·문제 근거를 역추적할 수 있습니다.
            </p>
          </div>
          <div className="compare-grid">
            <article className="compare-column generic">
              <header>
                <span className="compare-badge warning">범용 대화형 LLM</span>
                <small>주제 이탈 · 근거 없음 · 검수 불가</small>
              </header>
              <ul>
                {CONTROL_COMPARISON[session.branch_decision.flow_type].generic.map(
                  (question) => (
                    <li key={question}>{question}</li>
                  ),
                )}
              </ul>
            </article>
            <article className="compare-column controlled">
              <header>
                <span className="compare-badge success">통제형 기술면접</span>
                <small>Fact/Trap 범위 내 · 근거 명시 · 재현 가능</small>
              </header>
              <ul>
                {CONTROL_COMPARISON[session.branch_decision.flow_type].controlled.map(
                  (example) => (
                    <li key={example.question}>
                      <strong>{example.question}</strong>
                      <div className="compare-evidence-row">
                        <span className={`evidence-tag ${example.kind}`}>
                          {EVIDENCE_LABEL[example.kind]}
                        </span>
                        <small>{example.source}</small>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {report ? (
        <section className="card report-section">
          {session.report_mode === "deterministic" ? (
            <div className="fallback-assurance">
              <div className="eyebrow">외부 의존성 대응 모드</div>
              <p>
                외부 LLM이 없어도 대화 로그 휴리스틱 기반으로 3축 리포트가 자동 생성됩니다.
                제안서 2.7에서 정의한 <strong>&apos;외부 의존성 하의 데모 안정성&apos;</strong>{" "}
                요건 — 외부 API 불안정 상황에서도 세션을 완주하는 fallback 구조가 실제로
                작동 중입니다.
              </p>
            </div>
          ) : null}

          <div className="report-header">
            <div>
              <div className="eyebrow">Stage 03</div>
              <h2>3축 피드백</h2>
              <p>{report.summary}</p>
            </div>
            <div className="report-score-shell">
              <div className="report-score">{reportAverage}/10</div>
              <p>전체 준비도</p>
              <span className="muted">가장 약한 축: {weakestAxis?.label ?? "없음"}</span>
            </div>
          </div>

          <div className="report-grid">
            {reportAxes.map(({ label, axis }) => (
              <article key={label} className="report-card">
                <div className="axis-head">
                  <div className="score">{axis.score}/10</div>
                  <strong>{label}</strong>
                </div>
                <div className="axis-meter">
                  <span style={{ width: `${axis.score * 10}%` }} />
                </div>
                <p>{axis.rationale}</p>
                <strong>다음 연습</strong>
                <p>{axis.next_step}</p>
              </article>
            ))}
          </div>

          <div className="report-actions">
            <button className="primary" onClick={retryBootstrap}>
              같은 문제 다시 시연하기
            </button>
            <Link className="secondary-button" href="/">
              다른 시연 문제 보기
            </Link>
          </div>

          <div className="report-bottom">
            <div className="card subtle share-preview">
              <div className="eyebrow">시연 요약</div>
              <h3>이번 시연에서 어떤 흐름이 선택됐는지</h3>
              <p>
                분기:{" "}
                {session.branch_decision
                  ? FLOW_META[session.branch_decision.flow_type].label
                  : "대기"}{" "}
                / 질문 엔진: {MODE_LABEL[session.question_mode]} / 리포트 엔진:{" "}
                {MODE_LABEL[session.report_mode]}
              </p>
              <p className="muted">
                어떤 코드 신호 때문에 이 질문 흐름이 선택됐는지, 그리고 피드백이 어떤 방식으로
                정리됐는지 빠르게 복기할 수 있습니다.
              </p>
            </div>

            <div className="card subtle">
              <div className="eyebrow">다음 검증 포인트</div>
              <h3>다음 시연에서 먼저 확인할 약점 축</h3>
              <p>
                약한 축: {weakestAxis?.label ?? "미확정"} / 대표 신호:{" "}
                {session.branch_decision?.primary_signal ?? "대기"}
              </p>
              <ul className="constraint-list">
                {report.recommended_drills.map((drill) => (
                  <li key={drill}>{drill}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {!report && session.status === "evaluating" ? (
        <section className="card report-recovery">
          <div>
            <div className="eyebrow">리포트 복구</div>
            <h2>리포트 생성이 지연되거나 실패했을 수 있습니다.</h2>
            <p className="muted">
              이미 생성된 리포트를 다시 읽거나, 마무리 요청을 한 번 더 보내 복구할 수 있습니다.
            </p>
          </div>
          <button
            className="primary"
            onClick={() => recoverReport(session.id)}
            disabled={recoveringReport || submitting}
          >
            {recoveringReport ? "복구 중..." : "리포트 복구"}
          </button>
        </section>
      ) : null}

      {error ? <div className="error-box">{error}</div> : null}
    </div>
  );
}
