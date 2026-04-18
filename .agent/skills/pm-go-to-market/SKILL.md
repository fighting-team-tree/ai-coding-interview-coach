---
name: pm-go-to-market
description: "PM 복합 스킬: pm-go-to-market 관련된 6개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-go-to-market (Routing Hub)

본 스킬 파일은 **pm-go-to-market** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### beachhead-segment
- **목적(Description)**: Identify the first beachhead market segment for a product launch. Evaluates segments against burning pain, willingness to pay, winnable market share, and referral potential. Use when choosing a first market, targeting an initial customer segment, or planning market entry strategy.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/beachhead-segment/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### competitive-battlecard
- **목적(Description)**: Create sales-ready competitive battlecards comparing your product against a specific competitor — positioning, feature comparison, objection handling, and win/loss patterns. Use when preparing sales teams, creating competitive materials, or responding to 'why not competitor X?'
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/competitive-battlecard/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### growth-loops
- **목적(Description)**: Identify growth loops (flywheels) for sustainable traction. Evaluates 5 loop types: Viral, Usage, Collaboration, User-Generated, and Referral. Use when designing growth mechanisms, building product-led traction, or understanding how growth loops work.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/growth-loops/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### gtm-motions
- **목적(Description)**: Identify the best GTM motions and tools across 7 motion types: Inbound, Outbound, Paid Digital, Community, Partners, ABM, and PLG. Use when selecting marketing channels, choosing between inbound and outbound strategy, or planning cross-channel campaigns.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/gtm-motions/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### gtm-strategy
- **목적(Description)**: Create a go-to-market strategy covering marketing channels, messaging, success metrics, and launch timeline. Use when planning a product launch, creating a GTM plan from scratch, or defining a launch strategy for a new market.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/gtm-strategy/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### ideal-customer-profile
- **목적(Description)**: Identify the Ideal Customer Profile (ICP) from research data with demographics, behaviors, JTBD, and needs. Use when defining your ICP, analyzing PMF survey data, or understanding who your best customers are.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-go-to-market/SKILL.md)과 동일한 디렉토리에 위치한 `skills/ideal-customer-profile/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

