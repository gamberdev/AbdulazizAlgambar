"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data, mutate } = useSWR<any>("/api/settings", fetcher);
  const [form, setForm] = useState({ businessName: "", timezone: "UTC", openHour: 9, closeHour: 18, slotMinutes: 30, whatsappFrom: "" });

  useEffect(() => {
    if (data) setForm({ ...form, ...data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) mutate();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-4 max-w-xl bg-white rounded shadow p-4">
        <input className="border p-2 rounded" placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        <div className="flex gap-2">
          <input className="border p-2 rounded w-24" type="number" placeholder="Open hour" value={form.openHour} onChange={(e) => setForm({ ...form, openHour: Number(e.target.value) })} />
          <input className="border p-2 rounded w-24" type="number" placeholder="Close hour" value={form.closeHour} onChange={(e) => setForm({ ...form, closeHour: Number(e.target.value) })} />
          <input className="border p-2 rounded w-28" type="number" placeholder="Slot minutes" value={form.slotMinutes} onChange={(e) => setForm({ ...form, slotMinutes: Number(e.target.value) })} />
        </div>
        <input className="border p-2 rounded" placeholder="WhatsApp From (e.g., +1415...)" value={form.whatsappFrom} onChange={(e) => setForm({ ...form, whatsappFrom: e.target.value })} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded w-32" onClick={save}>Save</button>
      </div>
    </div>
  );
}