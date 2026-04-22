import { expect, test } from "@playwright/test";

import { completeInterviewFlow, openFeaturedProblem } from "./helpers/interview-flow";

test("홈 대시보드에서 대표 문제 CTA를 노출한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /AI Champion/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "같은 흐름으로 확인할 추가 문제" })).toBeVisible();
  await expect(page.locator("[data-video-cta='featured-problem']").first()).toHaveAttribute(
    "href",
    "/problems/two-pointer-window",
  );
});

test("대표 문제에서 코드 제출부터 3축 리포트까지 완료한다", async ({ page }) => {
  await openFeaturedProblem(page);
  await completeInterviewFlow(page);

  await expect(page.getByText("정의", { exact: true })).toBeVisible();
  await expect(page.getByText("해결", { exact: true })).toBeVisible();
  await expect(page.getByText("설명", { exact: true })).toBeVisible();
});
