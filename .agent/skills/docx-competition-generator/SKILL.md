---
name: docx-competition-generator
description: Markdown 형태의 제안서 내용을 기반으로 공식 경진대회 DOCX 서식 파일의 테이블을 정밀하게 채워넣습니다.
license: MIT
metadata:
  category: documents
  locale: ko-KR
  phase: v1
---

# DOCX Competition Generator

## What this skill does

이 스킬은 Markdown 파일(`구현_제안서.md`)에 정의된 섹션별 내용을 읽어들여, 지정된 공식 DOCX 템플릿의 테이블 셀에 맞춤형으로 주입합니다. 단순 포맷 변환이 아닌 '템플릿 필링(Template Filling)' 방식을 사용하여 공식 서식의 디자인을 100% 보존합니다.

## When to use

- "구현_제안서를 대회용 워드 서식으로 예쁘게 만들어줘"
- "워드로 변환할 때 표 안의 줄바꿈이 깨지지 않게 해줘"
- "공식 문서의 안내 문구들을 자동으로 삭제하고 최종본을 만들어줘"

## Prerequisites

- Python 3.8+
- `python-docx` 라이브러리 (`pip install python-docx`)

## Workflow

### 1. 필드 추출 및 매핑
Markdown 파일에서 `| 1.1 기술명 | 내용 |` 형태의 테이블 행을 찾아 내용을 추출합니다.

### 2. 템플릿 로드
`scripts/generate_docx.py`는 `docs/ai-champion-docx/` 내의 공식 템플릿을 로드합니다.

### 3. 테이블 주입
각 기술 키워드(1.1, 2.1 등)에 해당하는 워드 문서 내 테이블 위치를 찾아 내용을 삽입합니다. 이때 `<br>` 태그는 실제 개행 문자로 치환됩니다.

### 4. 정리 및 저장
- '참고' 또는 '작성 요령'이 포함된 안내용 테이블을 자동 제거합니다.
- 상단의 안내 파라그래프를 삭제합니다.
- 최종본을 지정된 경로에 저장합니다.

## Usage

```bash
# 의존성 설치 (최초 1회)
pip install python-docx

# 스크립트 실행
python .agent/skills/docx-competition-generator/scripts/generate_docx.py --input docs/구현_제안서.md --template docs/ai-champion-docx/서식.docx --output docs/최종본.docx
```

## Done when
- 공식 서식의 디자인이 유지된 채로 내용이 채워진 DOCX 파일이 생성됨.
- 표 내부의 줄바꿈이 정상적으로 표현됨.
- 안내 문구가 제거된 깔끔한 상태임.
