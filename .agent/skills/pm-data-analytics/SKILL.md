---
name: pm-data-analytics
description: "PM 복합 스킬: pm-data-analytics 관련된 3개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-data-analytics (Routing Hub)

본 스킬 파일은 **pm-data-analytics** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### ab-test-analysis
- **목적(Description)**: Analyze A/B test results with statistical significance, sample size validation, confidence intervals, and ship/extend/stop recommendations. Use when evaluating experiment results, checking if a test reached significance, interpreting split test data, or deciding whether to ship a variant.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-data-analytics/SKILL.md)과 동일한 디렉토리에 위치한 `skills/ab-test-analysis/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### cohort-analysis
- **목적(Description)**: Perform cohort analysis on user engagement data — retention curves, feature adoption trends, and segment-level insights. Use when analyzing user retention by cohort, studying feature adoption over time, investigating churn patterns, or identifying engagement trends.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-data-analytics/SKILL.md)과 동일한 디렉토리에 위치한 `skills/cohort-analysis/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### sql-queries
- **목적(Description)**: Generate SQL queries from natural language descriptions. Supports BigQuery, PostgreSQL, MySQL, and other dialects. Reads database schemas from uploaded diagrams or documentation. Use when writing SQL, building data reports, exploring databases, or translating business questions into queries.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-data-analytics/SKILL.md)과 동일한 디렉토리에 위치한 `skills/sql-queries/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

