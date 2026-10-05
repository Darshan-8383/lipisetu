import { existsSync, readFileSync } from "fs";
import os from "os";
import path from "path";

/**
 * Thrown when the built-in server-side engine (z-ai-web-dev-sdk) is not
 * configured on the current deployment (e.g. on Vercel, where no
 * `.z-ai-config` file exists). The app's primary engine is OCR running
 * in the user's browser, so this only affects the optional server-side
 * fallback.
 */
export class EngineUnavailableError extends Error {
  constructor() {
    super(
      "The built-in engine is not configured on this deployment. OCR (running in your browser) is the primary engine."
    );
    this.name = "EngineUnavailableError";
  }
}

/**
 * Resolve the SDK config the same way the SDK does:
 * ./.z-ai-config → ~/.z-ai-config → /etc/.z-ai-config
 */
function findZaiConfigPath(): string | null {
  const candidates = [
    path.join(process.cwd(), ".z-ai-config"),
    path.join(os.homedir(), ".z-ai-config"),
    "/etc/.z-ai-config",
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p) && readFileSync(p, "utf-8").trim()) return p;
    } catch {
      // ignore unreadable candidates
    }
  }
  return null;
}

/**
 * Singleton accessor for the Z-AI SDK (server-side only).
 * The SDK is lazily imported and its config is pre-checked, so deployments
 * without the config (e.g. Vercel) get a clean EngineUnavailableError
 * instead of a crash.
 */
export async function getZAI() {
  if (!findZaiConfigPath()) throw new EngineUnavailableError();
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  return ZAI.create();
}

/**
 * Extract the first JSON object from an LLM response string.
 * Handles markdown code fences and surrounding prose.
 */
export function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  // Strip markdown fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : raw;
  // Find the outermost { ... } block
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonStr = candidate.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
