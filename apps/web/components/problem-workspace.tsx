"use client";

import { useEffect, useMemo, useState } from "react";
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

type WorkspaceProps = {
  problemId: string;
};

const MAX_INTERVIEW_TURNS = 4;

const FLOW_META = {
  normal: {
    label: "Normal Flow",
    focus: "취약점 기반 꼬리질문",
    description: "AST와 problem trap을 근거로 코드의 약한 지점을 깊게 파고듭니다.",
  },
  plan_b: {
    label: "Plan B Flow",
    focus: "Scale-up 압박 질문",
    description: "정답이 비교적 안정적일 때 더 큰 입력, trade-off, 코드 리뷰 방어로 난도를 올립니다.",
  },
  fallback: {
    label: "Fallback Flow",
    focus: "핵심 개념 복구 질문",
    description: "코드가 복잡하거나 파싱이 불안정할 때 구현 세부보다 접근과 불변식부터 복구합니다.",
  },
} as const;

function getMatchedTrap(problem: ProblemDetail, assistantTurns: number) {
  if (assistantTurns <= 0 || problem.traps.length === 0) {
    return null;
  }

  return problem.traps[Math.min(assistantTurns - 1, problem.traps.length - 1)];
}

export function ProblemWorkspace({ problemId }: WorkspaceProps) {
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveringReport, setRecoveringReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        setProblem(null);
        setSession(null);
        setReport(null);

        const problemData = await getProblem(problemId);
        if (cancelled) {
          return;
        }

        setProblem(problemData);
        setCode(problemData.starter_code);

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

  const assistantTurns = useMemo(
    () => session?.turns.filter((turn) => turn.role === "assistant").length ?? 0,
    [session],
  );

  const reportAxes = report
    ? [
        { label: "Logical Structure", axis: report.logical_structure },
        { label: "Technical Accuracy", axis: report.technical_accuracy },
        { label: "Explanation Clarity", axis: report.explanation_clarity },
      ]
    : [];

  const activeFlow = session?.flow_type ? FLOW_META[session.flow_type] : null;
  const matchedTrap = problem ? getMatchedTrap(problem, assistantTurns) : null;
  const primaryExample = problem?.examples[0] ?? null;
  const reportAverage = reportAxes.length
    ? (reportAxes.reduce((sum, item) => sum + item.axis.score, 0) / reportAxes.length).toFixed(1)
    : null;
  const weakestAxis = reportAxes.reduce<(typeof reportAxes)[number] | null>((weakest, current) => {
    if (!weakest || current.axis.score < weakest.axis.score) {
      return current;
    }
    return weakest;
  }, null);

  const analysisCards = [
    {
      title: "Selected Flow",
      value: activeFlow?.label ?? "Awaiting submission",
      description: activeFlow?.description ?? "코드 제출 후 AST 프로필에 따라 질문 전략이 자동으로 선택됩니다.",
    },
    {
      title: "Matched Signal",
      value: matchedTrap?.signal ?? "No trap yet",
      description:
        matchedTrap?.hint ??
        "이 영역은 코드 제출 뒤 AST와 problem trap을 연결해 지금 질문이 나온 이유를 설명합니다.",
    },
    {
      title: "Question Intent",
      value: matchedTrap?.interview_focus ?? activeFlow?.focus ?? "Reasoning setup",
      description:
        session?.current_question ??
        "첫 질문이 시작되면 이번 턴이 무엇을 검증하려는지 명시적으로 보여줍니다.",
    },
    {
      title: "AI Guardrail",
      value: "Fact/Trap controlled",
      description:
        problem?.forbidden_boundaries[0] ??
        "면접 질문은 문제 범위를 벗어나지 않도록 가드레일 안에서만 생성됩니다.",
    },
  ];

  function retryBootstrap() {
    setReloadToken((current) => current + 1);
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
        <div className="eyebrow">Workspace Error</div>
        <h1>워크스페이스를 불러오지 못했습니다.</h1>
        <p className="muted">{error}</p>
        <button className="primary" onClick={retryBootstrap}>
          Retry
        </button>
      </div>
    );
  }

  if (loading || !problem || !session) {
    return <div className="card">워크스페이스를 준비하는 중입니다...</div>;
  }

  return (
    <div className="workspace">
      <section className="card workspace-hero">
        <div className="workspace-hero-copy">
          <div className="eyebrow">{problem.pattern}</div>
          <h1>{problem.title}</h1>
          <p className="muted">{problem.prompt}</p>
          <div className="pill-row">
            <span className={`difficulty-pill ${problem.difficulty}`}>{problem.difficulty}</span>
            <span className="pill">Expected: {problem.expected_complexity}</span>
            <span className="pill">
              Turn {assistantTurns} / {MAX_INTERVIEW_TURNS}
            </span>
            <span className="pill">Mission: explain the why, not only the code</span>
          </div>
          <ul className="constraint-list">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>

        <aside className="workspace-brief">
          <div className="brief-block">
            <div className="eyebrow">Problem Hook</div>
            <p>{problem.elevator_pitch}</p>
          </div>

          {primaryExample ? (
            <div className="brief-block">
              <div className="eyebrow">Representative Example</div>
              <p>
                <strong>입력</strong> {primaryExample.input}
              </p>
              <p>
                <strong>출력</strong> {primaryExample.output}
              </p>
              <p className="muted">{primaryExample.explanation}</p>
            </div>
          ) : null}

          <div className="brief-block">
            <div className="eyebrow">Interview Goals</div>
            <ul className="mini-list">
              {problem.follow_up_goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="analysis-grid">
        {analysisCards.map((card) => (
          <article key={card.title} className="card analysis-card">
            <div className="eyebrow">{card.title}</div>
            <h2>{card.value}</h2>
            <p className="muted">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="split">
        <div className="card code-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Stage 01</div>
              <h2>Code Submission</h2>
            </div>
            <button className="primary" onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>
          <p className="panel-copy">
            일부러 덜 최적화된 코드를 넣어도 괜찮습니다. 이 데모의 핵심은 정답 여부보다, AI가
            어디를 근거로 질문 전략을 여는지 보여주는 데 있습니다.
          </p>
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
                <span className="status-chip">{session.judge_result.mode}</span>
              </div>
              <p>
                {session.judge_result.stdout ||
                  session.judge_result.stderr ||
                  "No execution output."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="card interview-panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Stage 02</div>
              <h2>Interview Session</h2>
            </div>
            <span className="status-chip">{session.status}</span>
          </div>

          <div className={`flow-banner ${session.flow_type ?? "idle"}`}>
            <strong>{activeFlow?.label ?? "Submission pending"}</strong>
            <p>
              {activeFlow?.description ??
                "코드를 제출하면 AST와 trap 신호를 기반으로 면접 플로우가 선택됩니다."}
            </p>
          </div>

          <div className="chat-log">
            {session.turns.length === 0 ? (
              <p className="muted">코드를 제출하면 면접관이 첫 질문을 시작합니다.</p>
            ) : (
              session.turns.map((turn) => (
                <div key={turn.id} className={`message ${turn.role}`}>
                  <div className="message-role">
                    {turn.role === "assistant" ? "AI Interviewer" : "You"}
                  </div>
                  <div>{turn.content}</div>
                </div>
              ))
            )}
          </div>

          <div className="answer-box">
            <div className="answer-guide">
              <span>이번 답변에 포함하면 좋은 요소</span>
              <div className="answer-pill-row">
                <span className="pill muted-pill">Approach</span>
                <span className="pill muted-pill">Complexity</span>
                <span className="pill muted-pill">Invariant</span>
                <span className="pill muted-pill">Trade-off</span>
              </div>
            </div>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="풀이 접근, 시간복잡도, 왜 그 선택을 했는지까지 설명해보세요."
              rows={5}
              disabled={session.status === "completed" || submitting || !session.current_question}
            />
            <button
              className="primary"
              onClick={handleSendAnswer}
              disabled={submitting || recoveringReport || !session.current_question}
            >
              {submitting ? "Sending..." : "Send Answer"}
            </button>
          </div>

          {session.ast_profile ? (
            <div className="ast-box">
              <h3>AST Evidence</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">parse_ok</span>
                  <strong>{String(session.ast_profile.parse_ok)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">nested_loop_depth</span>
                  <strong>{session.ast_profile.nested_loop_depth}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">cyclomatic_complexity</span>
                  <strong>{session.ast_profile.cyclomatic_complexity}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">risky_ops</span>
                  <strong>{session.ast_profile.has_risky_ops.join(", ") || "none"}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {report ? (
        <section className="card report-section">
          <div className="report-header">
            <div>
              <div className="eyebrow">Stage 03</div>
              <h2>3-Axis Feedback Report</h2>
              <p>{report.summary}</p>
            </div>
            <div className="report-score-shell">
              <div className="report-score">{reportAverage}/10</div>
              <p>overall interview readiness</p>
              <span className="muted">
                Weakest axis: {weakestAxis?.label ?? "n/a"}
              </span>
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
                <strong>Next step</strong>
                <p>{axis.next_step}</p>
              </article>
            ))}
          </div>

          <div className="report-bottom">
            <div className="card subtle share-preview">
              <div className="eyebrow">Growth Story</div>
              <h3>공유 가능한 성과물처럼 보이게</h3>
              <p>
                이 리포트는 단발성 결과가 아니라, 다음 세션에서 어떤 축을 끌어올릴지 연결되는 성장
                카드여야 합니다. 대회에서는 이 지점이 제품 반복 사용성을 설명합니다.
              </p>
            </div>

            <div className="card subtle">
              <h3>Recommended drills</h3>
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
            <div className="eyebrow">Report Recovery</div>
            <h2>리포트 생성이 지연되거나 실패했을 수 있습니다.</h2>
            <p className="muted">
              이미 생성된 report를 다시 읽거나, finalize 요청을 한 번 더 보내 복구할 수 있습니다.
            </p>
          </div>
          <button
            className="primary"
            onClick={() => recoverReport(session.id)}
            disabled={recoveringReport || submitting}
          >
            {recoveringReport ? "Recovering..." : "Recover Report"}
          </button>
        </section>
      ) : null}

      {error ? <div className="error-box">{error}</div> : null}
    </div>
  );
}
