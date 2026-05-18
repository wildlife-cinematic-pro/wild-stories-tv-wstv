#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const outDir = process.argv[2] || "generated/jlpt-n2-original";
const now = new Date().toISOString();

function row(module, index, extra = {}) {
  return {
    id: `original-${module}-${index}`,
    module,
    term: module === "kanji" ? String.fromCharCode(0x4e00 + (index % 1800)) : `Original N2 ${module} ${index}`,
    reading: module === "kanji" ? "オン / くん" : `original-${index}`,
    meaning: `Original ${module} meaning ${index}`,
    explanation: `Original Nepali-friendly explanation ${index}. Created by local generator, not copied from any website or book.`,
    example: `これはオリジナルのN2練習文 ${index} です。内容は外部サイトからコピーしていません。`,
    source_name: "Local original generator",
    source_url: "",
    source_type: "original-script",
    copyright_status: "original",
    user_notes: `Generated ${now}`,
    created_by_user: false,
    ...extra,
  };
}

const batches = {
  "vocabulary.json": Array.from({ length: 300 }, (_, index) => row("vocabulary", index + 1)),
  "kanji.json": Array.from({ length: 100 }, (_, index) => row("kanji", index + 1)),
  "grammar.json": Array.from({ length: 50 }, (_, index) => row("grammar", index + 1, { term: `Original grammar pattern ${index + 1}` })),
  "reading.json": Array.from({ length: 30 }, (_, index) => row("reading", index + 1, { term: `Original reading passage ${index + 1}` })),
  "listening.json": Array.from({ length: 30 }, (_, index) => row("listening", index + 1, { term: `Original listening script ${index + 1}` })),
};

await mkdir(outDir, { recursive: true });
await Promise.all(Object.entries(batches).map(([name, rows]) => writeFile(join(outDir, name), JSON.stringify(rows, null, 2))));
console.log(`Wrote original JLPT N2 batches to ${outDir}`);
