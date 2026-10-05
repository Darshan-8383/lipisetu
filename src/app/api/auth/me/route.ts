import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    const [translationCount, quizCount] = await Promise.all([
      db.translation.count({ where: { userId: user.id } }),
      db.quizAttempt.count({ where: { userId: user.id } }),
    ]);
    return NextResponse.json({
      user,
      stats: { translations: translationCount, quizzes: quizCount },
    });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ user: null });
  }
}
