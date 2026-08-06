"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export default function SectorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [all, setAll] = useState<string[]>([]);
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getSectors().then((r) => setAll(r.sectors)).catch(() => {});
  }, []);
  useEffect(() => setQ(value || ""), [value]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = all.filter((s) => s.toLowerCase().includes(q.toLowerCase()));
  const exact = all.some((s) => s.toLowerCase() === q.trim().toLowerCase());

  function pick(v: string) {
    onChange(v);
    setQ(v);
    setOpen(false);
  }

  return (
    <div className="relative" ref={box}>
      <input
        className="input"
        value={q}
        placeholder="Cherchez votre secteur…"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          onChange(e.target.value);
        }}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lift">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-soft ${value === s ? "text-brand" : "text-ink"}`}
            >
              {s}
            </button>
          ))}
          {q.trim() && !exact && (
            <button
              type="button"
              onClick={() => pick(q.trim())}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-emerald-dark hover:bg-emerald-soft"
            >
              + Utiliser « {q.trim()} »
            </button>
          )}
          {filtered.length === 0 && !q.trim() && (
            <p className="px-3 py-2 text-sm text-muted">Tapez pour rechercher…</p>
          )}
        </div>
      )}
    </div>
  );
}
