import "server-only";
import OpenAI from "openai";

/**
 * Cerebras exposes an OpenAI-compatible chat completions API, so the
 * official `openai` SDK works unmodified against its base URL.
 */
export const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1",
});

export const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL ?? "gpt-oss-120b";
