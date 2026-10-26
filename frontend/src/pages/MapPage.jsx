import { useEffect, useMemo, useState } from "react";
import { Filter, Layers, MapPin, Search } from "lucide-react";
import MapView from "@/components/MapView";
import RecordDetail from "@/components/RecordDetail";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";
import { useAuth } from "@/hooks/useAuth";

export default function MapPage() {
  const { user, isSuperAdmin, superAdminScope } = useAuth();
  const [rawPoints, setRawPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = isSuperAdmin && superAdminScope ? { kabupaten: superAdminScope } : {};
    request(() => api.get(API_ENDPOINTS.MAP, { params }))
      .then((r) => setRawPoints(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSuperAdmin, superAdminScope]);

  const availableYears = useMemo(() => {
    const years = [...new Set(rawPoints.map((p) => p.tahun).filter(Boolean))];
    return years.sort((a, b) => b - a);
  }, [rawPoints]);

  const filteredPoints = useMemo(() => {
    return rawPoints.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (yearFilter !== "all" && String(p.tahun) !== String(yearFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = `${p.nomor} ${p.alamat} ${p.desa} ${p.kecamatan} ${p.kabupaten} ${p.status}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [rawPoints, typeFilter, yearFilter, search]);

  const handleOpenDetail = async (p) => {
    if (!p.id || !p.type) return;
    try {
      const res = await request(() => api.get(API_ENDPOINTS.RECORDS.DETAIL(p.type, p.id)));
      if (res?.data) {
        setSelectedRecord({ type: p.type, data: res.data });
      }
    } catch {
      /* toast */
    }
  };

  const sengketaCount = rawPoints.filter((p) => p.type === "sengketa").length;
  const perkaraCount = rawPoints.filter((p) => p.type === "perkara").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1>Peta Sebaran Lokasi</h1>
            {user?.kabupaten && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sand-300 bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-clay-800">
                <MapPin size={11} className="text-red-500" />
                {user.kabupaten}
              </span>
            )}
          </div>
          <p className="text-xs text-clay-600 mt-0.5">
            Peta digital pemetaan titik lokasi arsip sengketa dan perkara pertanahan ({user?.kabupaten || "Semua Wilayah"})
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-2.5 py-1 text-clay-800 shadow-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8A4B1F]" />
            Sengketa: <strong>{sengketaCount}</strong>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-2.5 py-1 text-clay-800 shadow-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1E40AF]" />
            Perkara: <strong>{perkaraCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3.5 flex flex-wrap items-center justify-between gap-3 bg-sand-50/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-clay-700">
            <Filter size={14} />
            <span>Kategori:</span>
          </div>

          <div className="flex rounded-lg border border-sand-300 bg-white p-0.5">
            {[
              ["all", "Semua"],
              ["sengketa", "Sengketa"],
              ["perkara", "Perkara"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTypeFilter(val)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  typeFilter === val
                    ? "bg-clay-700 text-white"
                    : "text-clay-700 hover:bg-sand-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {availableYears.length > 0 && (
            <select
              className="input py-1 px-2.5 text-xs w-auto"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-clay-400" />
          <input
            className="input py-1 pl-8 text-xs"
            placeholder="Cari nomor/alamat di peta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="relative isolate z-0">
        {loading ? (
          <div className="h-[70vh] w-full animate-pulse rounded-xl bg-sand-100" />
        ) : (
          <MapView
            points={filteredPoints}
            height="h-[70vh]"
            onSelectRecord={handleOpenDetail}
          />
        )}
      </div>

      {selectedRecord && (
        <RecordDetail
          type={selectedRecord.type}
          row={selectedRecord.data}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
