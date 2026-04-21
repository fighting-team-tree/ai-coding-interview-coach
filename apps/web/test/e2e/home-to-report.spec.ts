import { expect, test } from "@playwright/test";

import { completeInterviewFlow, openFeaturedProblem } from "./helpers/interview-flow";

test("홈 대시보드에서 대표 문제 CTA를 노출한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByText("Socratic Deep-Dive", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "설명 면접을 바로 시작할 문제를 고르세요" })).toBeVisible();
  await expect(page.getByRole("link", { name: "추천 문제 열기" })).toHaveAttribute(
    "href",
    "/problems/two-pointer-window",
  );
});

test("대표 문제에서 코드 제출부터 3축 리포트까지 완료한다", async ({ page }) => {
  await openFeaturedProblem(page);
  await completeInterviewFlow(page);

  await expect(page.getByText("Fallback report generated from transcript heuristics")).toBeVisible();
  await expect(page.getByText("논리 구조", { exact: true })).toBeVisible();
  await expect(page.getByText("기술 정확도", { exact: true })).toBeVisible();
  await expect(page.getByText("설명 명료도", { exact: true })).toBeVisible();
});
