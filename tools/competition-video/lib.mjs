import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
export const TOOLS_DIR = path.dirname(currentFile);
export const ROOT_DIR = path.resolve(TOOLS_DIR, "..", "..");
export const WEB_DIR = path.join(ROOT_DIR, "apps", "web");
export const API_DIR = path.join(ROOT_DIR, "apps", "api");
export const SCENARIO_DIR = path.join(TOOLS_DIR, "scenarios");
export const DEFAULT_SCENARIO_ID = "ai-champion-core";
export const OUTPUT_ROOT = path.join(ROOT_DIR, "output", "competition-video");

function resolveCommand(command) {
  if (command === "ffmpeg") {
    const ffmpegPath = resolveFfmpegPath();
    if (ffmpegPath) {
      return ffmpegPath;
    }
  }

  if (command === "ffprobe") {
    const ffprobePath = resolveFfprobePath();
    if (ffprobePath) {
      return ffprobePath;
    }
  }

  if (process.platform !== "win32") {
    return command;
  }

  if (command === "npm") {
    return "npm.cmd";
  }

  if (command === "npx") {
    return "npx.cmd";
  }

  return command;
}

function quoteWindowsArgument(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function createSpawnConfig(command, args, options) {
  const resolvedCommand = resolveCommand(command);
  const config = {
    command: resolvedCommand,
    args,
    options: {
      ...options,
      shell: false,
    },
  };

  if (process.platform === "win32" && resolvedCommand.toLowerCase().endsWith(".cmd")) {
    const comspec = process.env.ComSpec || "cmd.exe";
    const commandLine = [resolvedCommand, ...args].map(quoteWindowsArgument).join(" ");
    return {
      command: comspec,
      args: ["/d", "/s", "/c", commandLine],
      options: {
        ...options,
        shell: false,
      },
    };
  }

  return config;
}

function resolveFfmpegPath() {
  return resolveFfBinaryPath("ffmpeg.exe");
}

function resolveFfprobePath() {
  return resolveFfBinaryPath("ffprobe.exe");
}

function resolveFfBinaryPath(binaryName) {
  if (process.env.FFMPEG_PATH?.trim()) {
    const ffmpegCandidate = process.env.FFMPEG_PATH.trim();
    if (binaryName === "ffmpeg.exe") {
      return ffmpegCandidate;
    }

    const siblingCandidate = path.join(path.dirname(ffmpegCandidate), binaryName);
    if (fsSync.existsSync(siblingCandidate)) {
      return siblingCandidate;
    }
  }

  if (process.platform !== "win32") {
    return null;
  }

  const packageRoot = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft",
    "WinGet",
    "Packages",
  );
  if (!packageRoot || !fsSync.existsSync(packageRoot)) {
    return null;
  }

  const packageDir = fsSync
    .readdirSync(packageRoot, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.startsWith("Gyan.FFmpeg_"));
  if (!packageDir) {
    return null;
  }

  const ffmpegRoot = path.join(packageRoot, packageDir.name);
  const buildDir = fsSync
    .readdirSync(ffmpegRoot, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.startsWith("ffmpeg-"));
  if (!buildDir) {
    return null;
  }

  const binaryPath = path.join(ffmpegRoot, buildDir.name, "bin", binaryName);
  return fsSync.existsSync(binaryPath) ? binaryPath : null;
}

export function isMain(metaUrl) {
  if (!process.argv[1]) {
    return false;
  }

  return pathToFileURL(process.argv[1]).href === metaUrl;
}

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export async function ensureDir(targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
}

export function createTimestampTag(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export async function loadScenario(selection = DEFAULT_SCENARIO_ID) {
  const scenarioPath = selection.endsWith(".json")
    ? path.resolve(ROOT_DIR, selection)
    : path.join(SCENARIO_DIR, `${selection}.json`);
  const raw = await fs.readFile(scenarioPath, "utf-8");
  const scenario = JSON.parse(raw);

  return { scenario, scenarioPath };
}

export function resolveBundleDir({ scenarioId, outDir, timestampTag }) {
  if (outDir) {
    return path.resolve(ROOT_DIR, outDir);
  }

  return path.join(OUTPUT_ROOT, scenarioId, timestampTag);
}

export async function writeJson(targetPath, value) {
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

export async function runCommand(command, args, options = {}) {
  const { cwd = ROOT_DIR, env = process.env, label = command } = options;
  const spawnConfig = createSpawnConfig(command, args, {
    cwd,
    env,
    stdio: "inherit",
  });

  await new Promise((resolve, reject) => {
    const child = spawn(spawnConfig.command, spawnConfig.args, spawnConfig.options);

    child.on("error", (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code ?? "unknown"}`));
    });
  });
}

export async function runCommandCapture(command, args, options = {}) {
  const { cwd = ROOT_DIR, env = process.env, label = command } = options;
  const spawnConfig = createSpawnConfig(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return new Promise((resolve, reject) => {
    const child = spawn(spawnConfig.command, spawnConfig.args, spawnConfig.options);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${label} exited with code ${code ?? "unknown"}: ${stderr.trim()}`));
    });
  });
}

export function spawnLongLived(command, args, options = {}) {
  const { cwd = ROOT_DIR, env = process.env, stdio = "pipe" } = options;
  const spawnConfig = createSpawnConfig(command, args, {
    cwd,
    env,
    stdio,
  });

  return spawn(spawnConfig.command, spawnConfig.args, spawnConfig.options);
}

export async function waitForHttp(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }

      lastError = new Error(`Unexpected HTTP status: ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "unknown error"}`);
}

export async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyCommand(command, args = ["-version"]) {
  const spawnConfig = createSpawnConfig(command, args, {
    cwd: ROOT_DIR,
    stdio: "ignore",
  });

  await new Promise((resolve, reject) => {
    const child = spawn(spawnConfig.command, spawnConfig.args, spawnConfig.options);

    child.on("error", (error) => {
      reject(new Error(`${command} is not available: ${error.message}`));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

export async function getMediaDurationMs(targetPath) {
  const { stdout } = await runCommandCapture(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      targetPath,
    ],
    { label: "ffprobe duration" },
  );
  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Could not determine media duration for ${targetPath}`);
  }

  return Math.round(seconds * 1_000);
}

export async function loadChromium() {
  try {
    const playwright = await import("playwright");
    return playwright.chromium;
  } catch (playwrightError) {
    try {
      const testPackage = await import("@playwright/test");
      return testPackage.chromium;
    } catch {
      throw new Error(
        `Playwright could not be loaded from this workspace: ${playwrightError.message}`,
      );
    }
  }
}

export function getChromiumLaunchOptions() {
  const edgePath = path.join(
    process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
    "Microsoft",
    "Edge",
    "Application",
    "msedge.exe",
  );

  if (process.platform === "win32" && fsSync.existsSync(edgePath)) {
    return {
      channel: "msedge",
      headless: true,
    };
  }

  return {
    headless: true,
  };
}

export async function verifyChromium() {
  const chromium = await loadChromium();
  const browser = await chromium.launch(getChromiumLaunchOptions());
  await browser.close();
}

export function withVideoEnvironment(baseEnv, mode) {
  if (mode === "live") {
    return {
      ...baseEnv,
      FRONTEND_ORIGINS: "http://localhost:3100,http://127.0.0.1:3100",
    };
  }

  return {
    ...baseEnv,
    APP_ENV: "demo",
    FRONTEND_ORIGINS: "http://localhost:3100,http://127.0.0.1:3100",
    JUDGE0_BASE_URL: "",
    JUDGE0_API_TOKEN: "",
    INTERVIEW_MODEL: "",
    REPORT_MODEL: "",
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    GOOGLE_API_KEY: "",
  };
}

export function validateLiveEnvironment(env) {
  const hasInterviewModel = Boolean(env.INTERVIEW_MODEL?.trim());
  const hasReportModel = Boolean(env.REPORT_MODEL?.trim());
  const hasProviderKey =
    Boolean(env.OPENAI_API_KEY?.trim()) ||
    Boolean(env.ANTHROPIC_API_KEY?.trim()) ||
    Boolean(env.GOOGLE_API_KEY?.trim());

  if (!hasInterviewModel || !hasReportModel || !hasProviderKey) {
    throw new Error(
      "Live mode requires INTERVIEW_MODEL, REPORT_MODEL, and at least one provider API key.",
    );
  }
}

export async function stopProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  const terminated = new Promise((resolve) => {
    child.once("exit", () => resolve());
  });

  if (process.platform === "win32") {
    try {
      await runCommand("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        label: "taskkill",
      });
      await Promise.race([terminated, sleep(5_000)]);
      return;
    } catch {
      // Fall back to regular kill if taskkill is unavailable or fails.
    }
  }

  child.kill("SIGTERM");
  await Promise.race([terminated, sleep(5_000)]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([terminated, sleep(3_000)]);
  }
}

export async function resolveLatestBundleDir(scenarioId) {
  const scenarioRoot = path.join(OUTPUT_ROOT, scenarioId);
  const entries = await fs.readdir(scenarioRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  if (candidates.length === 0) {
    throw new Error(`No recorded bundles were found for scenario "${scenarioId}".`);
  }

  return path.join(scenarioRoot, candidates[0]);
}
