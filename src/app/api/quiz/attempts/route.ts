import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const attempts = await db.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ attempts });
  } catch (err) {
    console.error("List quiz attempts error:", err);
    return NextResponse.json(
      { error: "Could not load quiz history." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Login to save your quiz score." },
        { status: 401 }
      );
    }
    const body = await req.json();
    const topic = String(body.topic ?? "Sanskrit Basics").slice(0, 80);
    const score = Number(body.score);
    const total = Number(body.total);

    if (
      !Number.isFinite(score) ||
      !Number.isFinite(total) ||
      score < 0 ||
      total <= 0 ||
      score > total
    ) {
      return NextResponse.json({ error: "Invalid quiz score." }, { status: 400 });
    }

    const attempt = await db.quizAttempt.create({
      data: { userId: user.id, topic, score: Math.round(score), total: Math.round(total) },
    });
    return NextResponse.json({ attempt });
  } catch (err) {
    console.error("Save quiz attempt error:", err);
    return NextResponse.json(
      { error: "Could not save quiz score." },
      { status: 500 }
    );
  }
}
