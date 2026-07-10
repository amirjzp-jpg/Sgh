"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

const MAX_IMAGES = 4;

// Resize client-side so uploads stay small enough to store as data URLs
// (the demo's stand-in for object storage).
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 800;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

export default function NewListingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: CATEGORIES[0] as string,
    condition: CONDITIONS[2] as string,
  });
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "unauthenticated") {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-stone-600">You need an account to sell.</p>
        <Link href="/login?callbackUrl=/listings/new" className="btn-primary mt-4">
          Log in
        </Link>
      </div>
    );
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError("");
    try {
      const room = MAX_IMAGES - images.length;
      const files = Array.from(fileList).slice(0, room);
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      setImages((prev) => [...prev, ...dataUrls]);
    } catch {
      setError("Couldn't read one of those images — try a JPG or PNG.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const dollars = Number(form.price);
    if (!Number.isFinite(dollars) || dollars < 1) {
      setError("Price must be at least $1");
      return;
    }
    if (images.length === 0) {
      setError("Add at least one photo");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        priceCents: Math.round(dollars * 100),
        category: form.category,
        condition: form.condition,
        images,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't create the listing");
      return;
    }
    router.push(`/listings/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-stone-800">Sell something</h1>
      <p className="mt-1 text-sm text-stone-500">
        Free to list. A Lolosel courier handles the handoff once it sells.
      </p>

      <form onSubmit={handleSubmit} className="card mt-5 space-y-5 p-6">
        <div>
          <span className="label">Photos (up to {MAX_IMAGES})</span>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900/70 text-xs text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 transition hover:border-brand-600 hover:text-brand-700">
                <span className="text-2xl leading-none">＋</span>
                <span className="mt-1 text-[10px]">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" required minLength={3} maxLength={90} className="input"
            placeholder="Mid-century teak sofa — solid frame"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">Price (CAD)</label>
            <input id="price" required inputMode="decimal" className="input" placeholder="120"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="condition">Condition</label>
            <select id="condition" className="input" value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" required minLength={10} maxLength={3000} rows={5}
            className="input" placeholder="Condition details, dimensions, pickup neighbourhood…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
