import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCustomerSchema } from "@/lib/schemas";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = updateCustomerSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email, ...rest } = parsed.data;
  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: { ...rest, email: email ?? undefined },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.appointment.deleteMany({ where: { customerId: params.id } });
  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}