import { useEffect, useRef, useState } from "react";
import L, { TILES, createPinIcon } from "./leaflet";

/** Peta read-only dengan dukungan citra satelit dan marker kustom. */
export default function MapView({
  points = [],
  height = "h-72",
  center = [-2.5, 118],
  zoom = 5,
  onSelectRecord,
}) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const tileLayer = useRef(null);
  const [layerType, setLayerType] = useState("standard");

  useEffect(() => {
    map.current = L.map(el.current, {
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      zoomControl: true,
    }).setView(center, zoom);
    tileLayer.current = L.tileLayer(TILES.standard.url, {
      attribution: TILES.standard.attribution,
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);

    const timer = setTimeout(() => {
      map.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.current?.remove();
    };
    // eslint-disable-next-line
  }, []);

  const switchLayer = (type) => {
    setLayerType(type);
    if (tileLayer.current && map.current) {
      tileLayer.current.setUrl(TILES[type].url);
      tileLayer.current.options.attribution = TILES[type].attribution;
    }
  };

  useEffect(() => {
    if (!layer.current || !map.current) return;
    layer.current.clearLayers();
    const valid = points.filter((p) => p.lat != null && p.lng != null && !isNaN(+p.lat) && !isNaN(+p.lng));

    valid.forEach((p) => {
      const isSengketa = p.type === "sengketa";
      const icon = createPinIcon(p.type || "sengketa");
      const marker = L.marker([+p.lat, +p.lng], { icon });

      const gmapsLink = `https://www.google.com/maps?q=${p.lat},${p.lng}`;
      const gearthLink = `https://earth.google.com/web/search/${p.lat},${p.lng}`;

      const popupHtml = document.createElement("div");
      popupHtml.className = "text-xs space-y-2 p-1 min-w-[200px]";
      popupHtml.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #F1CBA5;padding-bottom:4px;">
          <span style="font-weight:700;font-size:11px;text-transform:uppercase;color:${isSengketa ? "#8A4B1F" : "#1E40AF"};">
            ${isSengketa ? "Sengketa" : "Perkara"} ${p.tahun ? `· ${p.tahun}` : ""}
          </span>
          <span style="font-weight:600;font-size:11px;color:#4A3B32;">${p.nomor || ""}</span>
        </div>
        ${p.alamat ? `<p style="margin:4px 0;color:#6C5D53;font-size:11px;line-height:1.3;">📍 ${p.alamat}</p>` : ""}
        ${p.status ? `<div style="font-size:11px;color:#8A4B1F;"><strong>Status:</strong> ${p.status}</div>` : ""}
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
          <a href="${gmapsLink}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:3px;background:#FFF8F1;border:1px solid #E2D9D2;padding:3px 6px;border-radius:4px;color:#8A4B1F;text-decoration:none;font-size:10px;font-weight:600;">
            Google Maps ↗
          </a>
          <a href="${gearthLink}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:3px;background:#EFF6FF;border:1px solid #BFDBFE;padding:3px 6px;border-radius:4px;color:#1E40AF;text-decoration:none;font-size:10px;font-weight:600;">
            Google Earth ↗
          </a>
        </div>
      `;

      if (onSelectRecord && p.id) {
        const detailBtn = document.createElement("button");
        detailBtn.type = "button";
        detailBtn.style.cssText =
          "width:100%;margin-top:6px;background:#8A4B1F;color:white;border:none;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;";
        detailBtn.textContent = "Lihat Detail Lengkap";
        detailBtn.onclick = () => onSelectRecord(p);
        popupHtml.appendChild(detailBtn);
      }

      marker.bindPopup(popupHtml).addTo(layer.current);
    });

    if (valid.length === 1) {
      map.current.setView([+valid[0].lat, +valid[0].lng], Math.max(zoom, 14));
    } else if (valid.length > 1) {
      map.current.fitBounds(
        valid.map((p) => [+p.lat, +p.lng]),
        { maxZoom: 15, padding: [35, 35] }
      );
    }
  }, [points, zoom, onSelectRecord]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-sand-200 shadow-sm isolate z-0">
      <div className="absolute right-3 top-3 z-[400] flex overflow-hidden rounded-lg border border-sand-300 bg-white shadow-md">
        <button
          type="button"
          onClick={() => switchLayer("standard")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            layerType === "standard"
              ? "bg-clay-700 text-white"
              : "bg-white text-clay-700 hover:bg-sand-50"
          }`}
        >
          Standar
        </button>
        <button
          type="button"
          onClick={() => switchLayer("satellite")}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            layerType === "satellite"
              ? "bg-clay-700 text-white"
              : "bg-white text-clay-700 hover:bg-sand-50"
          }`}
        >
          Citra Satelit
        </button>
      </div>
      <div ref={el} className={`${height} w-full`} />
    </div>
  );
}
