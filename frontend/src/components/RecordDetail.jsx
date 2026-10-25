import { ExternalLink, FileText, Globe, MapPin, Trophy } from "lucide-react";
import Modal from "./Modal";
import MapView from "./MapView";
import { FILE_URL } from "@/utils/api";
import { RECORDS, safeArray } from "@/utils/config";

const Row = ({ label, value }) =>
  value ? (
    <div className="grid gap-1 py-2 sm:grid-cols-3">
      <dt className="text-xs font-medium text-clay-600">{label}</dt>
      <dd className="text-sm font-normal text-clay-900 sm:col-span-2 whitespace-pre-wrap">{value}</dd>
    </div>
  ) : null;

const Section = ({ title, children }) => (
  <section className="rounded-xl border border-sand-200 bg-white p-4 space-y-2">
    <h2 className="text-sm font-bold uppercase tracking-wider text-clay-700">{title}</h2>
    <dl className="divide-y divide-sand-100">{children}</dl>
  </section>
);

function Parties({ list }) {
  const items = safeArray(list);
  if (!items.length) return <p className="py-2 text-sm text-clay-600">Tidak ada data</p>;
  return (
    <div className="divide-y divide-sand-100">
      {items.map((p, i) => (
        <div key={i} className="py-2.5 text-sm space-y-0.5">
          <p className="font-semibold text-clay-900">
            {p.nama || "-"}{" "}
            {p.jenis && p.jenis !== "Perorangan" && (
              <span className="ml-1 rounded bg-sand-100 px-1.5 py-0.5 text-xs font-normal text-clay-600">
                {p.jenis}
              </span>
            )}
          </p>
          <p className="text-xs text-clay-600">
            {[p.nik && `NIK: ${p.nik}`, p.pekerjaan, p.kedudukan && `Kedudukan: ${p.kedudukan}`, p.alamat]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RecordDetail({ type, row, onClose }) {
  const cfg = RECORDS[type];
  const locParts = [row.dusun, row.desa, row.kecamatan, row.kabupaten, row.provinsi].filter(Boolean);
  const locText = locParts.join(", ") || row.alamat || "-";
  const hasCoords = row.lat != null && row.lng != null && !isNaN(+row.lat) && !isNaN(+row.lng);
  const gmapsUrl = hasCoords ? `https://www.google.com/maps?q=${row.lat},${row.lng}` : null;
  const gearthUrl = hasCoords ? `https://earth.google.com/web/search/${row.lat},${row.lng}` : null;

  const winnerKey = row.pemenang ? row.pemenang.toLowerCase() : null;
  const winnerList = winnerKey && row[winnerKey] ? safeArray(row[winnerKey]) : [];
  const docs = safeArray(row.dokumen);

  return (
    <Modal wide title={`${cfg.label} · ${row[cfg.numKey]}`} onClose={onClose}>
      <div className="space-y-5">
        <Section title="I. Informasi Umum">
          <Row label="Tahun" value={row.tahun} />
          <Row label={cfg.numLabel} value={row[cfg.numKey]} />
          {type === "perkara" && <Row label="Pengadilan" value={row.pengadilan} />}
        </Section>

        <section className="space-y-3">
          {cfg.parties.map(([k, l]) => (
            <div key={k} className="rounded-xl border border-sand-200 bg-white p-4 space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-clay-700">{l}</h2>
              <Parties list={row[k]} />
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-sand-200 bg-white p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-clay-700">
                {type === "sengketa" ? "IV. Objek Sengketa" : "V. Objek Perkara"}
              </h2>
              <p className="mt-1 text-sm text-clay-800">{locText}</p>
            </div>
            {hasCoords && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline text-xs inline-flex items-center gap-1.5"
                >
                  <MapPin size={14} className="text-red-500" />
                  Buka di Google Maps
                  <ExternalLink size={12} />
                </a>
                <a
                  href={gearthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline text-xs inline-flex items-center gap-1.5"
                >
                  <Globe size={14} className="text-blue-500" />
                  Buka di Google Earth
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
          {hasCoords && (
            <MapView
              height="h-64"
              zoom={15}
              center={[+row.lat, +row.lng]}
              points={[{ lat: +row.lat, lng: +row.lng, label: `${row[cfg.numKey]} (${locText})` }]}
            />
          )}
        </section>

        {type === "sengketa" ? (
          <>
            <Section title="V. Riwayat Kasus">
              <Row label="Akar masalah" value={row.akar_masalah} />
              <Row label="Pokok masalah" value={row.pokok_masalah} />
              <Row label="Tipologi kasus" value={row.tipologi} />
              <Row label="Klasifikasi" value={row.klasifikasi} />
            </Section>
            <Section title="VI. Tindak Lanjut">
              <Row label="Bentuk penanganan" value={row.bentuk_penanganan} />
              <Row label="Status" value={row.status} />
            </Section>
          </>
        ) : (
          <>
            <Section title="VI. Status Perkara">
              <Row label="Status" value={row.status} />
            </Section>
            <Section title="VII. Riwayat Perkara">
              {[
                ["tingkat_pertama", "Tingkat pertama"],
                ["banding", "Tingkat banding"],
                ["kasasi", "Tingkat kasasi"],
                ["pk", "Peninjauan kembali"],
              ].map(([k, l]) => (
                <Row
                  key={k}
                  label={l}
                  value={
                    row[`${k}_no`] &&
                    `${row[`${k}_no`]}${row[`${k}_amar`] ? `\n(Amar: ${row[`${k}_amar`]})` : ""}`
                  }
                />
              ))}
              <Row label="Berita Acara Eksekusi" value={row.eksekusi_no} />
            </Section>

            {winnerKey && (
              <section className="rounded-xl border-2 border-sun/60 bg-amber-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                    Pemenang Perkara: Pihak {winnerKey === "penggugat" ? "Penggugat" : "Tergugat"}
                  </h2>
                </div>
                <Parties list={winnerList} />
              </section>
            )}
          </>
        )}

        <section className="rounded-xl border border-sand-200 bg-white p-4 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-clay-700">Hasil Scan Dokumen</h2>
          {!docs.length ? (
            <p className="text-sm text-clay-600">Belum ada dokumen yang diunggah</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {docs.map((d, i) => (
                <a
                  key={i}
                  href={FILE_URL + d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50/60 p-2.5 text-sm hover:bg-sand-100 transition"
                >
                  <FileText size={18} className="text-clay-700 shrink-0" />
                  <span className="truncate flex-1 font-medium">{d.name}</span>
                  <ExternalLink size={14} className="text-clay-500 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
