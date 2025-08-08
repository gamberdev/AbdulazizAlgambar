"use client";

import { Calendar, dateFnsLocalizer, Event, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo } from "react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export type CalendarEvent = Event & { id: string; customerName: string; serviceName: string };

export default function AppointmentsCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
}: {
  events: CalendarEvent[];
  onSelectEvent?: (e: CalendarEvent) => void;
  onSelectSlot?: (slot: SlotInfo) => void;
}) {
  const memoEvents = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        title: `${e.customerName} • ${e.serviceName}`,
        start: new Date(e.start as any),
        end: new Date(e.end as any),
      })),
    [events]
  );

  return (
    <div className="h-[80vh] bg-white rounded shadow">
      <Calendar
        localizer={localizer}
        events={memoEvents}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectEvent={(e) => onSelectEvent?.(e as CalendarEvent)}
        onSelectSlot={(slot) => onSelectSlot?.(slot)}
        views={["month", "week", "day"]}
        defaultView="week"
        step={30}
        timeslots={2}
      />
    </div>
  );
}