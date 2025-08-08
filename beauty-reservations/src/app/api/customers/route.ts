import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createCustomerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, ...rest } = parsed.data;
  const customer = await prisma.customer.create({
    data: { ...rest, email: email || null },
  });
  return NextResponse.json(customer, { status: 201 });
}