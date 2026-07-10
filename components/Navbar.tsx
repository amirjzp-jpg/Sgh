"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/listings/new", label: "Sell" },
  { href: "/inbox", label: "Inbox" },
  { href: "/orders", label: "Orders" },
  { href: "/wallet", label: "Wallet" },
  { href: "/courier", label: "Courier" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-serif text-xl font-bold tracking-tight text-brand-700">
            Lolosel
          </span>
          <span className="hidden text-[11px] italic text-stone-400 sm:inline">
            Old Loves. New Hands.
          </span>
        </Link>

        <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                pathname.startsWith(l.href)
                  ? "bg-brand-100 text-brand-800"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {session?.user?.isAdmin && (
            <Link
              href="/admin"
              className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                pathname.startsWith("/admin")
                  ? "bg-brand-100 text-brand-800"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {status === "loading" ? null : session?.user ? (
            <>
              <Link
                href="/profile"
                className="hidden rounded-md px-2.5 py-1.5 font-medium text-stone-600 hover:bg-stone-100 sm:block"
              >
                {session.user.name?.split(" ")[0] ?? "Profile"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md px-2.5 py-1.5 font-medium text-stone-500 hover:bg-stone-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-2.5 py-1.5 font-medium text-stone-600 hover:bg-stone-100">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary !py-1.5">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
