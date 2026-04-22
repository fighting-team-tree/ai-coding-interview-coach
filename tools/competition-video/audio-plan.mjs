const DEFAULT_AUDIO_CONFIG = {
  tts: {
    enabled: true,
    engine: "melotts",
    language: "KR",
    speaker: "KR",
    speed: 1.0,
    device: "cpu",
    pythonVersion: "3.10",
    offsetMs: 320,
    minGapMs: 260,
    sectionTailMs: 180,
  },
  bgm: {
    enabled: true,
    assetPath: "",
    volume: 0.16,
    fadeInMs: 1400,
    fadeOutMs: 2000,
    duckingThreshold: 0.018,
    duckingRatio: 10,
    attackMs: 180,
    releaseMs: 640,
  },
};

function mergeSection(defaults, overrides) {
  return {
    ...defaults,
    ...(overrides ?? {}),
  };
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getCueCaptionText(cue) {
  if (cue && typeof cue === "object") {
    return normalizeText(cue.caption ?? cue.text);
  }

  return normalizeText(cue);
}

function getCueNarrationText(cue) {
  if (cue && typeof cue === "object") {
    if (cue.ttsText !== undefined && cue.ttsText !== null) {
      return normalizeText(cue.ttsText);
    }

    return getCueCaptionText(cue);
  }

  return normalizeText(cue);
}

export function getScenarioAudioConfig(scenario) {
  return {
    tts: mergeSection(DEFAULT_AUDIO_CONFIG.tts, scenario.audio?.tts),
    bgm: mergeSection(DEFAULT_AUDIO_CONFIG.bgm, scenario.audio?.bgm),
  };
}

export function buildTitleNarration(card) {
  const explicitTtsText = normalizeText(card?.ttsText);
  if (explicitTtsText) {
    return explicitTtsText;
  }

  const parts = [card?.title, card?.subtitle, ...(card?.details ?? [])]
    .map(normalizeText)
    .filter(Boolean);
  return parts.join(" ");
}

export function buildAudioCueSheet({ scenario, metadata, clipDurationsMs }) {
  const audio = getScenarioAudioConfig(scenario);
  const [introDurationMs = 0, demoDurationMs = 0, outroDurationMs = 0] = clipDurationsMs;
  const totalDurationMs = introDurationMs + demoDurationMs + outroDurationMs;
  const cues = [];
  const offsetMs = audio.tts.offsetMs ?? 0;

  const introText = buildTitleNarration(scenario.intro);
  if (audio.tts.enabled && introText) {
    cues.push({
      id: "intro",
      startMs: Math.max(0, offsetMs),
      plannedStartMs: Math.max(0, offsetMs),
      text: introText,
      section: "intro",
    });
  }

  const demoCueEvents = metadata.demoCueEvents ?? [];
  for (const [index, event] of demoCueEvents.entries()) {
    const text = getCueNarrationText(event);
    if (!text) {
      continue;
    }

    const startMs = Math.max(0, introDurationMs + Number(event.startMs ?? 0) + offsetMs);
    cues.push({
      id: `demo-${index + 1}`,
      startMs,
      plannedStartMs: startMs,
      text,
      section: "demo",
    });
  }

  const outroText = buildTitleNarration(scenario.outro);
  if (audio.tts.enabled && outroText) {
    const startMs = Math.max(0, introDurationMs + demoDurationMs + offsetMs);
    cues.push({
      id: "outro",
      startMs,
      plannedStartMs: startMs,
      text: outroText,
      section: "outro",
    });
  }

  return {
    audio,
    cues,
    clipDurationsMs: {
      intro: introDurationMs,
      demo: demoDurationMs,
      outro: outroDurationMs,
      total: totalDurationMs,
    },
  };
}

export function scheduleNarrationCues({
  cues,
  cueDurationsMs,
  clipDurationsMs,
  minGapMs = DEFAULT_AUDIO_CONFIG.tts.minGapMs,
  sectionTailMs = DEFAULT_AUDIO_CONFIG.tts.sectionTailMs,
}) {
  const sectionEnds = {
    intro: clipDurationsMs.intro,
    demo: clipDurationsMs.intro + clipDurationsMs.demo,
    outro: clipDurationsMs.total,
  };
  const scheduled = [];
  let previousEndMs = 0;

  for (const [index, cue] of cues.entries()) {
    const durationMs = Math.max(0, Math.round(Number(cueDurationsMs[cue.id] ?? 0)));
    const sectionEndMs = sectionEnds[cue.section] ?? clipDurationsMs.total;
    const latestEndMs = sectionEndMs - sectionTailMs;
    const earliestStartMs = Math.max(cue.startMs, previousEndMs ? previousEndMs + minGapMs : 0);

    if (durationMs > 0 && earliestStartMs + durationMs > latestEndMs) {
      scheduled.push({
        ...cue,
        plannedStartMs: cue.plannedStartMs ?? cue.startMs,
        durationMs,
        skipped: true,
        skipReason: "overlap",
      });
      continue;
    }

    const startMs = earliestStartMs;
    const endMs = startMs + durationMs;
    previousEndMs = endMs;
    scheduled.push({
      ...cue,
      plannedStartMs: cue.plannedStartMs ?? cue.startMs,
      startMs,
      durationMs,
      endMs,
      skipped: false,
    });
  }

  return scheduled;
}
