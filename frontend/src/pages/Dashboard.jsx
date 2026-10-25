import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Calendar, Gavel, Scale } from "lucide-react";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    request(() => api.get(API_ENDPOINTS.DASHBOARD))
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  const stats = [
    ["Sengketa", data?.totals.sengketa, Scale, "/sengketa", "bg-amber-50 text-amber-900 border-amber-200"],
    ["Perkara", data?.totals.perkara, Gavel, "/perkara", "bg-blue-50 text-blue-900 border-blue-200"],
  ];

  const handleBarClick = (entry) => {
    if (entry && entry.activePayload?.[0]?.payload?.tahun) {
      const year = entry.activePayload[0].payload.tahun;
      navigate(`/sengketa?tahun=${year}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard KASTA</h1>
        <p className="text-sm text-clay-600">
          Sistem Informasi Manajemen Arsip Digital Sengketa & Perkara Pertanahan Berbasis Lokasi
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(([label, n, Icon, path]) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            className="card flex items-center justify-between p-5 cursor-pointer hover:border-clay-400 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-sand-100 text-clay-700">
                <Icon size={24} />
              </span>
              <div>
                <p className="text-xs uppercase font-semibold tracking-wider text-clay-600">Total {label}</p>
                <p className="text-3xl font-extrabold text-clay-900">{n ?? "–"}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-clay-700 hover:underline">
              Buka Arsip <ArrowRight size={14} />
            </span>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-clay-900">Grafik Statistik Pertahun</h2>
            <p className="text-xs text-clay-500">Klik pada batang grafik untuk langsung membuka arsip tahun tersebut</p>
          </div>
        </div>
        {!data ? (
          <div className="h-72 animate-pulse rounded-lg bg-sand-100" />
        ) : !data.chart?.length ? (
          <p className="py-16 text-center text-sm text-clay-600">Belum ada data arsip yang tersimpan</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.chart} onClick={handleBarClick} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1CBA5" vertical={false} />
                <XAxis dataKey="tahun" tickLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "#FFF8F1" }}
                  formatter={(value, name) => [`${value} berkas`, name]}
                />
                <Legend />
                <Bar dataKey="sengketa" name="Sengketa" fill="#8A4B1F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perkara" name="Perkara" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-clay-700" />
          <h2 className="text-base font-bold text-clay-900">Pilihan Tahun</h2>
        </div>
        <p className="text-xs text-clay-500">
          Pilih salah satu tahun di bawah ini untuk menampilkan data tabel sengketa atau perkara pada tahun tersebut:
        </p>
        {!data ? (
          <div className="h-20 animate-pulse rounded-lg bg-sand-100" />
        ) : !data.years?.length ? (
          <p className="py-8 text-center text-sm text-clay-600">Belum ada data tahun yang diinput</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.years.map((y) => (
              <div
                key={y.tahun}
                className="flex flex-col justify-between rounded-xl border border-sand-200 bg-sand-50/60 p-4 transition hover:border-clay-400 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-clay-900">{y.tahun}</span>
                    <span className="rounded bg-sand-200 px-2 py-0.5 text-xs font-semibold text-clay-800">
                      Total: {y.sengketa + y.perkara}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-clay-600">
                    <p className="flex justify-between">
                      <span>Sengketa:</span>
                      <strong className="text-amber-900">{y.sengketa} berkas</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Perkara:</span>
                      <strong className="text-blue-900">{y.perkara} berkas</strong>
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-sand-200/80 pt-2.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/sengketa?tahun=${y.tahun}`)}
                    className="btn-outline px-2 py-1 text-xs justify-center hover:bg-amber-100 hover:text-amber-900"
                  >
                    Sengketa
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/perkara?tahun=${y.tahun}`)}
                    className="btn-outline px-2 py-1 text-xs justify-center hover:bg-blue-100 hover:text-blue-900"
                  >
                    Perkara
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
