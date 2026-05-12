const GENERIC_SAFE_FOOD_ZONE =
  "non-graphic food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds";

const DEER_SAFE_FOOD_ZONE =
  "non-graphic deer food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds";

const RISKY_FOOD_TERMS =
  /\b(carcass|visible carcass|dead animal|blood|bloody|gore|gory|wounds?|visible injury|graphic feeding|exposed flesh|torn flesh)\b/i;

function cleanText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function safeDescriptor(value: string) {
  return value
    .replace(/\bvisible\s+carcass\b/gi, "")
    .replace(/\bdeer\s+carcass\b/gi, "deer")
    .replace(/\bcarcass\b/gi, "")
    .replace(/\bdead\s+animal\b/gi, "")
    .replace(/\bblood(?:y)?\b/gi, "")
    .replace(/\bgore|gory\b/gi, "")
    .replace(/\bwounds?\b/gi, "")
    .replace(/\bvisible\s+injury\b/gi, "")
    .replace(/\bgraphic\s+feeding\b/gi, "")
    .replace(/\bexposed\s+flesh\b/gi, "")
    .replace(/\btorn\s+flesh\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeScavengerFoodZone(value: unknown) {
  const text = cleanText(value);
  if (!text) return GENERIC_SAFE_FOOD_ZONE;

  const lower = text.toLowerCase();
  if (lower.includes("deer")) return DEER_SAFE_FOOD_ZONE;

  if (RISKY_FOOD_TERMS.test(text)) return GENERIC_SAFE_FOOD_ZONE;

  if (/\bfood\s+claim\s+zone\b/i.test(text)) {
    return text + ", food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds";
  }

  const descriptor = safeDescriptor(text);
  if (!descriptor || /^(zone|food zone|food source|claim zone)$/i.test(descriptor)) {
    return GENERIC_SAFE_FOOD_ZONE;
  }

  return "non-graphic " + descriptor + " food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds";
}
