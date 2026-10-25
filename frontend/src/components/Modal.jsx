import { X } from "lucide-react";

export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-clay-900/50 p-0 sm:items-center sm:p-4 !mt-0" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white sm:rounded-2xl ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h2>{title}</h2>
          <button className="btn-ghost px-2 py-1" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
