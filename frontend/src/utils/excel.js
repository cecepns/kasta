import * as XLSX from "xlsx";
import { safeArray } from "./config";

const formatParties = (parties) => {
  const arr = safeArray(parties);
  if (!arr.length) return "";
  return arr.map((p) => p.nama || p.jenis || "-").join("; ");
};

// Map tipologi string to 5 specific BPN columns: PP, PB, MP/B, BB, MM
export const mapTipologiToColumns = (tipologi = "") => {
  const t = (tipologi || "").toLowerCase().trim();
  const cols = { pp: "", pb: "", mpb: "", bb: "", mm: "" };
  if (!t) return cols;

  if (t.includes("batas") || t.includes("letak")) {
    cols.bb = tipologi;
  } else if (
    t.includes("penguasaan") ||
    t.includes("pemilikan") ||
    t.includes("adat") ||
    t.includes("ulayat") ||
    t.includes("putusan")
  ) {
    cols.pp = tipologi;
  } else if (
    t.includes("sertipikat") ||
    t.includes("penetapan hak") ||
    t.includes("pendaftaran") ||
    t.includes("pemeliharaan") ||
    t.includes("elektronik")
  ) {
    cols.pb = tipologi;
  } else if (
    t.includes("pemanfaatan") ||
    t.includes("penggunaan") ||
    t.includes("pengadaan") ||
    t.includes("land reform")
  ) {
    cols.mpb = tipologi;
  } else if (t.includes("mafia") || t.includes("kejahatan")) {
    cols.mm = tipologi;
  } else {
    cols.pp = tipologi;
  }
  return cols;
};

// Format complete Letak Objek string (Dusun, Desa, Kecamatan, Kabupaten, Provinsi)
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

// Export records to Excel matching BPN ENTRY format
export const exportRecordsToExcel = async (
  rows = [],
  type = "sengketa",
  filename = "Arsip",
  options = {}
) => {
  const isSengketa = type === "sengketa";

  if (isSengketa) {
    // 1. Coba populate ke master template BPN (Multi-Sheet: ENTRY, TAHUN, Data Kasus, Resume, TREND)
    try {
      const resp = await fetch("/template_pengaduan.xlsx");
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array", cellStyles: true, cellFormula: true });
        const ws = wb.Sheets["ENTRY"];
        if (ws) {
          // Bersihkan data lama baris 2 ke atas (pertahankan header A1:S1 beserta warnanya)
          Object.keys(ws).forEach((k) => {
            if (k.startsWith("!")) return;
            const rowNum = parseInt(k.replace(/[A-Z]/g, ""), 10);
            if (rowNum > 1) delete ws[k];
          });

          // Siapkan data baris baru sesuai 19 kolom sheet ENTRY
          const dataRows = rows.map((r, i) => {
            const tip = mapTipologiToColumns(r.tipologi);
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
              r.bentuk_penanganan || r.status || null,
              r.tanggal_penyelesaian || null,
              r.kriteria_penyelesaian || null,
            ];
          });

          if (dataRows.length > 0) {
            XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A2" });
            ws["!ref"] = `A1:S${dataRows.length + 1}`;
          } else {
            ws["!ref"] = "A1:S1";
          }

          XLSX.writeFile(wb, `${filename}.xlsx`);
          return;
        }
      }
    } catch (e) {
      console.warn("Fallback pembuatan standalone sheet ENTRY:", e);
    }

    // 2. Fallback: Buat sheet ENTRY standalone dengan 19 kolom dan lebar kolom presisi
    const mapped = rows.map((r, i) => {
      const tip = mapTipologiToColumns(r.tipologi);
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
        "Tindak Lanjut/Penyelesaian": r.bentuk_penanganan || r.status || "",
        "Tanggal Penyelesaian": r.tanggal_penyelesaian || "",
        "Kriteria Penyelesaian": r.kriteria_penyelesaian || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(mapped);
    ws["!cols"] = [
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
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ENTRY");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return;
  }

  // Format Perkara
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
              klasifikasi: norm.klasifikasi || norm.klasifikasikasus || "Ringan",
              tipologi,
              bentuk_penanganan:
                norm.tindaklanjutpenyelesaian ||
                norm.tindaklanjut ||
                norm.bentukpenanganan ||
                "",
              status: norm.status || norm.statuskasus || "Sementara Penanganan",
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
