import { NextResponse } from "next/server";

import { getCopyPolishProviderAvailability } from "@/lib/copy-polish-providers";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    providers: getCopyPolishProviderAvailability({
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    }),
  });
}
