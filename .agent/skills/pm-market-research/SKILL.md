---
name: pm-market-research
description: "PM 복합 스킬: pm-market-research 관련된 7개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-market-research (Routing Hub)

본 스킬 파일은 **pm-market-research** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### competitor-analysis
- **목적(Description)**: Analyze competitors with strengths, weaknesses, and differentiation opportunities. Identifies direct competitors and maps the competitive landscape. Use when doing competitive research, preparing a competitive brief, or finding differentiation opportunities.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/competitor-analysis/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### customer-journey-map
- **목적(Description)**: Create an end-to-end customer journey map with stages, touchpoints, emotions, pain points, and opportunities. Use when mapping the customer experience, identifying friction points, improving onboarding, or visualizing the user journey.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/customer-journey-map/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### market-segments
- **목적(Description)**: Identify 3-5 potential customer segments with demographics, JTBD, and product fit analysis. Use when exploring market segments, identifying target audiences, evaluating new markets, or learning how to segment a market.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/market-segments/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### market-sizing
- **목적(Description)**: Estimate market size using TAM, SAM, and SOM with top-down and bottom-up approaches. Use when sizing a market opportunity, estimating addressable market, preparing for investor pitches, or evaluating market entry.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/market-sizing/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### sentiment-analysis
- **목적(Description)**: Analyze user feedback data to identify segments with sentiment scores, JTBD, and product satisfaction insights. Use when analyzing user feedback at scale, running sentiment analysis on reviews or surveys, or identifying satisfaction patterns.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/sentiment-analysis/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### user-personas
- **목적(Description)**: Create refined user personas from research data — 3 personas with JTBD, pains, gains, and unexpected insights. Use when building personas from survey data, creating user profiles from research, or segmenting users for product decisions.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/user-personas/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### user-segmentation
- **목적(Description)**: Segment users from feedback data based on behavior, JTBD, and needs. Identifies at least 3 distinct user segments. Use when segmenting a user base, analyzing diverse user feedback, or building a segmentation model.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-market-research/SKILL.md)과 동일한 디렉토리에 위치한 `skills/user-segmentation/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

