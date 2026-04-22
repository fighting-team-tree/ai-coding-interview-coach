# Competition Video Pipeline

대회 제출용 데모 영상을 자동으로 생성하는 파이프라인입니다.

구성은 두 단계로 고정합니다.

1. `record.mjs`
   - Playwright로 실제 데모 사이트에 진입합니다.
   - intro / demo / outro raw clip을 각각 `.webm`으로 저장합니다.
2. `compose.mjs`
   - `ffmpeg`로 raw clip을 이어 붙이고 최종 `mp4`를 생성합니다.
   - 로컬 TTS와 ambient BGM을 렌더링해 최종 오디오까지 합성합니다.

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
  audio/
    narration.wav
    bgm.wav
    audio-metadata.json
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
- `audio`
- `audio.tts`
- `audio.bgm`

`turnCaptions`는 `answers`와 길이를 맞춰 각 턴마다 다른 자막을 노출할 때 사용합니다. 미지정 시 기존 `demo.captions.interview`를 모든 턴에 재사용합니다.

`audio`는 시나리오별 음성 합성 설정입니다.

- `audio.tts.engine`
- `audio.tts.language`
- `audio.tts.speaker`
- `audio.tts.speed`
- `audio.tts.device`
- `audio.tts.pythonVersion`
- `audio.tts.offsetMs`
- `audio.bgm.volume`
- `audio.bgm.assetPath`
- `audio.bgm.fadeInMs`
- `audio.bgm.fadeOutMs`
- `audio.bgm.duckingThreshold`
- `audio.bgm.duckingRatio`
- `audio.bgm.attackMs`
- `audio.bgm.releaseMs`

녹화 스크립트는 코드 제출 직후, 각 답변 전송 직후, 리포트 진입 직후에 인터뷰 패널과 채팅 로그를 다시 보이도록 스크롤을 보정합니다. 제출용 촬영에서는 이 방어 로직을 유지하는 편이 안전합니다.
또한 demo clip에서 실제 caption이 등장한 시각을 `metadata.json`에 저장하고, compose 단계는 그 시각을 기준으로 TTS를 배치합니다. 따라서 자막과 낭독이 따로 놀지 않습니다.

새 대회를 준비할 때는 기존 시나리오를 복사해 텍스트, 문제 경로, 답변 세트, 타이밍만 바꾸면 됩니다.

## 의존성

- `ffmpeg`
- `ffprobe`
- `uv`
- `python`
- Playwright Chromium
- MeloTTS 실행용 Python 3.10 환경

Chromium이 없다면 아래를 먼저 실행합니다.

```bash
npm run qa:install
```

로컬 TTS를 쓰므로 현재 제출용 오디오 파이프라인은 워크스페이스 안에서 격리된 MeloTTS 환경을 띄워 사용합니다.
현재 오디오 파이프라인은 `uv run --python 3.10 --with git+https://github.com/myshell-ai/MeloTTS.git --with mecab-ko-msvc --with mecab-ko-dic-msvc` 형태로 MeloTTS를 격리 실행합니다. 한국어는 `language: KR`, `speaker: KR`을 기본으로 사용합니다.
Windows에서는 `g2pkk`가 기대하는 `eunjeon` 인터페이스를 `tools/competition-video/python-shims/eunjeon.py`에서 `mecab-ko-msvc` 기반으로 맞춰줍니다.
첫 실행 시에는 MeloTTS 패키지, Python 3.10 런타임, 한국어 모델, 그리고 형태소 분석 리소스를 내려받기 때문에 시간이 더 걸릴 수 있습니다.
외부 BGM을 쓰려면 `audio.bgm.assetPath`에 프로젝트 기준 경로를 넣으면 됩니다. 현재 기본값은 [README.md](C:/Users/fkjy1/dev/Hackathon/AI_CHAMPION/tools/competition-video/assets/bgm/README.md) 에 기록된 Mixkit `Opalescent` 트랙입니다.

## 참고

- `apps/web/playwright.video.config.ts`는 수동 Playwright 촬영을 위한 보조 설정입니다.
- 제출용 최종본은 `video:competition`으로 생성하는 흐름을 기준으로 합니다.
