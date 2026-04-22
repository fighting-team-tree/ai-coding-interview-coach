import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import { problemCatalog } from "@/lib/problem-catalog";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("HomePage", () => {
  it("renders the immediate demo-entry home with a featured problem CTA", () => {
    render(<HomePage />);

    expect(
      screen.getAllByRole("heading", { name: problemCatalog[0].title }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("heading", { name: "코드 신호에 따라 질문 흐름이 달라집니다." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "같은 흐름을 더 적은 운영 부담으로 반복합니다" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "같은 흐름으로 확인할 추가 문제" })).toBeInTheDocument();
    expect(screen.getByText("대표 시연")).toBeInTheDocument();
    expect(screen.getByText("운영 기준")).toBeInTheDocument();
    expect(screen.getByText("다른 연습 문제")).toBeInTheDocument();
    expect(screen.getByText(problemCatalog[1].title)).toBeInTheDocument();
    const featuredProblemCtas = screen
      .getAllByRole("link", { name: "대표 문제 시작하기" })
      .filter((link) => link.getAttribute("data-video-cta") === "featured-problem");
    expect(featuredProblemCtas.length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByRole("heading", { name: "코드 비교 제출" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "면접 진행" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "질문 근거와 피드백" })).not.toBeInTheDocument();
    expect(screen.queryByText("느린 풀이 선택됨")).not.toBeInTheDocument();

    const flagshipLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === `/problems/${problemCatalog[0].id}`);
    expect(flagshipLinks.length).toBeGreaterThanOrEqual(2);
  });
});
