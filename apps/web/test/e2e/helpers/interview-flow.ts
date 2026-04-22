import { expect, Page } from "@playwright/test";

export const interviewAnswers = [
  "현재 풀이는 left마다 right를 다시 훑어서 최악의 경우 O(N^2)입니다. nums가 모두 양수라서 구간 합이 오른쪽으로 갈수록 커지므로, right를 뒤로 되돌릴 필요가 없습니다.",
  "합이 target 이상이 되면 그 시점의 길이를 기록하고 left를 줄여 더 짧은 후보를 확인합니다. 양수 배열이라 left를 줄이면 합이 감소해서 윈도우 불변식을 유지할 수 있습니다.",
  "핵심 상태는 현재 구간 합과 left, right입니다. 두 포인터가 각각 배열을 한 번씩만 지나가므로 전체 시간복잡도는 O(N)입니다.",
  "다시 제출한다면 모든 시작점마다 탐색하는 구조를 없애고, 조건을 만족하는 동안만 shrink 하는 슬라이딩 윈도우 구조로 바꾸겠습니다.",
] as const;

export async function openFeaturedProblem(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "같은 흐름으로 확인할 추가 문제" }),
  ).toBeVisible();
  await page.locator("[data-video-cta='featured-problem']").first().click();
  await expect(page).toHaveURL(/\/problems\/two-pointer-window$/);
  await expect(page.getByRole("heading", { name: "연속 부분 수열의 최소 길이" })).toBeVisible();
}

export async function completeInterviewFlow(page: Page) {
  await page.getByRole("button", { name: "느린 풀이" }).click();
  await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/sessions/") && response.url().includes("/submit");
    }),
    page.getByRole("button", { name: "코드 제출" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "일반 심화 질문" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "왜 이런 질문이 나왔는지" })).toBeVisible();
  await expect(page.getByText("중첩 반복문 또는 모든 구간 합 탐색", { exact: true })).toBeVisible();

  const answerBox = page.getByPlaceholder(
    "풀이 접근, 시간복잡도, 핵심 판단 기준과 왜 그런 선택을 했는지 설명해보세요.",
  );
  for (const answer of interviewAnswers) {
    await expect(answerBox).toBeEnabled();
    await answerBox.fill(answer);
    await Promise.all([
      page.waitForResponse((response) => {
        return response.url().includes("/sessions/") && response.url().includes("/turns");
      }),
      page.getByRole("button", { name: "답변 보내기" }).click(),
    ]);
  }

  await expect(page.getByRole("heading", { name: "3축 피드백" })).toBeVisible({
    timeout: 15_000,
  });
}
