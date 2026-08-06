"use client";
import { useMemo, useState } from "react";

type Table = { name: string; columns: string[]; rows: Record<string, string>[] };

const PAGE = 6;

export default function EditableTable({
  table,
  onChange,
  onRemove,
}: {
  table: Table;
  onChange: (t: Table) => void;
  onRemove: () => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const indexed = useMemo(
    () => table.rows.map((r, i) => ({ r, i })),
    [table.rows]
  );
  const filtered = useMemo(() => {
    if (!q.trim()) return indexed;
    const s = q.toLowerCase();
    return indexed.filter(({ r }) => Object.values(r).join(" ").toLowerCase().includes(s));
  }, [indexed, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  function setName(name: string) {
    onChange({ ...table, name });
  }
  function renameCol(ci: number, name: string) {
    const columns = table.columns.map((c, i) => (i === ci ? name : c));
    onChange({ ...table, columns });
  }
  function addCol() {
    onChange({ ...table, columns: [...table.columns, `Colonne ${table.columns.length + 1}`] });
  }
  function removeCol(ci: number) {
    const col = table.columns[ci];
    const columns = table.columns.filter((_, i) => i !== ci);
    const rows = table.rows.map((r) => {
      const { [col]: _drop, ...rest } = r;
      return rest;
    });
    onChange({ ...table, columns, rows });
  }
  function setCell(ri: number, col: string, val: string) {
    const rows = table.rows.map((r, i) => (i === ri ? { ...r, [col]: val } : r));
    onChange({ ...table, rows });
  }
  function addRow() {
    const blank: Record<string, string> = {};
    table.columns.forEach((c) => (blank[c] = ""));
    onChange({ ...table, rows: [...table.rows, blank] });
    setPage(Math.ceil((table.rows.length + 1) / PAGE) - 1);
  }
  function removeRow(ri: number) {
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== ri) });
  }

  return (
    <div className="rounded-xl border border-line bg-surface/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-[240px] font-display text-lg"
          value={table.name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex-1" />
        <input
          className="input max-w-[180px]"
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
        <button type="button" className="btn-ghost text-sm" onClick={onRemove}>
          Supprimer le tableau
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {table.columns.map((col, ci) => (
                <th key={ci} className="border-b border-line p-1 text-left">
                  <div className="flex items-center gap-1">
                    <input
                      className="w-full rounded-md bg-brand-soft/50 px-2 py-1 text-xs font-semibold text-brand-dark outline-none"
                      value={col}
                      onChange={(e) => renameCol(ci, e.target.value)}
                    />
                    <button type="button" onClick={() => removeCol(ci)} className="text-muted hover:text-brand" title="Retirer la colonne">×</button>
                  </div>
                </th>
              ))}
              <th className="border-b border-line p-1">
                <button type="button" onClick={addCol} className="chip text-xs">+ colonne</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {view.map(({ r, i }) => (
              <tr key={i} className="group">
                {table.columns.map((col) => (
                  <td key={col} className="border-b border-line/60 p-1">
                    <input
                      className="w-full rounded-md px-2 py-1.5 outline-none focus:bg-brand-soft/30"
                      value={r[col] ?? ""}
                      onChange={(e) => setCell(i, col, e.target.value)}
                    />
                  </td>
                ))}
                <td className="border-b border-line/60 p-1 text-center">
                  <button type="button" onClick={() => removeRow(i)} className="text-muted opacity-0 transition group-hover:opacity-100 hover:text-brand">×</button>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={table.columns.length + 1} className="p-3 text-center text-muted">Aucune ligne.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" className="text-sm font-medium text-brand hover:underline" onClick={addRow}>
          + Ajouter une ligne
        </button>
        {pages > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <button type="button" className="chip text-xs" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹</button>
            <span>{cur + 1} / {pages}</span>
            <button type="button" className="chip text-xs" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
