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
    elevatorPitch: "중첩 반복문 풀이를 슬라이딩 윈도우 설명으로 전환시키는 대표 비교 문제",
    demoFocus: "중첩 루프 신호를 잡아 후속 질문 방향이 달라지는 과정을 시연",
    flagship: true,
    comparisonPreview: [
      {
        label: "느린 풀이",
        purpose: "모든 구간을 다시 훑는 구현",
        expectedFlow: "일반 심화 질문",
        signal: "중첩 반복문 · 복잡도 방어",
      },
      {
        label: "안정적인 풀이",
        purpose: "위험 연산 없이 구간을 줄여 가는 구현",
        expectedFlow: "확장 검증 질문",
        signal: "낮은 리스크 · 확장 질문",
      },
      {
        label: "오류 코드",
        purpose: "문법 오류가 있는 제출",
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
    elevatorPitch: "탐색 순서와 방문 처리의 근거를 끝까지 방어해야 하는 그래프 문제",
    demoFocus: "큐 사용과 최단 거리 불변식을 얼마나 명확히 설명하는지 확인",
  },
  {
    id: "dfs-components",
    title: "네트워크 개수 세기",
    pattern: "DFS",
    difficulty: "easy",
    elevatorPitch: "기본 정답은 맞지만 재귀와 방문 처리 설명의 빈틈을 잡아내기 좋은 문제",
    demoFocus: "안정적인 풀이를 넣었을 때 확장 검증 질문으로 넘어가는 시나리오",
  },
  {
    id: "dp-stairs",
    title: "계단 오르기 경우의 수",
    pattern: "Dynamic Programming",
    difficulty: "easy",
    elevatorPitch: "점화식 설명과 메모리 절충 판단을 드러내기 좋은 DP 예시",
    demoFocus: "점화식 근거와 상태 정의를 말로 풀어내는 능력을 검증",
  },
  {
    id: "binary-search-budget",
    title: "예산 상한선 찾기",
    pattern: "Binary Search",
    difficulty: "medium",
    elevatorPitch: "탐색 범위와 판정 함수의 단조성을 설명해야 하는 문제",
    demoFocus: "정답은 맞지만 설명이 약하면 후속 질문이 깊어지는 시나리오",
  },
] as const;
