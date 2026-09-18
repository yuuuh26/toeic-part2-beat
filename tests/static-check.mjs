import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { QUESTIONS } from "../questions.js";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

assert.equal(QUESTIONS.length, 50);
assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 50);
assert.deepEqual(
  Object.fromEntries(["standard", "advanced", "expert"].map((difficulty) => [difficulty, QUESTIONS.filter((q) => q.difficulty === difficulty).length])),
  { standard: 20, advanced: 20, expert: 10 }
);

for (const question of QUESTIONS) {
  assert.match(question.id, /^Q\d{3}$/);
  assert.ok(question.questionText && question.questionJa && question.explanation);
  assert.equal(question.choices.length, 3);
  assert.deepEqual(question.choices.map((choice) => choice.key), ["A", "B", "C"]);
  assert.ok(question.choices.some((choice) => choice.key === question.correctChoice));
  for (const choice of question.choices) assert.ok(choice.text && choice.ja);
}

const requiredFiles = [
  "index.html", "styles.css", "app.js", "questions.js", "manifest.webmanifest", "sw.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"
];
requiredFiles.forEach((file) => assert.ok(exists(file), `${file} must exist`));

const html = read("index.html");
const app = read("app.js");
const serviceWorker = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.match(html, /noindex,nofollow/);
assert.match(html, /id="uncertain-button"/);
assert.match(html, /id="speaking-view"/);
assert.match(html, /Made by YUU/);
assert.match(app, /version: "1\.0\.0"/);
assert.match(app, /interimResults = true/);
assert.match(app, /speechFinalKeys/);
assert.match(app, /indexedDB\.open/);
assert.match(app, /navigator\.storage\.persist/);
assert.match(serviceWorker, /toeic-part2-beat-v1\.0\.0/);
assert.equal(manifest.id, "/toeic-part2-beat/");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "HTML ids must be unique");

console.log("Static checks passed: 50 questions, PWA assets, storage, speaking, and unique DOM ids.");
