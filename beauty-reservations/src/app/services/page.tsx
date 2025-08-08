"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ServicesPage() {
  const { data, mutate } = useSWR<any[]>("/api/services", fetcher);
  const [form, setForm] = useState({ name: "", durationMin: 60, priceCents: 0 });

  async function create() {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", durationMin: 60, priceCents: 0 });
      mutate();
    } else alert("Error");
  }

  async function remove(id: string) {
    if (!confirm("Delete service?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Services</h1>

      <div className="flex gap-2 items-center">
        <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 rounded w-40" type="number" placeholder="Duration (min)" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
        <input className="border p-2 rounded w-40" type="number" placeholder="Price (cents)" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={create}>Add</button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Duration</th>
            <th className="p-2">Price (cents)</th>
            <th className="p-2">ID</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.durationMin} min</td>
              <td className="p-2">{s.priceCents}</td>
              <td className="p-2 text-xs text-gray-500">{s.id}</td>
              <td className="p-2"><button className="text-red-600" onClick={() => remove(s.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}