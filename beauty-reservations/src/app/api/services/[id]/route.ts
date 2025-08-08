import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateServiceSchema } from "@/lib/schemas";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = updateServiceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { description, ...rest } = parsed.data;
  const updated = await prisma.service.update({
    where: { id: params.id },
    data: { ...rest, description: description ?? undefined },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.appointment.deleteMany({ where: { serviceId: params.id } });
  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}