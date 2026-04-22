import fs from "node:fs/promises";
import path from "node:path";

import { buildAudioCueSheet, scheduleNarrationCues } from "./audio-plan.mjs";
import {
  ROOT_DIR,
  TOOLS_DIR,
  ensureDir,
  getMediaDurationMs,
  runCommand,
  verifyCommand,
  writeJson,
} from "./lib.mjs";

const MELO_TTS_SOURCE = "git+https://github.com/myshell-ai/MeloTTS.git";
const PYTHON_SHIMS_DIR = path.join(TOOLS_DIR, "python-shims");

export function createMeloTtsInvocation({ audioDir, cueSheet, cues }) {
  const planPath = path.join(audioDir, "tts-plan.json");
  const plan = {
    engine: cueSheet.audio.tts.engine,
    language: cueSheet.audio.tts.language,
    speaker: cueSheet.audio.tts.speaker,
    speed: cueSheet.audio.tts.speed,
    device: cueSheet.audio.tts.device,
    cues: cues.map((cue) => ({
      text: cue.text,
      outputPath: cue.outputPath,
    })),
  };

  return {
    planPath,
    plan,
    command: "uv",
    args: [
      "run",
      "--python",
      cueSheet.audio.tts.pythonVersion,
      "--with",
      MELO_TTS_SOURCE,
      "--with",
      "mecab-ko-msvc",
      "--with",
      "mecab-ko-dic-msvc",
      "python",
      path.join(TOOLS_DIR, "render-tts.py"),
      "--plan",
      planPath,
    ],
    env: {
      ...process.env,
      UV_CACHE_DIR: path.join(ROOT_DIR, ".uv-cache"),
      PYTHONPATH: process.env.PYTHONPATH
        ? `${PYTHON_SHIMS_DIR}${path.delimiter}${process.env.PYTHONPATH}`
        : PYTHON_SHIMS_DIR,
      HF_HUB_DISABLE_SYMLINKS_WARNING: "1",
    },
  };
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveClipDurationsMs(rawClips) {
  const durations = [];
  for (const clipPath of rawClips) {
    durations.push(await getMediaDurationMs(clipPath));
  }
  return durations;
}

async function renderNarrationSegments(audioDir, cueSheet) {
  if (!cueSheet.audio.tts.enabled || cueSheet.cues.length === 0) {
    return [];
  }

  const ttsDir = path.join(audioDir, "tts");
  await ensureDir(ttsDir);

  const cues = cueSheet.cues.map((cue) => ({
    ...cue,
    outputPath: path.join(ttsDir, `${cue.id}.wav`),
  }));
  const invocation = createMeloTtsInvocation({ audioDir, cueSheet, cues });
  await writeJson(invocation.planPath, invocation.plan);
  await runCommand(invocation.command, invocation.args, {
    label: "render tts",
    env: invocation.env,
  });

  return cues;
}

async function resolveCueDurationsMs(narrationSegments) {
  const durations = {};

  for (const segment of narrationSegments) {
    durations[segment.id] = await getMediaDurationMs(segment.outputPath);
  }

  return durations;
}

async function renderNarrationTrack(audioDir, cueSheet, scheduledSegments) {
  const activeSegments = scheduledSegments.filter((segment) => !segment.skipped);
  if (activeSegments.length === 0) {
    return null;
  }

  const narrationPath = path.join(audioDir, "narration.wav");
  const totalSeconds = (cueSheet.clipDurationsMs.total / 1_000).toFixed(3);
  const ffmpegArgs = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=48000:cl=stereo:d=${totalSeconds}`,
  ];

  for (const segment of activeSegments) {
    ffmpegArgs.push("-i", segment.outputPath);
  }

  const filters = activeSegments.map((segment, index) => {
    const inputIndex = index + 1;
    return `[${inputIndex}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${segment.startMs}|${segment.startMs}[cue${index}]`;
  });
  const mixInputs = ["[0:a]", ...activeSegments.map((_, index) => `[cue${index}]`)].join("");
  filters.push(
    `${mixInputs}amix=inputs=${activeSegments.length + 1}:normalize=0:duration=longest,alimiter=limit=0.92[narration]`,
  );

  ffmpegArgs.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[narration]",
    "-t",
    totalSeconds,
    "-c:a",
    "pcm_s16le",
    narrationPath,
  );

  await runCommand("ffmpeg", ffmpegArgs, { label: "ffmpeg narration" });
  return narrationPath;
}

async function renderBgmTrack(audioDir, cueSheet) {
  if (!cueSheet.audio.bgm.enabled) {
    return null;
  }

  const bgmPath = path.join(audioDir, "bgm.wav");
  const totalSeconds = cueSheet.clipDurationsMs.total / 1_000;
  const fadeInSeconds = Math.max(0.2, (cueSheet.audio.bgm.fadeInMs ?? 0) / 1_000);
  const fadeOutSeconds = Math.max(0.2, (cueSheet.audio.bgm.fadeOutMs ?? 0) / 1_000);
  const fadeOutStart = Math.max(0, totalSeconds - fadeOutSeconds);
  const configuredAssetPath = String(cueSheet.audio.bgm.assetPath ?? "").trim();

  if (configuredAssetPath) {
    const sourcePath = path.resolve(ROOT_DIR, configuredAssetPath);
    if (!(await pathExists(sourcePath))) {
      throw new Error(`Configured BGM asset was not found: ${sourcePath}`);
    }

    await runCommand(
      "ffmpeg",
      [
        "-y",
        "-stream_loop",
        "-1",
        "-i",
        sourcePath,
        "-t",
        totalSeconds.toFixed(3),
        "-af",
        [
          "aformat=sample_rates=48000:channel_layouts=stereo",
          `afade=t=in:st=0:d=${fadeInSeconds.toFixed(3)}`,
          `afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOutSeconds.toFixed(3)}`,
          `volume=${cueSheet.audio.bgm.volume}`,
        ].join(","),
        "-c:a",
        "pcm_s16le",
        bgmPath,
      ],
      { label: "ffmpeg bgm asset" },
    );

    return bgmPath;
  }

  const expressionLeft = [
    "0.018*sin(2*PI*196*t)*(0.65+0.35*sin(2*PI*t/12))",
    "0.013*sin(2*PI*246.94*t)*(0.55+0.45*sin(2*PI*t/17))",
    "0.01*sin(2*PI*293.66*t)*(0.6+0.4*sin(2*PI*t/23))",
  ].join("+");
  const expressionRight = [
    "0.018*sin(2*PI*196*t+0.25)*(0.65+0.35*sin(2*PI*t/12))",
    "0.013*sin(2*PI*246.94*t+0.15)*(0.55+0.45*sin(2*PI*t/17))",
    "0.01*sin(2*PI*293.66*t+0.3)*(0.6+0.4*sin(2*PI*t/23))",
  ].join("+");

  await runCommand(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `aevalsrc=exprs='${expressionLeft}|${expressionRight}':s=48000:d=${totalSeconds.toFixed(3)}`,
      "-af",
      [
        "highpass=f=90",
        "lowpass=f=1400",
        `afade=t=in:st=0:d=${fadeInSeconds.toFixed(3)}`,
        `afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOutSeconds.toFixed(3)}`,
        `volume=${cueSheet.audio.bgm.volume}`,
      ].join(","),
      "-c:a",
      "pcm_s16le",
      bgmPath,
    ],
    { label: "ffmpeg bgm" },
  );

  return bgmPath;
}

export async function renderCompetitionAudio({ bundleDir, scenario, metadata }) {
  const audioDir = path.join(bundleDir, "audio");
  await ensureDir(audioDir);
  await verifyCommand("python", ["--version"]);
  await verifyCommand("uv", ["--version"]);
  await verifyCommand("ffprobe", ["-version"]);

  const clipDurationsMs = await resolveClipDurationsMs(metadata.rawClips);
  const cueSheet = buildAudioCueSheet({ scenario, metadata, clipDurationsMs });
  const narrationSegments = await renderNarrationSegments(audioDir, cueSheet);
  const cueDurationsMs = await resolveCueDurationsMs(narrationSegments);
  const scheduledNarrationSegments = scheduleNarrationCues({
    cues: narrationSegments,
    cueDurationsMs,
    clipDurationsMs: cueSheet.clipDurationsMs,
    minGapMs: cueSheet.audio.tts.minGapMs,
    sectionTailMs: cueSheet.audio.tts.sectionTailMs,
  });
  const narrationPath = await renderNarrationTrack(audioDir, cueSheet, scheduledNarrationSegments);
  const bgmPath = await renderBgmTrack(audioDir, cueSheet);

  const audioMetadata = {
    clipDurationsMs: cueSheet.clipDurationsMs,
    cues: scheduledNarrationSegments,
    narrationPath,
    bgmPath,
    bgmAssetPath: cueSheet.audio.bgm.assetPath || null,
    generatedAt: new Date().toISOString(),
  };
  await writeJson(path.join(audioDir, "audio-metadata.json"), audioMetadata);

  return {
    ...audioMetadata,
    audioDir,
    audio: cueSheet.audio,
  };
}
