import { QUESTIONS, QUESTION_MAP } from "./questions.js";
import { EXTRA_QUESTIONS } from "./questions-extra.js";
import { BGM_TRACKS } from "./bgm-tracks.js";

const APP_VERSION = "1.8.0";
const STORAGE_KEY = "toeic-part2-beat-enhancements-v3";
const LEGACY_STORAGE_KEYS = ["toeic-part2-beat-enhancements-v2", "toeic-part2-beat-enhancements-v1"];
const AUDIO_DB_NAME = "toeic-part2-beat-full-bgm";
const AUDIO_STORE_NAME = "tracks";
const BGM_LEAD_IN_MS = 1500;
const BGM_FADE_MS = 900;
const DEFAULTS = Object.freeze({
  bgmEnabled: true,
  bgmVolume: 34,
  readingBgmPercent: 100,
  bgmTrackId: "after-hours-velocity",
  voiceMode: "rotate",
  voiceCountries: ["en-US", "en-GB", "en-AU", "en-CA"]
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
bgm.loop = false;
bgm.preload = "auto";
bgm.playsInline = true;
bgm.setAttribute("aria-hidden", "true");
document.body.appendChild(bgm);

let readingActive = false;
let readingReleaseTimer = 0;
let voicePool = [];
let lastVoiceKey = "";
let lastVoiceLang = "";
let currentListeningLocale = "";
let bgmUnlocked = false;
let previewingBgm = false;
let bgmSessionActive = false;
let bgmLeadInTimer = 0;
let bgmFadeFrame = 0;
let bgmFading = false;
const fullTrackSources = new Map();

function loadEnhancementSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean)
      || "null";
    const saved = JSON.parse(raw);
    return { ...DEFAULTS, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch (error) {
    console.warn("Enhancement settings could not be loaded", error);
    return { ...DEFAULTS };
  }
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) db.createObjectStore(AUDIO_STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadRegisteredFullTracks() {
  if (!("indexedDB" in window)) return;
  try {
    const db = await openAudioDb();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE_NAME, "readonly");
      const request = tx.objectStore(AUDIO_STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    for (const record of records) {
      if (!record?.id || !record?.blob) continue;
      const previous = fullTrackSources.get(record.id);
      if (previous?.startsWith?.("blob:")) URL.revokeObjectURL(previous);
      fullTrackSources.set(record.id, URL.createObjectURL(record.blob));
    }
    db.close();
    applySelectedTrack();
    updateFullBgmStatus();
  } catch (error) {
    console.warn("Full BGM could not be restored", error);
  }
}

function matchTrackId(filename) {
  const normalized = String(filename || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return BGM_TRACKS.find((track) => track.id.split("-").every((token) => normalized.includes(token)))?.id || null;
}

async function registerFullTracks(files) {
  if (!files?.length || !("indexedDB" in window)) return;
  const matched = Array.from(files)
    .map((file) => ({ file, id: matchTrackId(file.name) }))
    .filter((item) => item.id);
  if (!matched.length) {
    updateBgmStatus("対応するBGM名を確認できませんでした");
    return;
  }
  try {
    const db = await openAudioDb();
    for (const { file, id } of matched) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(AUDIO_STORE_NAME, "readwrite");
        tx.objectStore(AUDIO_STORE_NAME).put({ id, blob: file, filename: file.name, savedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      const previous = fullTrackSources.get(id);
      if (previous?.startsWith?.("blob:")) URL.revokeObjectURL(previous);
      fullTrackSources.set(id, URL.createObjectURL(file));
    }
    db.close();
    applySelectedTrack({ reset: true });
    updateFullBgmStatus();
    const status = document.querySelector("#full-bgm-status");
    if (status) status.textContent = matched.length === 4 ? "4/4曲 全尺登録済み" : `${matched.length}曲を登録しました · 合計${fullTrackCount()}/4曲`;
  } catch (error) {
    console.warn("Full BGM registration failed", error);
    updateBgmStatus("全尺BGMの保存に失敗しました");
  }
}

function fullTrackCount() {
  return BGM_TRACKS.filter((track) => fullTrackSources.has(track.id) || track.fullSrc).length;
}

function updateFullBgmStatus() {
  const status = document.querySelector("#full-bgm-status");
  if (!status) return;
  const count = fullTrackCount();
  status.textContent = count >= BGM_TRACKS.length
    ? "4/4曲 全尺登録済み"
    : `${count}/4曲 全尺利用可能 · 元MP3は一度だけ登録`;
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
  const fullSource = fullTrackSources.get(track.id) || track.fullSrc || "";
  const source = fullSource || track.src;
  const sourceKey = fullSource ? `full:${track.id}` : `fallback:${track.id}`;
  if (bgm.dataset.sourceKey !== sourceKey) {
    bgm.pause();
    bgm.src = source;
    bgm.dataset.trackId = track.id;
    bgm.dataset.sourceKey = sourceKey;
    bgm.dataset.fullTrack = fullSource ? "true" : "false";
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

function clearBgmTransitions() {
  if (bgmLeadInTimer) window.clearTimeout(bgmLeadInTimer);
  bgmLeadInTimer = 0;
  if (bgmFadeFrame) cancelAnimationFrame(bgmFadeFrame);
  bgmFadeFrame = 0;
  bgmFading = false;
}

function fadeBgmToTarget(duration = BGM_FADE_MS) {
  clearBgmTransitions();
  bgmFading = true;
  const startedAt = performance.now();
  const from = bgm.volume;
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const target = currentBgmTargetVolume();
    bgm.volume = Math.max(0, Math.min(1, from + (target - from) * eased));
    if (progress < 1 && !bgm.paused) bgmFadeFrame = requestAnimationFrame(step);
    else {
      bgmFadeFrame = 0;
      bgmFading = false;
      if (!bgm.paused) bgm.volume = currentBgmTargetVolume();
    }
  };
  bgmFadeFrame = requestAnimationFrame(step);
}

function syncBgmVolume() {
  if (bgmLeadInTimer || bgmFading) return;
  bgm.volume = currentBgmTargetVolume();
}

function isListeningViewActive() {
  return Boolean(document.querySelector("#game-view.active, #review-view.active"));
}

function startBgm({ force = false, restart = false, skipLeadIn = false } = {}) {
  if (!enhancementSettings.bgmEnabled) return;
  if (!force && !isListeningViewActive()) return;
  applySelectedTrack({ reset: restart });

  const firstStart = !bgmSessionActive || restart;
  if (firstStart && !skipLeadIn) {
    clearBgmTransitions();
    bgm.volume = 0;
  } else {
    syncBgmVolume();
  }

  const playAttempt = bgm.play();
  if (playAttempt?.then) {
    playAttempt
      .then(() => {
        bgmUnlocked = true;
        bgmSessionActive = true;
        if (firstStart && !skipLeadIn) {
          bgmLeadInTimer = window.setTimeout(() => {
            bgmLeadInTimer = 0;
            fadeBgmToTarget();
          }, BGM_LEAD_IN_MS);
          updateBgmStatus("1.5秒後にBGM開始");
        } else {
          syncBgmVolume();
          updateBgmStatus("再生中");
        }
        updatePreviewButton();
      })
      .catch((error) => {
        updateBgmStatus("再生できませんでした。もう一度プレイを押してください");
        console.debug("BGM play was blocked", error);
      });
  }
}

function pauseBgm({ reset = false, endSession = true } = {}) {
  clearBgmTransitions();
  bgm.pause();
  previewingBgm = false;
  if (endSession) bgmSessionActive = false;
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
    const mode = bgm.dataset.fullTrack === "true" ? "全尺" : "短縮フォールバック";
    status.textContent = `${track?.title || "BGM"} · ${mode}を再生中`;
  } else {
    const mode = bgm.dataset.fullTrack === "true" ? "全尺" : "全尺未登録";
    status.textContent = `${track?.title || "BGM"} · ${mode}`;
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
  const ranked = voices
    .map((voice) => ({ voice, score: voiceQualityScore(voice) }))
    .filter(({ score }) => score >= 20)
    .sort((left, right) => right.score - left.score)
    .map(({ voice }) => voice)
    .filter((voice, index, list) => list.findIndex((candidate) => candidate.name === voice.name && candidate.lang === voice.lang) === index);

  const preferredLocales = ["en-US", "en-GB", "en-AU", "en-CA", "en-IE", "en-NZ", "en-IN", "en-ZA"];
  const regionalBest = preferredLocales
    .map((locale) => ranked.find((voice) => String(voice.lang || "").toLowerCase() === locale.toLowerCase()))
    .filter(Boolean);
  const selectedKeys = new Set(regionalBest.map((voice) => `${voice.name}|${voice.lang}`));
  const remaining = ranked.filter((voice) => !selectedKeys.has(`${voice.name}|${voice.lang}`));
  voicePool = [...regionalBest, ...remaining].slice(0, 12);
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

const VOICE_REGION_META = Object.freeze({
  "en-us": { flag: "🇺🇸", country: "アメリカ" },
  "en-gb": { flag: "🇬🇧", country: "イギリス" },
  "en-au": { flag: "🇦🇺", country: "オーストラリア" },
  "en-ca": { flag: "🇨🇦", country: "カナダ" },
  "en-ie": { flag: "🇮🇪", country: "アイルランド" },
  "en-nz": { flag: "🇳🇿", country: "ニュージーランド" },
  "en-in": { flag: "🇮🇳", country: "インド" },
  "en-za": { flag: "🇿🇦", country: "南アフリカ" }
});

const SELECTABLE_VOICE_COUNTRIES = Object.freeze([
  { locale: "en-US", flag: "🇺🇸", country: "アメリカ" },
  { locale: "en-GB", flag: "🇬🇧", country: "イギリス" },
  { locale: "en-AU", flag: "🇦🇺", country: "オーストラリア" },
  { locale: "en-CA", flag: "🇨🇦", country: "カナダ" }
]);

function normalizedVoiceLang(lang = "") {
  return String(lang || "").replace("_", "-").toLowerCase();
}

function voiceRegionMeta(lang = "") {
  const normalized = normalizedVoiceLang(lang);
  return {
    ...(VOICE_REGION_META[normalized] || { flag: "🌐", country: "英語" }),
    locale: lang || "en"
  };
}

function updateVoiceBadges(voice, fallbackLang = "") {
  const lang = voice?.lang || fallbackLang || "en";
  const meta = voiceRegionMeta(lang);
  const text = `${meta.flag} ${meta.country} · ${meta.locale}`;
  ["#listening-voice-badge", "#speaking-voice-badge"].forEach((selector) => {
    const badge = document.querySelector(selector);
    if (!badge) return;
    badge.textContent = text;
    if (voice?.name) badge.title = voice.name;
  });
}

function enabledVoiceCountries() {
  const saved = Array.isArray(enhancementSettings.voiceCountries)
    ? enhancementSettings.voiceCountries
    : [];
  const allowed = new Set(SELECTABLE_VOICE_COUNTRIES.map((item) => item.locale));
  const valid = saved.filter((locale) => allowed.has(locale));
  return valid.length ? valid : SELECTABLE_VOICE_COUNTRIES.map((item) => item.locale);
}

function randomEnabledVoiceCountry() {
  const enabled = enabledVoiceCountries();
  return enabled[Math.floor(Math.random() * enabled.length)] || enabled[0] || "en-US";
}

function bestVoiceForLocale(locale) {
  const pool = voicePool.length ? voicePool : refreshVoicePool();
  const normalizedTarget = normalizedVoiceLang(locale);
  const preferred = pool.filter((voice) => normalizedVoiceLang(voice.lang) === normalizedTarget);
  const allRegional = (window.speechSynthesis?.getVoices?.() || [])
    .filter((voice) => normalizedVoiceLang(voice.lang) === normalizedTarget);
  const candidates = preferred.length ? preferred : allRegional;
  if (!candidates.length) return null;
  const fresh = candidates.filter((voice) => `${voice.name}|${voice.lang}` !== lastVoiceKey);
  const options = fresh.length ? fresh : candidates;
  const voice = options[Math.floor(Math.random() * options.length)] || candidates[0] || null;
  if (voice) {
    lastVoiceKey = `${voice.name}|${voice.lang}`;
    lastVoiceLang = normalizedVoiceLang(voice.lang);
  }
  return voice;
}

function selectHighQualityVoice(locale = "") {
  const desiredLocale = locale || randomEnabledVoiceCountry();
  return bestVoiceForLocale(desiredLocale);
}

function updateQuestionCountryControl() {
  const select = document.querySelector("#question-voice-country");
  if (!select) return;
  const locale = currentListeningLocale || randomEnabledVoiceCountry();
  select.value = locale;
}

function chooseLocaleForNewQuestion() {
  currentListeningLocale = randomEnabledVoiceCountry();
  updateQuestionCountryControl();
}

function installQuestionCountryControl() {
  const select = document.querySelector("#question-voice-country");
  if (!select || select.dataset.bound === "true") return;
  select.dataset.bound = "true";
  select.addEventListener("change", () => {
    currentListeningLocale = select.value || randomEnabledVoiceCountry();
    const replay = document.querySelector("#replay-question");
    if (replay && document.querySelector("#game-view.active")) replay.click();
  });
  document.addEventListener("toeic-question-changed", chooseLocaleForNewQuestion);
  chooseLocaleForNewQuestion();
}

function installSpeechEnhancements() {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const synthesis = window.speechSynthesis;
  const originalSpeak = synthesis.speak.bind(synthesis);
  const originalCancel = synthesis.cancel.bind(synthesis);

  try {
    synthesis.speak = (utterance) => {
      if (utterance?.text) {
        const locale = isListeningViewActive()
          ? (currentListeningLocale || randomEnabledVoiceCountry())
          : randomEnabledVoiceCountry();
        const selectedVoice = selectHighQualityVoice(locale);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang || locale || utterance.lang;
        } else if (locale) {
          utterance.voice = null;
          utterance.lang = locale;
        }
      }

      if (readingReleaseTimer) window.clearTimeout(readingReleaseTimer);
      readingReleaseTimer = 0;
      updateVoiceBadges(utterance.voice, utterance.lang);
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
      const result = originalCancel();
      if (readingReleaseTimer) window.clearTimeout(readingReleaseTimer);
      readingReleaseTimer = window.setTimeout(() => {
        readingReleaseTimer = 0;
        setReadingActive(false);
      }, 80);
      return result;
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
    .bgm-track-actions button, .bgm-import-button { min-width: 70px; min-height: 38px; border: 1px solid var(--cyan); border-radius: 12px; background: rgba(0,246,255,.1); color: var(--cyan); font-weight: 900; cursor: pointer; }
    .bgm-import-button { padding: 8px 12px; }
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
    <div class="setting-info"><span><strong>全尺BGM</strong><small id="full-bgm-status">確認中...</small></span><button id="register-full-bgm" class="bgm-import-button" type="button">元MP3を登録</button><input id="full-bgm-files" type="file" accept="audio/*,.mp3,.ogg,.m4a" multiple hidden></div>
    <label><span><strong>BGM音量</strong><small><b id="bgm-volume-value" class="enhancement-value"></b></small></span><input id="setting-bgm-volume" class="enhancement-range" type="range" min="0" max="100" step="1"></label>
    <label><span><strong>問題読み上げ中のBGM</strong><small>通常音量に対する割合 · 初期値100%</small></span><span><b id="reading-bgm-value" class="enhancement-value"></b><input id="setting-reading-bgm" class="enhancement-range" type="range" min="0" max="100" step="10"></span></label>
    <div class="setting-info voice-country-setting"><span><strong>問題音声の国</strong><small id="voice-availability">選択した国から毎問ランダム</small></span><div id="voice-country-options" class="voice-country-options">${SELECTABLE_VOICE_COUNTRIES.map((item) => `<label class="voice-country-chip"><input type="checkbox" value="${item.locale}"><span>${item.flag} ${item.country}</span></label>`).join("")}</div></div>
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
    startBgm({ force: true, restart: true, skipLeadIn: true });
    updatePreviewButton();
  });

  document.querySelector("#register-full-bgm").addEventListener("click", () => {
    document.querySelector("#full-bgm-files")?.click();
  });

  document.querySelector("#full-bgm-files").addEventListener("change", async (event) => {
    await registerFullTracks(event.target.files);
    event.target.value = "";
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

  document.querySelectorAll("#voice-country-options input[type=\"checkbox\"]").forEach((input) => {
    input.addEventListener("change", () => {
      const checked = [...document.querySelectorAll("#voice-country-options input[type=\"checkbox\"]:checked")].map((item) => item.value);
      if (!checked.length) {
        input.checked = true;
        return;
      }
      enhancementSettings.voiceCountries = checked;
      enhancementSettings.voiceMode = "rotate";
      saveEnhancementSettings();
      updateVoiceAvailabilityText();
    });
  });

  syncSettingsUi();
}

function syncSettingsUi() {
  const enabled = document.querySelector("#setting-bgm-enabled");
  const track = document.querySelector("#setting-bgm-track");
  const volume = document.querySelector("#setting-bgm-volume");
  const reading = document.querySelector("#setting-reading-bgm");
  if (enabled) enabled.checked = enhancementSettings.bgmEnabled;
  if (track) track.value = selectedTrack()?.id || BGM_TRACKS[0]?.id || "";
  if (volume) volume.value = String(enhancementSettings.bgmVolume);
  if (reading) reading.value = String(enhancementSettings.readingBgmPercent);
  const enabledCountries = new Set(enabledVoiceCountries());
  document.querySelectorAll("#voice-country-options input[type=\"checkbox\"]").forEach((input) => {
    input.checked = enabledCountries.has(input.value);
  });
  const volumeValue = document.querySelector("#bgm-volume-value");
  const readingValue = document.querySelector("#reading-bgm-value");
  if (volumeValue) volumeValue.textContent = `${enhancementSettings.bgmVolume}%`;
  if (readingValue) readingValue.textContent = `${enhancementSettings.readingBgmPercent}%`;
  updateBgmStatus();
  updatePreviewButton();
  updateFullBgmStatus();
  updateVoiceAvailabilityText();
}

function updateVoiceAvailabilityText() {
  const label = document.querySelector("#voice-availability");
  if (!label) return;
  const enabled = enabledVoiceCountries();
  const names = enabled.map((locale) => {
    const meta = voiceRegionMeta(locale);
    return `${meta.flag}${meta.country}`;
  });
  label.textContent = `${enabled.length}カ国選択 · 毎問ランダム：${names.join(" / ")}`;
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
    pauseBgm({ reset: true, endSession: true });
    return;
  }

  const action = target.dataset.action;
  if (target.id === "replay-question") {
    bgmUnlocked = true;
    previewingBgm = false;
    setReadingActive(true);
    startBgm({ force: true, skipLeadIn: true });
    return;
  }

  const startsListening = action === "quick" || target.hasAttribute("data-filter") || target.id === "next-question";
  if (startsListening) {
    bgmUnlocked = true;
    previewingBgm = false;
    startBgm({ force: true });
    return;
  }

  if (action) {
    cancelNarration();
    pauseBgm({ reset: true, endSession: true });
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
    pauseBgm({ reset: true, endSession: true });
  }
});
window.addEventListener("pagehide", () => {
  cancelNarration();
  pauseBgm({ reset: true, endSession: true });
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
bgm.addEventListener("ended", () => {
  if (bgm.dataset.fullTrack === "true" && enhancementSettings.bgmEnabled && (isListeningViewActive() || previewingBgm)) {
    try { bgm.currentTime = 0; } catch {}
    startBgm({ force: true, skipLeadIn: true });
  } else if (bgm.dataset.fullTrack !== "true") {
    bgmSessionActive = false;
    updateBgmStatus("短縮版の連続ループを停止 · 元MP3を登録してください");
  }
});

const viewObserver = new MutationObserver(() => {
  updateAppMetadata();
  injectSettings();
  if (isListeningViewActive()) {
    if (bgmUnlocked) startBgm();
  } else if (!document.querySelector("#settings-view.active") || !previewingBgm) {
    pauseBgm({ reset: true, endSession: true });
  }
});
viewObserver.observe(document.querySelector("#app") || document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

injectEnhancementStyles();
installQuestionCountryControl();
installSpeechEnhancements();
applySelectedTrack();
loadRegisteredFullTracks();
injectSettings();
updateAppMetadata();
