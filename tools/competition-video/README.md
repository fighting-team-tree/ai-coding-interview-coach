# Competition Video Pipeline

대회 제출용 데모 영상을 자동으로 생성하는 파이프라인입니다.

구성은 두 단계로 고정합니다.

1. `record.mjs`
   - Playwright로 실제 데모 사이트에 진입합니다.
   - intro / demo / outro raw clip을 각각 `.webm`으로 저장합니다.
2. `compose.mjs`
   - `ffmpeg`로 raw clip을 이어 붙이고 최종 `mp4`를 생성합니다.

## 기본 명령

저장소 루트에서 실행합니다.

```bash
npm run video:check
npm run video:record -- --scenario ai-champion-core --mode demo
npm run video:compose -- --scenario ai-champion-core
npm run video:competition -- --scenario ai-champion-core --mode demo
```

## 실행 모드

- `demo`
  - 기본값입니다.
  - Judge0, LLM 의존성을 비활성화하고 결정론적 fallback 흐름으로 촬영합니다.
  - 대회 제출용 안정성이 가장 높습니다.
- `live`
  - 실제 모델/실행 서버 연동 상태로 촬영합니다.
  - `INTERVIEW_MODEL`, `REPORT_MODEL`, 그리고 최소 1개 이상의 API 키가 필요합니다.

## 출력 구조

```text
output/competition-video/<scenario>/<timestamp>/
  raw/
    01-intro.webm
    02-demo.webm
    03-outro.webm
  final/
    ai-champion-core-demo.mp4
  metadata.json
```

## 시나리오 정의

시나리오는 `tools/competition-video/scenarios/*.json`에 둡니다.

제출용 시나리오는 `2분 40초 ~ 2분 55초` 정도를 목표로 잡는 것을 권장합니다. 너무 짧으면 흐름이 급해지고, 3분을 넘기면 제출 리스크가 커집니다.

주요 필드:

- `viewport`
- `intro`
- `demo.problemPath`
- `demo.variantLabel`
- `demo.answers`
- `demo.captions`
- `demo.captions.interviewIntro`
- `demo.turnCaptions`
- `demo.holds.beforeFirstAnswerMs`
- `demo.holds.afterTurnMs`
- `demo.holds.beforeReportMs`
- `outro`

`turnCaptions`는 `answers`와 길이를 맞춰 각 턴마다 다른 자막을 노출할 때 사용합니다. 미지정 시 기존 `demo.captions.interview`를 모든 턴에 재사용합니다.

녹화 스크립트는 코드 제출 직후, 각 답변 전송 직후, 리포트 진입 직후에 인터뷰 패널과 채팅 로그를 다시 보이도록 스크롤을 보정합니다. 제출용 촬영에서는 이 방어 로직을 유지하는 편이 안전합니다.

새 대회를 준비할 때는 기존 시나리오를 복사해 텍스트, 문제 경로, 답변 세트, 타이밍만 바꾸면 됩니다.

## 의존성

- `ffmpeg`
- `uv`
- `python`
- Playwright Chromium

Chromium이 없다면 아래를 먼저 실행합니다.

```bash
npm run qa:install
```

## 참고

- `apps/web/playwright.video.config.ts`는 수동 Playwright 촬영을 위한 보조 설정입니다.
- 제출용 최종본은 `video:competition`으로 생성하는 흐름을 기준으로 합니다.
