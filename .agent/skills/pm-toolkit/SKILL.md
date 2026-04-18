---
name: pm-toolkit
description: "PM 복합 스킬: pm-toolkit 관련된 4개의 세부 프레임워크를 포함합니다. 기획/분석 등에 활용하세요."
---

# pm-toolkit (Routing Hub)

본 스킬 파일은 **pm-toolkit** 카테고리에 속한 세부 스킬들을 연결해주는 '라우팅 메뉴판(Routing Hub)'입니다. 
단독으로 기능을 수행하지 않으며, 아래 목록을 참조하여 사용자의 요청에 알맞은 **구체적 세부 스킬 파일을 불러오는 용도**입니다.

## 🛠️ [중요] 에이전트(AI) 행동 지침 
사용자가 이 스킬을 호출할 경우, 추측해서 답변하지 마십시오. 반드시 다음 절차를 따르십시오:
1. 사용자의 질문/요청 목적에 맞는 **가장 적절한 하위 스킬(Sub-Skill)을 아래에서 하나 선택**합니다.
2. 선택한 스킬의 **Action to take** 항목에 기재된 파일 경로를 복사하여 `view_file` (또는 로컬 파일 읽기) 도구로 **직접 읽어 들입니다**.
3. 읽어 들인 세부 스킬 문서의 지침(Instructions)에 따라 사용자에게 답변을 생성합니다.

---

## 📋 Available Sub-Skills

### draft-nda
- **목적(Description)**: Draft a detailed Non-Disclosure Agreement between two parties covering information types, jurisdiction, and clauses needing legal review. Use when creating confidentiality agreements or preparing an NDA for a partnership.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-toolkit/SKILL.md)과 동일한 디렉토리에 위치한 `skills/draft-nda/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### grammar-check
- **목적(Description)**: Identify grammar, logical, and flow errors in text and suggest targeted fixes without rewriting the entire text. Use when proofreading content, checking writing quality, or reviewing a draft.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-toolkit/SKILL.md)과 동일한 디렉토리에 위치한 `skills/grammar-check/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### privacy-policy
- **목적(Description)**: Draft a detailed privacy policy covering data types, jurisdiction, GDPR and compliance considerations, and clauses needing legal review. Use when creating a privacy policy, updating data protection documentation, or preparing for compliance.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-toolkit/SKILL.md)과 동일한 디렉토리에 위치한 `skills/privacy-policy/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

### review-resume
- **목적(Description)**: Comprehensive PM resume review and tailoring against 10 best practices including XYZ+S formula, keyword optimization, job-specific tailoring, and structure. Use when reviewing a PM resume, preparing for job applications, or improving resume impact.
- **Action to take**: `view_file` 도구를 사용하여 현재 메뉴 파일(pm-toolkit/SKILL.md)과 동일한 디렉토리에 위치한 `skills/review-resume/SKILL.md` 파일을 읽고 해당 지침에 따르십시오.

