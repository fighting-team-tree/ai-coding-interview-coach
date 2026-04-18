---
name: pm-product-discovery
description: "PM 복합 스킬: pm-product-discovery 관련된 13개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-product-discovery (Routing Hub)

본 스킬 파일은 **pm-product-discovery** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### analyze-feature-requests
- **목적(Description)**: Analyze and prioritize a list of feature requests by theme, strategic alignment, impact, effort, and risk. Use when reviewing customer feature requests, triaging a backlog, or making prioritization decisions.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/analyze-feature-requests/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### brainstorm-experiments-existing
- **목적(Description)**: Design experiments to test assumptions for an existing product — prototypes, A/B tests, spikes, and other low-effort validation methods. Use when validating assumptions, testing feature ideas cheaply, or planning product experiments.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/brainstorm-experiments-existing/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### brainstorm-experiments-new
- **목적(Description)**: Design lean startup experiments (pretotypes) for a new product. Creates XYZ hypotheses and suggests low-effort validation methods like landing pages, explainer videos, and pre-orders. Use when validating a new product idea, creating pretotypes, or testing market demand.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/brainstorm-experiments-new/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### brainstorm-ideas-existing
- **목적(Description)**: Brainstorm product ideas for an existing product using multi-perspective ideation from PM, Designer, and Engineer viewpoints. Use when generating new feature ideas, brainstorming solutions for an identified opportunity, or ideating with a product trio.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/brainstorm-ideas-existing/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### brainstorm-ideas-new
- **목적(Description)**: Brainstorm feature ideas for a new product in initial discovery from PM, Designer, and Engineer perspectives. Use when starting product discovery for a new product, exploring features for a startup idea, or doing initial ideation.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/brainstorm-ideas-new/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### identify-assumptions-existing
- **목적(Description)**: Identify risky assumptions for a feature idea in an existing product across Value, Usability, Viability, and Feasibility. Uses multi-perspective devil's advocate thinking. Use when stress-testing a feature idea, doing risk assessment, or preparing for assumption mapping.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/identify-assumptions-existing/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### identify-assumptions-new
- **목적(Description)**: Identify risky assumptions for a new product idea across 8 risk categories including Go-to-Market, Strategy, and Team. Use when evaluating startup risks, assessing a new product concept, or mapping assumptions for a new venture.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/identify-assumptions-new/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### interview-script
- **목적(Description)**: Create a structured customer interview script with JTBD probing questions, warm-up, core exploration, and wrap-up sections. Follows The Mom Test principles — no leading questions, no pitching, focus on past behavior. Use when preparing for user interviews, creating interview guides, or planning discovery research.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/interview-script/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### metrics-dashboard
- **목적(Description)**: Define and design a product metrics dashboard with key metrics, data sources, visualization types, and alert thresholds. Use when creating a metrics dashboard, defining KPIs, setting up product analytics, or building a data monitoring plan.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/metrics-dashboard/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### opportunity-solution-tree
- **목적(Description)**: Build an Opportunity Solution Tree (OST) to structure product discovery — map a desired outcome to opportunities, solutions, and experiments. Based on Teresa Torres' Continuous Discovery Habits. Use when structuring discovery work, mapping opportunities to solutions, or deciding what to build next.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/opportunity-solution-tree/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### prioritize-assumptions
- **목적(Description)**: Prioritize assumptions using an Impact × Risk matrix and suggest experiments for each. Use when triaging a list of assumptions, deciding what to test first, or applying the assumption prioritization canvas.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/prioritize-assumptions/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### prioritize-features
- **목적(Description)**: Prioritize a backlog of feature ideas based on impact, effort, risk, and strategic alignment with top 5 recommendations. Use when prioritizing a feature backlog, making scope decisions, or ranking product ideas.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/prioritize-features/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### summarize-interview
- **목적(Description)**: Summarize a customer interview transcript into a structured template with JTBD, satisfaction signals, and action items. Use when processing interview recordings or transcripts, synthesizing discovery interviews, or creating interview summaries.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-product-discovery/SKILL.md)과 동일한 디렉토리에 위치한 `skills/summarize-interview/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

