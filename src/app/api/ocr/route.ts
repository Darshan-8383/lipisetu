import { NextRequest, NextResponse } from "next/server";
import { getZAI, extractJson, EngineUnavailableError } from "@/lib/zai";

// 60s keeps this within the Vercel Hobby plan function limit.
export const maxDuration = 60;

type OcrResult = {
  sanskrit: string;
  transliteration: string;
  notes: string;
  hasDevanagari: boolean;
};

const PROMPT = `You are LipiSetu OCR, an expert epigrapher specializing in ancient Indian inscriptions written in Sanskrit and scripts ancestral to Devanagari (Nagari, Siddham, Grantha-influenced Nagari etc.).

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image = String(body.image ?? "");

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "A valid image is required." },
        { status: 400 }
      );
    }

    const zai = await getZAI();
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = extractJson<OcrResult>(raw);

    if (!parsed || typeof parsed.sanskrit !== "string") {
      // Fall back to raw text if JSON parsing failed
      const text = raw.trim();
      if (text) {
        return NextResponse.json({
          sanskrit: text,
          transliteration: "",
          notes: "Extracted with basic OCR mode.",
          hasDevanagari: /[\u0900-\u097F]/.test(text),
        });
      }
      return NextResponse.json(
        { error: "Could not read text from this image. Try enhancing it or use a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      sanskrit: parsed.sanskrit.trim(),
      transliteration: (parsed.transliteration ?? "").trim(),
      notes: (parsed.notes ?? "").trim(),
      hasDevanagari:
        typeof parsed.hasDevanagari === "boolean"
          ? parsed.hasDevanagari
          : /[\u0900-\u097F]/.test(parsed.sanskrit),
    });
  } catch (err) {
    if (err instanceof EngineUnavailableError) {
      return NextResponse.json(
        {
          error: err.message,
          engineUnavailable: true,
        },
        { status: 503 }
      );
    }
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: "OCR failed. Please try again with a clearer image." },
      { status: 500 }
    );
  }
}
