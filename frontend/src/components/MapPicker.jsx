import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ExternalLink, MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";
import L, { TILES, createPinIcon } from "./leaflet";
import { API_ENDPOINTS } from "@/utils/endpoints";

/** Pilih titik: klik peta, cari alamat, atau input koordinat manual. */
export default function MapPicker({ lat, lng, query, onChange }) {
  const el = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const tileLayer = useRef(null);
  const [layerType, setLayerType] = useState("standard");
  const [q, setQ] = useState(query || "");
  const [manualLat, setManualLat] = useState(lat != null ? String(lat) : "");
  const [manualLng, setManualLng] = useState(lng != null ? String(lng) : "");
  const [busy, setBusy] = useState(false);

  const place = (la, ln, zoom) => {
    if (!map.current) return;
    const icon = createPinIcon("picker");
    if (marker.current) {
      marker.current.setLatLng([la, ln]);
      marker.current.setIcon(icon);
    } else {
      marker.current = L.marker([la, ln], { icon }).addTo(map.current);
    }
    if (zoom) map.current.setView([la, ln], zoom);
    setManualLat(String(la));
    setManualLng(String(ln));
  };

  useEffect(() => {
    const hasInitial = lat != null && lng != null && !isNaN(+lat) && !isNaN(+lng);
    map.current = L.map(el.current, {
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      zoomControl: true,
    }).setView(
      hasInitial ? [+lat, +lng] : [-2.5, 118],
      hasInitial ? 15 : 5
    );
    tileLayer.current = L.tileLayer(TILES.standard.url, {
      attribution: TILES.standard.attribution,
      maxZoom: 19,
    }).addTo(map.current);

    if (hasInitial) place(+lat, +lng);

    map.current.on("click", (e) => {
      const la = +e.latlng.lat.toFixed(7);
      const ln = +e.latlng.lng.toFixed(7);
      place(la, ln);
      onChange(la, ln);
    });

    // Invalidate size in case rendered inside modal animation
    const timer = setTimeout(() => {
      map.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.current?.remove();
    };
    // eslint-disable-next-line
  }, []);

  // Update marker position when lat / lng props change or load
  useEffect(() => {
    if (lat != null && lng != null && !isNaN(+lat) && !isNaN(+lng) && map.current) {
      setManualLat(String(lat));
      setManualLng(String(lng));
      place(+lat, +lng);
    }
  }, [lat, lng]);

  const switchLayer = (type) => {
    setLayerType(type);
    if (tileLayer.current && map.current) {
      tileLayer.current.setUrl(TILES[type].url);
      tileLayer.current.options.attribution = TILES[type].attribution;
    }
  };

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const { data } = await axios.get(API_ENDPOINTS.GEOCODE, {
        params: { format: "json", limit: 1, q },
      });
      if (!data[0]) return toast.error("Alamat tidak ditemukan, silakan klik langsung di peta");
      const la = +(+data[0].lat).toFixed(7);
      const ln = +(+data[0].lon).toFixed(7);
      place(la, ln, 16);
      onChange(la, ln);
      toast.success("Lokasi ditemukan!");
    } catch {
      toast.error("Pencarian alamat gagal");
    } finally {
      setBusy(false);
    }
  };

  const applyManual = () => {
    const la = parseFloat(manualLat);
    const ln = parseFloat(manualLng);
    if (isNaN(la) || isNaN(ln)) {
      return toast.error("Format koordinat Latitude / Longitude tidak valid");
    }
    place(+la.toFixed(7), +ln.toFixed(7), 16);
    onChange(+la.toFixed(7), +ln.toFixed(7));
    toast.success("Koordinat diterapkan");
  };

  const hasCoords = lat != null && lng != null && !isNaN(+lat) && !isNaN(+lng);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 gap-2">
          <input
            className="input"
            placeholder="Ketik alamat untuk mencari lokasi (contoh: Kec. Panakkukang, Makassar)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          />
          <button type="button" className="btn-outline shrink-0" disabled={busy} onClick={search}>
            <Search size={16} /> Cari Alamat
          </button>
        </div>
      </div>

      <div className="relative isolate z-0">
        <div className="absolute right-3 top-3 z-[400] flex overflow-hidden rounded-lg border border-sand-300 bg-white shadow-md">
          <button
            type="button"
            onClick={() => switchLayer("standard")}
            className={`px-2.5 py-1 text-xs font-semibold ${
              layerType === "standard"
                ? "bg-clay-700 text-white"
                : "bg-white text-clay-700 hover:bg-sand-50"
            }`}
          >
            Peta
          </button>
          <button
            type="button"
            onClick={() => switchLayer("satellite")}
            className={`px-2.5 py-1 text-xs font-semibold ${
              layerType === "satellite"
                ? "bg-clay-700 text-white"
                : "bg-white text-clay-700 hover:bg-sand-50"
            }`}
          >
            Satelit
          </button>
        </div>
        <div ref={el} className="h-64 w-full rounded-xl border border-sand-200" />
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-sand-50 p-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-clay-700">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin size={14} className="text-red-500 shrink-0" />
          <span>Koordinat:</span>
          <input
            className="input w-28 py-0.5 px-2 text-xs"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
          />
          <input
            className="input w-28 py-0.5 px-2 text-xs"
            placeholder="Longitude"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
          />
          <button type="button" className="btn-outline py-0.5 px-2 text-xs" onClick={applyManual}>
            Terapkan
          </button>
        </div>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-clay-700 hover:text-clay-900 underline"
          >
            Buka di Google Maps <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
