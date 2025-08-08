import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function fmtDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtMonth(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const range = params.get("range") === "monthly" ? "monthly" : "daily";
  const startParam = params.get("start");
  const endParam = params.get("end");
  const start = startParam ? new Date(startParam) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = endParam ? new Date(endParam) : new Date();

  const appts = await prisma.appointment.findMany({
    where: {
      status: { in: ["SCHEDULED", "CONFIRMED", "COMPLETED"] },
      startTime: { gte: start, lte: end },
    },
    include: { service: true },
  });

  const bucketed: Record<string, number> = {};
  for (const a of appts) {
    const key = range === "monthly" ? fmtMonth(a.startTime) : fmtDay(a.startTime);
    bucketed[key] = (bucketed[key] || 0) + a.service.priceCents;
  }

  const data = Object.entries(bucketed)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, cents]) => ({ period, cents }));

  return NextResponse.json({ range, data });
}