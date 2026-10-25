import { Plus, Trash2 } from "lucide-react";
import Field from "./Field";
import { JENIS_PIHAK, NAMA_LABEL, emptyPerson, emptyOrg, safeArray } from "@/utils/config";

/** Editor pihak. typed = pilih jenis pihak; multiple = boleh lebih dari satu. */
export default function PartyEditor({ label, value, onChange, typed, multiple = true }) {
  const items = safeArray(value);
  const set = (i, k, v) => onChange(items.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const add = () => onChange([...items, typed ? { ...emptyOrg } : { ...emptyPerson }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between">
        <h2>{label}</h2>
        {(multiple || items.length === 0) && (
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={add}>
            <Plus size={16} /> Tambah {label}
          </button>
        )}
      </div>
      {!items.length && <p className="text-sm text-clay-600">Belum ada pihak (klik Tambah di atas)</p>}
      {items.map((p, i) => {
        const jenis = p.jenis || "Perorangan";
        const person = !typed || jenis === "Perorangan";
        return (
          <div key={i} className="grid gap-3 rounded-xl bg-sand-50 p-3 sm:grid-cols-2">
            {typed && (
              <Field label="Jenis pihak" className="sm:col-span-2">
                <select
                  className="input"
                  value={jenis}
                  onChange={(e) => set(i, "jenis", e.target.value)}
                >
                  {JENIS_PIHAK.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
              </Field>
            )}
            {person ? (
              <>
                <Field label="NIK">
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={p.nik || ""}
                    onChange={(e) => set(i, "nik", e.target.value.replace(/\D/g, ""))}
                  />
                </Field>
                <Field label="Nama">
                  <input
                    className="input"
                    placeholder="Nama lengkap"
                    value={p.nama || ""}
                    onChange={(e) => set(i, "nama", e.target.value)}
                  />
                </Field>
                <Field label="Alamat">
                  <input
                    className="input"
                    placeholder="Alamat domisili"
                    value={p.alamat || ""}
                    onChange={(e) => set(i, "alamat", e.target.value)}
                  />
                </Field>
                <Field label="Pekerjaan">
                  <input
                    className="input"
                    placeholder="Pekerjaan"
                    value={p.pekerjaan || ""}
                    onChange={(e) => set(i, "pekerjaan", e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label={NAMA_LABEL[jenis] || "Nama"}>
                  <input
                    className="input"
                    placeholder={`Masukkan ${NAMA_LABEL[jenis] || "nama"}`}
                    value={p.nama || ""}
                    onChange={(e) => set(i, "nama", e.target.value)}
                  />
                </Field>
                <Field label="Kedudukan">
                  <input
                    className="input"
                    placeholder="Contoh: Makassar / Jakarta"
                    value={p.kedudukan || ""}
                    onChange={(e) => set(i, "kedudukan", e.target.value)}
                  />
                </Field>
              </>
            )}
            {(multiple || items.length > 1) && (
              <button
                type="button"
                className="btn-ghost justify-self-start px-2 py-1 text-red-600 sm:col-span-2 text-xs"
                onClick={() => remove(i)}
              >
                <Trash2 size={14} /> Hapus pihak ini
              </button>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

