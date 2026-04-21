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

    expect(await screen.findByRole("heading", { name: "코드를 제출하면 면접이 시작됩니다" })).toBeInTheDocument();
    expect(screen.getByText("느린 코드").closest("button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "왜 이런 질문이 나왔는지" })).toBeInTheDocument();
    expect(screen.getByText("positive numbers")).toBeInTheDocument();
    expect(screen.getByText("질문이 참고하는 기준")).toBeInTheDocument();
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
});
