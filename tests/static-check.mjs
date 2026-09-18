import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { QUESTIONS } from "../questions.js";
import { EXTRA_QUESTIONS } from "../questions-extra.js";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const allQuestions = [...QUESTIONS, ...EXTRA_QUESTIONS];

assert.equal(QUESTIONS.length, 50);
assert.equal(EXTRA_QUESTIONS.length, 100);
assert.equal(allQuestions.length, 150);
assert.equal(new Set(allQuestions.map((question) => question.id)).size, 150);
assert.deepEqual(
  Object.fromEntries(["standard", "advanced", "expert"].map((difficulty) => [difficulty, allQuestions.filter((question) => question.difficulty === difficulty).length])),
  { standard: 60, advanced: 60, expert: 30 }
);

for (const question of allQuestions) {
  assert.match(question.id, /^Q\d{3}$/);
  assert.ok(question.questionText && question.questionJa && question.explanation);
  assert.equal(question.choices.length, 3);
  assert.deepEqual(question.choices.map((choice) => choice.key), ["A", "B", "C"]);
  assert.ok(question.choices.some((choice) => choice.key === question.correctChoice));
  for (const choice of question.choices) assert.ok(choice.text && choice.ja);
}

const requiredFiles = [
  "index.html", "styles.css", "app.js", "enhancements.js", "questions.js", "questions-extra.js",
  "questions-extra-1.js", "questions-extra-2.js", "questions-extra-3.js", "questions-extra-4.js", "questions-extra-5.js",
  "bgm-after-hours.js", "bgm-small-1.js", "bgm-small-2.js", "manifest.webmanifest", "sw.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"
];
requiredFiles.forEach((file) => assert.ok(exists(file), `${file} must exist`));

const html = read("index.html");
const app = read("app.js");
const enhancements = read("enhancements.js");
const serviceWorker = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.match(html, /noindex,nofollow/);
assert.match(html, /id="uncertain-button"/);
assert.match(html, /id="speaking-view"/);
assert.match(html, /src="\.\/enhancements\.js"/);
assert.match(html, /v1\.3\.0/);
assert.match(html, /150 original questions/);
assert.match(html, /Made by YUU/);
assert.match(app, /interimResults = true/);
assert.match(app, /speechFinalKeys/);
assert.match(app, /indexedDB\.open/);
assert.match(app, /navigator\.storage\.persist/);
assert.match(app, /choice\.text/);
assert.match(app, /listeningTextFor/);
assert.match(app, /playListeningQuestion/);
assert.doesNotMatch(html, /id="listening-status"/);
assert.doesNotMatch(html, /class="choice-text"/);
assert.match(read("styles.css"), /grid-template-columns: 1fr; gap: 10px/);

assert.match(enhancements, /window\.speechSynthesis\.cancel|synthesis\.cancel/);
assert.match(enhancements, /#back-button/);
assert.match(enhancements, /visibilitychange/);
assert.match(enhancements, /readingBgmPercent: 100/);
assert.match(enhancements, /bgmVolume: 34/);
assert.match(enhancements, /setting-reading-bgm/);
assert.match(enhancements, /selectHighQualityVoice/);
assert.match(enhancements, /VOICE_HINTS/);
assert.match(enhancements, /EXTRA_QUESTIONS/);
assert.match(enhancements, /AFTER_HOURS_VELOCITY_BGM/);

assert.match(serviceWorker, /toeic-part2-beat-v1\.3\.0/);
assert.match(serviceWorker, /enhancements\.js/);
assert.match(serviceWorker, /questions-extra-5\.js/);
assert.match(serviceWorker, /bgm-after-hours\.js/);
assert.equal(manifest.id, "/toeic-part2-beat/");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "HTML ids must be unique");

console.log("Static checks passed: 150 questions, voice variation, narration guards, BGM controls, PWA assets, storage, speaking, and unique DOM ids.");
