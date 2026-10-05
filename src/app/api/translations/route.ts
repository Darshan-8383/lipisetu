import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const translations = await db.translation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        sanskritText: true,
        englishTranslation: true,
        kannadaTranslation: true,
        saved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ translations });
  } catch (err) {
    console.error("List translations error:", err);
    return NextResponse.json(
      { error: "Could not load translations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please login to save results." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = String(body.title ?? "").trim() || "Untitled Inscription";
    const originalImage = String(body.originalImage ?? "");
    const sanskritText = String(body.sanskritText ?? "").trim();

    if (!sanskritText) {
      return NextResponse.json(
        { error: "Sanskrit text is required to save a result." },
        { status: 400 }
      );
    }
    if (!originalImage.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Original image is required to save a result." },
        { status: 400 }
      );
    }

    const translation = await db.translation.create({
      data: {
        userId: user.id,
        title: title.slice(0, 120),
        originalImage,
        enhancedImage:
          typeof body.enhancedImage === "string" &&
          body.enhancedImage.startsWith("data:image/")
            ? body.enhancedImage
            : null,
        thumbnail:
          typeof body.thumbnail === "string" &&
          body.thumbnail.startsWith("data:image/")
            ? body.thumbnail
            : null,
        translatedImage:
          typeof body.translatedImage === "string" &&
          body.translatedImage.startsWith("data:image/")
            ? body.translatedImage
            : null,
        engine:
          typeof body.engine === "string" && body.engine.trim()
            ? body.engine.trim().slice(0, 80)
            : null,
        sanskritText,
        transliteration: String(body.transliteration ?? "").trim() || null,
        englishTranslation:
          String(body.englishTranslation ?? "").trim() || null,
        kannadaTranslation:
          String(body.kannadaTranslation ?? "").trim() || null,
        notes: String(body.notes ?? "").trim() || null,
        saved: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ translation });
  } catch (err) {
    console.error("Save translation error:", err);
    return NextResponse.json(
      { error: "Could not save the result. Please try again." },
      { status: 500 }
    );
  }
}
