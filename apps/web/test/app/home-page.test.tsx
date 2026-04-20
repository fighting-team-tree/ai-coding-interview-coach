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
  it("renders the demo heading and a card for every problem", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "코딩 테스트 직후, 바로 기술 면접으로 넘어가는 데모",
      }),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(problemCatalog.length);

    for (const problem of problemCatalog) {
      const title = screen.getByText(problem.title);
      expect(title).toBeInTheDocument();
      expect(title.closest("a")).toHaveAttribute("href", `/problems/${problem.id}`);
    }
  });
});
