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
const API_PORT = 8110;
const ANSWER_PLACEHOLDER =
  "풀이 접근, 시간복잡도, 핵심 판단 기준과 왜 그런 선택을 했는지 설명해보세요.";
const INTERVIEW_PANEL_TARGET_RATIO = 0.3;
const ANSWER_COMPOSER_TARGET_RATIO = 0.4;
const REPORT_PANEL_TARGET_RATIO = 0.24;
const WINDOW_SCROLL_DURATION_MS = 700;
const CHAT_SCROLL_DURATION_MS = 520;
const SCROLL_SETTLE_MS = 180;
const CTA_TARGET_RATIO = 0.72;
const CTA_FOCUS_DURATION_MS = 950;
const CTA_CLICK_DELAY_MS = 140;

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
        font-family: Inter, "Segoe UI", system-ui, sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(94, 106, 210, 0.16), transparent 34%),
          linear-gradient(180deg, #08090a 0%, #0b0c0f 100%);
        color: #f7f8f8;
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
        border-radius: 22px;
        background: rgba(15, 16, 17, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow:
          0 24px 80px rgba(0, 0, 0, 0.42),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .eyebrow {
        font-size: 13px;
        font-weight: 510;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #7170ff;
      }

      h1 {
        margin: 16px 0 14px;
        font-size: 62px;
        line-height: 1;
        letter-spacing: -1.056px;
        font-weight: 510;
      }

      p {
        margin: 0;
        font-size: 26px;
        line-height: 1.45;
        color: #d0d6e0;
      }

      ul {
        margin: 30px 0 0;
        padding-left: 24px;
        display: grid;
        gap: 16px;
        font-size: 24px;
        line-height: 1.45;
        color: #d0d6e0;
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
        background: rgba(15, 16, 17, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #f7f8f8;
        font-family: Inter, "Segoe UI", system-ui, sans-serif;
        font-size: 28px;
        line-height: 1.45;
        font-weight: 510;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
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

function normalizeCaptionCue(cue) {
  if (cue && typeof cue === "object") {
    return {
      text: String(cue.caption ?? cue.text ?? "").trim(),
      ttsText:
        cue.ttsText === undefined || cue.ttsText === null ? undefined : String(cue.ttsText).trim(),
    };
  }

  return {
    text: String(cue ?? "").trim(),
    ttsText: undefined,
  };
}

async function setCaption(page, cue, onShow = null) {
  const normalizedCue = normalizeCaptionCue(cue);

  await page.evaluate((value) => {
    const caption = document.getElementById("competition-video-caption");
    if (!caption) {
      return;
    }

    caption.textContent = value;
    caption.classList.toggle("visible", Boolean(value));
  }, normalizedCue.text);

  if (normalizedCue.text && onShow) {
    onShow(normalizedCue);
  }
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

export function computeViewportScrollTop({
  currentScrollY,
  elementTop,
  elementHeight,
  viewportHeight,
  targetRatio,
}) {
  const targetViewportY = viewportHeight * targetRatio;
  return Math.max(
    0,
    Math.round(currentScrollY + elementTop + elementHeight / 2 - targetViewportY),
  );
}

async function smoothScrollPageToElement(
  locator,
  { targetRatio = ANSWER_COMPOSER_TARGET_RATIO, durationMs = WINDOW_SCROLL_DURATION_MS } = {},
) {
  if (!(await locator.count())) {
    return;
  }

  await locator.evaluate(
    async (element, options) => {
      const startY = window.scrollY;
      const rect = element.getBoundingClientRect();
      const targetY = Math.max(
        0,
        Math.round(
          window.scrollY +
            rect.top +
            rect.height / 2 -
            window.innerHeight * options.targetRatio,
        ),
      );
      const delta = targetY - startY;

      if (Math.abs(delta) < 4 || options.durationMs <= 0) {
        window.scrollTo(0, targetY);
        return;
      }

      const easeInOutCubic = (value) =>
        value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

      await new Promise((resolve) => {
        const startedAt = performance.now();

        const step = (timestamp) => {
          const progress = Math.min(1, (timestamp - startedAt) / options.durationMs);
          const eased = easeInOutCubic(progress);
          window.scrollTo(0, startY + delta * eased);

          if (progress < 1) {
            requestAnimationFrame(step);
            return;
          }

          resolve();
        };

        requestAnimationFrame(step);
      });
    },
    { targetRatio, durationMs },
  );
}

async function smoothScrollContainerToBottom(
  locator,
  { durationMs = CHAT_SCROLL_DURATION_MS } = {},
) {
  if (!(await locator.count())) {
    return;
  }

  await locator.evaluate(
    async (element, options) => {
      const targetTop = Math.max(0, element.scrollHeight - element.clientHeight);
      const startTop = element.scrollTop;
      const delta = targetTop - startTop;

      if (Math.abs(delta) < 4 || options.durationMs <= 0) {
        element.scrollTop = targetTop;
        return;
      }

      const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

      await new Promise((resolve) => {
        const startedAt = performance.now();

        const step = (timestamp) => {
          const progress = Math.min(1, (timestamp - startedAt) / options.durationMs);
          const eased = easeOutCubic(progress);
          element.scrollTop = startTop + delta * eased;

          if (progress < 1) {
            requestAnimationFrame(step);
            return;
          }

          resolve();
        };

        requestAnimationFrame(step);
      });
    },
    { durationMs },
  );
}

async function emphasizeCta(locator, { durationMs = CTA_FOCUS_DURATION_MS } = {}) {
  if (!(await locator.count())) {
    return;
  }

  await locator.focus();
  await locator.evaluate(
    async (element, options) => {
      const previousTransition = element.style.transition;
      const previousTransform = element.style.transform;
      const previousBoxShadow = element.style.boxShadow;
      const previousFilter = element.style.filter;

      element.style.transition =
        "transform 220ms ease, box-shadow 220ms ease, filter 220ms ease";
      element.style.transform = "translateY(-2px) scale(1.02)";
      element.style.boxShadow =
        "0 0 0 1px rgba(113,112,255,0.55), 0 0 0 10px rgba(113,112,255,0.16), 0 18px 40px rgba(0,0,0,0.28)";
      element.style.filter = "brightness(1.05)";

      await new Promise((resolve) => window.setTimeout(resolve, options.durationMs));

      element.style.transform = previousTransform;
      element.style.boxShadow = previousBoxShadow;
      element.style.filter = previousFilter;
      element.style.transition = previousTransition;
    },
    { durationMs },
  );
}

async function revealInterviewState(page, options = {}) {
  const { focusAnswerComposer = false } = options;
  const interviewPanel = page.locator("[data-video-interview-panel]");
  if (await interviewPanel.count()) {
    await smoothScrollPageToElement(interviewPanel, {
      targetRatio: INTERVIEW_PANEL_TARGET_RATIO,
    });
  }

  const chatLog = page.locator("[data-video-chat-log]");
  await smoothScrollContainerToBottom(chatLog);

  if (!focusAnswerComposer) {
    await sleep(SCROLL_SETTLE_MS);
    return;
  }

  const answerComposer = page.getByPlaceholder(ANSWER_PLACEHOLDER);
  await smoothScrollPageToElement(answerComposer, {
    targetRatio: ANSWER_COMPOSER_TARGET_RATIO,
    durationMs: WINDOW_SCROLL_DURATION_MS + 120,
  });
  await sleep(SCROLL_SETTLE_MS);
}

async function revealReportState(page) {
  const reportPanel = page.locator("[data-video-report]");
  if (await reportPanel.count()) {
    await smoothScrollPageToElement(reportPanel, {
      targetRatio: REPORT_PANEL_TARGET_RATIO,
      durationMs: WINDOW_SCROLL_DURATION_MS + 160,
    });
  }
  await sleep(SCROLL_SETTLE_MS);
}

async function recordDemoClip(browser, viewport, rawDir, scenario, baseUrl) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  const cueEvents = [];

  try {
    const afterTurnMs =
      scenario.demo.holds.afterTurnMs ?? scenario.demo.holds.betweenAnswerMs ?? 0;
    const beforeFirstAnswerMs =
      scenario.demo.holds.beforeFirstAnswerMs ?? scenario.demo.holds.betweenAnswerMs ?? 0;
    const beforeReportMs = scenario.demo.holds.beforeReportMs ?? afterTurnMs;
    const turnCaptions =
      scenario.demo.turnCaptions ??
      scenario.demo.answers.map(() => scenario.demo.captions.interview ?? "");

    let lastCueKey = null;
    const clipStartedAt = Date.now();
    const recordCue = (cue) => {
      const text = String(cue.text ?? "").trim();
      const ttsText =
        cue.ttsText === undefined || cue.ttsText === null ? undefined : String(cue.ttsText).trim();
      const cueKey = `${text}::${ttsText ?? ""}`;
      if (!text || cueKey === lastCueKey) {
        return null;
      }

      lastCueKey = cueKey;
      const event = {
        startMs: Date.now() - clipStartedAt,
        text,
        ttsText,
      };
      cueEvents.push(event);
      return event;
    };

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await installCaptionOverlay(page);
    const cueBaselineMs = Date.now();
    const cueTimeOffsetMs = cueBaselineMs - clipStartedAt;
    const adjustedRecordCue = (cue) => {
      const event = recordCue({
        ...cue,
        startMs: undefined,
      });
      if (event) {
        event.startMs = Math.max(0, event.startMs - cueTimeOffsetMs);
      }
    };

    await setCaption(page, scenario.demo.captions.home, adjustedRecordCue);
    const featuredProblemCta = page.locator("[data-video-cta='featured-problem']").first();
    const homeHoldMs = Math.max(0, scenario.demo.holds.homeMs ?? 0);
    const preClickLeadMs = Math.min(2200, Math.max(1200, Math.round(homeHoldMs * 0.35)));
    const homeLeadMs = Math.max(0, homeHoldMs - preClickLeadMs);

    await sleep(homeLeadMs);
    await smoothScrollPageToElement(featuredProblemCta, {
      targetRatio: CTA_TARGET_RATIO,
      durationMs: WINDOW_SCROLL_DURATION_MS - 120,
    });
    await emphasizeCta(featuredProblemCta);
    await sleep(240);

    await featuredProblemCta.click({ delay: CTA_CLICK_DELAY_MS });
    await page.waitForURL(new RegExp(`${scenario.demo.problemPath.replace(/\//g, "\\/")}$`));
    await page.getByRole("heading", { name: scenario.demo.problemHeading }).waitFor();

    await setCaption(page, scenario.demo.captions.problem, adjustedRecordCue);
    await sleep(scenario.demo.holds.problemMs);

    await page.getByRole("button", { name: scenario.demo.variantLabel }).click();
    await setCaption(page, scenario.demo.captions.variant, adjustedRecordCue);
    await sleep(scenario.demo.holds.variantMs);

    await setCaption(page, scenario.demo.captions.submit, adjustedRecordCue);
    await Promise.all([
      page.waitForResponse((response) => {
        return response.url().includes("/sessions/") && response.url().includes("/submit");
      }),
      page.getByRole("button", { name: "코드 제출" }).click(),
    ]);

    await page.getByRole("heading", { name: "일반 심화 질문" }).waitFor();
    await page.getByRole("heading", { name: "왜 이런 질문이 나왔는지" }).waitFor();
    await revealInterviewState(page, { focusAnswerComposer: true });
    await sleep(scenario.demo.holds.afterSubmitMs);

    const answerBox = page.getByPlaceholder(ANSWER_PLACEHOLDER);

    if (scenario.demo.captions.interviewIntro) {
      await setCaption(page, scenario.demo.captions.interviewIntro, adjustedRecordCue);
      await sleep(beforeFirstAnswerMs);
    }

    for (const [index, answer] of scenario.demo.answers.entries()) {
      await answerBox.waitFor();
      await revealInterviewState(page, { focusAnswerComposer: true });
      await answerBox.clear();
      await setCaption(
        page,
        turnCaptions[index] ?? scenario.demo.captions.interview ?? "",
        adjustedRecordCue,
      );
      await typeAnswerSlowly(page, answerBox, answer, scenario.demo.typingDelayMs);

      await Promise.all([
        page.waitForResponse((response) => {
          return response.url().includes("/sessions/") && response.url().includes("/turns");
        }),
        page.getByRole("button", { name: "답변 보내기" }).click(),
      ]);

      await revealInterviewState(page, { focusAnswerComposer: true });
      await sleep(index === scenario.demo.answers.length - 1 ? beforeReportMs : afterTurnMs);
    }

    await page.getByRole("heading", { name: "3축 피드백" }).waitFor({ timeout: 15_000 });
    await revealReportState(page);
    await setCaption(page, scenario.demo.captions.report, adjustedRecordCue);
    await sleep(scenario.demo.holds.reportMs);
    await setCaption(page, "");

    await page.close();
    await context.close();
    return {
      clipPath: await moveVideoFile(video, path.join(rawDir, "02-demo.webm")),
      cueEvents,
    };
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
    const demoClip = await recordDemoClip(
      browser,
      scenario.viewport,
      rawDir,
      scenario,
      `http://127.0.0.1:${HOME_PORT}`,
    );
    clipPaths.push(demoClip.clipPath);
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
      demoCueEvents: demoClip.cueEvents,
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
