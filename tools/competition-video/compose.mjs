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

async function readMetadata(bundleDir) {
  const metadataPath = path.join(bundleDir, "metadata.json");
  const raw = await fs.readFile(metadataPath, "utf-8");
  return { metadataPath, metadata: JSON.parse(raw) };
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

  const concatFile = path.join(bundleDir, "concat.txt");
  const finalPath = path.join(finalDir, `${metadata.outputName}-${metadata.mode}.mp4`);
  const concatContent = metadata.rawClips
    .map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(concatFile, `${concatContent}\n`, "utf-8");

  await runCommand(
    "ffmpeg",
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatFile,
      "-vf",
      "fps=30,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-movflags",
      "+faststart",
      "-an",
      finalPath,
    ],
    { label: "ffmpeg compose" },
  );

  const nextMetadata = {
    ...metadata,
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
