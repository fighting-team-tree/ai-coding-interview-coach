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
  it("renders the new demo framing and a card for every problem", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "코딩 테스트 직후, AI가 내 코드의 약점을 근거로 압박 면접을 만든다",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Controlled Interview AI")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(problemCatalog.length);

    for (const problem of problemCatalog) {
      const title = screen.getByText(problem.title);
      expect(title).toBeInTheDocument();
      expect(title.closest("a")).toHaveAttribute("href", `/problems/${problem.id}`);
    }
  });
});
