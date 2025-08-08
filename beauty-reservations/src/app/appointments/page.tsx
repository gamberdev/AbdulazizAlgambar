"use client";

import useSWR from "swr";
import AppointmentsCalendar, { CalendarEvent } from "@/components/Calendar";
import { useCallback } from "react";
import { formatISO } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AppointmentsPage() {
  const { data, mutate } = useSWR<
    Array<{ id: string; startTime: string; endTime: string; customer: any; service: any }>
  >("/api/appointments", fetcher);

  const events: CalendarEvent[] = (data || []).map((a) => ({
    id: a.id,
    start: new Date(a.startTime),
    end: new Date(a.endTime),
    customerName: `${a.customer.firstName} ${a.customer.lastName}`,
    serviceName: a.service.name as string,
    title: "",
    allDay: false,
    resource: a,
  }));

  const onSelectSlot = useCallback(
    async ({ start, end }: { start: Date; end: Date }) => {
      const customerId = prompt("Customer ID?");
      if (!customerId) return;
      const serviceId = prompt("Service ID?");
      if (!serviceId) return;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          serviceId,
          startTime: formatISO(start),
          endTime: formatISO(end),
        }),
      });
      if (res.ok) mutate();
      else alert("Error creating appointment");
    },
    [mutate]
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <AppointmentsCalendar events={events} onSelectSlot={onSelectSlot} />
      <p className="text-sm text-gray-500">Tip: Click and drag on the calendar to create a new appointment. Use the Customers and Services pages to find IDs for now.</p>
    </div>
  );
}