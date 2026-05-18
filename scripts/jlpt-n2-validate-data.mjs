#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = "data/jlpt-n2";
const allowedSourceTypes = new Set(["original", "original-script", "original-admin-tool", "user-notes", "user-reading-extraction"]);
const fileModules = {
  "vocabulary.expanded.json": "vocabulary",
  "kanji.expanded.json": "kanji",
  "grammar.expanded.json": "grammar",
  "reading.expanded.json": "reading",
  "listening.expanded.json": "listening",
  "mock.expanded.json": "mock test",
};
const required = {
  vocabulary: ["id", "module", "term", "word", "reading", "kanji_form", "kana_form", "meaning_np", "meaning_en", "part_of_speech", "jlpt_estimated_level", "priority_score", "related_kanji", "example_jp", "example_np", "collocations", "similar_words", "common_mistake", "tags", "source_type", "created_by_user"],
  kanji: ["id", "module", "term", "kanji", "onyomi", "kunyomi", "meaning_np", "meaning_en", "radicals", "similar_kanji", "common_mistakes", "example", "example_words", "n2_priority_words", "jlpt_estimated_level", "source_type"],
  grammar: ["id", "module", "term", "pattern", "meaning_np", "meaning_en", "formation", "nuance", "register", "usage_context", "similar_patterns", "common_mistake", "example", "example_np", "quiz_items", "jlpt_estimated_level", "source_type"],
  reading: ["id", "module", "term", "title", "reading_type", "passage_type", "difficulty", "estimated_time_minutes", "target_time_seconds", "timer_target", "example_jp", "passage_jp", "question", "questions", "correct_answer", "correct_answers", "explanation_np", "vocabulary_notes", "grammar_notes", "why_wrong", "jlpt_estimated_level", "source_type"],
  listening: ["id", "module", "term", "title", "weakness_category", "conversation_type", "difficulty", "question_type", "example_jp", "script_jp", "question", "questions", "correct_answer", "correct_answers", "explanation_np", "key_vocabulary", "key_vocab", "key_grammar", "dictation_text", "shadowing_checklist", "jlpt_estimated_level", "source_type"],
  "mock test": ["id", "module", "term", "language_score", "reading_score", "listening_score", "explanation", "explanation_np", "weak_section_repair", "score_strategy", "source_type"],
};
const readingTypes = new Set(["short", "medium", "long", "email/notice", "email/message", "opinion essay", "information search", "workplace/social", "workplace notice", "public announcement", "comparison text", "newspaper-style", "newspaper-style simplified article", "social issue explanation", "product/service notice", "community rule/instruction text"]);
const listeningTypes = new Set(["task comprehension", "key points", "summary", "quick response", "integrated comprehension"]);
const posValues = new Set(["n", "n/suru", "na-adj/n", "na-adjective", "na-adjective / noun modifier", "i-adjective", "adverb", "verb", "expression", "prefix/suffix", "counter"]);
const minimumCounts = { vocabulary: 2000, kanji: 500, grammar: 200, reading: 150, listening: 150, "mock test": 20 };
const allowedLevels = new Set(["N2", "N2-relevant", "N2 cumulative"]);
const errors = [];
const warnings = [];
const counts = {};
const ids = new Map();
const vocabTerms = new Map();
const moduleTerms = new Map();
function text(value) { return typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim(); }
function fail(file, id, message) { errors.push({ file, id, message }); }
function warn(file, id, message) { warnings.push({ file, id, message }); }
function parseJsonField(value, file, id, field) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed) && typeof parsed !== "object") fail(file, id, field + " must be JSON object/array");
    return parsed;
  } catch { fail(file, id, field + " is malformed JSON"); return null; }
}
function validUrl(value) { if (!value) return true; try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; } }
function kanaOnly(value) { return /^[ぁ-んァ-ンー・\s/]+$/.test(value); }
function hasKanji(value) { return /[一-龯]/.test(value); }
for (const file of Object.keys(fileModules)) {
  const rows = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  if (!Array.isArray(rows)) fail(file, "file", "top-level JSON must be an array");
  const expectedModule = fileModules[file];
  counts[expectedModule] = rows.length;
  if (rows.length < minimumCounts[expectedModule]) fail(file, "file", "expected at least " + minimumCounts[expectedModule] + " " + expectedModule + " rows, found " + rows.length);
  rows.forEach((row, index) => {
    const id = text(row.id) || "row-" + (index + 1);
    if (ids.has(id)) fail(file, id, "duplicate id also used in " + ids.get(id)); else ids.set(id, file);
    if (row.module !== expectedModule) fail(file, id, "module must be " + expectedModule);
    const moduleTermKey = expectedModule + ":" + text(row.term);
    if (moduleTerms.has(moduleTermKey)) fail(file, id, "duplicate term/pattern/card also used by " + moduleTerms.get(moduleTermKey)); else moduleTerms.set(moduleTermKey, id);
    for (const field of required[expectedModule] || []) if (!text(row[field]) && row[field] !== false) fail(file, id, "missing required field " + field);
    if (row.source_type && !allowedSourceTypes.has(row.source_type)) fail(file, id, "invalid source_type " + row.source_type);
    const level = text(row.jlpt_estimated_level);
    if (expectedModule !== "mock test" && !level) fail(file, id, "missing jlpt_estimated_level");
    if (["N5", "N4"].includes(level)) fail(file, id, "N5/N4 items are not allowed");
    if (level === "N1" && !(text(row.tags).includes("n2_bridge") && text(row.n2_purpose).length > 20)) fail(file, id, "N1-only items require n2_bridge tag and justification");
    if (level && level !== "N1" && !allowedLevels.has(level)) fail(file, id, "jlpt_estimated_level must be N2 or N2-relevant");
    if (Object.values(row).some((value) => typeof value === "string" && /general Japanese practice|形が近い漢字|Component cue|Plain\/formal phrase \+|random practice/i.test(value))) fail(file, id, "generic filler phrase detected");
    if (!validUrl(text(row.source_url))) fail(file, id, "malformed source_url " + row.source_url);
    if (row.created_by_user !== false) fail(file, id, "expanded original rows must have created_by_user: false");
    if (row.srsLevel !== undefined) {
      const stage = Number(row.srsLevel);
      if (!Number.isInteger(stage) || stage < 0 || stage > 6) fail(file, id, "invalid SRS stage; expected 0-6");
    }
    if (expectedModule === "vocabulary") {
      const term = text(row.term);
      if (text(row.word) !== term) fail(file, id, "word must match term for expanded vocabulary");
      if (vocabTerms.has(term)) fail(file, id, "duplicate vocabulary term also used by " + vocabTerms.get(term)); else vocabTerms.set(term, id);
      if (text(row.kanji_form) !== term) fail(file, id, "kanji_form must match term for expanded vocabulary");
      if (text(row.kana_form) !== text(row.reading)) fail(file, id, "kana_form must match reading");
      if (!kanaOnly(text(row.reading))) fail(file, id, "reading must be kana-only");
      if (!posValues.has(text(row.part_of_speech))) fail(file, id, "unexpected part_of_speech " + row.part_of_speech);
      if (!text(row.example_jp).includes(term)) fail(file, id, "example_jp should include the target term");
      if (text(row.similar_words).split(/[,、]/).map((x) => x.trim()).filter(Boolean).length < 2) warn(file, id, "similar_words could be richer");
    }
    if (expectedModule === "kanji") {
      if (text(row.kanji) !== text(row.term)) fail(file, id, "kanji must match term");
      if (text(row.term).length !== 1 || !hasKanji(text(row.term))) fail(file, id, "term must be one kanji");
      if (!text(row.onyomi)) fail(file, id, "onyomi is required");
      if (text(row.similar_kanji).includes("形が近い漢字")) fail(file, id, "similar_kanji is generic filler");
      if (text(row.radicals).includes("Component cue")) fail(file, id, "radicals is generic filler");
      if (text(row.example).includes("No local vocabulary")) warn(file, id, "no local vocabulary expansion examples");
    }
    if (expectedModule === "grammar") {
      if (text(row.pattern) !== text(row.term)) fail(file, id, "pattern must match term");
      if (text(row.formation).includes("Plain/formal phrase +")) fail(file, id, "formation is generic filler");
      if (text(row.nuance).startsWith("Reading passages use it")) fail(file, id, "nuance is generic filler");
      if (!text(row.example).includes(text(row.term))) fail(file, id, "example should include the grammar pattern");
      const quiz = parseJsonField(row.quiz_items, file, id, "quiz_items");
      if (Array.isArray(quiz)) quiz.forEach((item, qi) => { if (!text(item.prompt) || !text(item.answer)) fail(file, id, "quiz item " + (qi + 1) + " missing prompt/answer"); });
    }
    if (expectedModule === "reading") {
      if (!readingTypes.has(text(row.reading_type))) fail(file, id, "invalid reading_type " + row.reading_type);
      const minutes = Number(text(row.timer_target).match(/\d+/)?.[0] || 0);
      if (minutes < 2 || minutes > 15) fail(file, id, "timer_target should be 2-15 minutes");
      const questions = parseJsonField(row.questions, file, id, "questions");
      if (Array.isArray(questions)) questions.forEach((item, qi) => { if (!text(item.q) || !text(item.a)) fail(file, id, "reading question " + (qi + 1) + " missing q/a"); });
      if (!text(row.example_jp).includes("。")) fail(file, id, "reading passage is too short or unnatural");
    }
    if (expectedModule === "listening") {
      if (!listeningTypes.has(text(row.weakness_category))) fail(file, id, "invalid weakness_category " + row.weakness_category);
      const questions = parseJsonField(row.questions, file, id, "questions");
      if (Array.isArray(questions)) questions.forEach((item, qi) => { if (!text(item.q) || !text(item.a)) fail(file, id, "listening question " + (qi + 1) + " missing q/a"); });
      if (!text(row.example_jp).includes(text(row.dictation_text))) fail(file, id, "dictation_text must appear in script");
    }
    if (expectedModule === "mock test") {
      for (const field of ["language_score", "reading_score", "listening_score"]) {
        const score = Number(row[field]);
        if (!Number.isFinite(score) || score < 0 || score > 60) fail(file, id, field + " must be 0-60");
      }
      if (!text(row.score_strategy).includes("total >= 90") || !text(row.score_strategy).includes("total >= 150")) fail(file, id, "score_strategy must state pass and 150+ rules");
      if (row.mini_mock_items) parseJsonField(row.mini_mock_items, file, id, "mini_mock_items");
    }
  });
}
console.log("JLPT N2 expanded data validation");
console.log(JSON.stringify({ counts, errors: errors.length, warnings: warnings.length }, null, 2));
if (errors.length) {
  console.log("\nErrors:");
  for (const err of errors.slice(0, 80)) console.log("- " + err.file + " " + err.id + ": " + err.message);
  if (errors.length > 80) console.log("...and " + (errors.length - 80) + " more");
}
if (warnings.length) {
  console.log("\nWarnings:");
  for (const item of warnings.slice(0, 40)) console.log("- " + item.file + " " + item.id + ": " + item.message);
  if (warnings.length > 40) console.log("...and " + (warnings.length - 40) + " more");
}
process.exit(errors.length ? 1 : 0);
