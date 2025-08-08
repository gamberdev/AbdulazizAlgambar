import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServiceSchema } from "@/lib/schemas";

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createServiceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { description, ...rest } = parsed.data;
  const service = await prisma.service.create({ data: { ...rest, description: description || null } });
  return NextResponse.json(service, { status: 201 });
}