import { QUESTIONS, QUESTION_MAP } from "./questions.js";
import { EXTRA_QUESTIONS } from "./questions-extra.js";
import { BGM_TRACKS } from "./bgm-tracks.js";

const APP_VERSION = "1.4.0";
const STORAGE_KEY = "toeic-part2-beat-enhancements-v2";
const LEGACY_STORAGE_KEY = "toeic-part2-beat-enhancements-v1";
const DEFAULTS = Object.freeze({
  bgmEnabled: true,
  bgmVolume: 34,
  readingBgmPercent: 100,
  bgmTrackId: "after-hours-velocity",
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

const bgm = new Audio();
bgm.id = "game-bgm";
bgm.loop = true;
bgm.preload = "auto";
bgm.playsInline = true;
bgm.setAttribute("aria-hidden", "true");
document.body.appendChild(bgm);

let readingActive = false;
let voicePool = [];
let bgmUnlocked = false;
let previewingBgm = false;

function loadEnhancementSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    return { ...DEFAULTS, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch (error) {
    console.warn("Enhancement settings could not be loaded", error);
    return { ...DEFAULTS };
  }
}

function saveEnhancementSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enhancementSettings));
  } catch (error) {
    console.warn("Enhancement settings could not be saved", error);
  }
}

function listeningTextFor(question) {
  if (!question) return "";
  return [question.questionText, ...question.choices.map((choice) => `${choice.key}. ${choice.text}`)].join(" ");
}

function selectedTrack() {
  return BGM_TRACKS.find((track) => track.id === enhancementSettings.bgmTrackId) || BGM_TRACKS[0];
}

function applySelectedTrack({ reset = false } = {}) {
  const track = selectedTrack();
  if (!track) return;
  if (bgm.dataset.trackId !== track.id) {
    bgm.pause();
    bgm.src = track.src;
    bgm.dataset.trackId = track.id;
    bgm.load();
    reset = true;
  }
  if (reset) {
    try { bgm.currentTime = 0; } catch (error) { console.debug("BGM seek unavailable", error); }
  }
  updateBgmStatus();
}

function currentBgmTargetVolume() {
  const base = Math.max(0, Math.min(100, Number(enhancementSettings.bgmVolume) || 0)) / 100;
  const readingRatio = readingActive
    ? Math.max(0, Math.min(100, Number(enhancementSettings.readingBgmPercent) || 0)) / 100
    : 1;
  return Math.max(0, Math.min(1, base * readingRatio));
}

function syncBgmVolume() {
  bgm.volume = currentBgmTargetVolume();
}

function isListeningViewActive() {
  return Boolean(document.querySelector("#game-view.active, #review-view.active"));
}

function startBgm({ force = false, restart = false } = {}) {
  if (!enhancementSettings.bgmEnabled) return;
  if (!force && !isListeningViewActive()) return;
  applySelectedTrack({ reset: restart });
  syncBgmVolume();
  const playAttempt = bgm.play();
  if (playAttempt?.then) {
    playAttempt
      .then(() => {
        bgmUnlocked = true;
        updateBgmStatus("再生中");
        updatePreviewButton();
      })
      .catch((error) => {
        updateBgmStatus("再生できませんでした。もう一度プレイを押してください");
        console.debug("BGM play was blocked", error);
      });
  }
}

function pauseBgm({ reset = false } = {}) {
  bgm.pause();
  previewingBgm = false;
  if (reset) {
    try { bgm.currentTime = 0; } catch (error) { console.debug("BGM reset unavailable", error); }
  }
  updateBgmStatus();
  updatePreviewButton();
}

function setReadingActive(active) {
  readingActive = Boolean(active);
  syncBgmVolume();
}

function updateBgmStatus(message = "") {
  const status = document.querySelector("#bgm-status");
  if (!status) return;
  const track = selectedTrack();
  if (message) {
    status.textContent = message;
  } else if (!enhancementSettings.bgmEnabled) {
    status.textContent = "オフ";
  } else if (!bgm.paused) {
    status.textContent = `${track?.title || "BGM"} を再生中`;
  } else {
    status.textContent = `${track?.title || "BGM"} · プレイ開始時に再生`;
  }
}

function updatePreviewButton() {
  const button = document.querySelector("#preview-bgm");
  if (button) button.textContent = !bgm.paused && previewingBgm ? "■ 停止" : "▶ 試聴";
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
  const regional = hint ? pool.filter((voice) => `${voice.lang || ""}`.toLowerCase() === hint.toLowerCase()) : [];
  const candidates = regional.length ? regional : pool;
  return candidates[stableHash(text) % candidates.length] || pool[0];
}

function installSpeechEnhancements() {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const synthesis = window.speechSynthesis;
  const originalSpeak = synthesis.speak.bind(synthesis);
  const originalCancel = synthesis.cancel.bind(synthesis);

  try {
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
  } catch (error) {
    console.warn("Speech enhancement could not patch the browser voice engine", error);
  }

  refreshVoicePool();
  synthesis.addEventListener?.("voiceschanged", refreshVoicePool);
}

function injectEnhancementStyles() {
  if (document.querySelector("#enhancement-styles")) return;
  const style = document.createElement("style");
  style.id = "enhancement-styles";
  style.textContent = `
    .enhancement-range { width: 132px; accent-color: var(--cyan); }
    .bgm-track-actions { display: flex; align-items: center; gap: 8px; }
    .bgm-track-actions select { min-width: 150px; max-width: 180px; }
    .bgm-track-actions button { min-width: 70px; min-height: 38px; border: 1px solid var(--cyan); border-radius: 12px; background: rgba(0,246,255,.1); color: var(--cyan); font-weight: 900; cursor: pointer; }
    .enhancement-value { color: var(--cyan); font-weight: 900; }
  `;
  document.head.appendChild(style);
}

function injectSettings() {
  const list = document.querySelector(".settings-list");
  if (!list || document.querySelector("#setting-bgm-enabled")) {
    syncSettingsUi();
    return;
  }

  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <label><span><strong>BGM</strong><small id="bgm-status">プレイ開始時に再生</small></span><input id="setting-bgm-enabled" type="checkbox"></label>
    <div class="setting-info"><span><strong>BGM選択</strong><small>気分に合わせて変更</small></span><div class="bgm-track-actions"><select id="setting-bgm-track">${BGM_TRACKS.map((track) => `<option value="${track.id}">${track.title}</option>`).join("")}</select><button id="preview-bgm" type="button">▶ 試聴</button></div></div>
    <label><span><strong>BGM音量</strong><small><b id="bgm-volume-value" class="enhancement-value"></b></small></span><input id="setting-bgm-volume" class="enhancement-range" type="range" min="0" max="100" step="1"></label>
    <label><span><strong>問題読み上げ中のBGM</strong><small>通常音量に対する割合 · 初期値100%</small></span><span><b id="reading-bgm-value" class="enhancement-value"></b><input id="setting-reading-bgm" class="enhancement-range" type="range" min="0" max="100" step="10"></span></label>
    <label class="select-row"><span><strong>問題音声の声</strong><small id="voice-availability">高品質音声を確認中...</small></span><select id="setting-voice-mode"><option value="rotate">高品質音声を自動切替</option><option value="fixed">現在の音声に固定</option></select></label>
  `;
  while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
  list.prepend(fragment);

  document.querySelector("#setting-bgm-enabled").addEventListener("change", (event) => {
    enhancementSettings.bgmEnabled = event.target.checked;
    saveEnhancementSettings();
    if (event.target.checked) startBgm({ force: isListeningViewActive() });
    else pauseBgm({ reset: true });
    updateBgmStatus();
  });

  document.querySelector("#setting-bgm-track").addEventListener("change", (event) => {
    enhancementSettings.bgmTrackId = event.target.value;
    saveEnhancementSettings();
    applySelectedTrack({ reset: true });
    if (isListeningViewActive() || previewingBgm) startBgm({ force: true, restart: true });
    updateBgmStatus();
  });

  document.querySelector("#preview-bgm").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    bgmUnlocked = true;
    if (!bgm.paused && previewingBgm) {
      pauseBgm({ reset: true });
      return;
    }
    previewingBgm = true;
    startBgm({ force: true, restart: true });
    updatePreviewButton();
  });

  document.querySelector("#setting-bgm-volume").addEventListener("input", (event) => {
    enhancementSettings.bgmVolume = Number(event.target.value);
    saveEnhancementSettings();
    syncBgmVolume();
    document.querySelector("#bgm-volume-value").textContent = `${enhancementSettings.bgmVolume}%`;
  });

  document.querySelector("#setting-reading-bgm").addEventListener("input", (event) => {
    enhancementSettings.readingBgmPercent = Number(event.target.value);
    saveEnhancementSettings();
    syncBgmVolume();
    document.querySelector("#reading-bgm-value").textContent = `${enhancementSettings.readingBgmPercent}%`;
  });

  document.querySelector("#setting-voice-mode").addEventListener("change", (event) => {
    enhancementSettings.voiceMode = event.target.value;
    saveEnhancementSettings();
  });

  syncSettingsUi();
}

function syncSettingsUi() {
  const enabled = document.querySelector("#setting-bgm-enabled");
  const track = document.querySelector("#setting-bgm-track");
  const volume = document.querySelector("#setting-bgm-volume");
  const reading = document.querySelector("#setting-reading-bgm");
  const voiceMode = document.querySelector("#setting-voice-mode");
  if (enabled) enabled.checked = enhancementSettings.bgmEnabled;
  if (track) track.value = selectedTrack()?.id || BGM_TRACKS[0]?.id || "";
  if (volume) volume.value = String(enhancementSettings.bgmVolume);
  if (reading) reading.value = String(enhancementSettings.readingBgmPercent);
  if (voiceMode) voiceMode.value = enhancementSettings.voiceMode;
  const volumeValue = document.querySelector("#bgm-volume-value");
  const readingValue = document.querySelector("#reading-bgm-value");
  if (volumeValue) volumeValue.textContent = `${enhancementSettings.bgmVolume}%`;
  if (readingValue) readingValue.textContent = `${enhancementSettings.readingBgmPercent}%`;
  updateBgmStatus();
  updatePreviewButton();
  updateVoiceAvailabilityText();
}

function updateVoiceAvailabilityText() {
  const label = document.querySelector("#voice-availability");
  if (label) label.textContent = voicePool.length ? `${voicePool.length}種類の英語音声を利用可能` : "端末標準の英語音声を使用";
}

function updateAppMetadata() {
  const version = document.querySelector("#version-label");
  if (version) version.textContent = `v${APP_VERSION}`;
  const about = document.querySelector(".about-card small");
  if (about) about.textContent = `${QUESTIONS.length} original questions · 4 selectable BGM tracks · Local-first PWA`;
}

function handleDirectGesture(event) {
  const target = event.target.closest?.("#back-button, [data-action], [data-filter], #replay-question, #next-question");
  if (!target) return;

  if (target.id === "back-button") {
    cancelNarration();
    pauseBgm();
    return;
  }

  const action = target.dataset.action;
  const startsListening = action === "quick" || target.hasAttribute("data-filter") || target.id === "replay-question" || target.id === "next-question";
  if (startsListening) {
    bgmUnlocked = true;
    previewingBgm = false;
    startBgm({ force: true });
    return;
  }

  if (action) {
    cancelNarration();
    pauseBgm();
  }
}

document.addEventListener("pointerdown", handleDirectGesture, true);
document.addEventListener("click", (event) => {
  if (window.PointerEvent) return;
  handleDirectGesture(event);
}, true);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelNarration();
    pauseBgm();
  }
});
window.addEventListener("pagehide", () => {
  cancelNarration();
  pauseBgm();
});

bgm.addEventListener("play", () => {
  updateBgmStatus("再生中");
  updatePreviewButton();
});
bgm.addEventListener("pause", () => {
  updateBgmStatus();
  updatePreviewButton();
});
bgm.addEventListener("error", () => {
  updateBgmStatus("音源を読み込めませんでした");
});

const viewObserver = new MutationObserver(() => {
  updateAppMetadata();
  injectSettings();
  if (isListeningViewActive()) {
    if (bgmUnlocked) startBgm();
  } else if (!document.querySelector("#settings-view.active") || !previewingBgm) {
    pauseBgm();
  }
});
viewObserver.observe(document.querySelector("#app") || document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

injectEnhancementStyles();
installSpeechEnhancements();
applySelectedTrack();
injectSettings();
updateAppMetadata();
