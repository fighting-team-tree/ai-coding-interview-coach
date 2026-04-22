import fs from "node:fs/promises";
import path from "node:path";

import {
  API_DIR,
  WEB_DIR,
  createTimestampTag,
  ensureDir,
  getChromiumLaunchOptions,
  isMain,
  loadChromium,
  loadScenario,
  parseArgs,
  resolveBundleDir,
  runCommand,
  sleep,
  spawnLongLived,
  stopProcess,
  validateLiveEnvironment,
  verifyChromium,
  waitForHttp,
  withVideoEnvironment,
  writeJson,
} from "./lib.mjs";

const HOME_PORT = 3100;
const API_PORT = 8100;

function buildTitleCardHtml({ title, subtitle, details }) {
  const detailItems = details.map((detail) => `<li>${detail}</li>`).join("");
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Segoe UI", system-ui, sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(44, 125, 255, 0.22), transparent 30%),
          linear-gradient(135deg, #08111f 0%, #13243c 48%, #1d3855 100%);
        color: #f8fafc;
      }

      main {
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 72px;
        box-sizing: border-box;
      }

      section {
        width: min(1180px, 100%);
        padding: 56px;
        border-radius: 28px;
        background: rgba(7, 16, 28, 0.72);
        border: 1px solid rgba(191, 219, 254, 0.2);
        box-shadow: 0 32px 80px rgba(8, 15, 26, 0.45);
      }

      .eyebrow {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #93c5fd;
      }

      h1 {
        margin: 16px 0 14px;
        font-size: 58px;
        line-height: 1.05;
      }

      p {
        margin: 0;
        font-size: 26px;
        line-height: 1.45;
        color: rgba(241, 245, 249, 0.94);
      }

      ul {
        margin: 30px 0 0;
        padding-left: 24px;
        display: grid;
        gap: 16px;
        font-size: 24px;
        line-height: 1.45;
        color: rgba(226, 232, 240, 0.95);
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <div class="eyebrow">Automated Demo Video</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <ul>${detailItems}</ul>
      </section>
    </main>
  </body>
</html>`;
}

async function moveVideoFile(video, targetPath) {
  const videoPath = await video.path();
  await fs.rename(videoPath, targetPath);
  return targetPath;
}

async function installCaptionOverlay(page) {
  await page.addStyleTag({
    content: `
      #competition-video-caption {
        position: fixed;
        left: 50%;
        bottom: 42px;
        transform: translateX(-50%);
        width: min(1180px, calc(100vw - 96px));
        padding: 18px 24px;
        border-radius: 18px;
        background: rgba(5, 10, 20, 0.84);
        color: #f8fafc;
        font-family: "Segoe UI", system-ui, sans-serif;
        font-size: 28px;
        line-height: 1.45;
        font-weight: 600;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.34);
        z-index: 2147483647;
        opacity: 0;
        transition: opacity 180ms ease;
        pointer-events: none;
      }
      #competition-video-caption.visible {
        opacity: 1;
      }
    `,
  });

  await page.evaluate(() => {
    if (document.getElementById("competition-video-caption")) {
      return;
    }

    const caption = document.createElement("div");
    caption.id = "competition-video-caption";
    document.body.appendChild(caption);
  });
}

async function setCaption(page, text) {
  await page.evaluate((value) => {
    const caption = document.getElementById("competition-video-caption");
    if (!caption) {
      return;
    }

    caption.textContent = value;
    caption.classList.toggle("visible", Boolean(value));
  }, text);
}

async function recordTitleClip(browser, viewport, rawDir, clipName, cardConfig) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();

  await page.setContent(buildTitleCardHtml(cardConfig), { waitUntil: "domcontentloaded" });
  await sleep(cardConfig.holdMs);

  await page.close();
  await context.close();

  return moveVideoFile(video, path.join(rawDir, clipName));
}

async function typeAnswerSlowly(page, locator, answer, delay) {
  await locator.click();
  await page.keyboard.type(answer, { delay });
}

async function revealInterviewState(page) {
  const interviewPanel = page.locator(".interview-panel");
  if (await interviewPanel.count()) {
    await interviewPanel.scrollIntoViewIfNeeded();
  }

  const chatLog = page.locator(".chat-log");
  if (await chatLog.count()) {
    await chatLog.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  }
}

async function revealReportState(page) {
  const reportHeading = page.getByRole("heading", { name: "3축 피드백" });
  await reportHeading.scrollIntoViewIfNeeded();
}

async function recordDemoClip(browser, viewport, rawDir, scenario, baseUrl) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    const afterTurnMs =
      scenario.demo.holds.afterTurnMs ?? scenario.demo.holds.betweenAnswerMs ?? 0;
    const beforeFirstAnswerMs =
      scenario.demo.holds.beforeFirstAnswerMs ?? scenario.demo.holds.betweenAnswerMs ?? 0;
    const beforeReportMs = scenario.demo.holds.beforeReportMs ?? afterTurnMs;
    const turnCaptions =
      scenario.demo.turnCaptions ??
      scenario.demo.answers.map(() => scenario.demo.captions.interview ?? "");

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await installCaptionOverlay(page);

    await setCaption(page, scenario.demo.captions.home);
    await sleep(scenario.demo.holds.homeMs);

    await page.getByRole("link", { name: scenario.demo.ctaName }).click();
    await page.waitForURL(new RegExp(`${scenario.demo.problemPath.replace(/\//g, "\\/")}$`));
    await page.getByRole("heading", { name: scenario.demo.problemHeading }).waitFor();

    await setCaption(page, scenario.demo.captions.problem);
    await sleep(scenario.demo.holds.problemMs);

    await page.getByRole("button", { name: scenario.demo.variantLabel }).click();
    await setCaption(page, scenario.demo.captions.variant);
    await sleep(scenario.demo.holds.variantMs);

    await setCaption(page, scenario.demo.captions.submit);
    await Promise.all([
      page.waitForResponse((response) => {
        return response.url().includes("/sessions/") && response.url().includes("/submit");
      }),
      page.getByRole("button", { name: "코드 제출" }).click(),
    ]);

    await page.getByRole("heading", { name: "일반 심화 질문" }).waitFor();
    await page.getByRole("heading", { name: "왜 이런 질문이 나왔는지" }).waitFor();
    await revealInterviewState(page);
    await sleep(scenario.demo.holds.afterSubmitMs);

    const answerBox = page.getByPlaceholder(
      "풀이 접근, 시간복잡도, 핵심 판단 기준과 왜 그런 선택을 했는지 설명해보세요.",
    );

    if (scenario.demo.captions.interviewIntro) {
      await setCaption(page, scenario.demo.captions.interviewIntro);
      await sleep(beforeFirstAnswerMs);
    }

    for (const [index, answer] of scenario.demo.answers.entries()) {
      await answerBox.waitFor();
      await revealInterviewState(page);
      await answerBox.clear();
      await setCaption(page, turnCaptions[index] ?? scenario.demo.captions.interview ?? "");
      await typeAnswerSlowly(page, answerBox, answer, scenario.demo.typingDelayMs);

      await Promise.all([
        page.waitForResponse((response) => {
          return response.url().includes("/sessions/") && response.url().includes("/turns");
        }),
        page.getByRole("button", { name: "답변 보내기" }).click(),
      ]);

      await revealInterviewState(page);
      await sleep(index === scenario.demo.answers.length - 1 ? beforeReportMs : afterTurnMs);
    }

    await page.getByRole("heading", { name: "3축 피드백" }).waitFor({ timeout: 15_000 });
    await revealReportState(page);
    await setCaption(page, scenario.demo.captions.report);
    await sleep(scenario.demo.holds.reportMs);
    await setCaption(page, "");

    await page.close();
    await context.close();
    return moveVideoFile(video, path.join(rawDir, "02-demo.webm"));
  } catch (error) {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    throw error;
  }
}

async function startServers(mode) {
  if (mode === "live") {
    validateLiveEnvironment(process.env);
  }

  await runCommand("npm", ["run", "qa:build"], {
    cwd: WEB_DIR,
    label: "qa build",
  });

  const apiProcess = spawnLongLived(
    "uv",
    ["run", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(API_PORT)],
    {
      cwd: API_DIR,
      env: withVideoEnvironment(process.env, mode),
    },
  );
  const webProcess = spawnLongLived(
    "python",
    ["-m", "http.server", String(HOME_PORT), "--directory", "out"],
    {
      cwd: WEB_DIR,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
      },
    },
  );

  await waitForHttp(`http://127.0.0.1:${API_PORT}/health`);
  await waitForHttp(`http://127.0.0.1:${HOME_PORT}`);

  return { apiProcess, webProcess };
}

export async function recordCompetitionVideo(options = {}) {
  const args = options.args ?? parseArgs(process.argv.slice(2));
  const mode = args.mode === "live" ? "live" : "demo";
  const { scenario, scenarioPath } = await loadScenario(args.scenario);
  const timestampTag = createTimestampTag();
  const bundleDir = resolveBundleDir({
    scenarioId: scenario.id,
    outDir: args.outDir,
    timestampTag,
  });
  const rawDir = path.join(bundleDir, "raw");
  const finalDir = path.join(bundleDir, "final");

  await ensureDir(rawDir);
  await ensureDir(finalDir);
  await verifyChromium();

  const chromium = await loadChromium();
  const browser = await chromium.launch(getChromiumLaunchOptions());
  let serverHandles = null;

  try {
    serverHandles = await startServers(mode);

    const clipPaths = [];
    clipPaths.push(
      await recordTitleClip(browser, scenario.viewport, rawDir, "01-intro.webm", scenario.intro),
    );
    clipPaths.push(
      await recordDemoClip(
        browser,
        scenario.viewport,
        rawDir,
        scenario,
        `http://127.0.0.1:${HOME_PORT}`,
      ),
    );
    clipPaths.push(
      await recordTitleClip(browser, scenario.viewport, rawDir, "03-outro.webm", scenario.outro),
    );

    const metadata = {
      scenarioId: scenario.id,
      title: scenario.title,
      mode,
      outputName: scenario.outputName,
      viewport: scenario.viewport,
      scenarioPath,
      bundleDir,
      rawDir,
      finalDir,
      rawClips: clipPaths,
      generatedAt: new Date().toISOString(),
    };

    await writeJson(path.join(bundleDir, "metadata.json"), metadata);
    return metadata;
  } finally {
    await browser.close().catch(() => {});

    if (serverHandles) {
      await stopProcess(serverHandles.apiProcess);
      await stopProcess(serverHandles.webProcess);
    }
  }
}

async function main() {
  const metadata = await recordCompetitionVideo();
  console.log(`Recorded raw clips in ${metadata.rawDir}`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
