---
name: pm-execution
description: "PM 복합 스킬: pm-execution 관련된 15개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-execution (Routing Hub)

본 스킬 파일은 **pm-execution** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### brainstorm-okrs
- **목적(Description)**: Brainstorm team-level OKRs aligned with company objectives — qualitative objectives with measurable key results. Use when setting quarterly OKRs, aligning team goals with company strategy, drafting objectives, or learning how to write effective OKRs.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/brainstorm-okrs/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### create-prd
- **목적(Description)**: Create a Product Requirements Document using a comprehensive 8-section template covering problem, objectives, segments, value propositions, solution, and release planning. Use when writing a PRD, documenting product requirements, preparing a feature spec, or reviewing an existing PRD.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/create-prd/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### dummy-dataset
- **목적(Description)**: Generate realistic dummy datasets for testing with customizable columns, constraints, and output formats (CSV, JSON, SQL, Python script). Use when creating test data, building mock datasets, or generating sample data for development and demos.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/dummy-dataset/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### job-stories
- **목적(Description)**: Create job stories using the 'When [situation], I want to [motivation], so I can [outcome]' format with detailed acceptance criteria. Use when writing job stories, creating JTBD-style backlog items, or expressing user situations and motivations.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/job-stories/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### outcome-roadmap
- **목적(Description)**: Transform an output-focused roadmap into an outcome-focused one that communicates strategic intent. Rewrites initiatives as outcome statements reflecting user and business impacts. Use when shifting to outcome roadmaps, making a roadmap more strategic, or rewriting feature lists as outcomes.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/outcome-roadmap/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### pre-mortem
- **목적(Description)**: Run a pre-mortem risk analysis on a PRD or launch plan. Categorizes risks as Tigers (real problems), Paper Tigers (overblown concerns), and Elephants (unspoken worries), then classifies as launch-blocking, fast-follow, or track. Use when preparing for launch, stress-testing a product plan, or identifying what could go wrong.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/pre-mortem/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### prioritization-frameworks
- **목적(Description)**: Reference guide to 9 prioritization frameworks with formulas, when-to-use guidance, and templates — RICE, ICE, Kano, MoSCoW, Opportunity Score, and more. Use when selecting a prioritization method, comparing frameworks like RICE vs ICE, or learning how different prioritization approaches work.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/prioritization-frameworks/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### release-notes
- **목적(Description)**: Generate user-facing release notes from tickets, PRDs, or changelogs. Creates clear, engaging summaries organized by category (new features, improvements, fixes). Use when writing release notes, creating changelogs, announcing product updates, or summarizing what shipped.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/release-notes/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### retro
- **목적(Description)**: Facilitate a structured sprint retrospective — what went well, what didn't, and prioritized action items with owners and deadlines. Use when running a retrospective, reflecting on a sprint, creating action items from team feedback, or learning how to run effective retros.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/retro/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### sprint-plan
- **목적(Description)**: Plan a sprint with capacity estimation, story selection, dependency mapping, and risk identification. Use when preparing for sprint planning, estimating team capacity, selecting stories, or balancing sprint scope against velocity.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/sprint-plan/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### stakeholder-map
- **목적(Description)**: Build a stakeholder map using a power/interest grid, identify communication strategies per quadrant, and generate a communication plan. Use when managing stakeholders, preparing for a launch, aligning cross-functional teams, or planning stakeholder engagement.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/stakeholder-map/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### summarize-meeting
- **목적(Description)**: Summarize a meeting transcript into structured notes with date, participants, topic, key decisions, summary points, and action items. Use when processing meeting recordings, creating meeting notes, writing meeting minutes, or recapping discussions.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/summarize-meeting/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### test-scenarios
- **목적(Description)**: Create comprehensive test scenarios from user stories with test objectives, starting conditions, user roles, step-by-step actions, and expected outcomes. Use when writing QA test cases, creating test plans, defining acceptance tests, or preparing for feature validation.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/test-scenarios/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### user-stories
- **목적(Description)**: Create user stories following the 3 C's (Card, Conversation, Confirmation) and INVEST criteria with descriptions, design links, and acceptance criteria. Use when writing user stories, breaking down features into backlog items, or defining acceptance criteria.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/user-stories/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### wwas
- **목적(Description)**: Create product backlog items in Why-What-Acceptance format — independent, valuable, testable items with strategic context. Use when writing structured backlog items, breaking features into work items, or using the WWA format.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-execution/SKILL.md)과 동일한 디렉토리에 위치한 `skills/wwas/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

