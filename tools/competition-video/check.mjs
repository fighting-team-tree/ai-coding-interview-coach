import { API_DIR, ROOT_DIR, WEB_DIR, isMain, parseArgs, verifyChromium, verifyCommand } from "./lib.mjs";

export async function checkCompetitionVideoEnvironment() {
  await verifyCommand("python", ["--version"]);
  await verifyCommand("uv", ["--version"]);
  await verifyCommand("ffmpeg", ["-version"]);
  await verifyCommand("npm", ["--version"]);
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
