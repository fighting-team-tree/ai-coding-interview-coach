export type ComparisonPreview = {
  label: string;
  purpose: string;
  expectedFlow: string;
  signal: string;
};

export type ProblemCatalogEntry = {
  id: string;
  title: string;
  pattern: string;
  difficulty: "easy" | "medium" | "hard";
  elevatorPitch: string;
  demoFocus: string;
  flagship?: boolean;
  comparisonPreview?: ComparisonPreview[];
};

export const problemCatalog: ProblemCatalogEntry[] = [
  {
    id: "two-pointer-window",
    title: "연속 부분 수열의 최소 길이",
    pattern: "Two Pointer",
    difficulty: "medium",
    elevatorPitch: "한 학습자의 코드 제출부터 코칭 리포트까지 보기 좋은 대표 훈련 세션",
    demoFocus: "중첩 반복문 신호가 어떤 꼬리 질문과 코칭 메모로 이어지는지 확인",
    flagship: true,
    comparisonPreview: [
      {
        label: "개선 필요 제출",
        purpose: "모든 구간을 다시 계산하는 학습자 풀이",
        expectedFlow: "복잡도 설명 코칭",
        signal: "중첩 반복문 · 복잡도 설명 필요",
      },
      {
        label: "안정 제출",
        purpose: "구간을 줄여 가며 답을 찾는 학습자 풀이",
        expectedFlow: "확장 판단 코칭",
        signal: "낮은 리스크 · 확장 확인",
      },
      {
        label: "복구 필요 제출",
        purpose: "문법 오류로 실행이 멈추는 학습자 제출",
        expectedFlow: "기초 개념 복구",
        signal: "파싱 실패 · 핵심 개념 복구",
      },
    ],
  },
  {
    id: "bfs-grid",
    title: "격자 최단 탈출",
    pattern: "BFS",
    difficulty: "medium",
    elevatorPitch: "방문 처리와 탐색 순서를 말로 설명하는 훈련 문제",
    demoFocus: "큐 사용과 최단 거리 판단을 다음 코칭 포인트로 정리",
  },
  {
    id: "dfs-components",
    title: "네트워크 개수 세기",
    pattern: "DFS",
    difficulty: "easy",
    elevatorPitch: "정답 이후 설명의 빈틈을 확인하기 좋은 기본 훈련 문제",
    demoFocus: "안정적인 풀이 뒤에도 설명 습관을 추가 확인",
  },
  {
    id: "dp-stairs",
    title: "계단 오르기 경우의 수",
    pattern: "Dynamic Programming",
    difficulty: "easy",
    elevatorPitch: "점화식과 상태 정의를 말로 풀어내는 DP 훈련 문제",
    demoFocus: "상태 정의 근거를 다음 연습 포인트로 남김",
  },
  {
    id: "binary-search-budget",
    title: "예산 상한선 찾기",
    pattern: "Binary Search",
    difficulty: "medium",
    elevatorPitch: "판정 함수와 탐색 범위를 설명해야 하는 훈련 문제",
    demoFocus: "정답 이후 설명이 약할 때 코칭 질문이 깊어지는 흐름 확인",
  },
] as const;
