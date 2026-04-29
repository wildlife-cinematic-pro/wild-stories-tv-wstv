function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDefined(base, patch) {
  if (!isObject(patch)) return base;
  const next = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (isObject(value) && isObject(next[key])) {
      next[key] = mergeDefined(next[key], value);
    } else if (typeof value === "string") {
      next[key] = value.trim().length > 0 ? value.trim() : next[key];
    } else {
      next[key] = value;
    }
  }

  return next;
}

function stripJsonFence(value) {
  return String(value)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJsonObject(value) {
  if (!hasText(value)) return null;
  const cleaned = stripJsonFence(value);

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function buildLocalEnhancements(input) {
  const predator = input.predator ?? {};
  const prey = input.prey ?? {};
  const environment = input.environment ?? {};
  const finalScene = input.finalScene ?? {};
  const style = input.aiEnhancement?.style ?? "viral wildlife documentary";

  return {
    predator: {
      description: predator.description,
      identityNotes: predator.identityNotes
    },
    prey: {
      description: prey.description,
      identityNotes: prey.identityNotes
    },
    environment: {
      description: environment.description,
      lighting: environment.lighting,
      rules: environment.rules
    },
    finalScene: {
      composition: finalScene.composition,
      camera: finalScene.camera,
      style: finalScene.style ?? style,
      tension: finalScene.tension,
      action: finalScene.action
    },
    video: input.video,
    aiEnhancement: {
      ...(input.aiEnhancement ?? {}),
      used: false,
      fallbackReason: getGeminiApiKey() ? "gemini unavailable or returned invalid JSON" : "gemini api key missing"
    }
  };
}

export function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  ).trim();
}

export async function safeGeminiGenerate(prompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey || !hasText(prompt)) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.45,
            topP: 0.9,
            maxOutputTokens: 1800,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");
    return hasText(text) ? text : null;
  } catch {
    return null;
  }
}

export async function enhancePromptWithGemini(prompt, context = {}) {
  if (!context?.enabled && context?.enabled !== undefined) return prompt;
  const instruction = [
    "Enhance this wildlife production prompt for Runway/Kling/ElevenLabs while preserving all subject names, roles, tags, and factual constraints.",
    "Use positive control language, stable anatomy, grounded motion, clean readable spacing, and cinematic wildlife documentary specificity.",
    "Return JSON only as {\"prompt\":\"...\"}.",
    `Context: ${JSON.stringify(context)}`,
    `Prompt: ${prompt}`
  ].join("\n");

  const result = parseJsonObject(await safeGeminiGenerate(instruction));
  return hasText(result?.prompt) ? result.prompt.trim() : prompt;
}

export async function enhanceInputWithGemini(input) {
  if (input.aiEnhancement?.enabled === false || input.aiEnhancement?.provider !== "gemini") {
    return mergeDefined(input, { aiEnhancement: { ...(input.aiEnhancement ?? {}), used: false, fallbackReason: "disabled" } });
  }

  const localFallback = buildLocalEnhancements(input);
  const request = [
    "You are enhancing a generic all-animal wildlife storyboard input for a Runway three-reference workflow.",
    "Do not add brand-new animals, locations, contact, gore, people, buildings, roads, text overlays, or secrets.",
    "Do not hardcode any species or place. Preserve the provided animal names, slugs, sides, roles, and environment name.",
    "Strengthen animal descriptions, identity notes, environment detail, final scene prompt fields, Kling prompt intent, Runway prompt intent, and ElevenLabs music intent.",
    "Use positive control wording: animals remain separated, clear open reaction lane, both animals fully visible, clean readable spacing, grounded contact, stable anatomy.",
    "Return JSON only with optional keys predator, prey, environment, finalScene, video, aiEnhancement.",
    `Input JSON: ${JSON.stringify(input)}`
  ].join("\n");

  const result = parseJsonObject(await safeGeminiGenerate(request));
  if (!result) return mergeDefined(input, localFallback);

  return mergeDefined(input, {
    ...result,
    aiEnhancement: {
      ...(input.aiEnhancement ?? {}),
      ...(result.aiEnhancement ?? {}),
      used: true,
      provider: "gemini"
    }
  });
}
