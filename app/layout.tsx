import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Lolosel — Old Loves. New Hands.",
  description:
    "Vancouver's secondhand marketplace. Free to sell, courier-run handoff, escrow-held payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
          <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
            Lolosel demo — payments, couriers, and withdrawals are simulated. Vancouver, BC.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
