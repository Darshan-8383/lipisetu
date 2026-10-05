import { NextRequest, NextResponse } from "next/server";
import { getZAI, extractJson, EngineUnavailableError } from "@/lib/zai";

// 60s keeps this within the Vercel Hobby plan function limit.
export const maxDuration = 60;

type TranslationResult = {
  english: string;
  kannada: string;
  transliteration: string;
  notes: string;
};

const SYSTEM_PROMPT = `You are an expert Sanskrit scholar and translator specializing in ancient Indian epigraphy (inscriptions on temple walls, copper plates, and stone). You are fluent in English and Kannada.

Task: Translate the given Sanskrit (Devanagari) text into:
1. English - a faithful, scholarly translation. For inscriptional formulas use accepted epigraphic conventions (e.g. "svasti śrī" may be kept with an explanation).
2. Kannada - a natural, fluent Kannada rendering of the same meaning.

Also provide:
- transliteration: the IAST romanization of the Sanskrit source.
- notes: 2-4 sentences of context - explain key terms, inscriptional formulas, grammar, or historical conventions a learner would find useful.

Return ONLY a valid JSON object with exactly these keys:
{"english": "...", "kannada": "...", "transliteration": "...", "notes": "..."}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Sanskrit text is required." },
        { status: 400 }
      );
    }
    if (text.length > 4000) {
      return NextResponse.json(
        { error: "Text is too long (max 4000 characters)." },
        { status: 400 }
      );
    }

    const zai = await getZAI();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Translate this Sanskrit text:\n\n${text}` },
      ],
      thinking: { type: "disabled" },
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = extractJson<TranslationResult>(raw);

    if (!parsed || !parsed.english) {
      return NextResponse.json(
        { error: "Translation failed. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      english: parsed.english.trim(),
      kannada: (parsed.kannada ?? "").trim(),
      transliteration: (parsed.transliteration ?? "").trim(),
      notes: (parsed.notes ?? "").trim(),
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
    console.error("Translation error:", err);
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}
