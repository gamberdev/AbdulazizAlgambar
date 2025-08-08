import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beauty Reservations",
  description: "Appointments, WhatsApp notifications, and sales reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <nav className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold">Beauty Reservations</Link>
            <Link href="/appointments" className="text-gray-700 hover:text-black">Appointments</Link>
            <Link href="/customers" className="text-gray-700 hover:text-black">Customers</Link>
            <Link href="/services" className="text-gray-700 hover:text-black">Services</Link>
            <Link href="/reports" className="text-gray-700 hover:text-black">Reports</Link>
            <Link href="/settings" className="text-gray-700 hover:text-black">Settings</Link>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
