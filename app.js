import { QUESTIONS, QUESTION_MAP } from "./questions.js";

const APP = Object.freeze({
  version: "1.1.0",
  dailyGoal: 10,
  streakMinimum: 5,
  appUrl: "https://yuuuh26.github.io/toeic-part2-beat/",
  repoUrl: "https://github.com/yuuuh26/toeic-part2-beat"
});

const GAME_CONFIG = Object.freeze({
  autoNextMs: 920,
  feverCombo: 5,
  milestoneCombos: [3, 5, 10, 15, 20],
  baseXp: { standard: 10, advanced: 12, expert: 15 },
  comboBonus(combo) { return combo >= 15 ? 5 : combo >= 10 ? 4 : combo >= 5 ? 2 : 0; },
  weak: { incorrect: 4, uncertain: 2, correct: -1, masteredBonus: -4, masteredStreak: 3 }
});

const SPEAKING_CONFIG = Object.freeze({
  thresholds: { good: 0.7, great: 0.86, perfect: 0.96 },
  xp: { good: 10, great: 15, perfect: 20 },
  countdownMs: 680,
  language: "en-US"
});

const EFFECT_CONFIG = Object.freeze({
  max: { particles: 110, special: 220, shake: true, flash: true },
  normal: { particles: 64, special: 125, shake: true, flash: true },
  reduced: { particles: 26, special: 50, shake: false, flash: false }
});

const STORAGE = { dbName: "toeic-part2-beat", storeName: "app", key: "state", schema: 1 };

const defaultState = () => ({
  schemaVersion: STORAGE.schema,
  totalXp: 0,
  totalAttempts: 0,
  totalCorrect: 0,
  totalSpeaking: 0,
  totalSpeakingXp: 0,
  longestStreak: 0,
  learningDates: [],
  daily: {},
  questions: {},
  settings: { sound: true, vibration: true, rate: 1, effects: "max" },
  dailyBonusDates: []
});

let state = defaultState();
let db = null;
let currentView = "home";
let currentQuestion = null;
let currentAnswer = null;
let currentMode = "quick";
let questionQueue = [];
let uncertain = false;
let answerLocked = false;
let listeningCombo = 0;
let speakingCombo = 0;
let speakingQueue = [];
let currentSpeaking = null;
let recognition = null;
let recognitionActive = false;
let shouldScoreSpeech = false;
let speechFinalSegments = [];
let speechFinalKeys = new Set();
let speechInterim = "";
let toastTimer = null;
let audioContext = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const els = {
  app: $("#app"), back: $("#back-button"), topStatus: $("#top-status"),
  canvas: $("#fx-canvas"), flash: $("#flash"), reward: $("#reward-layer"), toast: $("#toast")
};

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBefore(key, days = 1) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() - days);
  return todayKey(date);
}

function dailyRecord() {
  const key = todayKey();
  if (!state.daily[key]) state.daily[key] = { attempts: 0, correct: 0, xp: 0, speaking: 0 };
  return state.daily[key];
}

function questionRecord(id) {
  if (!state.questions[id]) {
    state.questions[id] = { attemptCount: 0, correctCount: 0, incorrectCount: 0, uncertainCount: 0, correctStreak: 0, lastResult: null, lastAnsweredAt: null, weakScore: 0, speakingCount: 0, speakingBest: 0 };
  }
  return state.questions[id];
}

function mergeState(saved) {
  const fresh = defaultState();
  if (!saved || typeof saved !== "object") return fresh;
  return {
    ...fresh,
    ...saved,
    settings: { ...fresh.settings, ...(saved.settings || {}) },
    daily: saved.daily || {},
    questions: saved.questions || {},
    learningDates: Array.isArray(saved.learningDates) ? saved.learningDates : [],
    dailyBonusDates: Array.isArray(saved.dailyBonusDates) ? saved.dailyBonusDates : []
  };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB is not supported"));
    const request = indexedDB.open(STORAGE.dbName, STORAGE.schema);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORAGE.storeName)) database.createObjectStore(STORAGE.storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet() {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORAGE.storeName, "readonly").objectStore(STORAGE.storeName).get(STORAGE.key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbSave() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORAGE.storeName, "readwrite");
    transaction.objectStore(STORAGE.storeName).put(state, STORAGE.key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Save aborted"));
  });
}

async function saveState() {
  try {
    if (!db) throw new Error("Database unavailable");
    await idbSave();
    return true;
  } catch (error) {
    console.error(error);
    showToast("学習データを保存できませんでした", true);
    return false;
  }
}

function xpForLevel(level) { return 100 + (level - 1) * 20; }

function levelInfo(totalXp = state.totalXp) {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, progress: remaining, needed, percent: Math.min(100, (remaining / needed) * 100) };
}

function getCurrentStreak() {
  const dates = new Set(state.learningDates);
  const today = todayKey();
  let cursor = dates.has(today) ? today : dayBefore(today);
  if (!dates.has(cursor)) return 0;
  let count = 0;
  while (dates.has(cursor)) { count += 1; cursor = dayBefore(cursor); }
  return count;
}

function markLearningDay() {
  const date = todayKey();
  if (dailyRecord().attempts < APP.streakMinimum || state.learningDates.includes(date)) return false;
  state.learningDates.push(date);
  state.learningDates.sort();
  state.longestStreak = Math.max(state.longestStreak, getCurrentStreak());
  return true;
}

function addXp(amount) {
  const before = levelInfo();
  state.totalXp += amount;
  dailyRecord().xp += amount;
  const after = levelInfo();
  return { amount, levelUp: after.level > before.level, before: before.level, after: after.level };
}

function showView(name) {
  if (recognitionActive && name !== "speaking") stopRecognition(false);
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}-view`));
  currentView = name;
  els.back.classList.toggle("hidden", name === "home");
  window.scrollTo({ top: 0, behavior: "instant" });
  if (name === "home") renderHome();
  if (name === "stats") renderStats();
  if (name === "weak") renderWeak();
  if (name === "settings") renderSettings();
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function renderHome() {
  const level = levelInfo();
  const daily = dailyRecord();
  const weak = getWeakQuestions("all").length;
  $("#home-level").textContent = level.level;
  $("#xp-label").textContent = `${level.progress} / ${level.needed} XP`;
  $("#xp-percent").textContent = `${Math.round(level.percent)}%`;
  $("#xp-fill").style.width = `${level.percent}%`;
  $("#streak-value").textContent = `${getCurrentStreak()} DAYS`;
  $("#today-count").textContent = `${daily.attempts} / ${APP.dailyGoal}`;
  $("#daily-fill").style.width = `${Math.min(100, daily.attempts / APP.dailyGoal * 100)}%`;
  $("#daily-caption").textContent = daily.attempts >= APP.dailyGoal ? "DAILY CLEAR!" : `あと${APP.dailyGoal - daily.attempts}問！`;
  $("#weak-badge").textContent = weak;
  els.topStatus.textContent = `XP ${state.totalXp}`;
  document.body.classList.remove("fever");
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuickQueue() {
  const unanswered = QUESTIONS.filter((q) => !state.questions[q.id]?.attemptCount);
  const stale = QUESTIONS.filter((q) => state.questions[q.id]?.attemptCount).sort((a, b) => (state.questions[a.id].lastAnsweredAt || "").localeCompare(state.questions[b.id].lastAnsweredAt || ""));
  const weak = getWeakQuestions("auto");
  const mixed = [...shuffled(unanswered).slice(0, 18), ...shuffled(weak).slice(0, 8), ...shuffled(stale).slice(0, 12), ...shuffled(QUESTIONS)];
  const seen = new Set();
  return mixed.filter((q) => !seen.has(q.id) && seen.add(q.id));
}

function getWeakQuestions(filter = "auto") {
  return QUESTIONS.filter((question) => {
    const record = state.questions[question.id];
    if (!record) return false;
    const accuracy = record.attemptCount ? record.correctCount / record.attemptCount : 1;
    if (filter === "missed") return record.incorrectCount > 0;
    if (filter === "uncertain") return record.uncertainCount > 0;
    if (filter === "all") return record.incorrectCount > 0 || record.uncertainCount > 0;
    if (filter === "accuracy") return record.attemptCount >= 2 && accuracy < .75;
    return record.weakScore >= 2 || record.incorrectCount > 0 || record.uncertainCount >= 2;
  }).sort((a, b) => (state.questions[b.id]?.weakScore || 0) - (state.questions[a.id]?.weakScore || 0));
}

function startGame(mode = "quick", filter = "auto") {
  currentMode = mode;
  listeningCombo = 0;
  questionQueue = mode === "quick" ? buildQuickQueue() : shuffled(getWeakQuestions(filter));
  if (!questionQueue.length) {
    showToast("該当する弱点問題はまだありません");
    showView("home");
    return;
  }
  showView("game");
  nextQuestion();
}

function nextQuestion() {
  if (!questionQueue.length) questionQueue = currentMode === "quick" ? buildQuickQueue() : shuffled(getWeakQuestions("auto"));
  if (!questionQueue.length) return showView("home");
  currentQuestion = questionQueue.shift();
  currentAnswer = null;
  uncertain = false;
  answerLocked = false;
  $("#question-number").textContent = currentQuestion.id.replace("Q0", "Q.").replace("Q", "Q.");
  $("#mode-label").textContent = currentMode === "quick" ? "QUICK PLAY" : "WEAK POINT";
  updateComboHud();
  $("#uncertain-button").classList.remove("active");
  $("#uncertain-button").setAttribute("aria-pressed", "false");
  currentQuestion.choices.forEach((choice) => {
    const button = $(`.choice-button[data-choice="${choice.key}"]`);
    if (!button) return;
    button.disabled = false;
    button.classList.remove("correct", "wrong");
    button.innerHTML = `<span class="choice-letter">${choice.key}</span><span class="choice-text">${escapeHtml(choice.text)}</span>`;
    button.setAttribute("aria-label", `${choice.key}. ${choice.text}`);
  });
  $("#listening-status").textContent = "LISTENING...";
  const listeningText = [
    currentQuestion.questionText,
    ...currentQuestion.choices.map((choice) => `${choice.key}. ${choice.text}`)
  ].join(" ");
  setTimeout(() => speakText(listeningText, { onEnd: () => { if (!answerLocked) $("#listening-status").textContent = "CHOOSE A / B / C"; } }), 180);
}

function updateComboHud() {
  $("#combo-label").textContent = `COMBO ${listeningCombo}`;
  document.body.classList.toggle("fever", listeningCombo >= GAME_CONFIG.feverCombo);
}

function toggleUncertain() {
  if (answerLocked) return;
  uncertain = !uncertain;
  $("#uncertain-button").classList.toggle("active", uncertain);
  $("#uncertain-button").setAttribute("aria-pressed", String(uncertain));
  tone(uncertain ? 660 : 360, .07, "sine", .03);
}

async function submitAnswer(choice) {
  if (answerLocked || !currentQuestion) return;
  answerLocked = true;
  currentAnswer = choice;
  window.speechSynthesis?.cancel();
  const correct = choice === currentQuestion.correctChoice;
  const record = questionRecord(currentQuestion.id);
  const daily = dailyRecord();
  const beforeDaily = daily.attempts;
  record.attemptCount += 1;
  record.lastResult = correct ? "correct" : "incorrect";
  record.lastAnsweredAt = new Date().toISOString();
  if (uncertain) record.uncertainCount += 1;
  state.totalAttempts += 1;
  daily.attempts += 1;
  let xpEvent = { levelUp: false, amount: 0 };

  if (correct) {
    record.correctCount += 1;
    record.correctStreak += 1;
    record.weakScore = Math.max(0, record.weakScore + (uncertain ? GAME_CONFIG.weak.uncertain : 0) + GAME_CONFIG.weak.correct);
    if (record.correctStreak >= GAME_CONFIG.weak.masteredStreak) record.weakScore = Math.max(0, record.weakScore + GAME_CONFIG.weak.masteredBonus);
    state.totalCorrect += 1;
    daily.correct += 1;
    listeningCombo += 1;
    const base = GAME_CONFIG.baseXp[currentQuestion.difficulty] || 10;
    xpEvent = addXp(base + GAME_CONFIG.comboBonus(listeningCombo));
  } else {
    record.incorrectCount += 1;
    record.correctStreak = 0;
    record.weakScore += GAME_CONFIG.weak.incorrect + (uncertain ? GAME_CONFIG.weak.uncertain : 0);
    listeningCombo = 0;
  }

  markLearningDay();
  let dailyClear = false;
  if (beforeDaily < APP.dailyGoal && daily.attempts >= APP.dailyGoal && !state.dailyBonusDates.includes(todayKey())) {
    state.dailyBonusDates.push(todayKey());
    const bonus = addXp(30);
    xpEvent.levelUp = xpEvent.levelUp || bonus.levelUp;
    xpEvent.after = bonus.after;
    dailyClear = true;
  }
  await saveState();
  updateComboHud();

  const selected = $(`.choice-button[data-choice="${choice}"]`);
  selected.classList.add(correct ? "correct" : "wrong");
  $$(".choice-button").forEach((button) => { button.disabled = true; });

  if (correct) {
    const specialCombo = GAME_CONFIG.milestoneCombos.includes(listeningCombo);
    celebrate(specialCombo ? (listeningCombo === 5 ? "🔥 FEVER 🔥" : `${listeningCombo} COMBO!!`) : "CORRECT!", `+${xpEvent.amount} XP`, specialCombo);
    let delay = GAME_CONFIG.autoNextMs;
    if (dailyClear) {
      delay = 2100;
      setTimeout(() => celebrate("DAILY CLEAR!!", "+30 XP", true), 820);
    }
    if (xpEvent.levelUp) {
      delay = Math.max(delay, dailyClear ? 3200 : 2200);
      setTimeout(() => celebrate("LEVEL UP!", `LV.${xpEvent.before || levelInfo(state.totalXp - xpEvent.amount).level} → LV.${levelInfo().level}`, true), dailyClear ? 1900 : 850);
    }
    setTimeout(nextQuestion, delay);
  } else {
    missEffect();
    setTimeout(showReview, 460);
  }
}

function showReview() {
  showView("review");
  $("#review-id").textContent = currentQuestion.id;
  $("#review-question-en").textContent = currentQuestion.questionText;
  $("#review-question-ja").textContent = currentQuestion.questionJa;
  $("#review-explanation").textContent = currentQuestion.explanation;
  $("#review-choices").innerHTML = currentQuestion.choices.map((choice) => `
    <article class="review-choice ${choice.key === currentQuestion.correctChoice ? "correct" : ""} ${choice.key === currentAnswer && choice.key !== currentQuestion.correctChoice ? "user-wrong" : ""}">
      <span class="choice-key">${choice.key}</span>
      <div><strong>${escapeHtml(choice.text)}</strong><p>${escapeHtml(choice.ja)}</p></div>
      <button data-speak="${choice.key}" aria-label="選択肢${choice.key}を再生">🔊</button>
    </article>`).join("");
  $$('[data-speak]', $("#review-choices")).forEach((button) => button.addEventListener("click", () => {
    const choice = currentQuestion.choices.find((item) => item.key === button.dataset.speak);
    speakText(choice.text);
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function renderWeak() {
  const filters = ["missed", "uncertain", "all", "accuracy", "auto"];
  filters.forEach((filter) => { $(`#count-${filter}`).textContent = getWeakQuestions(filter).length; });
}

function renderStats() {
  const today = dailyRecord();
  const accuracy = state.totalAttempts ? Math.round(state.totalCorrect / state.totalAttempts * 100) : 0;
  const todayAccuracy = today.attempts ? Math.round(today.correct / today.attempts * 100) : 0;
  const weakCount = getWeakQuestions("auto").length;
  $("#stats-summary").innerHTML = [
    ["TODAY", `${today.attempts} Q`, `${todayAccuracy}% · ${today.xp} XP`],
    ["TOTAL", `${state.totalAttempts} Q`, `${accuracy}% · ${state.totalXp} XP`],
    ["STREAK", `${getCurrentStreak()} DAYS`, `最長 ${state.longestStreak} · 累計 ${state.learningDates.length}日`],
    ["WEAK", `${weakCount} Q`, `MISS ${getWeakQuestions("missed").length} · ? ${getWeakQuestions("uncertain").length}`]
  ].map(([label, value, note]) => `<article class="stat-card"><small>${label}</small><strong>${value}</strong><span>${note}</span></article>`).join("");

  const records = QUESTIONS.filter((q) => state.questions[q.id]?.attemptCount).sort((a, b) => (state.questions[b.id].weakScore || 0) - (state.questions[a.id].weakScore || 0));
  $("#question-stats").innerHTML = records.length ? records.map((q) => {
    const r = state.questions[q.id];
    const rate = Math.round(r.correctCount / r.attemptCount * 100);
    return `<article class="question-stat"><strong>${q.id}</strong><div><span>正答 ${rate}%</span><span>回答 ${r.attemptCount}</span><span>? ${r.uncertainCount}</span></div><span>WEAK ${r.weakScore}</span></article>`;
  }).join("") : '<div class="empty-state">問題を解くと、ここに問題別データが表示されます。</div>';
}

function renderSettings() {
  $("#setting-sound").checked = state.settings.sound;
  $("#setting-vibration").checked = state.settings.vibration;
  $("#setting-rate").value = String(state.settings.rate);
  $("#setting-effects").value = state.settings.effects;
  $("#app-url").textContent = APP.appUrl;
  $("#repo-url").textContent = APP.repoUrl;
  $("#version-label").textContent = `v${APP.version}`;
  checkPersistence();
}

function chooseEnglishVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((voice) => /^en-US/i.test(voice.lang) && /Google|Samantha|Microsoft/i.test(voice.name)) || voices.find((voice) => /^en-US/i.test(voice.lang)) || voices.find((voice) => /^en/i.test(voice.lang));
}

function speakText(text, options = {}) {
  if (!("speechSynthesis" in window)) {
    showToast("このブラウザでは音声再生を利用できません", true);
    options.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEAKING_CONFIG.language;
  utterance.rate = Number(state.settings.rate) || 1;
  utterance.pitch = 1;
  const voice = chooseEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}

function tone(frequency = 440, duration = .12, type = "sine", volume = .05, delay = 0) {
  if (!state.settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  } catch (error) { console.debug("Sound unavailable", error); }
}

function rewardSound(special = false) {
  const notes = special ? [523, 659, 784, 1047, 1319] : [659, 880, 1047];
  notes.forEach((note, index) => tone(note, special ? .26 : .17, index % 2 ? "triangle" : "sine", .055, index * .055));
}

function vibrate(pattern) {
  if (state.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

function celebrate(title, subtitle, special = false) {
  const effect = EFFECT_CONFIG[state.settings.effects] || EFFECT_CONFIG.max;
  els.reward.innerHTML = `<div class="reward ${special ? "special" : ""}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span></div>`;
  if (effect.flash) {
    els.flash.classList.remove("burst");
    void els.flash.offsetWidth;
    els.flash.classList.add("burst");
  }
  if (effect.shake && special) {
    els.app.classList.remove("screen-shake");
    void els.app.offsetWidth;
    els.app.classList.add("screen-shake");
  }
  launchParticles(special ? effect.special : effect.particles, special);
  rewardSound(special);
  vibrate(special ? [45, 35, 70, 35, 110] : [35, 25, 45]);
  setTimeout(() => { els.reward.innerHTML = ""; }, 900);
}

function missEffect() {
  tone(170, .18, "sawtooth", .04);
  vibrate([75, 35, 75]);
  els.app.classList.remove("screen-shake");
  void els.app.offsetWidth;
  els.app.classList.add("screen-shake");
}

function launchParticles(count, special) {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ["#00f6ff", "#ff2bd6", "#b7ff2a", "#ffe14d", "#ffffff", "#8b5cff"];
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (special ? 5 : 3.5) + Math.random() * (special ? 10 : 7);
    return { x: innerWidth / 2, y: innerHeight * .43, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (special ? 3 : 1), g: .15 + Math.random() * .14, size: 2 + Math.random() * (special ? 7 : 5), life: 1, decay: .012 + Math.random() * .017, color: colors[Math.floor(Math.random() * colors.length)], spin: Math.random() * .3 };
  });
  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .992; p.life -= p.decay;
      if (p.life <= 0) return;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(frame * p.spin);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = special ? 13 : 8;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size * (special ? 1.7 : 1.2), p.size);
      ctx.restore();
    });
    frame += 1;
    if (alive && frame < 100) requestAnimationFrame(draw); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(draw);
}

function setupSpeaking(weakOnly = false) {
  const pool = weakOnly ? getWeakQuestions("auto") : QUESTIONS;
  if (!pool.length) {
    showToast("弱点問題がないため通常Speakingを開始します");
    return setupSpeaking(false);
  }
  speakingQueue = shuffled(pool);
  speakingCombo = 0;
  $("#speaking-mode").textContent = weakOnly ? "WEAK SPEAKING" : "SPEAKING";
  showView("speaking");
  nextSpeaking();
}

function nextSpeaking() {
  if (!speakingQueue.length) speakingQueue = shuffled(QUESTIONS);
  const question = speakingQueue.shift();
  const choice = question.choices.find((item) => item.key === question.correctChoice);
  currentSpeaking = { question, text: choice.text, ja: choice.ja };
  $("#speaking-title").textContent = choice.text;
  $("#speaking-translation").textContent = choice.ja;
  $("#speaking-combo").textContent = `COMBO ×${speakingCombo}`;
  $("#speech-stage").className = "speech-stage idle";
  $("#speech-status").textContent = "TAP START";
  $("#speech-transcript").textContent = "認識結果がここに表示されます";
  $("#speech-start").classList.remove("hidden");
  $("#speech-stop").classList.add("hidden");
  $("#speaking-next").classList.add("hidden");
  $("#speech-support").textContent = speechRecognitionConstructor() ? "START後、GO!が出たら話してください。" : "音声認識非対応です。Listening機能は引き続き利用できます。";
  $("#speech-start").disabled = !speechRecognitionConstructor();
}

function speechRecognitionConstructor() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }

function showCountdown(text) {
  const overlay = document.createElement("div");
  overlay.className = "countdown";
  overlay.innerHTML = `<strong>${text}</strong>`;
  document.body.append(overlay);
  setTimeout(() => overlay.remove(), SPEAKING_CONFIG.countdownMs);
}

async function startSpeakingRecognition() {
  const Recognition = speechRecognitionConstructor();
  if (!Recognition || recognitionActive) return;
  window.speechSynthesis?.cancel();
  $("#speech-start").classList.add("hidden");
  showCountdown("READY");
  await new Promise((resolve) => setTimeout(resolve, SPEAKING_CONFIG.countdownMs));
  showCountdown("GO!");
  tone(880, .13, "square", .04);
  await new Promise((resolve) => setTimeout(resolve, 290));

  speechFinalSegments = [];
  speechFinalKeys = new Set();
  speechInterim = "";
  shouldScoreSpeech = true;
  recognition = new Recognition();
  recognition.lang = SPEAKING_CONFIG.language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    recognitionActive = true;
    $("#speech-stage").className = "speech-stage listening";
    $("#speech-status").textContent = "LISTENING...";
    $("#speech-stop").classList.remove("hidden");
  };
  recognition.onresult = handleSpeechResult;
  recognition.onerror = (event) => {
    if (event.error !== "aborted" && event.error !== "no-speech") showToast(`音声認識エラー：${event.error}`, true);
  };
  recognition.onend = () => {
    const wasActive = recognitionActive;
    recognitionActive = false;
    $("#speech-stop").classList.add("hidden");
    if (wasActive && shouldScoreSpeech) scoreSpeech();
  };
  try { recognition.start(); } catch (error) { showToast("音声認識を開始できませんでした", true); nextSpeaking(); }
}

function handleSpeechResult(event) {
  let interim = "";
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result[0]?.transcript?.trim() || "";
    if (!transcript) continue;
    if (result.isFinal) {
      const key = normalizeSpeech(transcript);
      if (key && !speechFinalKeys.has(key)) {
        speechFinalKeys.add(key);
        speechFinalSegments.push(transcript);
      }
    } else {
      interim += `${transcript} `;
    }
  }
  speechInterim = interim.trim();
  const display = [...speechFinalSegments, speechInterim].filter(Boolean).join(" ");
  $("#speech-transcript").textContent = display || "聞き取り中...";
}

function stopRecognition(score = true) {
  if (!recognition) return;
  shouldScoreSpeech = score;
  try { recognition.stop(); } catch (error) { console.debug(error); }
}

function normalizeSpeech(value) {
  return String(value).toLowerCase().replace(/’/g, "'").replace(/\b(i am)\b/g, "i'm").replace(/\b(do not)\b/g, "don't").replace(/\b(it is)\b/g, "it's").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const hold = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = hold;
    }
  }
  return row[b.length];
}

function similarity(target, spoken) {
  const a = normalizeSpeech(target);
  const b = normalizeSpeech(spoken);
  if (!a || !b) return 0;
  const charScore = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  const targetTokens = a.split(" ");
  const spokenTokens = b.split(" ");
  const matches = targetTokens.filter((token, index) => spokenTokens.includes(token) || spokenTokens[index] === token).length;
  const precision = matches / Math.max(1, spokenTokens.length);
  const recall = matches / targetTokens.length;
  const tokenF1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  return Math.max(0, Math.min(1, charScore * .55 + tokenF1 * .45));
}

async function scoreSpeech() {
  const spoken = speechFinalSegments.join(" ") || speechInterim;
  const score = similarity(currentSpeaking.text, spoken);
  let rank = "retry";
  if (score >= SPEAKING_CONFIG.thresholds.perfect) rank = "perfect";
  else if (score >= SPEAKING_CONFIG.thresholds.great) rank = "great";
  else if (score >= SPEAKING_CONFIG.thresholds.good) rank = "good";

  $("#speech-stage").className = "speech-stage idle";
  $("#speech-status").textContent = rank === "retry" ? "KEEP GOING" : `${rank.toUpperCase()} · ${Math.round(score * 100)}%`;
  $("#speech-transcript").textContent = spoken || "音声を認識できませんでした";
  $("#speaking-next").classList.remove("hidden");
  const record = questionRecord(currentSpeaking.question.id);
  record.speakingCount += 1;
  record.speakingBest = Math.max(record.speakingBest || 0, score);
  state.totalSpeaking += 1;

  if (rank !== "retry") {
    const xp = SPEAKING_CONFIG.xp[rank];
    const xpEvent = addXp(xp);
    state.totalSpeakingXp += xp;
    dailyRecord().speaking += 1;
    if (rank === "great" || rank === "perfect") speakingCombo += 1; else speakingCombo = 0;
    celebrate(`${rank.toUpperCase()}${rank === "perfect" ? "!!" : "!"}`, `+${xp} XP`, rank === "perfect");
    if (xpEvent.levelUp) setTimeout(() => celebrate("LEVEL UP!", `LV.${xpEvent.before} → LV.${xpEvent.after}`, true), 900);
  } else {
    speakingCombo = 0;
    tone(240, .16, "triangle", .03);
  }
  $("#speaking-combo").textContent = `COMBO ×${speakingCombo}`;
  await saveState();
}

async function checkPersistence() {
  const label = $("#persistence-status");
  if (!navigator.storage?.persisted) return void (label.textContent = "この環境では確認できません");
  try { label.textContent = await navigator.storage.persisted() ? "有効" : "未許可"; }
  catch { label.textContent = "確認できません"; }
}

async function requestPersistence() {
  if (!navigator.storage?.persist) return showToast("この環境では申請できません", true);
  try {
    const granted = await navigator.storage.persist();
    showToast(granted ? "永続ストレージが有効になりました" : "永続ストレージは許可されませんでした");
    checkPersistence();
  } catch { showToast("永続ストレージを申請できませんでした", true); }
}

async function copyText(value) {
  try { await navigator.clipboard.writeText(value); showToast("コピーしました"); }
  catch { showToast("コピーできませんでした", true); }
}

function bindEvents() {
  els.back.addEventListener("click", () => showView("home"));
  $$('[data-action]').forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "quick") startGame("quick");
    if (action === "weak") showView("weak");
    if (action === "speaking") setupSpeaking(false);
    if (action === "weak-speaking") setupSpeaking(true);
    if (action === "stats") showView("stats");
    if (action === "settings") showView("settings");
  }));
  $$('[data-filter]').forEach((button) => button.addEventListener("click", () => startGame("weak", button.dataset.filter)));
  $("#uncertain-button").addEventListener("click", toggleUncertain);
  $$(".choice-button").forEach((button) => button.addEventListener("click", () => submitAnswer(button.dataset.choice)));
  $("#replay-question").addEventListener("click", () => currentQuestion && speakText(currentQuestion.questionText));
  $("#review-question-audio").addEventListener("click", () => currentQuestion && speakText(currentQuestion.questionText));
  $("#next-question").addEventListener("click", () => { showView("game"); nextQuestion(); });
  $("#model-audio").addEventListener("click", () => currentSpeaking && speakText(currentSpeaking.text));
  $("#speech-start").addEventListener("click", startSpeakingRecognition);
  $("#speech-stop").addEventListener("click", () => stopRecognition(true));
  $("#speaking-next").addEventListener("click", nextSpeaking);
  $("#setting-sound").addEventListener("change", async (event) => { state.settings.sound = event.target.checked; await saveState(); });
  $("#setting-vibration").addEventListener("change", async (event) => { state.settings.vibration = event.target.checked; await saveState(); });
  $("#setting-rate").addEventListener("change", async (event) => { state.settings.rate = Number(event.target.value); await saveState(); });
  $("#setting-effects").addEventListener("change", async (event) => { state.settings.effects = event.target.value; await saveState(); });
  $("#request-persistence").addEventListener("click", requestPersistence);
  $$('[data-copy]').forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copy === "app" ? APP.appUrl : APP.repoUrl)));
  document.addEventListener("visibilitychange", () => { if (document.hidden) window.speechSynthesis?.cancel(); });
}

async function init() {
  bindEvents();
  try {
    db = await openDatabase();
    state = mergeState(await idbGet());
  } catch (error) {
    console.error(error);
    showToast("学習データを保存できません。ブラウザ設定を確認してください", true);
  }
  renderHome();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.debug("Service worker registration failed", error));
  }
  navigator.storage?.persist?.().then(() => {}).catch(() => {});
}

init();
