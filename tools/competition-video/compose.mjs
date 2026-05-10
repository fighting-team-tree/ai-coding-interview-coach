import fs from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_SCENARIO_ID,
  ensureDir,
  isMain,
  loadScenario,
  parseArgs,
  resolveLatestBundleDir,
  runCommand,
  verifyCommand,
  writeJson,
} from "./lib.mjs";
import { renderCompetitionAudio } from "./render-audio.mjs";

async function readMetadata(bundleDir) {
  const metadataPath = path.join(bundleDir, "metadata.json");
  const raw = await fs.readFile(metadataPath, "utf-8");
  return { metadataPath, metadata: JSON.parse(raw) };
}

function formatAssTimestamp(ms) {
  const totalMs = Math.max(0, Math.round(ms));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function escapeAssText(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\n/g, "\\N");
}

function escapeAssPath(targetPath) {
  return targetPath.replace(/\\/g, "/").replace(":", "\\:");
}

async function writeCaptionAss(bundleDir, metadata, audioMetadata) {
  const captionPath = path.join(bundleDir, "captions.ass");
  const demoCues = (audioMetadata.cues ?? []).filter((cue) => cue.section === "demo" && !cue.skipped && cue.text);

  const dialogueLines = demoCues.map((cue, index) => {
    const nextCue = demoCues[index + 1];
    const endMs = nextCue ? Math.max(cue.startMs + 300, nextCue.startMs - 80) : cue.endMs ?? cue.startMs + cue.durationMs;
    return `Dialogue: 0,${formatAssTimestamp(cue.startMs)},${formatAssTimestamp(endMs)},Default,,0,0,0,,${escapeAssText(cue.text)}`;
  });

  const content = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1920",
    "PlayResY: 1080",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding",
    "Style: Default,Segoe UI,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,0,0,0,0,100,100,0,0,3,1.6,0,2,72,72,34,1",
    "",
    "[Events]",
    "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text",
    ...dialogueLines,
    "",
  ].join("\n");

  await fs.writeFile(captionPath, content, "utf-8");
  return captionPath;
}

function resolveBundleSelection(args, scenarioId) {
  if (args.bundle) {
    return path.resolve(args.bundle);
  }

  return resolveLatestBundleDir(scenarioId);
}

export async function composeCompetitionVideo(options = {}) {
  const args = options.args ?? parseArgs(process.argv.slice(2));
  const { scenario } = await loadScenario(args.scenario ?? DEFAULT_SCENARIO_ID);
  const bundleDir = await resolveBundleSelection(args, scenario.id);
  const { metadataPath, metadata } = await readMetadata(bundleDir);
  const finalDir = metadata.finalDir ?? path.join(bundleDir, "final");

  await ensureDir(finalDir);
  await verifyCommand("ffmpeg", ["-version"]);
  await verifyCommand("ffprobe", ["-version"]);

  const concatFile = path.join(bundleDir, "concat.txt");
  const finalPath = path.join(finalDir, `${metadata.outputName}-${metadata.mode}.mp4`);
  const concatContent = metadata.rawClips
    .map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(concatFile, `${concatContent}\n`, "utf-8");

  const audioAssets = await renderCompetitionAudio({
    bundleDir,
    scenario,
    metadata,
  });
  const captionAssPath = await writeCaptionAss(bundleDir, metadata, audioAssets);

  const ffmpegArgs = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
  ];

  if (audioAssets.narrationPath) {
    ffmpegArgs.push("-i", audioAssets.narrationPath);
  }

  if (audioAssets.bgmPath) {
    ffmpegArgs.push("-i", audioAssets.bgmPath);
  }

  const hasNarration = Boolean(audioAssets.narrationPath);
  const hasBgm = Boolean(audioAssets.bgmPath);

  if (hasNarration || hasBgm) {
    const filters = [];
    const narrationInputIndex = hasNarration ? 1 : null;
    const bgmInputIndex = hasBgm ? (hasNarration ? 2 : 1) : null;

    if (hasNarration && hasBgm) {
      filters.push(`[${narrationInputIndex}:a]asplit=2[voice_sidechain][voice_mix]`);
      filters.push(`[${bgmInputIndex}:a]volume=1.0[bgm]`);
      filters.push(
        `[bgm][voice_sidechain]sidechaincompress=threshold=${audioAssets.audio.bgm.duckingThreshold}:ratio=${audioAssets.audio.bgm.duckingRatio}:attack=${audioAssets.audio.bgm.attackMs}:release=${audioAssets.audio.bgm.releaseMs}[bgmducked]`,
      );
      filters.push(
        `[bgmducked][voice_mix]amix=inputs=2:normalize=0,alimiter=limit=0.95[aout]`,
      );
    } else if (hasNarration) {
      filters.push(`[${narrationInputIndex}:a]alimiter=limit=0.95[aout]`);
    } else if (hasBgm) {
      filters.push(`[${bgmInputIndex}:a]alimiter=limit=0.9[aout]`);
    }

    ffmpegArgs.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "0:v:0",
      "-map",
      "[aout]",
    );
  }

  ffmpegArgs.push(
    "-vf",
    `ass='${escapeAssPath(captionAssPath)}',fps=30,format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
  );

  if (hasNarration || hasBgm) {
    ffmpegArgs.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  } else {
    ffmpegArgs.push("-an");
  }

  ffmpegArgs.push("-movflags", "+faststart", finalPath);

  await runCommand("ffmpeg", ffmpegArgs, { label: "ffmpeg compose" });

  const nextMetadata = {
    ...metadata,
    audioDir: audioAssets.audioDir,
    audioTracks: {
      narration: audioAssets.narrationPath,
      bgm: audioAssets.bgmPath,
    },
    finalVideo: finalPath,
    composedAt: new Date().toISOString(),
  };
  await writeJson(metadataPath, nextMetadata);

  return { bundleDir, finalPath };
}

async function main() {
  const { finalPath } = await composeCompetitionVideo();
  console.log(`Composed final video at ${finalPath}`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
