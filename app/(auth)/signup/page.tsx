"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "Vancouver" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setBusy(false);
      return;
    }
    // Auto sign-in after signup
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/browse");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="card p-6">
        <h1 className="font-serif text-2xl font-bold text-stone-800">Join Lolosel</h1>
        <p className="mt-1 text-sm text-stone-500">Buy and sell secondhand around Vancouver.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" required className="input" value={form.name}
              onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" value={form.email}
              onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (8+ characters)</label>
            <input id="password" type="password" required minLength={8} className="input"
              value={form.password} onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="city">Neighbourhood / city</label>
            <input id="city" required className="input" value={form.city}
              onChange={(e) => set("city", e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
