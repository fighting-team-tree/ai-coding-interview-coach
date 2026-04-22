import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAudioCueSheet,
  buildTitleNarration,
  getScenarioAudioConfig,
  scheduleNarrationCues,
} from "./audio-plan.mjs";

test("buildTitleNarration joins title, subtitle, and details", () => {
  const text = buildTitleNarration({
    title: "질문에서 피드백까지",
    subtitle: "하나의 세션으로 이어집니다.",
    details: ["코드 신호에 따라 질문 흐름이 달라집니다.", "3축 피드백이 남습니다."],
  });

  assert.equal(
    text,
    "질문에서 피드백까지 하나의 세션으로 이어집니다. 코드 신호에 따라 질문 흐름이 달라집니다. 3축 피드백이 남습니다.",
  );
});

test("buildTitleNarration prefers explicit ttsText when provided", () => {
  const text = buildTitleNarration({
    title: "질문에서 피드백까지",
    subtitle: "하나의 세션으로 이어집니다.",
    details: ["이 문장은 읽지 않습니다."],
    ttsText: "질문에서 피드백까지 하나의 세션으로 이어집니다.",
  });

  assert.equal(text, "질문에서 피드백까지 하나의 세션으로 이어집니다.");
});

test("getScenarioAudioConfig merges scenario overrides with defaults", () => {
  const config = getScenarioAudioConfig({
    audio: {
      tts: {
        speaker: "KR",
        speed: 1.15,
      },
      bgm: {
        volume: 0.12,
      },
    },
  });

  assert.equal(config.tts.enabled, true);
  assert.equal(config.tts.engine, "melotts");
  assert.equal(config.tts.language, "KR");
  assert.equal(config.tts.speaker, "KR");
  assert.equal(config.tts.speed, 1.15);
  assert.equal(config.bgm.enabled, true);
  assert.equal(config.bgm.volume, 0.12);
});

test("buildAudioCueSheet offsets demo captions after intro duration", () => {
  const result = buildAudioCueSheet({
    scenario: {
      intro: {
        title: "Intro",
        subtitle: "Subtitle",
        details: [],
      },
      outro: {
        title: "Outro",
        subtitle: "Closing",
        details: [],
      },
      audio: {
        tts: {
          offsetMs: 500,
        },
      },
    },
    metadata: {
      demoCueEvents: [
        { startMs: 1_200, text: "첫 질문이 열립니다." },
        { startMs: 4_800, text: "리포트가 이어집니다." },
      ],
    },
    clipDurationsMs: [12_000, 54_000, 10_000],
  });

  assert.equal(result.clipDurationsMs.total, 76_000);
  assert.deepEqual(
    result.cues.map((cue) => ({
      id: cue.id,
      startMs: cue.startMs,
      plannedStartMs: cue.plannedStartMs,
      section: cue.section,
      text: cue.text,
    })),
    [
      {
        id: "intro",
        startMs: 500,
        plannedStartMs: 500,
        section: "intro",
        text: "Intro Subtitle",
      },
      {
        id: "demo-1",
        startMs: 13_700,
        plannedStartMs: 13_700,
        section: "demo",
        text: "첫 질문이 열립니다.",
      },
      {
        id: "demo-2",
        startMs: 17_300,
        plannedStartMs: 17_300,
        section: "demo",
        text: "리포트가 이어집니다.",
      },
      {
        id: "outro",
        startMs: 66_500,
        plannedStartMs: 66_500,
        section: "outro",
        text: "Outro Closing",
      },
    ],
  );
});

test("buildAudioCueSheet uses event ttsText and skips muted caption-only cues", () => {
  const result = buildAudioCueSheet({
    scenario: {
      intro: {
        title: "Intro",
        subtitle: "Subtitle",
        ttsText: "Intro narration",
      },
      outro: {
        title: "Outro",
        subtitle: "Closing",
        ttsText: "Outro narration",
      },
      audio: {
        tts: {
          offsetMs: 0,
        },
      },
    },
    metadata: {
      demoCueEvents: [
        { startMs: 0, text: "보이기만 하는 캡션", ttsText: "" },
        { startMs: 2_000, text: "캡션", ttsText: "실제로 읽을 문장" },
      ],
    },
    clipDurationsMs: [5_000, 8_000, 4_000],
  });

  assert.deepEqual(
    result.cues.map((cue) => cue.text),
    ["Intro narration", "실제로 읽을 문장", "Outro narration"],
  );
});

test("scheduleNarrationCues shifts later cues and skips cues that still cannot fit", () => {
  const scheduled = scheduleNarrationCues({
    cues: [
      { id: "demo-1", startMs: 1_000, plannedStartMs: 1_000, text: "one", section: "demo" },
      { id: "demo-2", startMs: 3_200, plannedStartMs: 3_200, text: "two", section: "demo" },
      { id: "demo-3", startMs: 5_000, plannedStartMs: 5_000, text: "three", section: "demo" },
    ],
    cueDurationsMs: {
      "demo-1": 2_500,
      "demo-2": 1_900,
      "demo-3": 900,
    },
    clipDurationsMs: {
      intro: 2_000,
      demo: 4_500,
      outro: 2_000,
      total: 8_500,
    },
    minGapMs: 200,
    sectionTailMs: 100,
  });

  assert.deepEqual(
    scheduled.map((cue) => ({
      id: cue.id,
      startMs: cue.startMs,
      endMs: cue.endMs,
      skipped: cue.skipped,
      skipReason: cue.skipReason ?? null,
    })),
    [
      {
        id: "demo-1",
        startMs: 1_000,
        endMs: 3_500,
        skipped: false,
        skipReason: null,
      },
      {
        id: "demo-2",
        startMs: 3_700,
        endMs: 5_600,
        skipped: false,
        skipReason: null,
      },
      {
        id: "demo-3",
        startMs: 5_000,
        endMs: undefined,
        skipped: true,
        skipReason: "overlap",
      },
    ],
  );
});
