import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { id } = await params;

    const translation = await db.translation.findUnique({ where: { id } });
    if (!translation || translation.userId !== user.id) {
      return NextResponse.json({ error: "Result not found." }, { status: 404 });
    }

    return NextResponse.json({ translation });
  } catch (err) {
    console.error("Get translation error:", err);
    return NextResponse.json({ error: "Could not load result." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { id } = await params;

    const translation = await db.translation.findUnique({ where: { id } });
    if (!translation || translation.userId !== user.id) {
      return NextResponse.json({ error: "Result not found." }, { status: 404 });
    }

    await db.translation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete translation error:", err);
    return NextResponse.json(
      { error: "Could not delete result." },
      { status: 500 }
    );
  }
}
