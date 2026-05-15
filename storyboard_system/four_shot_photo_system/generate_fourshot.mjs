import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFourshotPrompts, exportFourshotJson, outputFilesForPrompts } from "./prompt_builder.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_FILE = path.join(__dirname, "fourshot_input.json");
const PROMPTS_DIR = path.join(__dirname, "prompts");
const EXPORTS_DIR = path.join(__dirname, "exports");
const EXPORT_FILE = path.join(EXPORTS_DIR, "fourshot_prompts.json");

async function readInput() {
  return JSON.parse(await readFile(INPUT_FILE, "utf8"));
}

async function writeOutputs(data) {
  await rm(PROMPTS_DIR, { recursive: true, force: true });
  await rm(EXPORTS_DIR, { recursive: true, force: true });
  await mkdir(PROMPTS_DIR, { recursive: true });
  await mkdir(EXPORTS_DIR, { recursive: true });
  for (const [filename, prompt] of outputFilesForPrompts(data)) {
    await writeFile(path.join(PROMPTS_DIR, filename), prompt.trim() + "\n", "utf8");
  }
  await writeFile(EXPORT_FILE, JSON.stringify(exportFourshotJson(data), null, 2) + "\n", "utf8");
}

async function main() {
  const data = buildFourshotPrompts(await readInput());
  await writeOutputs(data);
  console.log("Generated " + outputFilesForPrompts(data).length + " prompt files.");
  console.log("Wrote " + path.relative(process.cwd(), EXPORT_FILE) + ".");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

