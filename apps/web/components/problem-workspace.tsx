"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

import {
  FeedbackReport,
  ProblemDetail,
  Session,
  createSession,
  finalizeSession,
  getProblem,
  submitAnswer,
  submitCode
} from "@/lib/api";

type WorkspaceProps = {
  problemId: string;
};

export function ProblemWorkspace({ problemId }: WorkspaceProps) {
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        const [problemData, sessionData] = await Promise.all([
          getProblem(problemId),
          createSession(problemId)
        ]);
        if (cancelled) {
          return;
        }
        setProblem(problemData);
        setCode(problemData.starter_code);
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
  }, [problemId]);

  const assistantTurns = useMemo(
    () => session?.turns.filter((turn) => turn.role === "assistant").length ?? 0,
    [session]
  );
  const reportAxes = report
    ? [
        { label: "Logical Structure", axis: report.logical_structure },
        { label: "Technical Accuracy", axis: report.technical_accuracy },
        { label: "Explanation Clarity", axis: report.explanation_clarity },
      ]
    : [];

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
        const finalized = await finalizeSession(session.id);
        setReport(finalized.report);
        setSession((current) => (current ? { ...current, status: "completed" } : current));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Answer submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !problem || !session) {
    return <div className="card">워크스페이스를 준비하는 중입니다...</div>;
  }

  return (
    <div className="workspace">
      <section className="card">
        <div className="eyebrow">{problem.pattern}</div>
        <h1>{problem.title}</h1>
        <p className="muted">{problem.prompt}</p>
        <div className="pill-row">
          <span className="pill">Expected: {problem.expected_complexity}</span>
          <span className="pill">Turn {assistantTurns} / 4</span>
        </div>
        <ul className="constraint-list">
          {problem.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      </section>

      <section className="split">
        <div className="card">
          <div className="panel-header">
            <h2>Code Submission</h2>
            <button className="primary" onClick={handleSubmitCode} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>
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
              <strong>{session.judge_result.status}</strong>
              <p>{session.judge_result.stdout || session.judge_result.stderr || "No execution output."}</p>
            </div>
          ) : null}
        </div>

        <div className="card">
          <div className="panel-header">
            <h2>Interview Session</h2>
            <span className="status-chip">{session.status}</span>
          </div>
          <div className="chat-log">
            {session.turns.length === 0 ? (
              <p className="muted">코드를 제출하면 면접관이 첫 질문을 시작합니다.</p>
            ) : (
              session.turns.map((turn) => (
                <div key={turn.id} className={`message ${turn.role}`}>
                  <div className="message-role">{turn.role === "assistant" ? "AI Interviewer" : "You"}</div>
                  <div>{turn.content}</div>
                </div>
              ))
            )}
          </div>
          <div className="answer-box">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Explain your reasoning, complexity, and trade-offs."
              rows={5}
              disabled={session.status === "completed" || submitting || !session.current_question}
            />
            <button className="primary" onClick={handleSendAnswer} disabled={submitting || !session.current_question}>
              {submitting ? "Sending..." : "Send Answer"}
            </button>
          </div>
          {session.ast_profile ? (
            <div className="ast-box">
              <h3>AST Profile</h3>
              <ul>
                <li>parse_ok: {String(session.ast_profile.parse_ok)}</li>
                <li>nested_loop_depth: {session.ast_profile.nested_loop_depth}</li>
                <li>cyclomatic_complexity: {session.ast_profile.cyclomatic_complexity}</li>
                <li>risky_ops: {session.ast_profile.has_risky_ops.join(", ") || "none"}</li>
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {report ? (
        <section className="card">
          <h2>3-Axis Feedback Report</h2>
          <p>{report.summary}</p>
          <div className="report-grid">
            {reportAxes.map(({ label, axis }) => (
              <article key={label} className="report-card">
                <div className="score">{axis.score}/10</div>
                <h3>{label}</h3>
                <p>{axis.rationale}</p>
                <strong>Next step</strong>
                <p>{axis.next_step}</p>
              </article>
            ))}
          </div>
          <div className="card subtle">
            <h3>Recommended drills</h3>
            <ul className="constraint-list">
              {report.recommended_drills.map((drill) => (
                <li key={drill}>{drill}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {error ? <div className="error-box">{error}</div> : null}
    </div>
  );
}
