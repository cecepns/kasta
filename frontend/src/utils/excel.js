import * as XLSX from "xlsx";
import { safeArray } from "./config";

const formatParties = (parties) => {
  const arr = safeArray(parties);
  if (!arr.length) return "";
  return arr.map((p) => p.nama || p.jenis || "-").join("; ");
};

// Deteksi jenis pihak (Perorangan, Badan Hukum, Pemerintah, Masyarakat)
export const getPartyKind = (partyArray) => {
  const arr = safeArray(partyArray);
  if (!arr.length) return "Perorangan";
  const p = arr[0] || {};
  const jenis = p.jenis || "";
  const nama = (p.nama || "").toLowerCase();

  if (
    jenis === "Badan Hukum" ||
    /^pt\b|^cv\b|^pt\.|^perseroan|^yayasan|^koperasi|^corp/i.test(nama)
  ) {
    return "Badan Hukum";
  }
  if (
    jenis === "Pemerintah" ||
    /^pemerintah|^pemkab|^pemkot|^pemprov|^bumn|^kementerian|^dinas|^badan/i.test(nama)
  ) {
    return "Pemerintah";
  }
  if (
    jenis === "Kelompok Masyarakat" ||
    /^masyarakat|^warga|^kelompok|^aliansi|^komunitas|^tokoh adat/i.test(nama)
  ) {
    return "Masyarakat";
  }
  return "Perorangan";
};

// Mapping kolom tipologi BPN berdasarkan SUBJEK PIHAK:
// PP   = Perorangan dengan Perorangan (Kolom G)
// PB   = Perorangan dengan Badan Hukum / PT (Kolom H)
// MP/B = Masyarakat dengan Pemerintah / BUMN (Kolom I)
// BB   = Badan Hukum dengan Badan Hukum (Kolom J)
// MM   = Antar Kelompok Masyarakat (Kolom K)
export const mapTipologiToColumnsByParties = (tipologi = "", pengadu, teradu) => {
  const tipVal = tipologi || "Penguasaan dan Pemilikan Tanah";
  const cols = { pp: "", pb: "", mpb: "", bb: "", mm: "" };

  const k1 = getPartyKind(pengadu);
  const k2 = getPartyKind(teradu);

  // 1. PP: Perorangan vs Perorangan
  if (k1 === "Perorangan" && k2 === "Perorangan") {
    cols.pp = tipVal;
  }
  // 2. PB: Perorangan vs Badan Hukum (PT, CV, dll.)
  else if (
    (k1 === "Perorangan" && k2 === "Badan Hukum") ||
    (k1 === "Badan Hukum" && k2 === "Perorangan")
  ) {
    cols.pb = tipVal;
  }
  // 3. MP/B: Masyarakat vs Pemerintah / BUMN (atau Perorangan vs Pemerintah)
  else if (
    (k1 === "Masyarakat" && k2 === "Pemerintah") ||
    (k1 === "Pemerintah" && k2 === "Masyarakat") ||
    (k1 === "Perorangan" && k2 === "Pemerintah") ||
    (k1 === "Pemerintah" && k2 === "Perorangan")
  ) {
    cols.mpb = tipVal;
  }
  // 4. BB: Badan Hukum vs Badan Hukum
  else if (k1 === "Badan Hukum" && k2 === "Badan Hukum") {
    cols.bb = tipVal;
  }
  // 5. MM: Antar Kelompok Masyarakat
  else if (k1 === "Masyarakat" && k2 === "Masyarakat") {
    cols.mm = tipVal;
  }
  // Fallbacks
  else if (k1 === "Badan Hukum" || k2 === "Badan Hukum") {
    cols.pb = tipVal;
  } else if (k1 === "Pemerintah" || k2 === "Pemerintah") {
    cols.mpb = tipVal;
  } else if (k1 === "Masyarakat" || k2 === "Masyarakat") {
    cols.mm = tipVal;
  } else {
    cols.pp = tipVal;
  }

  return cols;
};

// Format alamat lengkap Letak Objek (Dusun, Desa, Kecamatan, Kabupaten, Provinsi)
export const formatLetakObjek = (r) => {
  const parts = [];
  if (r.dusun) parts.push(r.dusun);
  if (r.desa) {
    const d = r.desa.trim();
    parts.push(/^desa|^kelurahan/i.test(d) ? d : `Desa ${d}`);
  }
  if (r.kecamatan) {
    const k = r.kecamatan.trim();
    parts.push(/^kecamatan/i.test(k) ? k : `Kecamatan ${k}`);
  }
  if (r.kabupaten) {
    const kab = r.kabupaten.trim();
    parts.push(/^kabupaten|^kota/i.test(kab) ? kab : `Kabupaten ${kab}`);
  }
  if (r.provinsi) {
    const p = r.provinsi.trim();
    parts.push(/^provinsi/i.test(p) ? p : `Provinsi ${p}`);
  }
  return parts.length ? parts.join(", ") : r.alamat || "-";
};

// Format Perihal
export const formatPerihal = (r) => {
  if (r.perihal) return r.perihal;
  if (r.bentuk_penanganan) return r.bentuk_penanganan;
  if (r.klasifikasi) return `Pengaduan Sengketa Tanah (${r.klasifikasi})`;
  return "Pengaduan / Sengketa Pertanahan";
};

// Format Tanggal Surat
export const formatTanggalSurat = (r) => {
  if (r.tanggal_surat) return r.tanggal_surat;
  if (r.created_at) {
    try {
      const d = new Date(r.created_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    } catch {}
  }
  return r.tahun ? `01 Januari ${r.tahun}` : "-";
};

// Format Status Hak Atas Tanah (HAT)
export const formatStatusHAT = (r) => {
  if (r.status_hat) return r.status_hat;
  if (r.pokok_masalah && /shm|sertipikat/i.test(r.pokok_masalah)) return "SHM";
  return "Tanah Negara";
};

// Helper: Menyesuaikan Judul Kantor Pertanahan dan Tahun pada sheet-sheet laporan BPN
const updateWorkbookReportHeaders = (wb, targetKabupaten, targetYear) => {
  let kantorLabel = "KABUPATEN MAMASA";
  if (targetKabupaten && targetKabupaten !== "Semua Wilayah" && targetKabupaten !== "Nasional") {
    const raw = targetKabupaten.toUpperCase().trim();
    kantorLabel = raw.startsWith("KOTA") || raw.startsWith("KABUPATEN") ? raw : `KABUPATEN ${raw}`;
  }
  const yearLabel = String(targetYear || new Date().getFullYear());

  // 1. Sheet TAHUN 2024
  const wsTahun = wb.Sheets["TAHUN 2024"];
  if (wsTahun) {
    if (wsTahun["A1"]) {
      wsTahun["A1"].v = `DATA PENGADUAN KANTOR PERTANAHAN ${kantorLabel} `;
      wsTahun["A1"].w = wsTahun["A1"].v;
    }
    if (wsTahun["A2"]) {
      wsTahun["A2"].v = `TAHUN ANGGARAN ${yearLabel}`;
      wsTahun["A2"].w = wsTahun["A2"].v;
    }
  }

  // 2. Sheet Data Kasus Pertanahan 2024
  const wsKasus = wb.Sheets["Data Kasus Pertanahan 2024"];
  if (wsKasus) {
    if (wsKasus["A2"]) {
      wsKasus["A2"].v = `KANTOR PERTANAHAN ${kantorLabel}`;
      wsKasus["A2"].w = wsKasus["A2"].v;
    }
    if (wsKasus["A3"]) {
      wsKasus["A3"].v = `TAHUN ${yearLabel}`;
      wsKasus["A3"].w = wsKasus["A3"].v;
    }
  }

  // 3. Sheet Resume Pemetaan
  const wsResume = wb.Sheets["Resume Pemetaan"];
  if (wsResume) {
    if (wsResume["A2"]) {
      wsResume["A2"].v = `KANTOR PERTANAHAN ${kantorLabel}`;
      wsResume["A2"].w = wsResume["A2"].v;
    }
    if (wsResume["A3"]) {
      wsResume["A3"].v = `TAHUN ${yearLabel}`;
      wsResume["A3"].w = wsResume["A3"].v;
    }
  }

  // 4. Sheet TREND KASUS
  const wsTrend = wb.Sheets["TREND KASUS"];
  if (wsTrend) {
    if (wsTrend["A2"]) {
      wsTrend["A2"].v = `KANTOR PERTANAHAN ${kantorLabel}`;
      wsTrend["A2"].w = wsTrend["A2"].v;
    }
    if (wsTrend["A3"]) {
      wsTrend["A3"].v = `TAHUN ${yearLabel}`;
      wsTrend["A3"].w = wsTrend["A3"].v;
    }
  }
};

// Ekspor berkas ke Excel
export const exportRecordsToExcel = async (
  rows = [],
  type = "sengketa",
  filename = "Arsip",
  options = {}
) => {
  const isSengketa = type === "sengketa";

  // ============================================================
  // EXPORT SENGKETA: BPN ENTRY Format + Full Application Data
  // ============================================================
  if (isSengketa) {
    const targetKab = options.kabupaten || (rows[0]?.kabupaten || "Semua Wilayah");
    const targetYear = options.tahun || (rows[0]?.tahun || new Date().getFullYear());

    // Header tambahan untuk Lokasi detail & Status Penanganan sesuai permintaan klien
    const extraHeaders = [
      "Status Penanganan",
      "Bentuk Penanganan",
      "Klasifikasi Kasus",
      "Dusun / Alamat",
      "Desa / Kelurahan",
      "Kecamatan",
      "Kabupaten / Kota",
      "Provinsi",
      "Titik Koordinat (Lat, Lng)",
    ];

    // Data aplikasi lengkap untuk sheet kedua: Data Sengketa (Aplikasi)
    const appRows = rows.map((r, i) => ({
      "No": i + 1,
      "Tahun": r.tahun || "",
      "No. Registrasi": r.no_registrasi || "",
      "Pihak Pengadu": formatParties(r.pengadu),
      "Pihak Teradu": formatParties(r.teradu),
      "Provinsi": r.provinsi || "",
      "Kabupaten": r.kabupaten || "",
      "Kecamatan": r.kecamatan || "",
      "Desa / Kelurahan": r.desa || "",
      "Dusun / Alamat": r.dusun || r.alamat || "",
      "Latitude": r.lat ?? "",
      "Longitude": r.lng ?? "",
      "Klasifikasi": r.klasifikasi || "",
      "Tipologi": r.tipologi || "",
      "Bentuk Penanganan": r.bentuk_penanganan || "",
      "Status Penanganan": r.status || "",
      "Akar Masalah": r.akar_masalah || "",
      "Pokok Masalah": r.pokok_masalah || "",
    }));

    try {
      const resp = await fetch("/template_pengaduan.xlsx");
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array", cellStyles: true, cellFormula: true });
        const ws = wb.Sheets["ENTRY"];
        if (ws) {
          // 1. Sesuaikan judul Kantor Pertanahan dan Tahun Anggaran pada sheet-sheet laporan
          updateWorkbookReportHeaders(wb, targetKab, targetYear);

          // 2. Bersihkan data baris > 1 di template ENTRY
          Object.keys(ws).forEach((k) => {
            if (k.startsWith("!")) return;
            const rowNum = parseInt(k.replace(/[A-Z]/g, ""), 10);
            if (rowNum > 1) delete ws[k];
          });

          // 3. Tambahkan kolom Lokasi & Status Penanganan pada baris header (A1..)
          const origHeaders = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];
          const allHeaders = [...origHeaders, ...extraHeaders];
          XLSX.utils.sheet_add_aoa(ws, [allHeaders], { origin: "A1" });

          // 4. Siapkan baris data sheet ENTRY
          const dataRows = rows.map((r, i) => {
            // MAPPING SUBJEK: PP (Col G), PB (Col H), MP/B (Col I), BB (Col J), MM (Col K)
            const tip = mapTipologiToColumnsByParties(r.tipologi, r.pengadu, r.teradu);

            return [
              i + 1,
              r.no_registrasi || "",
              formatPerihal(r),
              formatTanggalSurat(r),
              formatParties(r.pengadu),
              formatParties(r.teradu),
              tip.pp || null,
              tip.pb || null,
              tip.mpb || null,
              tip.bb || null,
              tip.mm || null,
              r.pokok_masalah || r.akar_masalah || "",
              formatStatusHAT(r),
              formatLetakObjek(r),
              r.luas_objek || (r.luas ? `${r.luas} M²` : null),
              r.pihak_berkontribusi || null,
              r.status ? (r.bentuk_penanganan ? `${r.bentuk_penanganan} (${r.status})` : r.status) : (r.bentuk_penanganan || null),
              r.tanggal_penyelesaian || null,
              r.kriteria_penyelesaian || null,
              // Kolom tambahan Lokasi & Status Penanganan sesuai aplikasi
              r.status || "-",
              r.bentuk_penanganan || "-",
              r.klasifikasi || "-",
              r.dusun || r.alamat || "-",
              r.desa || "-",
              r.kecamatan || "-",
              r.kabupaten || "-",
              r.provinsi || "-",
              r.lat && r.lng ? `${r.lat}, ${r.lng}` : "-",
            ];
          });

          if (dataRows.length > 0) {
            XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A2" });
            ws["!ref"] = `A1:AB${dataRows.length + 1}`;
          } else {
            ws["!ref"] = "A1:AB1";
          }

          // 5. Tambahkan Sheet kedua: Data Sengketa (Aplikasi)
          const wsApp = XLSX.utils.json_to_sheet(appRows);
          wsApp["!cols"] = Object.keys(appRows[0] || {}).map((k) => ({
            wch: Math.max(k.length + 3, 14),
          }));
          XLSX.utils.book_append_sheet(wb, wsApp, "Data Sengketa (Aplikasi)");

          XLSX.writeFile(wb, `${filename}.xlsx`);
          return;
        }
      }
    } catch (e) {
      console.warn("Fallback standalone sheet sengketa:", e);
    }

    // Fallback: Standalone ENTRY sheet + App View sheet
    const mappedEntry = rows.map((r, i) => {
      const tip = mapTipologiToColumnsByParties(r.tipologi, r.pengadu, r.teradu);
      return {
        "No.": i + 1,
        "Nomor Register Surat Masuk": r.no_registrasi || "",
        "Perihal": formatPerihal(r),
        "Tanggal Surat": formatTanggalSurat(r),
        "Pihak Pengadu": formatParties(r.pengadu),
        "Pihak Teradu": formatParties(r.teradu),
        "Tipologi PP": tip.pp || "",
        "Tipologi PB": tip.pb || "",
        "Tipologi MP/B": tip.mpb || "",
        "Tipologi BB": tip.bb || "",
        "Tipologi MM": tip.mm || "",
        "Pokok Masalah": r.pokok_masalah || r.akar_masalah || "",
        "Status HAT": formatStatusHAT(r),
        "Letak Objek": formatLetakObjek(r),
        "Luas Objek": r.luas_objek || (r.luas ? `${r.luas} M²` : ""),
        "Pihak Berkontribusi": r.pihak_berkontribusi || "",
        "Tindak Lanjut/Penyelesaian": r.status ? (r.bentuk_penanganan ? `${r.bentuk_penanganan} (${r.status})` : r.status) : (r.bentuk_penanganan || ""),
        "Tanggal Penyelesaian": r.tanggal_penyelesaian || "",
        "Kriteria Penyelesaian": r.kriteria_penyelesaian || "",
        "Status Penanganan": r.status || "",
        "Bentuk Penanganan": r.bentuk_penanganan || "",
        "Klasifikasi Kasus": r.klasifikasi || "",
        "Dusun / Alamat": r.dusun || r.alamat || "",
        "Desa / Kelurahan": r.desa || "",
        "Kecamatan": r.kecamatan || "",
        "Kabupaten / Kota": r.kabupaten || "",
        "Provinsi": r.provinsi || "",
        "Titik Koordinat (Lat, Lng)": r.lat && r.lng ? `${r.lat}, ${r.lng}` : "",
      };
    });

    const wb = XLSX.utils.book_new();
    const wsEntry = XLSX.utils.json_to_sheet(mappedEntry);
    wsEntry["!cols"] = [
      { wch: 6 },   // No.
      { wch: 26 },  // Nomor Register Surat Masuk
      { wch: 28 },  // Perihal
      { wch: 18 },  // Tanggal Surat
      { wch: 28 },  // Pihak Pengadu
      { wch: 28 },  // Pihak Teradu
      { wch: 24 },  // Tipologi PP
      { wch: 24 },  // Tipologi PB
      { wch: 24 },  // Tipologi MP/B
      { wch: 20 },  // Tipologi BB
      { wch: 20 },  // Tipologi MM
      { wch: 45 },  // Pokok Masalah
      { wch: 16 },  // Status HAT
      { wch: 45 },  // Letak Objek
      { wch: 14 },  // Luas Objek
      { wch: 24 },  // Pihak Berkontribusi
      { wch: 32 },  // Tindak Lanjut/Penyelesaian
      { wch: 20 },  // Tanggal Penyelesaian
      { wch: 24 },  // Kriteria Penyelesaian
      { wch: 22 },  // Status Penanganan
      { wch: 22 },  // Bentuk Penanganan
      { wch: 18 },  // Klasifikasi Kasus
      { wch: 25 },  // Dusun/Alamat
      { wch: 20 },  // Desa
      { wch: 20 },  // Kecamatan
      { wch: 22 },  // Kabupaten
      { wch: 22 },  // Provinsi
      { wch: 25 },  // Titik Koordinat
    ];
    XLSX.utils.book_append_sheet(wb, wsEntry, "ENTRY");

    // Sheet kedua
    const wsApp = XLSX.utils.json_to_sheet(appRows);
    wsApp["!cols"] = Object.keys(appRows[0] || {}).map((k) => ({
      wch: Math.max(k.length + 3, 14),
    }));
    XLSX.utils.book_append_sheet(wb, wsApp, "Data Sengketa (Aplikasi)");

    XLSX.writeFile(wb, `${filename}.xlsx`);
    return;
  }

  // ============================================================
  // EXPORT PERKARA: Format Lengkap Sesuai Aplikasi (Sudah Disetujui Klien)
  // ============================================================
  const mapped = rows.map((r, i) => ({
    "No": i + 1,
    "Tahun": r.tahun || "",
    "No. Perkara": r.no_perkara || "",
    "Pengadilan": r.pengadilan || "",
    "Pihak Penggugat": formatParties(r.penggugat),
    "Pihak Tergugat": formatParties(r.tergugat),
    "Turut Tergugat": formatParties(r.turut_tergugat),
    "Provinsi": r.provinsi || "",
    "Kabupaten": r.kabupaten || "",
    "Kecamatan": r.kecamatan || "",
    "Desa/Kelurahan": r.desa || "",
    "Dusun/Alamat": r.dusun || r.alamat || "",
    "Latitude": r.lat ?? "",
    "Longitude": r.lng ?? "",
    "Status Perkara": r.status || "",
    "Pemenang Perkara": r.pemenang || "",
    "Putusan Tk I No": r.tingkat_pertama_no || "",
    "Putusan Tk I Amar": r.tingkat_pertama_amar || "",
    "Putusan Banding No": r.banding_no || "",
    "Putusan Banding Amar": r.banding_amar || "",
    "Putusan Kasasi No": r.kasasi_no || "",
    "Putusan Kasasi Amar": r.kasasi_amar || "",
    "Putusan PK No": r.pk_no || "",
    "Putusan PK Amar": r.pk_amar || "",
    "BA Eksekusi No": r.eksekusi_no || "",
  }));

  const ws = XLSX.utils.json_to_sheet(mapped);
  const colWidths = Object.keys(mapped[0] || {}).map((k) => ({
    wch: Math.max(k.length + 3, 14),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Perkara");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const downloadExcelTemplate = (type = "sengketa") => {
  const isSengketa = type === "sengketa";

  const sample = isSengketa
    ? [
        {
          "No.": 1,
          "Nomor Register Surat Masuk": "01/MAMASA/I/2024",
          "Perihal": "Pencegahan Penerbitan Sertipikat",
          "Tanggal Surat": "25 Januari 2024",
          "Pihak Pengadu": "Lusiana, Dkk.",
          "Pihak Teradu": "Nurhayati dan Ajis Muis",
          "Tipologi PP": "Penguasaan dan Pemilikan Tanah",
          "Tipologi PB": "",
          "Tipologi MP/B": "",
          "Tipologi BB": "",
          "Tipologi MM": "",
          "Pokok Masalah": "Pengajuan sertipikat atas tanah adat yang tidak diperjualbelikan",
          "Status HAT": "Tanah Negara",
          "Letak Objek": "Desa Salukonta, Kecamatan Tawalian, Kabupaten Mamasa, Provinsi Sulawesi Barat",
          "Luas Objek": "1731 M²",
          "Pihak Berkontribusi": "",
          "Tindak Lanjut/Penyelesaian": "Kaukus dan Surat Balasan",
          "Tanggal Penyelesaian": "",
          "Kriteria Penyelesaian": "",
        },
      ]
    : [
        {
          "No": 1,
          "Tahun": 2025,
          "No. Perkara": "12/Pdt.G/2025/PN Mks",
          "Pengadilan": "Pengadilan Negeri",
          "Pihak Penggugat": "Budi Santoso",
          "Pihak Tergugat": "Siti Aminah",
          "Turut Tergugat": "",
          "Provinsi": "Sulawesi Selatan",
          "Kabupaten": "Kota Makassar",
          "Kecamatan": "Mamajang",
          "Desa/Kelurahan": "Mamajang Luar",
          "Dusun/Alamat": "Lingkungan 2, Jl. Veteran",
          "Latitude": -5.165,
          "Longitude": 119.413,
          "Status Perkara": "Sementara Berjalan",
          "Pemenang Perkara": "penggugat",
          "Putusan Tk I No": "12/Pdt.G/2025/PN Mks",
          "Putusan Tk I Amar": "Mengabulkan gugatan sebagian",
          "Putusan Banding No": "",
          "Putusan Banding Amar": "",
          "Putusan Kasasi No": "",
          "Putusan Kasasi Amar": "",
          "Putusan PK No": "",
          "Putusan PK Amar": "",
          "BA Eksekusi No": "",
        },
      ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isSengketa ? "ENTRY" : "Template");
  XLSX.writeFile(wb, `Template_Import_${isSengketa ? "Sengketa" : "Perkara"}.xlsx`);
};

export const parseExcelFile = (file, type = "sengketa") => {
  return new Promise((resolve, reject) => {
    const isSengketa = type === "sengketa";
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        // Prioritaskan sheet ENTRY jika ada, atau sheet pertama
        const targetSheetName = workbook.SheetNames.includes("ENTRY")
          ? "ENTRY"
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[targetSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        const parsed = rawJson.map((row) => {
          // Normalisasi key tanpa spasi dan huruf kecil
          const norm = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            norm[cleanKey] = row[k];
          });

          // Ekstraksi nomor registrasi / perkara
          const num =
            norm.nomorregistersuratmasuk ||
            norm.noregistrasi ||
            norm.noperkara ||
            norm.nomor ||
            "";

          // Coba ekstrak tahun dari nomor registrasi / tanggal surat / tahun eksplisit
          let tahun = norm.tahun || norm.year;
          if (!tahun && norm.tanggalsurat) {
            const matchYear = String(norm.tanggalsurat).match(/\b(19\d\d|20\d\d)\b/);
            if (matchYear) tahun = matchYear[1];
          }
          if (!tahun && num) {
            const matchYear = String(num).match(/\b(19\d\d|20\d\d)\b/);
            if (matchYear) tahun = matchYear[1];
          }
          tahun = tahun || new Date().getFullYear();

          const pengadu = norm.pihakpengadu || norm.pengadu || "";
          const teradu = norm.pihakteradu || norm.teradu || "";
          const penggugat = norm.pihakpenggugat || norm.penggugat || "";
          const tergugat = norm.pihaktergugat || norm.tergugat || "";
          const turut = norm.turuttergugat || norm.pihakturut || "";

          let provinsi = norm.provinsi || "";
          let kabupaten = norm.kabupaten || norm.kabupatenkota || "";
          let kecamatan = norm.kecamatan || "";
          let desa = norm.desakelurahan || norm.desa || norm.kelurahan || "";
          let dusun = norm.dusunalamat || norm.dusun || norm.alamat || "";

          // Jika format dari Letak Objek (mis: "Desa Salukonta, Kecamatan Tawalian, Kabupaten Mamasa, Provinsi Sulawesi Barat")
          if (norm.letakobjek && (!desa || !kecamatan || !kabupaten)) {
            const parts = String(norm.letakobjek).split(",").map((s) => s.trim());
            parts.forEach((p) => {
              if (/^provinsi\s+/i.test(p)) provinsi = p.replace(/^provinsi\s+/i, "");
              else if (/^kabupaten\s+|^kota\s+/i.test(p)) kabupaten = p.replace(/^kabupaten\s+|^kota\s+/i, "");
              else if (/^kecamatan\s+/i.test(p)) kecamatan = p.replace(/^kecamatan\s+/i, "");
              else if (/^desa\s+|^kelurahan\s+/i.test(p)) desa = p.replace(/^desa\s+|^kelurahan\s+/i, "");
              else if (!dusun) dusun = p;
            });
          }

          const lat = norm.latitude ?? norm.lat ?? null;
          const lng = norm.longitude ?? norm.lng ?? null;

          // Tipologi (mendukung kolom terpisah PP, PB, MP/B, BB, MM atau kolom umum)
          const tipologi =
            norm.tipologipp ||
            norm.tipologipb ||
            norm.tipologimpb ||
            norm.tipologibb ||
            norm.tipologimm ||
            norm.tipologi ||
            "";

          if (isSengketa) {
            return {
              tahun: +tahun,
              no_registrasi: String(num).trim(),
              pengadu: pengadu ? [{ nama: String(pengadu).trim(), jenis: "Perorangan" }] : [],
              teradu: teradu ? [{ nama: String(teradu).trim(), jenis: "Perorangan" }] : [],
              provinsi,
              kabupaten,
              kecamatan,
              desa,
              dusun,
              lat: lat ? +lat : null,
              lng: lng ? +lng : null,
              klasifikasi: norm.klasifikasikasus || norm.klasifikasi || "Ringan",
              tipologi,
              bentuk_penanganan:
                norm.bentukpenanganan ||
                norm.tindaklanjutpenyelesaian ||
                norm.tindaklanjut ||
                "",
              status: norm.statuspenanganan || norm.statuskasus || norm.status || "Sementara Penanganan",
              akar_masalah: norm.akarmasalah || norm.perihal || "",
              pokok_masalah: norm.pokokmasalah || "",
            };
          }

          return {
            tahun: +tahun,
            no_perkara: String(num).trim(),
            pengadilan: norm.pengadilan || "Pengadilan Negeri",
            penggugat: penggugat ? [{ nama: String(penggugat).trim(), jenis: "Perorangan" }] : [],
            tergugat: tergugat ? [{ nama: String(tergugat).trim(), jenis: "Perorangan" }] : [],
            turut_tergugat: turut ? [{ nama: String(turut).trim(), jenis: "Perorangan" }] : [],
            provinsi,
            kabupaten,
            kecamatan,
            desa,
            dusun,
            lat: lat ? +lat : null,
            lng: lng ? +lng : null,
            status: norm.status || norm.statusperkara || "Sementara Berjalan",
            pemenang: (norm.pemenang || norm.pemenangperkara || "").toLowerCase(),
            tingkat_pertama_no: norm.putusantkino || norm.tingkatpertamano || "",
            tingkat_pertama_amar: norm.putusantkiamar || norm.tingkatpertamaamar || "",
            banding_no: norm.putusanbandingno || norm.bandingno || "",
            banding_amar: norm.putusanbandingamar || norm.bandingamar || "",
            kasasi_no: norm.putusankasasino || norm.kasasino || "",
            kasasi_amar: norm.putusankasasiamar || norm.kasasiamar || "",
            pk_no: norm.putusanpkno || norm.pkno || "",
            pk_amar: norm.putusanpkamar || norm.pkamar || "",
            eksekusi_no: norm.baeksekusino || norm.eksekusino || "",
          };
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
