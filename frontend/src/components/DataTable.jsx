import { Inbox, Search } from "lucide-react";
import Pagination from "./Pagination";

/** Tabel dengan search, loading skeleton, empty state, dan pagination. */
export default function DataTable({ columns, rows, loading, list, onRowClick, actions, toolbar, emptyText = "Belum ada data" }) {
  const { pagination, params, update } = list;
  const offset = (pagination.page - 1) * pagination.limit;
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-sand-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-400" />
          <input className="input pl-9" placeholder="Cari" value={params.search} onChange={(e) => update({ search: e.target.value, page: 1 })} />
        </div>
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-50 text-xs text-clay-700">
            <tr>
              <th className="w-12 px-4 py-3 font-semibold">No</th>
              {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-3 font-semibold">{c.label}</th>)}
              {actions && <th className="w-24 px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {loading && Array.from({ length: 4 }, (_, i) => (
              <tr key={i}><td colSpan={columns.length + 2} className="px-4 py-3"><div className="h-5 animate-pulse rounded bg-sand-100" /></td></tr>
            ))}
            {!loading && rows.map((r, i) => (
              <tr key={r.id ?? i} onClick={() => onRowClick?.(r)} className={onRowClick ? "cursor-pointer hover:bg-sand-50" : ""}>
                <td className="px-4 py-3 text-clay-600">{offset + i + 1}</td>
                {columns.map((c) => <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key] || "-"}</td>)}
                {actions && <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !rows.length && (
          <div className="flex flex-col items-center gap-2 py-14 text-clay-600"><Inbox size={28} /><p className="text-sm">{params.search ? "Tidak ada hasil" : emptyText}</p></div>
        )}
      </div>
      <Pagination pagination={pagination} onChange={update} />
    </div>
  );
}
