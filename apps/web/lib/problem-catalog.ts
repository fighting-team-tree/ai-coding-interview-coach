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
    elevatorPitch: "질문 흐름 변화가 가장 선명하게 드러나는 대표 문제",
    demoFocus: "중첩 반복문이 후속 질문을 어떻게 바꾸는지 확인",
    flagship: true,
    comparisonPreview: [
      {
        label: "느린 풀이",
        purpose: "모든 구간을 다시 계산하는 구현",
        expectedFlow: "일반 심화 질문",
        signal: "중첩 반복문 · 복잡도 설명 필요",
      },
      {
        label: "안정적인 풀이",
        purpose: "구간을 줄여 가며 답을 찾는 구현",
        expectedFlow: "확장 검증 질문",
        signal: "낮은 리스크 · 확장 확인",
      },
      {
        label: "오류 코드",
        purpose: "문법 오류로 실행이 멈추는 제출",
        expectedFlow: "개념 복구 질문",
        signal: "파싱 실패 · 핵심 개념 복구",
      },
    ],
  },
  {
    id: "bfs-grid",
    title: "격자 최단 탈출",
    pattern: "BFS",
    difficulty: "medium",
    elevatorPitch: "방문 처리와 탐색 순서를 설명해야 하는 그래프 문제",
    demoFocus: "큐 사용과 최단 거리 판단을 얼마나 또렷하게 설명하는지 확인",
  },
  {
    id: "dfs-components",
    title: "네트워크 개수 세기",
    pattern: "DFS",
    difficulty: "easy",
    elevatorPitch: "정답 이후 설명의 빈틈을 확인하기 좋은 기본 문제",
    demoFocus: "안정적인 풀이에서 질문이 더 넓게 확장되는 흐름을 확인",
  },
  {
    id: "dp-stairs",
    title: "계단 오르기 경우의 수",
    pattern: "Dynamic Programming",
    difficulty: "easy",
    elevatorPitch: "점화식과 상태 정의를 설명하기 좋은 DP 문제",
    demoFocus: "점화식 근거와 상태 정의를 말로 풀어내는지 확인",
  },
  {
    id: "binary-search-budget",
    title: "예산 상한선 찾기",
    pattern: "Binary Search",
    difficulty: "medium",
    elevatorPitch: "판정 함수와 탐색 범위를 설명해야 하는 문제",
    demoFocus: "정답 이후 설명이 약할 때 질문이 깊어지는 흐름을 확인",
  },
] as const;
