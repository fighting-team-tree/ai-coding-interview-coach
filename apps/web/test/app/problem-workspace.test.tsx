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

  it("shows bootstrap errors and skips session creation when the problem fetch fails", async () => {
    vi.mocked(api.getProblem).mockRejectedValue(new Error("API offline"));

    render(<ProblemWorkspace problemId="two-pointer-window" />);

    expect(
      await screen.findByRole("heading", { name: "워크스페이스를 불러오지 못했습니다." }),
    ).toBeInTheDocument();
    expect(screen.getByText("API offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(api.createSession).not.toHaveBeenCalled();
  });
});
