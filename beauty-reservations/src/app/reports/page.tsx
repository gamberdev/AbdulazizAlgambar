"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReportsPage() {
  const daily = useSWR<{ range: string; data: { period: string; cents: number }[] }>("/api/reports/sales?range=daily", fetcher);
  const monthly = useSWR<{ range: string; data: { period: string; cents: number }[] }>("/api/reports/sales?range=monthly", fetcher);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sales Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow">
          <h2 className="p-4 font-medium">Daily (last 30 days)</h2>
          <ul>
            {(daily.data?.data || []).map((r) => (
              <li key={r.period} className="flex justify-between p-2 border-t">
                <span>{r.period}</span>
                <span>{(r.cents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded shadow">
          <h2 className="p-4 font-medium">Monthly</h2>
          <ul>
            {(monthly.data?.data || []).map((r) => (
              <li key={r.period} className="flex justify-between p-2 border-t">
                <span>{r.period}</span>
                <span>{(r.cents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}