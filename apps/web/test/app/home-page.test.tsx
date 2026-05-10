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
  it("renders the institution training narrative with a representative session CTA", () => {
    render(<HomePage />);

    expect(
      screen.getAllByRole("heading", { name: problemCatalog[0].title }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("heading", { name: "강사의 반복 질문을 학습자별 훈련 세션으로 바꿉니다." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "한 번의 훈련 후, 강사는 다음에 무엇을 물어볼지 바로 압니다." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "같은 운영 흐름으로 반복할 수 있는 문제들" })).toBeInTheDocument();
    expect(screen.getByText("부트캠프·교육기관용 면접 훈련 시스템")).toBeInTheDocument();
    expect(screen.getByText("운영 루프")).toBeInTheDocument();
    expect(screen.getByText("훈련 문제")).toBeInTheDocument();
    expect(screen.getByText(problemCatalog[1].title)).toBeInTheDocument();
    const featuredProblemCtas = screen
      .getAllByRole("link", { name: "대표 학습자 세션 보기" })
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
