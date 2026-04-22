import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProblemWorkspace } from "@/components/problem-workspace";
import * as api from "@/lib/api";

vi.mock("@monaco-editor/react", () => ({
  default: ({ value }: { value?: string }) => <div data-testid="editor">{value}</div>,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    createSession: vi.fn(),
    finalizeSession: vi.fn(),
    getProblem: vi.fn(),
    getSessionReport: vi.fn(),
    submitAnswer: vi.fn(),
    submitCode: vi.fn(),
  };
});

describe("ProblemWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("renders variant selection and evidence rail when bootstrap succeeds", async () => {
    vi.mocked(api.getProblem).mockResolvedValue({
      id: "two-pointer-window",
      title: "연속 부분 수열의 최소 길이",
      pattern: "Two Pointer",
      difficulty: "medium",
      elevator_pitch: "대표 데모",
      prompt: "prompt",
      constraints: ["constraint"],
      examples: [{ input: "1", output: "1", explanation: "example" }],
      starter_code: "print('starter')",
      expected_complexity: "O(N)",
      optimal_solution: "sliding window",
      facts: ["positive numbers", "window shrink"],
      follow_up_goals: ["goal"],
      forbidden_boundaries: ["no full answer"],
      traps: [{ signal: "nested loop", hint: "hint", interview_focus: "focus" }],
      demo_variants: [
        {
          id: "slow_nested",
          label: "느린 코드",
          purpose: "normal flow demo",
          code: "print('slow')",
          expected_flow: "normal",
          expected_signals: ["nested loops"],
        },
      ],
    });
    vi.mocked(api.createSession).mockResolvedValue({
      session: {
        id: "session-1",
        problem_id: "two-pointer-window",
        status: "created",
        current_question: null,
        turns: [],
        question_mode: "pending",
        report_mode: "pending",
      },
    });

    render(<ProblemWorkspace problemId="two-pointer-window" />);

    expect(await screen.findByRole("heading", { name: "코드를 제출하면 분기 시연이 시작됩니다" })).toBeInTheDocument();
    expect(screen.getByText("느린 코드").closest("button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "왜 이런 질문이 나왔는지" })).toBeInTheDocument();
    expect(screen.getByText("positive numbers")).toBeInTheDocument();
    expect(screen.getByText("질문이 참고하는 범위")).toBeInTheDocument();
    expect(screen.queryByText("기관 활용 포인트")).not.toBeInTheDocument();
  });

  it("shows bootstrap errors and skips session creation when the problem fetch fails", async () => {
    vi.mocked(api.getProblem).mockRejectedValue(new Error("API offline"));

    render(<ProblemWorkspace problemId="two-pointer-window" />);

    expect(
      await screen.findByRole("heading", { name: "워크스페이스를 불러오지 못했습니다." }),
    ).toBeInTheDocument();
    expect(screen.getByText("API offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(api.createSession).not.toHaveBeenCalled();
  });

  it("scrolls the interview log to the newest assistant question", async () => {
    const scrollToSpy = vi.spyOn(HTMLElement.prototype, "scrollTo");

    vi.mocked(api.getProblem).mockResolvedValue({
      id: "two-pointer-window",
      title: "연속 부분 수열의 최소 길이",
      pattern: "Two Pointer",
      difficulty: "medium",
      elevator_pitch: "대표 데모",
      prompt: "prompt",
      constraints: ["constraint"],
      examples: [{ input: "1", output: "1", explanation: "example" }],
      starter_code: "print('starter')",
      expected_complexity: "O(N)",
      optimal_solution: "sliding window",
      facts: ["positive numbers", "window shrink"],
      follow_up_goals: ["goal"],
      forbidden_boundaries: ["no full answer"],
      traps: [{ signal: "nested loop", hint: "hint", interview_focus: "focus" }],
      demo_variants: [
        {
          id: "slow_nested",
          label: "느린 코드",
          purpose: "normal flow demo",
          code: "print('slow')",
          expected_flow: "normal",
          expected_signals: ["nested loops"],
        },
      ],
    });
    vi.mocked(api.createSession).mockResolvedValue({
      session: {
        id: "session-1",
        problem_id: "two-pointer-window",
        status: "interviewing",
        current_question: "지금 구현의 최악 시간복잡도를 수식으로 설명해 주세요.",
        turns: [
          {
            id: "assistant-turn-1",
            role: "assistant",
            content: "지금 구현의 최악 시간복잡도를 수식으로 설명해 주세요.",
            intent: "복잡도 확인",
            evidence_refs: [
              { kind: "ast", label: "중첩 루프", detail: "모든 구간 합을 순회하고 있습니다." },
            ],
            guardrail_note: "문제 Fact와 AST 근거 안에서만 질문합니다.",
          },
        ],
        question_mode: "deterministic",
        report_mode: "pending",
        flow_type: "normal",
        branch_decision: {
          flow_type: "normal",
          reason_codes: ["nested_loop_detected"],
          primary_signal: "중첩 반복문 또는 모든 구간 합 탐색",
        },
      },
    });

    render(<ProblemWorkspace problemId="two-pointer-window" />);

    expect(
      await screen.findByRole("heading", { name: "코드 근거 기반 면접 시연" }),
    ).toBeInTheDocument();
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
  });
});
