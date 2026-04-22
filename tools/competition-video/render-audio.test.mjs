import test from "node:test";
import assert from "node:assert/strict";

import { createMeloTtsInvocation } from "./render-audio.mjs";

test("createMeloTtsInvocation builds uv command for MeloTTS rendering", () => {
  const invocation = createMeloTtsInvocation({
    audioDir: "/tmp/audio",
    cueSheet: {
      audio: {
        tts: {
          engine: "melotts",
          language: "KR",
          speaker: "KR",
          speed: 1.05,
          device: "cpu",
          pythonVersion: "3.10",
        },
      },
    },
    cues: [
      {
        id: "intro",
        text: "안녕하세요.",
        outputPath: "/tmp/audio/tts/intro.wav",
      },
    ],
  });

  assert.equal(invocation.command, "uv");
  assert.deepEqual(invocation.plan, {
    engine: "melotts",
    language: "KR",
    speaker: "KR",
    speed: 1.05,
    device: "cpu",
    cues: [
      {
        text: "안녕하세요.",
        outputPath: "/tmp/audio/tts/intro.wav",
      },
    ],
  });
  assert.deepEqual(invocation.args.slice(0, 10), [
    "run",
    "--python",
    "3.10",
    "--with",
    "git+https://github.com/myshell-ai/MeloTTS.git",
    "--with",
    "mecab-ko-msvc",
    "--with",
    "mecab-ko-dic-msvc",
    "python",
  ]);
  assert.match(String(invocation.args[10]), /render-tts\.py$/);
  assert.equal(invocation.args[11], "--plan");
  assert.equal(invocation.args[12], invocation.planPath);
  assert.match(String(invocation.env.PYTHONPATH), /python-shims/);
});
