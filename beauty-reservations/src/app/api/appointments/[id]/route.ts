import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAppointmentSchema } from "@/lib/schemas";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { format } from "date-fns";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { customer: true, service: true },
  });
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appointment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = updateAppointmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      customerId: parsed.data.customerId,
      serviceId: parsed.data.serviceId,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
      notes: parsed.data.notes ?? undefined,
      status: parsed.data.status ?? undefined,
    },
    include: { customer: true, service: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.appointment.findUnique({ where: { id: params.id }, include: { customer: true, service: true } });
  if (!existing) return NextResponse.json({ ok: true });

  await prisma.appointment.delete({ where: { id: params.id } });

  // WhatsApp cancellation
  const body = `Hi ${existing.customer.firstName}, your appointment for ${existing.service.name} on ${format(existing.startTime, "PPPp")} has been cancelled.`;
  const sendResult = await sendWhatsAppMessage(existing.customer.phone, body);
  await prisma.notificationLog.create({
    data: {
      type: "WHATSAPP_CANCELLATION",
      toPhone: existing.customer.phone,
      appointmentId: existing.id,
      status: sendResult.status,
      error: null,
    },
  });

  return NextResponse.json({ ok: true });
}