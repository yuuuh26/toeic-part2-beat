import { QUESTIONS, QUESTION_MAP } from "./questions.js";
import { EXTRA_QUESTIONS } from "./questions-extra.js";
import { AFTER_HOURS_VELOCITY_BGM } from "./bgm-after-hours.js";

const APP_VERSION = "1.3.0";
const STORAGE_KEY = "toeic-part2-beat-enhancements-v1";
const DEFAULTS = Object.freeze({
  bgmEnabled: true,
  bgmVolume: 34,
  readingBgmPercent: 100,
  voiceMode: "rotate"
});
const VOICE_HINTS = ["en-US", "en-GB", "en-AU", "en-CA"];

const enhancementSettings = loadEnhancementSettings();
const existingIds = new Set(QUESTIONS.map((question) => question.id));
EXTRA_QUESTIONS.forEach((question, index) => {
  if (existingIds.has(question.id)) return;
  const enhancedQuestion = { ...question, voiceHint: VOICE_HINTS[index % VOICE_HINTS.length] };
  QUESTIONS.push(enhancedQuestion);
  QUESTION_MAP[enhancedQuestion.id] = enhancedQuestion;
  existingIds.add(enhancedQuestion.id);
});

const voiceHintByListeningText = new Map(
  QUESTIONS.map((question, index) => [
    listeningTextFor(question),
    question.voiceHint || VOICE_HINTS[index % VOICE_HINTS.length]
  ])
);

const bgm = new Audio(AFTER_HOURS_VELOCITY_BGM);
bgm.id = "game-bgm";
bgm.loop = true;
bgm.preload = "auto";
bgm.setAttribute("aria-hidden", "true");
document.body.appendChild(bgm);

let readingActive = false;
let voicePool = [];
let lastActiveView = "home-view";
let volumeAnimationFrame = 0;

function loadEnhancementSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return { ...DEFAULTS, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveEnhancementSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enhancementSettings));
  } catch (error) {
    console.debug("Enhancement settings could not be saved", error);
  }
}

function listeningTextFor(question) {
  return [
    question.questionText,
    ...question.choices.map((choice) => `${choice.key}. ${choice.text}`)
  ].join(" ");
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function currentBgmTargetVolume() {
  const base = clamp(enhancementSettings.bgmVolume, 0, 100) / 100;
  const readingRatio = readingActive
    ? clamp(enhancementSettings.readingBgmPercent, 0, 100) / 100
    : 1;
  return base * readingRatio;
}

function animateBgmVolume(target, duration = 160) {
  cancelAnimationFrame(volumeAnimationFrame);
  const startVolume = bgm.volume;
  const safeTarget = clamp(target, 0, 1);
  const startedAt = performance.now();
  const step = (now) => {
    const progress = duration <= 0 ? 1 : Math.min(1, (now - startedAt) / duration);
    bgm.volume = startVolume + (safeTarget - startVolume) * progress;
    if (progress < 1) volumeAnimationFrame = requestAnimationFrame(step);
  };
  volumeAnimationFrame = requestAnimationFrame(step);
}

function setReadingActive(active) {
  readingActive = Boolean(active);
  animateBgmVolume(currentBgmTargetVolume());
}

function activeViewId() {
  return document.querySelector(".view.active")?.id || "";
}

function isListeningSessionView(viewId = activeViewId()) {
  return viewId === "game-view" || viewId === "review-view";
}

function startBgm() {
  if (!enhancementSettings.bgmEnabled) return;
  animateBgmVolume(currentBgmTargetVolume(), 80);
  const playAttempt = bgm.play();
  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch((error) => console.debug("BGM playback is waiting for a user gesture", error));
  }
}

function pauseBgm() {
  bgm.pause();
}

function cancelNarration() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  setReadingActive(false);
}

function voiceQualityScore(voice) {
  const name = `${voice.name || ""}`.toLowerCase();
  const lang = `${voice.lang || ""}`.toLowerCase();
  let score = lang.startsWith("en") ? 30 : -100;
  if (voice.localService) score += 6;
  if (/google/.test(name)) score += 34;
  if (/microsoft/.test(name)) score += 30;
  if (/natural|premium|enhanced|neural/.test(name)) score += 32;
  if (/samantha|daniel|karen|moira|tessa|serena|ava|aria|guy|ryan|sonia|jenny|libby/.test(name)) score += 18;
  if (/compact|espeak|novelty/.test(name)) score -= 60;
  if (/en-us|en-gb|en-au|en-ca/.test(lang)) score += 8;
  return score;
}

function refreshVoicePool() {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices().filter((voice) => /^en/i.test(voice.lang || ""));
  voicePool = voices
    .map((voice) => ({ voice, score: voiceQualityScore(voice) }))
    .filter(({ score }) => score >= 20)
    .sort((left, right) => right.score - left.score)
    .map(({ voice }) => voice)
    .filter((voice, index, list) => list.findIndex((candidate) => candidate.name === voice.name && candidate.lang === voice.lang) === index)
    .slice(0, 8);
  updateVoiceAvailabilityText();
  return voicePool;
}

function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectHighQualityVoice(text) {
  const pool = voicePool.length ? voicePool : refreshVoicePool();
  if (!pool.length) return null;
  const hint = voiceHintByListeningText.get(text);
  const regional = hint
    ? pool.filter((voice) => `${voice.lang || ""}`.toLowerCase() === hint.toLowerCase())
    : [];
  const candidates = regional.length ? regional : pool;
  return candidates[stableHash(text) % candidates.length] || pool[0];
}

function installSpeechEnhancements() {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const synthesis = window.speechSynthesis;
  const originalSpeak = synthesis.speak.bind(synthesis);
  const originalCancel = synthesis.cancel.bind(synthesis);

  synthesis.speak = (utterance) => {
    if (enhancementSettings.voiceMode === "rotate" && utterance?.text) {
      const selectedVoice = selectHighQualityVoice(utterance.text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || utterance.lang;
      }
    }

    setReadingActive(true);
    const previousEnd = utterance.onend;
    const previousError = utterance.onerror;
    utterance.onend = (event) => {
      setReadingActive(false);
      if (typeof previousEnd === "function") previousEnd.call(utterance, event);
    };
    utterance.onerror = (event) => {
      setReadingActive(false);
      if (typeof previousError === "function") previousError.call(utterance, event);
    };
    return originalSpeak(utterance);
  };

  synthesis.cancel = () => {
    setReadingActive(false);
    return originalCancel();
  };

  refreshVoicePool();
  synthesis.addEventListener?.("voiceschanged", refreshVoicePool);
  window.addEventListener("voiceschanged", refreshVoicePool);
}

function settingRow(innerHtml, className = "") {
  const wrapper = document.createElement("label");
  wrapper.className = `enhancement-setting ${className}`.trim();
  wrapper.innerHTML = innerHtml;
  return wrapper;
}

function injectEnhancementStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .enhancement-setting input[type="range"] { width: 132px; accent-color: var(--cyan); }
    .enhancement-range-control { display: grid; grid-template-columns: minmax(92px, 1fr) 42px; gap: 8px; align-items: center; }
    .enhancement-range-control output { color: var(--cyan); font-size: 11px; font-weight: 900; text-align: right; }
    .enhancement-setting select { max-width: 176px; }
    .enhancement-setting small.voice-count { color: var(--cyan-soft); }
  `;
  document.head.appendChild(style);
}

function injectSettingsControls() {
  const list = document.querySelector("#settings-view .settings-list");
  if (!list || document.querySelector("#setting-bgm")) return;
  const insertionPoint = document.querySelector("#setting-effects")?.closest("label")?.nextSibling || list.firstChild;

  const bgmToggle = settingRow(`
    <span><strong>BGM</strong><small>問題モード中に再生</small></span>
    <input id="setting-bgm" type="checkbox">
  `);
  const bgmVolume = settingRow(`
    <span><strong>BGM音量</strong><small>通常時の音量</small></span>
    <span class="enhancement-range-control"><input id="setting-bgm-volume" type="range" min="0" max="100" step="1"><output id="setting-bgm-volume-value"></output></span>
  `);
  const readingVolume = settingRow(`
    <span><strong>読み上げ中のBGM</strong><small>通常音量に対する割合・初期値100%</small></span>
    <span class="enhancement-range-control"><input id="setting-reading-bgm" type="range" min="0" max="100" step="5"><output id="setting-reading-bgm-value"></output></span>
  `);
  const voiceMode = settingRow(`
    <span><strong>問題音声のバリエーション</strong><small id="voice-availability" class="voice-count">音声を確認中...</small></span>
    <select id="setting-voice-mode">
      <option value="rotate">高品質音声を自動切替</option>
      <option value="fixed">現在の音声に固定</option>
    </select>
  `, "select-row");

  [voiceMode, readingVolume, bgmVolume, bgmToggle].forEach((row) => list.insertBefore(row, insertionPoint));

  const bgmToggleInput = document.querySelector("#setting-bgm");
  const bgmVolumeInput = document.querySelector("#setting-bgm-volume");
  const readingVolumeInput = document.querySelector("#setting-reading-bgm");
  const voiceModeInput = document.querySelector("#setting-voice-mode");

  bgmToggleInput.checked = enhancementSettings.bgmEnabled;
  bgmVolumeInput.value = String(enhancementSettings.bgmVolume);
  readingVolumeInput.value = String(enhancementSettings.readingBgmPercent);
  voiceModeInput.value = enhancementSettings.voiceMode;
  updateSettingsOutputs();

  bgmToggleInput.addEventListener("change", () => {
    enhancementSettings.bgmEnabled = bgmToggleInput.checked;
    saveEnhancementSettings();
    if (enhancementSettings.bgmEnabled && isListeningSessionView()) startBgm();
    else pauseBgm();
  });
  bgmVolumeInput.addEventListener("input", () => {
    enhancementSettings.bgmVolume = clamp(bgmVolumeInput.value, 0, 100);
    saveEnhancementSettings();
    updateSettingsOutputs();
    animateBgmVolume(currentBgmTargetVolume(), 60);
  });
  readingVolumeInput.addEventListener("input", () => {
    enhancementSettings.readingBgmPercent = clamp(readingVolumeInput.value, 0, 100);
    saveEnhancementSettings();
    updateSettingsOutputs();
    animateBgmVolume(currentBgmTargetVolume(), 60);
  });
  voiceModeInput.addEventListener("change", () => {
    enhancementSettings.voiceMode = voiceModeInput.value;
    saveEnhancementSettings();
    updateVoiceAvailabilityText();
  });
}

function updateSettingsOutputs() {
  const bgmOutput = document.querySelector("#setting-bgm-volume-value");
  const readingOutput = document.querySelector("#setting-reading-bgm-value");
  if (bgmOutput) bgmOutput.value = `${Math.round(enhancementSettings.bgmVolume)}%`;
  if (readingOutput) readingOutput.value = `${Math.round(enhancementSettings.readingBgmPercent)}%`;
}

function updateVoiceAvailabilityText() {
  const label = document.querySelector("#voice-availability");
  if (!label) return;
  if (enhancementSettings.voiceMode === "fixed") {
    label.textContent = "端末の現在の音声を使用";
    return;
  }
  label.textContent = voicePool.length >= 2
    ? `利用可能な高品質英語音声：${voicePool.length}種類`
    : "別音声がない場合は現在の音声を維持";
}

function synchronizeDisplayedMetadata() {
  const version = document.querySelector("#version-label");
  const count = document.querySelector("#settings-view .about-card small");
  if (version) version.textContent = `v${APP_VERSION}`;
  if (count) count.textContent = `${QUESTIONS.length} original questions · Local-first PWA`;
}

function handleViewChange() {
  const viewId = activeViewId();
  if (!viewId || viewId === lastActiveView) {
    synchronizeDisplayedMetadata();
    return;
  }
  lastActiveView = viewId;

  if (isListeningSessionView(viewId)) {
    startBgm();
  } else {
    pauseBgm();
  }

  if (viewId === "home-view" || viewId === "settings-view" || viewId === "stats-view" || viewId === "weak-view") {
    cancelNarration();
  }
  synchronizeDisplayedMetadata();
}

function installNavigationGuards() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("#back-button, [data-action='quick'], [data-filter], #replay-question");
    if (!target) return;
    if (target.id === "back-button") {
      cancelNarration();
      pauseBgm();
      return;
    }
    if (target.matches("[data-action='quick'], [data-filter], #replay-question")) startBgm();
  }, true);

  const observer = new MutationObserver(handleViewChange);
  document.querySelectorAll(".view").forEach((view) => observer.observe(view, { attributes: true, attributeFilter: ["class"] }));

  window.addEventListener("pagehide", () => {
    cancelNarration();
    pauseBgm();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelNarration();
      pauseBgm();
    }
  });
}

injectEnhancementStyles();
injectSettingsControls();
installSpeechEnhancements();
installNavigationGuards();
synchronizeDisplayedMetadata();
animateBgmVolume(currentBgmTargetVolume(), 0);
