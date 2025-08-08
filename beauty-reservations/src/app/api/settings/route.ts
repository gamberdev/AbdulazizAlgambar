import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/schemas";

export async function GET() {
  const settings = await prisma.setting.findFirst();
  return NextResponse.json(settings ?? null);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const saved = await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return NextResponse.json(saved);
}