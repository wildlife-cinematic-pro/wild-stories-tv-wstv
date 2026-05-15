import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, "prompts");
const EXPORT_FILE = path.join(__dirname, "exports", "fourshot_prompts.json");
const EXPECTED_PROMPTS = [
  "00_master_environment.nano.txt",
  "00_master_environment.gptimage2.txt",
  "01_wide_hook.nano.txt",
  "01_wide_hook.gptimage2.txt",
  "02_predator_push_in.nano.txt",
  "02_predator_push_in.gptimage2.txt",
  "03_prey_reaction.nano.txt",
  "03_prey_reaction.gptimage2.txt",
  "04_chase_action.nano.txt",
  "04_chase_action.gptimage2.txt"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function validatePromptFiles() {
  const files = (await readdir(PROMPTS_DIR)).filter((file) => file.endsWith(".txt")).sort();
  const expected = [...EXPECTED_PROMPTS].sort();
  assert(files.length === 10, "Expected exactly 10 prompt files, found " + files.length + ".");
  assert(JSON.stringify(files) === JSON.stringify(expected), "Prompt files do not match expected list. Found: " + files.join(", "));
  for (const file of expected) {
    const text = await readFile(path.join(PROMPTS_DIR, file), "utf8");
    assert(text.trim().length > 120, file + " is unexpectedly short.");
  }
}

async function validateJsonExport() {
  const parsed = JSON.parse(await readFile(EXPORT_FILE, "utf8"));
  assert(parsed.masterEnvironment, "JSON export missing masterEnvironment.");
  assert(parsed.masterEnvironment.nanoBanana2Prompt, "Master environment missing Nano Banana 2 prompt.");
  assert(parsed.masterEnvironment.gptImage2Prompt, "Master environment missing GPT Image 2 prompt.");
  assert(Array.isArray(parsed.shots), "JSON export shots must be an array.");
  assert(parsed.shots.length === 4, "Expected exactly 4 shots, found " + (parsed.shots ? parsed.shots.length : 0) + ".");
  for (const shot of parsed.shots) {
    assert(shot.id, "Shot missing id.");
    assert(shot.name, "Shot " + shot.id + " missing name.");
    assert(shot.purpose, "Shot " + shot.id + " missing purpose.");
    assert(shot.nanoBanana2Prompt, "Shot " + shot.id + " missing Nano Banana 2 prompt.");
    assert(shot.gptImage2Prompt, "Shot " + shot.id + " missing GPT Image 2 prompt.");
    assert(Array.isArray(shot.continuityChecklist) && shot.continuityChecklist.length >= 6, "Shot " + shot.id + " missing continuity checklist.");
  }
}

async function main() {
  await validatePromptFiles();
  await validateJsonExport();
  console.log("Four-shot photo system validation passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

