"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CustomersPage() {
  const { data, mutate } = useSWR<any[]>("/api/customers", fetcher);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  async function create() {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ firstName: "", lastName: "", phone: "" });
      mutate();
    } else alert("Error");
  }

  async function remove(id: string) {
    if (!confirm("Delete customer?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>

      <div className="flex gap-2">
        <input className="border p-2 rounded" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={create}>Add</button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">ID</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.firstName} {c.lastName}</td>
              <td className="p-2">{c.phone}</td>
              <td className="p-2 text-xs text-gray-500">{c.id}</td>
              <td className="p-2"><button className="text-red-600" onClick={() => remove(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}