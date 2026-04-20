export type ProblemSummary = {
  id: string;
  title: string;
  pattern: string;
  difficulty: "easy" | "medium" | "hard";
  elevator_pitch: string;
};

export type ProblemDetail = ProblemSummary & {
  prompt: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
  starter_code: string;
  expected_complexity: string;
  optimal_solution: string;
  follow_up_goals: string[];
  forbidden_boundaries: string[];
  traps: Array<{ signal: string; hint: string; interview_focus: string }>;
};

export type SessionStatus = "created" | "submitted" | "interviewing" | "evaluating" | "completed";

export type Session = {
  id: string;
  problem_id: string | null;
  status: SessionStatus;
  current_question: string | null;
  turns: Array<{ id: string; role: "assistant" | "user"; content: string }>;
  judge_result?: {
    status: string;
    passed: boolean;
    stdout: string;
    stderr: string;
    mode: "judge0" | "demo";
  } | null;
  ast_profile?: {
    parse_ok: boolean;
    nested_loop_depth: number;
    has_risky_ops: string[];
    recursion_detected: boolean;
    cyclomatic_complexity: number;
    notes: string[];
  } | null;
  flow_type?: "normal" | "plan_b" | "fallback" | null;
};

export type FeedbackReport = {
  session_id: string;
  summary: string;
  logical_structure: { score: number; rationale: string; next_step: string };
  technical_accuracy: { score: number; rationale: string; next_step: string };
  explanation_clarity: { score: number; rationale: string; next_step: string };
  recommended_drills: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function listProblems(): Promise<ProblemSummary[]> {
  return fetchJson<ProblemSummary[]>("/problems");
}

export function getProblem(problemId: string): Promise<ProblemDetail> {
  return fetchJson<ProblemDetail>(`/problems/${problemId}`);
}

export function createSession(problemId: string): Promise<{ session: Session }> {
  return fetchJson<{ session: Session }>("/sessions", {
    method: "POST",
    body: JSON.stringify({ problem_id: problemId })
  });
}

export function submitCode(sessionId: string, code: string): Promise<{ session: Session; opening_question: string }> {
  return fetchJson<{ session: Session; opening_question: string }>(`/sessions/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

export function submitAnswer(sessionId: string, answer: string): Promise<{ session: Session; next_question: string | null; completed: boolean }> {
  return fetchJson<{ session: Session; next_question: string | null; completed: boolean }>(`/sessions/${sessionId}/turns`, {
    method: "POST",
    body: JSON.stringify({ answer })
  });
}

export function finalizeSession(sessionId: string): Promise<{ report: FeedbackReport }> {
  return fetchJson<{ report: FeedbackReport }>(`/sessions/${sessionId}/finalize`, {
    method: "POST",
    body: JSON.stringify({})
  });
}
