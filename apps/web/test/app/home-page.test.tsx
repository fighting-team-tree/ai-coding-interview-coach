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
  it("renders the flagship demo framing and supporting scenarios", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "같은 문제라도 코드가 다르면 질문이 달라집니다",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("질문 통제")).toBeInTheDocument();
    expect(screen.getByText("일반 심화 질문")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "대표 데모 보기" })).toHaveAttribute(
      "href",
      `/problems/${problemCatalog[0].id}`,
    );

    const scenarioLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/problems/"));
    expect(scenarioLinks.length).toBeGreaterThanOrEqual(problemCatalog.length - 1);

    for (const problem of problemCatalog.slice(1)) {
      const title = screen
        .getAllByText(problem.title)
        .find((node) => node.closest("a")?.getAttribute("href") === `/problems/${problem.id}`);
      if (!title) {
        throw new Error(`Missing scenario link for ${problem.id}`);
      }
      expect(title).toBeInTheDocument();
      expect(title.closest("a")).toHaveAttribute("href", `/problems/${problem.id}`);
    }
  });
});
