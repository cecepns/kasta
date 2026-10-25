import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onChange }) {
  const { page, limit, total, totalPages } = pagination;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-sand-200 px-4 py-3 text-sm sm:flex-row">
      <div className="flex items-center gap-2 text-clay-700">
        <select className="input w-auto py-1" value={limit} onChange={(e) => onChange({ limit: +e.target.value, page: 1 })}>
          {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
        </select>
        <span>per halaman · {total} data</span>
      </div>
      <div className="flex items-center gap-1">
        <button className="btn-outline px-2 py-1" disabled={page <= 1} onClick={() => onChange({ page: page - 1 })} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
        {pages.map((n) => (
          <button key={n} onClick={() => onChange({ page: n })} className={`h-8 min-w-8 rounded-lg px-2 text-sm ${n === page ? "bg-clay-700 text-white" : "hover:bg-sand-100"}`}>{n}</button>
        ))}
        <button className="btn-outline px-2 py-1" disabled={page >= totalPages} onClick={() => onChange({ page: page + 1 })} aria-label="Berikutnya"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
