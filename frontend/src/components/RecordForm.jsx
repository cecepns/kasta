import { useState } from "react";
import { FileText, Loader2, Upload, X, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import Field from "./Field";
import Modal from "./Modal";
import PartyEditor from "./PartyEditor";
import MapPicker from "./MapPicker";
import WilayahSelector from "./WilayahSelector";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";
import {
  BENTUK_PENANGANAN,
  KLASIFIKASI_KASUS,
  LEVELS,
  PENGADILAN_OPTIONS,
  RECORDS,
  STATUS_PERKARA,
  STATUS_SENGKETA,
  TIPOLOGI,
  safeArray,
} from "@/utils/config";

const Select = ({ options, ...p }) => (
  <select className="input" {...p}>
    <option value="">Pilih</option>
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

export default function RecordForm({ type, initial, onClose, onSaved }) {
  const cfg = RECORDS[type];
  const [f, setF] = useState(() => {
    const merged = { ...cfg.empty, ...initial };
    merged.dokumen = safeArray(merged.dokumen);
    cfg.parties.forEach(([k]) => {
      merged[k] = safeArray(merged[k]);
      if (!merged[k].length) {
        merged[k] = type === "perkara" && k === "turut_tergugat" ? [] : [{ ...(cfg.typed ? cfg.empty.pengadu[0] : cfg.empty.penggugat[0]) }];
      }
    });
    return merged;
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bind = (k) => ({ className: "input", value: f[k] ?? "", onChange: (e) => set(k, e.target.value) });
  const alamat = [f.dusun, f.desa, f.kecamatan, f.kabupaten, f.provinsi].filter(Boolean).join(", ");

  const submit = async (e) => {
    e.preventDefault();
    if (!f.tahun || !f[cfg.numKey]) return toast.error(`Tahun dan ${cfg.numLabel.toLowerCase()} wajib diisi`);
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...f, alamat }));
    files.forEach((file) => fd.append("files", file));
    setSaving(true);
    try {
      const url = initial?.id ? API_ENDPOINTS.RECORDS.DETAIL(type, initial.id) : API_ENDPOINTS.RECORDS.LIST(type);
      await request(() => api[initial?.id ? "put" : "post"](url, fd), "Data berhasil disimpan");
      onSaved();
    } catch {
      /* toast tampil */
    } finally {
      setSaving(false);
    }
  };

  const winnerParties = f.pemenang ? safeArray(f[f.pemenang]) : [];

  return (
    <Modal wide title={`${initial?.id ? "Edit" : "Tambah"} ${cfg.label.toLowerCase()}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-6">
        <section className="space-y-3">
          <h2>I. Informasi Registrasi</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tahun">
              <input type="number" required {...bind("tahun")} />
            </Field>
            <Field label={cfg.numLabel} className={type === "sengketa" ? "sm:col-span-2" : ""}>
              <input required placeholder={`Masukkan ${cfg.numLabel.toLowerCase()}`} {...bind(cfg.numKey)} />
            </Field>
            {type === "perkara" && (
              <Field label="Pengadilan">
                <Select
                  options={PENGADILAN_OPTIONS}
                  value={f.pengadilan}
                  onChange={(e) => set("pengadilan", e.target.value)}
                />
              </Field>
            )}
          </div>
        </section>

        <section className="space-y-4">
          {cfg.parties.map(([k, label]) => (
            <PartyEditor
              key={k}
              label={label}
              value={f[k]}
              onChange={(v) => set(k, v)}
              typed={cfg.typed}
              multiple={true}
            />
          ))}
        </section>

        <section className="space-y-3">
          <h2>{type === "sengketa" ? "IV. Objek" : "V. Objek Perkara"}</h2>
          <WilayahSelector
            values={{
              provinsi: f.provinsi,
              kabupaten: f.kabupaten,
              kecamatan: f.kecamatan,
              desa: f.desa,
              dusun: f.dusun,
            }}
            lockedToUser={true}
            showDusun={true}
            onChange={(newLoc) => setF((s) => ({ ...s, ...newLoc }))}
          />
          <MapPicker
            lat={f.lat}
            lng={f.lng}
            query={alamat}
            onChange={(lat, lng) => setF((s) => ({ ...s, lat, lng }))}
          />
        </section>

        {type === "sengketa" ? (
          <>
            <section className="space-y-3">
              <h2>V. Riwayat Kasus</h2>
              <Field label="Akar masalah">
                <textarea rows={2} placeholder="Uraian akar masalah..." {...bind("akar_masalah")} />
              </Field>
              <Field label="Pokok masalah">
                <textarea rows={2} placeholder="Uraian pokok masalah..." {...bind("pokok_masalah")} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipologi kasus" className="sm:col-span-2">
                  <Select options={TIPOLOGI} value={f.tipologi} onChange={(e) => set("tipologi", e.target.value)} />
                </Field>
                <Field label="Klasifikasi kasus">
                  <Select
                    options={KLASIFIKASI_KASUS}
                    value={f.klasifikasi}
                    onChange={(e) => set("klasifikasi", e.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <h2>VI. Tindak Lanjut</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bentuk penanganan">
                  <Select
                    options={BENTUK_PENANGANAN}
                    value={f.bentuk_penanganan}
                    onChange={(e) => set("bentuk_penanganan", e.target.value)}
                  />
                </Field>
                <Field label="Status">
                  <Select
                    options={STATUS_SENGKETA}
                    value={f.status}
                    onChange={(e) => set("status", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <h2>VI. Status Perkara</h2>
              <Field label="Status perkara">
                <Select
                  options={STATUS_PERKARA}
                  value={f.status}
                  onChange={(e) => set("status", e.target.value)}
                />
              </Field>
            </section>

            <section className="space-y-3">
              <h2>VII. Riwayat Perkara</h2>
              {LEVELS.map(([k, l]) => (
                <div key={k} className="grid gap-3 rounded-xl bg-sand-50 p-3 sm:grid-cols-2">
                  <Field label={`Nomor Putusan · ${l}`}>
                    <input placeholder={`Contoh: 12/Pdt.G/2025/...`} {...bind(`${k}_no`)} />
                  </Field>
                  <Field label="Amar putusan">
                    <textarea rows={2} placeholder="Uraian amar putusan..." {...bind(`${k}_amar`)} />
                  </Field>
                </div>
              ))}
              <Field label="Nomor Berita Acara Eksekusi">
                <input placeholder="Nomor BA eksekusi jika ada" {...bind("eksekusi_no")} />
              </Field>
            </section>

            <section className="space-y-3">
              <h2>VIII. Pemenang Perkara</h2>
              <Field label="Pilih Pemenang Perkara">
                <Select
                  options={["Penggugat", "Tergugat"]}
                  value={f.pemenang ? f.pemenang[0].toUpperCase() + f.pemenang.slice(1) : ""}
                  onChange={(e) => set("pemenang", e.target.value.toLowerCase())}
                />
              </Field>
              {f.pemenang && (
                <div className="rounded-xl border border-sand-200 bg-sand-50/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-clay-700">
                      <Trophy size={14} className="text-amber-600" />
                      Data Pihak Pemenang: {f.pemenang === "penggugat" ? "Pihak Penggugat" : "Pihak Tergugat"}
                    </span>
                    <span className="text-[11px] text-clay-500">Otomatis terisi dari input pihak</span>
                  </div>
                  {!winnerParties.length ? (
                    <p className="text-xs italic text-clay-500">
                      Belum ada data pihak yang diisi di {f.pemenang === "penggugat" ? "Pihak Penggugat" : "Pihak Tergugat"}.
                    </p>
                  ) : (
                    winnerParties.map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-sand-200 bg-white p-3 text-xs shadow-sm space-y-1"
                      >
                        <p className="font-semibold text-clay-900 text-sm">
                          {p.nama || "(Nama belum diisi)"}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-clay-700">
                          <p>
                            <span className="text-clay-500">NIK:</span> {p.nik || "-"}
                          </p>
                          <p>
                            <span className="text-clay-500">Pekerjaan:</span> {p.pekerjaan || "-"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="text-clay-500">Alamat:</span> {p.alamat || "-"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </>
        )}

        <section className="space-y-2">
          <h2>Dokumen Scan</h2>
          {[
            ...safeArray(f.dokumen).map((d, i) => ({
              name: d.name,
              remove: () => set("dokumen", f.dokumen.filter((_, x) => x !== i)),
            })),
            ...files.map((file, i) => ({
              name: file.name,
              remove: () => setFiles(files.filter((_, x) => x !== i)),
            })),
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-sand-50 px-3 py-2 text-sm">
              <FileText size={16} className="shrink-0" />
              <span className="flex-1 truncate">{d.name}</span>
              <button type="button" onClick={d.remove} aria-label="Hapus file">
                <X size={16} />
              </button>
            </div>
          ))}
          <label className="btn-outline cursor-pointer inline-flex">
            <Upload size={16} /> Pilih file hasil scan (PDF/gambar)
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => {
                setFiles([...files, ...e.target.files]);
                e.target.value = "";
              }}
            />
          </label>
        </section>

        <div className="flex justify-end gap-2 border-t border-sand-200 pt-4">
          <button type="button" className="btn-outline" onClick={onClose}>
            Batal
          </button>
          <button className="btn-primary" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
