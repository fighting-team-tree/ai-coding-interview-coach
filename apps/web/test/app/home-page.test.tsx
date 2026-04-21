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
  it("renders a service-style dashboard home instead of the old static preview", () => {
    render(<HomePage />);

    expect(
      screen.getAllByRole("heading", { name: problemCatalog[0].title }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "설명 명료도를 먼저 끌어올릴 차례입니다" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "설명 면접을 바로 시작할 문제를 고르세요" })).toBeInTheDocument();
    expect(screen.getByText("오늘의 추천 인터뷰")).toBeInTheDocument();
    expect(screen.getByText("샘플 피드백 미리보기")).toBeInTheDocument();
    expect(screen.getByText("지금 연습할 문제")).toBeInTheDocument();
    expect(screen.getByText(problemCatalog[1].title)).toBeInTheDocument();

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
