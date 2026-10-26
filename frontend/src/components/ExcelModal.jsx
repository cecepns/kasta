import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";
import { useAuth } from "@/hooks/useAuth";
import { exportRecordsToExcel, downloadExcelTemplate, parseExcelFile } from "@/utils/excel";

export default function ExcelModal({
  type = "sengketa",
  currentYear = null,
  initialMode = "export",
  onClose,
  onImportSuccess,
}) {
  const { user, isSuperAdmin, superAdminScope } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'export' or 'import'
  const [exportYear, setExportYear] = useState(currentYear ? String(currentYear) : "");
  const [downloading, setDownloading] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const activeKabupaten = !isSuperAdmin ? user?.kabupaten : superAdminScope || "Semua Wilayah";
  const label = type === "sengketa" ? "Sengketa" : "Perkara";

  // Handle Export
  const handleExport = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (exportYear) params.tahun = exportYear;
      if (isSuperAdmin && superAdminScope) params.kabupaten = superAdminScope;

      const res = await api.get(API_ENDPOINTS.RECORDS.EXPORT_DATA(type), { params });
      const rows = res.data?.data || res.data || [];

      if (!rows.length) {
        return toast.error("Tidak ada data untuk diekspor pada filter ini");
      }

      const scopeName = (!isSuperAdmin ? user?.kabupaten : superAdminScope || "Nasional")
        .replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `KASTA_Arsip_${label}_${scopeName}_${exportYear || "SemuaTahun"}`;

      exportRecordsToExcel(rows, type, filename, {
        kabupaten: activeKabupaten,
        tahun: exportYear,
      });
      toast.success(`Berhasil mengekspor ${rows.length} data berkas ke Excel`);
      onClose();
    } catch (err) {
      toast.error("Gagal mengekspor data: " + (err.message || ""));
    } finally {
      setDownloading(false);
    }
  };

  // Handle File Upload for Import
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setParsing(true);
    try {
      const rows = await parseExcelFile(file, type);
      setParsedRows(rows);
      toast.success(`Berhasil membaca ${rows.length} baris data dari file Excel`);
    } catch (err) {
      toast.error("Gagal membaca file Excel. Pastikan format kolom sesuai template.");
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  // Submit Import to Database
  const submitImport = async () => {
    if (!parsedRows.length) return toast.error("Tidak ada data yang valid untuk diimpor");

    setImporting(true);
    try {
      const res = await request(
        () => api.post(API_ENDPOINTS.RECORDS.BULK_IMPORT(type), { items: parsedRows }),
        `Berhasil mengimpor data ke sistem`
      );
      onImportSuccess?.();
      onClose();
    } catch {
      /* toast */
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal wide title={`Kelola Data Excel · Arsip ${label}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex border-b border-sand-200">
          <button
            type="button"
            onClick={() => setMode("export")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
              mode === "export"
                ? "border-clay-700 text-clay-900"
                : "border-transparent text-clay-500 hover:text-clay-700"
            }`}
          >
            <Download size={14} /> Export ke Excel
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
              mode === "import"
                ? "border-clay-700 text-clay-900"
                : "border-transparent text-clay-500 hover:text-clay-700"
            }`}
          >
            <Upload size={14} /> Import dari Excel
          </button>
        </div>

        {/* EXPORT TAB */}
        {mode === "export" && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-sand-200 bg-sand-50/70 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-clay-900 text-sm">
                <FileSpreadsheet className="text-emerald-700" size={18} />
                <span>Ekspor Arsip {label} ke Format Excel (.xlsx)</span>
              </div>
              <p className="text-clay-600">
                Data yang diekspor mencakup nomor registrasi/perkara, identitas lengkap pihak, alamat objek lokasi, koordinat peta, hingga riwayat putusan.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-md bg-white border border-sand-200 px-2 py-1 text-clay-700">
                  Cakupan Wilayah: <strong>{activeKabupaten}</strong>
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-clay-700">Pilih Tahun Berkas:</label>
                <select
                  className="input text-xs"
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                >
                  <option value="">Semua Tahun (Seluruh Arsip)</option>
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-sand-200 pt-3">
              <button type="button" className="btn-outline text-xs" onClick={onClose}>
                Tutup
              </button>
              <button
                type="button"
                className="btn-primary text-xs bg-emerald-700 hover:bg-emerald-800"
                onClick={handleExport}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyiapkan Berkas...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Unduh File Excel (.xlsx)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* IMPORT TAB */}
        {mode === "import" && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-sand-200 bg-sand-50/70 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-clay-900 text-sm flex items-center gap-2">
                  <Upload className="text-clay-700" size={16} />
                  Langkah 1: Unduh Template Excel Resmi
                </span>
                <button
                  type="button"
                  onClick={() =>
                    downloadExcelTemplate(type, {
                      kabupaten: activeKabupaten,
                      tahun: exportYear,
                    })
                  }
                  className="btn-outline py-1 px-2.5 text-xs font-semibold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                >
                  <Download size={13} /> Unduh Template (.xlsx)
                </button>
              </div>
              <p className="text-clay-600">
                Gunakan template resmi agar susunan kolom sesuai dengan standar database. Buka template tersebut di Microsoft Excel, isi data berkas, lalu unggah pada form di bawah.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-clay-800">
                Langkah 2: Pilih File Excel Hasil Pengisian (.xlsx / .xls)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="block w-full text-xs text-clay-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-clay-700 file:text-white hover:file:bg-clay-800 cursor-pointer border border-sand-200 rounded-xl p-2 bg-white"
              />
            </div>

            {parsing && (
              <div className="flex items-center gap-2 text-xs text-clay-600 py-2">
                <Loader2 size={16} className="animate-spin text-clay-700" /> Sedang membaca isi file Excel...
              </div>
            )}

            {/* Preview Parsed Rows */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-clay-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Preview: Ditemukan {parsedRows.length} data berkas siap diimpor
                  </span>
                  <span className="text-clay-500">
                    Otomatis masuk ke wilayah: <strong>{activeKabupaten}</strong>
                  </span>
                </div>

                <div className="max-h-48 overflow-auto rounded-lg border border-sand-200 bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-sand-50 sticky top-0 text-clay-700 border-b border-sand-200">
                      <tr>
                        <th className="px-2.5 py-1.5">No</th>
                        <th className="px-2.5 py-1.5">Tahun</th>
                        <th className="px-2.5 py-1.5">Nomor Berkas</th>
                        <th className="px-2.5 py-1.5">Kecamatan</th>
                        <th className="px-2.5 py-1.5">Kelurahan</th>
                        <th className="px-2.5 py-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {parsedRows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-sand-50">
                          <td className="px-2.5 py-1 text-clay-500">{i + 1}</td>
                          <td className="px-2.5 py-1 font-semibold">{r.tahun}</td>
                          <td className="px-2.5 py-1 font-mono">{r.no_registrasi || r.no_perkara}</td>
                          <td className="px-2.5 py-1">{r.kecamatan || "-"}</td>
                          <td className="px-2.5 py-1">{r.desa || "-"}</td>
                          <td className="px-2.5 py-1">{r.status || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 50 && (
                  <p className="text-[10px] text-clay-500 italic">
                    Menampilkan 50 baris pertama dari total {parsedRows.length} baris.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-sand-200 pt-3">
              <button type="button" className="btn-outline text-xs" onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={submitImport}
                disabled={!parsedRows.length || importing}
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Mengimpor ke Database...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Simpan {parsedRows.length} Data ke Sistem
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
