/**
 * LipiSetu — Client-side Gemini API integration.
 *
 * All Gemini calls run in the USER'S BROWSER and go directly to Google's
 * Gemini API (generativelanguage.googleapis.com) with the user's own API
 * key. The key is never sent to the LipiSetu server. This matters because
 * the sandbox/server network may be in a region where the Gemini API is
 * unavailable, while the user's own network is supported.
 *
 * Features:
 *  - Model discovery (ListModels) with smart ranking so "Gemini 3.5 Flash
 *    Lite" resolves to the exact model id available for the key.
 *  - Inscription OCR (vision) with JSON-structured output.
 *  - Sanskrit → English + Kannada translation.
 *  - Translated-image generation (Gemini image models, Imagen fallback).
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const LS_KEY_OVERRIDE = "lipisetu.gemini.key";
const LS_MODELS_CACHE = "lipisetu.gemini.models.v2";
const MODELS_TTL_MS = 10 * 60 * 1000;

export type GeminiModelInfo = {
  name: string;
  displayName?: string;
  outputModalities?: string[];
  supportsGenerateContent: boolean;
  supportsPredict: boolean;
};

export type ResolvedModels = {
  textModel: string | null;
  imageModel: string | null;
  imageKind: "gemini" | "imagen" | null;
};

export type GeminiErrorCode =
  | "no-key"
  | "invalid-key"
  | "geo-blocked"
  | "quota"
  | "no-model"
  | "no-image-model"
  | "network"
  | "safety"
  | "api";

export class GeminiError extends Error {
  code: GeminiErrorCode;
  detail?: string;

  constructor(code: GeminiErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.detail = detail;
  }
}

/* ------------------------------------------------------------------ */
/* Key management                                                      */
/* ------------------------------------------------------------------ */

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    try {
      const v = window.localStorage.getItem(LS_KEY_OVERRIDE);
      if (v && v.trim().length > 10) return v.trim();
    } catch {
      /* ignore */
    }
  }
  return (process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "").trim();
}

/** Persist a personal key override in this browser (falls back to env key when removed). */
export function setApiKeyOverride(key: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (key && key.trim().length > 10) {
      window.localStorage.setItem(LS_KEY_OVERRIDE, key.trim());
    } else {
      window.localStorage.removeItem(LS_KEY_OVERRIDE);
    }
    window.localStorage.removeItem(LS_MODELS_CACHE);
  } catch {
    /* ignore */
  }
}

export function hasApiKeyOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(LS_KEY_OVERRIDE);
    return !!(v && v.trim().length > 10);
  } catch {
    return false;
  }
}

export function maskKey(key: string): string {
  if (!key) return "—";
  if (key.length <= 12) return key.slice(0, 4) + "…";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

/* ------------------------------------------------------------------ */
/* JSON extraction (client-safe duplicate of the server helper)         */
/* ------------------------------------------------------------------ */

function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Model discovery                                                     */
/* ------------------------------------------------------------------ */

async function toGeminiError(res: Response): Promise<GeminiError> {
  let msg = `Gemini API error (HTTP ${res.status})`;
  try {
    const data = (await res.json()) as {
      error?: { message?: string; status?: string };
    };
    if (data?.error?.message) msg = data.error.message;
  } catch {
    /* ignore */
  }
  if (res.status === 400 && /location/i.test(msg)) {
    return new GeminiError(
      "geo-blocked",
      "The Gemini API is not available from this network's location. LipiSetu will use its built-in engine instead.",
      msg
    );
  }
  if (res.status === 401 || res.status === 403) {
    return new GeminiError(
      "invalid-key",
      "Your Gemini API key was rejected. Check the key in Profile → AI Engine.",
      msg
    );
  }
  if (res.status === 404) {
    return new GeminiError(
      "no-model",
      "The configured Gemini model is not available for this key.",
      msg
    );
  }
  if (res.status === 429) {
    return new GeminiError(
      "quota",
      "Gemini API rate limit reached. Please retry in a moment.",
      msg
    );
  }
  return new GeminiError("api", msg, msg);
}

async function fetchModels(): Promise<GeminiModelInfo[]> {
  const key = getApiKey();
  if (!key) {
    throw new GeminiError(
      "no-key",
      "No Gemini API key is configured for LipiSetu."
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${API_BASE}/models?pageSize=1000`, {
      headers: { "x-goog-api-key": key },
      signal: controller.signal,
    });
    if (!res.ok) throw await toGeminiError(res);
    const data = (await res.json()) as {
      models?: Array<{
        name?: string;
        displayName?: string;
        outputModalities?: string[];
        supportedGenerationMethods?: string[];
      }>;
    };
    return (data.models ?? [])
      .map((m) => ({
        name: String(m.name ?? "").replace(/^models\//, ""),
        displayName: m.displayName,
        outputModalities: m.outputModalities,
        supportsGenerateContent: (m.supportedGenerationMethods ?? []).includes(
          "generateContent"
        ),
        supportsPredict: (m.supportedGenerationMethods ?? []).includes(
          "predict"
        ),
      }))
      .filter((m) => m.name.length > 0);
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiError("network", "The Gemini API request timed out.");
    }
    throw new GeminiError(
      "network",
      "Could not reach the Gemini API from your browser.",
      String(e)
    );
  } finally {
    clearTimeout(timer);
  }
}

function versionOf(name: string): number {
  const m = name.match(/gemini-(\d+)(?:\.(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + Number(m[2] ?? 0) / 100;
}

const isStable = (n: string) => !/preview|exp|legacy|deprecated/i.test(n);

/** Rank model names, preferring the newest stable version. */
function byVersionDesc(a: GeminiModelInfo, b: GeminiModelInfo): number {
  const v = versionOf(b.name) - versionOf(a.name);
  if (v !== 0) return v;
  return (isStable(b.name) ? 1 : 0) - (isStable(a.name) ? 1 : 0);
}

function pickTextModel(models: GeminiModelInfo[]): string | null {
  const envPref = (process.env.NEXT_PUBLIC_GEMINI_MODEL ?? "gemini-3.5-flash-lite").trim();
  const usable = models.filter(
    (m) =>
      m.supportsGenerateContent &&
      !/embedding|aqa|tts|native-audio|image|imagen|veo|learnlm|robotics|live|thinking/i.test(
        m.name
      )
  );
  const tiers: Array<(n: string) => boolean> = [
    (n) => n === envPref,
    (n) => /^gemini-3\.5-flash-lite/.test(n) && isStable(n),
    (n) => /^gemini-3\.5-flash-lite/.test(n),
    (n) => /^gemini-3[^.]*-flash-lite/.test(n) && isStable(n),
    (n) => /^gemini-3[^.]*-flash-lite/.test(n),
    (n) => /flash-lite/.test(n) && isStable(n),
    (n) => /flash-lite/.test(n),
    (n) => /flash/.test(n) && isStable(n),
    (n) => /^gemini-\d/.test(n) && isStable(n),
  ];
  for (const tier of tiers) {
    const hit = usable.filter((m) => tier(m.name)).sort(byVersionDesc);
    if (hit.length) return hit[0].name;
  }
  return null;
}

function pickImageModel(
  models: GeminiModelInfo[]
): { imageModel: string | null; imageKind: "gemini" | "imagen" | null } {
  const imgCapable = models.filter(
    (m) =>
      m.supportsGenerateContent && (m.outputModalities ?? []).includes("IMAGE")
  );
  const flashImage = imgCapable.filter((m) =>
    /gemini-[\d.]+-flash-image/.test(m.name)
  );
  const pool = flashImage.length ? flashImage : imgCapable;
  if (pool.length) {
    pool.sort(byVersionDesc);
    return { imageModel: pool[0].name, imageKind: "gemini" };
  }
  const imagen = models
    .filter((m) => m.supportsPredict && /^imagen-\d/.test(m.name))
    .sort((a, b) => versionOf(b.name) - versionOf(a.name));
  if (imagen.length) {
    return { imageModel: imagen[0].name, imageKind: "imagen" };
  }
  return { imageModel: null, imageKind: null };
}

/** Discover and cache the best models for this API key. */
export async function resolveModels(force = false): Promise<
  ResolvedModels & { all: GeminiModelInfo[] }
> {
  if (!force && typeof window !== "undefined") {
    try {
      const cached = JSON.parse(
        window.localStorage.getItem(LS_MODELS_CACHE) ?? "null"
      ) as
        | (ResolvedModels & { all?: GeminiModelInfo[]; at?: number })
        | null;
      if (
        cached &&
        cached.at &&
        Date.now() - cached.at < MODELS_TTL_MS &&
        cached.textModel
      ) {
        return {
          textModel: cached.textModel,
          imageModel: cached.imageModel ?? null,
          imageKind: cached.imageKind ?? null,
          all: cached.all ?? [],
        };
      }
    } catch {
      /* ignore */
    }
  }
  const all = await fetchModels();
  const textModel =
    pickTextModel(all) ||
    (process.env.NEXT_PUBLIC_GEMINI_MODEL ?? "").trim() ||
    null;
  const { imageModel, imageKind } = pickImageModel(all);
  const result: ResolvedModels & { all: GeminiModelInfo[] } = {
    textModel,
    imageModel,
    imageKind,
    all,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        LS_MODELS_CACHE,
        JSON.stringify({ ...result, at: Date.now() })
      );
    } catch {
      /* ignore */
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* generateContent core                                                */
/* ------------------------------------------------------------------ */

type Part =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type GenerateOpts = {
  json?: boolean;
  temperature?: number;
  responseModalities?: string[];
  timeoutMs?: number;
};

function splitDataUrl(
  dataUrl: string
): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) {
    throw new GeminiError("api", "Invalid image data URL.");
  }
  return { mimeType: m[1], data: m[2] };
}

async function generateContent(
  model: string,
  parts: Part[],
  opts: GenerateOpts = {}
): Promise<{ text: string; images: string[] }> {
  const key = getApiKey();
  if (!key) {
    throw new GeminiError(
      "no-key",
      "No Gemini API key is configured for LipiSetu."
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);
  try {
    const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
          ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
          ...(opts.responseModalities
            ? { responseModalities: opts.responseModalities }
            : {}),
        },
      }),
    });
    if (!res.ok) throw await toGeminiError(res);
    const data = (await res.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
    };
    const cand = data.candidates?.[0];
    const parts2 = cand?.content?.parts ?? [];
    const text = parts2.map((p) => p.text ?? "").join("");
    const images = parts2
      .map((p) => {
        const inline = p.inlineData ?? p.inline_data;
        if (!inline?.data) return null;
        const mime =
          (inline as { mimeType?: string }).mimeType ??
          (inline as { mime_type?: string }).mime_type ??
          "image/png";
        return `data:${mime};base64,${inline.data}`;
      })
      .filter((x): x is string => !!x);

    const finish = cand?.finishReason;
    if (finish === "SAFETY" || finish === "PROHIBITED_CONTENT" || finish === "BLOCKLIST") {
      throw new GeminiError(
        "safety",
        "Gemini declined to generate this content. Try again or adjust the input."
      );
    }
    return { text, images };
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiError("network", "The Gemini API request timed out.");
    }
    throw new GeminiError(
      "network",
      "Could not reach the Gemini API from your browser.",
      String(e)
    );
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Public API: OCR + translation + translated image                    */
/* ------------------------------------------------------------------ */

export type OcrResult = {
  sanskrit: string;
  transliteration: string;
  notes: string;
  hasDevanagari: boolean;
};

const OCR_PROMPT = `You are LipiSetu OCR, an expert epigrapher specializing in ancient Indian inscriptions written in Sanskrit and scripts ancestral to Devanagari (Nagari, Siddham, Grantha-influenced Nagari etc.).

Analyze the inscription image and transcribe the visible text into MODERN DEVANAGARI script (Sanskrit). Reconstruct worn or partially damaged characters using epigraphic context when reasonable.

Rules:
- Transcribe line by line, in reading order. Keep the original line breaks using the newline character.
- If the inscription begins with traditional auspicious formulas (e.g. स्वस्ति श्री, सिद्धम्, ॐ), keep them.
- If parts are illegible, mark them with the placeholder […].
- Provide an IAST scholarly transliteration of your transcription.
- Write brief notes (1-3 sentences) about the script condition and any reconstruction you made.
- If the image contains no readable Devanagari/inscription text at all, set hasDevanagari to false and leave the text empty.

Return ONLY a valid JSON object with exactly these keys:
{"sanskrit": "...", "transliteration": "...", "notes": "...", "hasDevanagari": true}`;

export async function geminiOcr(
  imageDataUrl: string
): Promise<OcrResult & { model: string }> {
  const { textModel } = await resolveModels();
  if (!textModel) {
    throw new GeminiError(
      "no-model",
      "No suitable Gemini text/vision model was found for this API key."
    );
  }
  const { mimeType, data } = splitDataUrl(imageDataUrl);
  const { text } = await generateContent(
    textModel,
    [{ text: OCR_PROMPT }, { inline_data: { mime_type: mimeType, data } }],
    { json: true, temperature: 0.1 }
  );
  const parsed = extractJson<OcrResult>(text);
  if (!parsed || typeof parsed.sanskrit !== "string" || !parsed.sanskrit.trim()) {
    throw new GeminiError(
      "api",
      "Gemini returned an unreadable OCR response."
    );
  }
  return {
    sanskrit: parsed.sanskrit.trim(),
    transliteration: (parsed.transliteration ?? "").trim(),
    notes: (parsed.notes ?? "").trim(),
    hasDevanagari:
      typeof parsed.hasDevanagari === "boolean"
        ? parsed.hasDevanagari
        : /[\u0900-\u097F]/.test(parsed.sanskrit),
    model: textModel,
  };
}

export type TranslationResult = {
  english: string;
  kannada: string;
  transliteration: string;
  notes: string;
};

const TRANSLATE_PROMPT = `You are an expert Sanskrit scholar and translator specializing in ancient Indian epigraphy (inscriptions on temple walls, copper plates, and stone). You are fluent in English and Kannada.

Task: Translate the given Sanskrit (Devanagari) text into:
1. English - a faithful, scholarly translation. For inscriptional formulas use accepted epigraphic conventions (e.g. "svasti śrī" may be kept with an explanation).
2. Kannada - a natural, fluent Kannada rendering of the same meaning.

Also provide:
- transliteration: the IAST romanization of the Sanskrit source.
- notes: 2-4 sentences of context - explain key terms, inscriptional formulas, grammar, or historical conventions a learner would find useful.

Return ONLY a valid JSON object with exactly these keys:
{"english": "...", "kannada": "...", "transliteration": "...", "notes": "..."}`;

export async function geminiTranslate(
  sanskritText: string
): Promise<TranslationResult & { model: string }> {
  const { textModel } = await resolveModels();
  if (!textModel) {
    throw new GeminiError(
      "no-model",
      "No suitable Gemini text model was found for this API key."
    );
  }
  const { text } = await generateContent(
    textModel,
    [{ text: `${TRANSLATE_PROMPT}\n\nSanskrit text to translate:\n${sanskritText}` }],
    { json: true, temperature: 0.2 }
  );
  const parsed = extractJson<TranslationResult>(text);
  if (!parsed || !parsed.english) {
    throw new GeminiError(
      "api",
      "Gemini returned an unreadable translation."
    );
  }
  return {
    english: parsed.english.trim(),
    kannada: (parsed.kannada ?? "").trim(),
    transliteration: (parsed.transliteration ?? "").trim(),
    notes: (parsed.notes ?? "").trim(),
    model: textModel,
  };
}

export type TranslatedImageInput = {
  originalImage?: string | null;
  sanskrit: string;
  transliteration?: string | null;
  english?: string | null;
  kannada?: string | null;
};

const clip = (s: string | null | undefined, n: number): string => {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

function buildImagePrompt(input: TranslatedImageInput): string {
  const lines = [
    "Create a single clean, elegant digital museum plaque that presents the translation of an ancient stone inscription.",
    "",
    "Design requirements:",
    "- Warm ivory-parchment background with a very subtle stone texture",
    "- A refined terracotta and antique-gold double border frame",
    "- Elegant, highly legible typography with a museum-label aesthetic",
    "- All text must be crisp, correctly spelled and correctly rendered, including the Devanagari and Kannada scripts",
    "- No watermark, no logo, no decorative gibberish text",
    ...(input.originalImage
      ? [
          "- At the top of the plaque, include a small framed reproduction of the inscription photograph provided",
        ]
      : []),
    "",
    "Render EXACTLY this text (do not translate, alter, add or omit anything):",
    'Title line: "LipiSetu — Inscription Translation"',
    `Sanskrit (Devanagari): "${clip(input.sanskrit, 260)}"`,
    `English: "${clip(input.english, 260)}"`,
    `Kannada: "${clip(input.kannada, 260)}"`,
  ];
  return lines.join("\n");
}

export async function geminiTranslatedImage(
  input: TranslatedImageInput
): Promise<{ dataUrl: string; model: string }> {
  let imageModel: string | null;
  let imageKind: "gemini" | "imagen" | null;
  try {
    const resolved = await resolveModels();
    imageModel = resolved.imageModel;
    imageKind = resolved.imageKind;
  } catch (e) {
    if (e instanceof GeminiError) {
      // Re-word connectivity issues for the image-generation context.
      throw new GeminiError(
        e.code,
        `${e.message} The “Clean Card” tab always produces a downloadable translated image.`
      );
    }
    throw e;
  }
  if (!imageModel || !imageKind) {
    throw new GeminiError(
      "no-image-model",
      "No Gemini image-generation model is available with this API key. You can still download the clean translation card."
    );
  }

  if (imageKind === "imagen") {
    const key = getApiKey();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(
        `${API_BASE}/models/${imageModel}:predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          signal: controller.signal,
          body: JSON.stringify({
            instances: [{ prompt: buildImagePrompt(input) }],
            parameters: { sampleCount: 1 },
          }),
        }
      );
      if (!res.ok) throw await toGeminiError(res);
      const data = (await res.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
      };
      const b64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) {
        throw new GeminiError("api", "The image model returned no image.");
      }
      return {
        dataUrl: `data:${data.predictions?.[0]?.mimeType ?? "image/png"};base64,${b64}`,
        model: imageModel,
      };
    } catch (e) {
      if (e instanceof GeminiError) throw e;
      throw new GeminiError(
        "network",
        "Could not reach the Gemini API from your browser.",
        String(e)
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // Gemini image model (generateContent with IMAGE output modality)
  const parts: Part[] = [{ text: buildImagePrompt(input) }];
  if (input.originalImage) {
    try {
      const { mimeType, data } = splitDataUrl(input.originalImage);
      parts.push({ inline_data: { mime_type: mimeType, data } });
    } catch {
      /* continue without the reference image */
    }
  }
  // Some model versions only accept a specific modality set — try both.
  const attempts: string[][] = [["IMAGE"], ["TEXT", "IMAGE"]];
  let lastError: GeminiError | null = null;
  for (const modalities of attempts) {
    try {
      const { images } = await generateContent(imageModel, parts, {
        responseModalities: modalities,
        temperature: 0.4,
        timeoutMs: 150_000,
      });
      if (images.length) {
        return { dataUrl: images[0], model: imageModel };
      }
      lastError = new GeminiError(
        "api",
        "The image model returned no image. Please try regenerating."
      );
    } catch (e) {
      const ge = e instanceof GeminiError ? e : new GeminiError("api", String(e));
      const retryable =
        ge.code === "api" &&
        /modalit/i.test(ge.detail ?? ge.message ?? "");
      lastError = ge;
      if (!retryable) throw ge;
    }
  }
  throw (
    lastError ??
    new GeminiError("api", "The image model returned no image.")
  );
}

/* ------------------------------------------------------------------ */
/* AI assistant (multi-turn chat)                                      */
/* ------------------------------------------------------------------ */

export type ChatTurn = { role: "user" | "assistant"; text: string };

export type AssistantContext = {
  view?: string;
  sanskrit?: string;
  transliteration?: string;
  english?: string;
  kannada?: string;
  notes?: string;
};

const ASSISTANT_SYSTEM = `You are LipiSetu Assistant, a friendly and knowledgeable guide inside the LipiSetu app (Sanskrit inscription translation + Sanskrit learning).

You help with:
- Sanskrit grammar, vocabulary, sandhi, word meanings and pronunciation
- Reading and understanding ancient Indian inscriptions (epigraphy), scripts (Brahmi, Nagari, Siddham, Grantha), dynasties, eras and inscription formulas
- Explaining the translation currently shown in the app, word by word if asked
- Kannada and English renderings of Sanskrit text
- Tips for photographing inscriptions and using the app (upload, enhance, OCR, edit text, translate, translated image, history, learn section, quiz)

Style rules:
- Be concise and clear; use short paragraphs or short lists. Use Devanagari for Sanskrit with IAST in brackets when helpful.
- Reply in the language the user writes in (English or Kannada).
- If OCR text may be wrong (worn stone), say so honestly instead of inventing certainty. Never fabricate historical facts, dates or dynasties; say when you are unsure.
- Stay on topic (Sanskrit, inscriptions, heritage, the app). Politely decline unrelated requests.`;

function contextBlock(ctx?: AssistantContext): string {
  if (!ctx) return "";
  const rows: string[] = [];
  if (ctx.view) rows.push(`Current screen: ${ctx.view}`);
  if (ctx.sanskrit) rows.push(`Sanskrit text in the app:\n${ctx.sanskrit.slice(0, 1500)}`);
  if (ctx.transliteration) rows.push(`Transliteration: ${ctx.transliteration.slice(0, 1200)}`);
  if (ctx.english) rows.push(`English translation: ${ctx.english.slice(0, 1500)}`);
  if (ctx.kannada) rows.push(`Kannada translation: ${ctx.kannada.slice(0, 1500)}`);
  if (ctx.notes) rows.push(`Notes: ${ctx.notes.slice(0, 800)}`);
  if (rows.length <= 1) return "";
  return `\n\nThe user is currently working on this inscription (use it when they say "this", "the text", "the translation"):\n${rows.join("\n")}`;
}

/** Send a multi-turn conversation to Gemini and return the assistant's reply. */
export async function geminiChat(
  history: ChatTurn[],
  context?: AssistantContext
): Promise<{ reply: string; model: string }> {
  const key = getApiKey();
  if (!key) {
    throw new GeminiError(
      "no-key",
      "No Gemini API key is configured. Add one in Profile → AI Engine."
    );
  }
  const { textModel } = await resolveModels();
  if (!textModel) {
    throw new GeminiError(
      "no-model",
      "No suitable Gemini text model was found for this API key."
    );
  }
  const turns = history.slice(-12);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${API_BASE}/models/${textModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: ASSISTANT_SYSTEM + contextBlock(context) }],
        },
        contents: turns.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.text }],
        })),
        generationConfig: { temperature: 0.5 },
      }),
    });
    if (!res.ok) throw await toGeminiError(res);
    const data = (await res.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const cand = data.candidates?.[0];
    if (cand?.finishReason === "SAFETY" || cand?.finishReason === "PROHIBITED_CONTENT") {
      throw new GeminiError(
        "safety",
        "Gemini declined to answer that. Try rephrasing your question."
      );
    }
    const reply = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    if (!reply) throw new GeminiError("api", "Gemini returned an empty reply.");
    return { reply, model: textModel };
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiError("network", "The Gemini API request timed out.");
    }
    throw new GeminiError(
      "network",
      "Could not reach the Gemini API from your browser.",
      String(e)
    );
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Downscale/re-encode a data URL before sending it to the Gemini API. */
export async function downscaleForApi(
  dataUrl: string,
  maxDim = 1600,
  quality = 0.9
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load image"));
    el.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** "gemini-3.5-flash-lite" → "Gemini 3.5 Flash Lite" */
export function prettyModelName(id: string | null | undefined): string {
  if (!id) return "";
  const name = id.replace(/^gemini-/, "");
  const pretty = name
    .split(/[-_]/)
    .map((p) => {
      if (/^\d/.test(p)) return p;
      if (p === "lite") return "Lite";
      if (p === "pro") return "Pro";
      if (p === "flash") return "Flash";
      if (p === "image") return "Image";
      if (/^latest$/i.test(p)) return "";
      if (/^preview/i.test(p)) return "Preview";
      if (/^\d{2}-\d{4}$/.test(p)) return "";
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .filter(Boolean)
    .join(" ");
  return id.startsWith("gemini") ? "OCR" : pretty;
}

/** Quick connectivity test used by the Profile → AI Engine card. */
export async function testGeminiConnection(): Promise<
  | { ok: true; textModel: string; imageModel: string | null; imageKind: string | null }
  | { ok: false; error: string; code: GeminiErrorCode }
> {
  try {
    const { textModel, imageModel, imageKind } = await resolveModels(true);
    if (!textModel) {
      return {
        ok: false,
        code: "no-model",
        error:
          "No suitable Gemini model was found for this API key (expected a Flash Lite model).",
      };
    }
    const { text } = await generateContent(
      textModel,
      [{ text: "Reply with the single word: OK" }],
      { temperature: 0 }
    );
    if (!text.trim()) {
      return {
        ok: false,
        code: "api",
        error: "Gemini responded with an empty reply.",
      };
    }
    return { ok: true, textModel, imageModel, imageKind };
  } catch (e) {
    const ge =
      e instanceof GeminiError
        ? e
        : new GeminiError("api", "Unexpected error while contacting Gemini.");
    return { ok: false, error: ge.message, code: ge.code };
  }
}
