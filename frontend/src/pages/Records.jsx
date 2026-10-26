import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet, Filter, MapPin, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import DataTable from "@/components/DataTable";
import RecordForm from "@/components/RecordForm";
import RecordDetail from "@/components/RecordDetail";
import ExcelModal from "@/components/ExcelModal";
import useList from "@/hooks/useList";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { confirmToast, request } from "@/utils/request";
import { RECORDS } from "@/utils/config";

export default function Records({ type }) {
  const cfg = RECORDS[type];
  const { user, isSuperAdmin, isAdmin, superAdminScope } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get("tahun");
  const year = yearParam ? +yearParam : null;

  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({});
  const [excelModal, setExcelModal] = useState(null);

  const listParams = {
    tahun: year,
    ...filters,
    ...(isSuperAdmin && superAdminScope ? { kabupaten: superAdminScope } : {}),
  };

  const list = useList(API_ENDPOINTS.RECORDS.LIST(type), listParams, year !== null);

  const loadYears = () => {
    setYearsLoading(true);
    const params = isSuperAdmin && superAdminScope ? { kabupaten: superAdminScope } : {};
    request(() => api.get(API_ENDPOINTS.RECORDS.YEARS(type), { params }))
      .then((r) => setYears(r.data))
      .catch(() => {})
      .finally(() => setYearsLoading(false));
  };

  useEffect(loadYears, [type, superAdminScope]);

  const selectYear = (y) => {
    setFilters({});
    if (y !== null) {
      setSearchParams({ tahun: String(y) });
    } else {
      setSearchParams({});
    }
  };

  const open = async (row) => {
    const r = await request(() => api.get(API_ENDPOINTS.RECORDS.DETAIL(type, row.id))).catch(() => null);
    return r?.data;
  };

  const edit = async (row) => {
    const d = await open(row);
    if (d) setForm(d);
  };

  const view = async (row) => {
    const d = await open(row);
    if (d) setDetail(d);
  };

  const remove = async (row) => {
    if (!(await confirmToast(`Hapus ${cfg.label.toLowerCase()} ${row[cfg.numKey]}?`))) return;
    await request(() => api.delete(API_ENDPOINTS.RECORDS.DETAIL(type, row.id)), "Data berhasil dihapus").catch(() => null);
    list.reload();
    loadYears();
  };

  const saved = () => {
    setForm(null);
    list.reload();
    loadYears();
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const addBtn = isAdmin && (
    <button
      className="btn-primary"
      onClick={() => setForm(year ? { tahun: year } : {})}
    >
      <Plus size={16} /> Tambah {cfg.label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {year !== null && (
            <button
              className="btn-ghost -ml-2 px-2"
              onClick={() => selectYear(null)}
              aria-label="Kembali ke daftar tahun"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1>
                Arsip {cfg.label} {year !== null && `· Tahun ${year}`}
              </h1>
              {user?.kabupaten && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-sand-300 bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-clay-800">
                  <MapPin size={11} className="text-red-500" />
                  {user.kabupaten}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-outline text-xs text-clay-700 bg-white shadow-xs"
            onClick={() => setExcelModal("export")}
            title="Ekspor data ke file Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" /> Export Excel
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn-outline text-xs text-clay-700 bg-white shadow-xs"
              onClick={() => setExcelModal("import")}
              title="Impor data dari file Excel (.xlsx)"
            >
              <Upload size={15} className="text-blue-700" /> Import Excel
            </button>
          )}
          {addBtn}
        </div>
      </div>

      {year === null ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand-50 text-xs text-clay-700">
              <tr>
                <th className="w-16 px-4 py-3">No</th>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3">Jumlah Berkas</th>
                <th className="w-28 px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {yearsLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-4">
                    <div className="h-6 animate-pulse rounded bg-sand-100" />
                  </td>
                </tr>
              )}
              {years.map((y, i) => (
                <tr
                  key={y.tahun}
                  className="cursor-pointer hover:bg-sand-50 transition"
                  onClick={() => selectYear(y.tahun)}
                >
                  <td className="px-4 py-3.5 text-clay-600">{i + 1}</td>
                  <td className="px-4 py-3.5 font-bold text-clay-900 text-base">{y.tahun}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-sand-100 px-2 py-0.5 text-xs font-semibold text-clay-800">
                      {y.total} data
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-semibold text-clay-700 hover:underline">
                      Buka Tabel →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!yearsLoading && !years.length && (
            <div className="py-14 text-center text-sm text-clay-600 space-y-2">
              <p>Belum ada data arsip {cfg.label.toLowerCase()} untuk wilayah ini</p>
              {isAdmin && (
                <button className="btn-outline text-xs" onClick={() => setForm({})}>
                  <Plus size={14} /> Tambah Data Sekarang
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Filter Bar Kategori */}
          <div className="card p-3 flex flex-wrap items-center gap-3 bg-sand-50/70 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-clay-700">
              <Filter size={14} />
              <span>Filter Kategori:</span>
            </div>
            {cfg.categories?.map((cat) => (
              <div key={cat.key} className="flex items-center gap-1.5">
                <label className="text-clay-600">{cat.label}:</label>
                <select
                  className="input py-1 px-2 text-xs w-auto min-w-[120px]"
                  value={filters[cat.key] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters((prev) => ({ ...prev, [cat.key]: val || undefined }));
                    list.update({ page: 1 });
                  }}
                >
                  <option value="">Semua {cat.label}</option>
                  {cat.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-ghost py-1 px-2 text-xs text-clay-700 hover:text-clay-900"
                onClick={() => {
                  setFilters({});
                  list.update({ page: 1 });
                }}
              >
                <RotateCcw size={12} /> Reset Filter
              </button>
            )}
          </div>

          <DataTable
            list={list}
            rows={list.rows}
            loading={list.loading}
            columns={cfg.columns}
            onRowClick={view}
            toolbar={addBtn}
            actions={
              isAdmin &&
              ((r) => (
                <div className="flex justify-end gap-1">
                  <button
                    className="btn-ghost px-2 py-1"
                    onClick={() => edit(r)}
                    aria-label="Edit"
                    title="Edit berkas"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="btn-ghost px-2 py-1 text-red-600"
                    onClick={() => remove(r)}
                    aria-label="Hapus"
                    title="Hapus berkas"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            }
          />
        </div>
      )}

      {form && (
        <RecordForm
          type={type}
          initial={form.id ? form : year ? { tahun: year } : {}}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {detail && <RecordDetail type={type} row={detail} onClose={() => setDetail(null)} />}
      {excelModal && (
        <ExcelModal
          type={type}
          currentYear={year}
          initialMode={excelModal}
          onClose={() => setExcelModal(null)}
          onImportSuccess={() => {
            list.reload();
            loadYears();
          }}
        />
      )}
    </div>
  );
}
