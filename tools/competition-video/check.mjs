import { API_DIR, ROOT_DIR, WEB_DIR, isMain, parseArgs, verifyChromium, verifyCommand } from "./lib.mjs";
import { createMeloTtsInvocation } from "./render-audio.mjs";

export async function checkCompetitionVideoEnvironment() {
  await verifyCommand("python", ["--version"]);
  await verifyCommand("uv", ["--version"]);
  await verifyCommand("ffmpeg", ["-version"]);
  await verifyCommand("ffprobe", ["-version"]);
  await verifyCommand("npm", ["--version"]);
  const invocation = createMeloTtsInvocation({
    audioDir: ROOT_DIR,
    cueSheet: {
      audio: {
        tts: {
          engine: "melotts",
          language: "KR",
          speaker: "KR",
          speed: 1,
          device: "cpu",
          pythonVersion: "3.10",
        },
      },
    },
    cues: [],
  });
  await verifyCommand(invocation.command, [...invocation.args.slice(0, -4), "python", "--version"]);
  await verifyChromium();

  return {
    rootDir: ROOT_DIR,
    apiDir: API_DIR,
    webDir: WEB_DIR,
  };
}

async function main() {
  parseArgs(process.argv.slice(2));
  const result = await checkCompetitionVideoEnvironment();
  console.log(
    [
      "Competition video environment is ready.",
      `root: ${result.rootDir}`,
      `api: ${result.apiDir}`,
      `web: ${result.webDir}`,
    ].join("\n"),
  );
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
