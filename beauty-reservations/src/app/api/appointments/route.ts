import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/schemas";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const start = params.get("start");
  const end = params.get("end");
  const where: any = {};
  if (start && end) {
    where.startTime = { gte: new Date(start), lt: new Date(end) };
  }
  const appointments = await prisma.appointment.findMany({
    where,
    include: { customer: true, service: true },
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createAppointmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { customerId, serviceId, startTime, endTime, notes, status } = parsed.data;

  // Ensure no double-booking for the same time & service
  const overlap = await prisma.appointment.count({
    where: {
      serviceId,
      NOT: [
        { endTime: { lte: new Date(startTime) } },
        { startTime: { gte: new Date(endTime) } },
      ],
    },
  });
  if (overlap > 0) return NextResponse.json({ error: "Timeslot overlaps another appointment" }, { status: 409 });

  const created = await prisma.appointment.create({
    data: {
      customerId,
      serviceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes: notes || null,
      status: status || "SCHEDULED",
    },
    include: { customer: true, service: true },
  });

  // WhatsApp confirmation
  const body = `Hi ${created.customer.firstName}, your appointment for ${created.service.name} is scheduled on ${format(created.startTime, "PPPp")}.`;
  const sendResult = await sendWhatsAppMessage(created.customer.phone, body);
  await prisma.notificationLog.create({
    data: {
      type: "WHATSAPP_CONFIRMATION",
      toPhone: created.customer.phone,
      appointmentId: created.id,
      status: sendResult.status,
      error: null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}