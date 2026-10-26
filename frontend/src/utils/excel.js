import * as XLSX from "xlsx";
import { safeArray } from "./config";

const formatParties = (parties) => {
  const arr = safeArray(parties);
  if (!arr.length) return "";
  return arr.map((p) => p.nama || p.jenis || "-").join("; ");
};

export const exportRecordsToExcel = (rows = [], type = "sengketa", filename = "Arsip") => {
  const isSengketa = type === "sengketa";

  const mapped = rows.map((r, i) => {
    if (isSengketa) {
      return {
        "No": i + 1,
        "Tahun": r.tahun || "",
        "No. Registrasi": r.no_registrasi || "",
        "Pihak Pengadu": formatParties(r.pengadu),
        "Pihak Teradu": formatParties(r.teradu),
        "Provinsi": r.provinsi || "",
        "Kabupaten": r.kabupaten || "",
        "Kecamatan": r.kecamatan || "",
        "Desa/Kelurahan": r.desa || "",
        "Dusun/Alamat": r.dusun || r.alamat || "",
        "Latitude": r.lat ?? "",
        "Longitude": r.lng ?? "",
        "Klasifikasi": r.klasifikasi || "",
        "Tipologi": r.tipologi || "",
        "Bentuk Penanganan": r.bentuk_penanganan || "",
        "Status Kasus": r.status || "",
        "Akar Masalah": r.akar_masalah || "",
        "Pokok Masalah": r.pokok_masalah || "",
      };
    }

    return {
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
    };
  });

  const ws = XLSX.utils.json_to_sheet(mapped);
  // Auto-width columns
  const colWidths = Object.keys(mapped[0] || {}).map((k) => ({
    wch: Math.max(k.length + 3, 14),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isSengketa ? "Data Sengketa" : "Data Perkara");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const downloadExcelTemplate = (type = "sengketa") => {
  const isSengketa = type === "sengketa";

  const sample = isSengketa
    ? [
        {
          "Tahun": 2025,
          "No. Registrasi": "REG/001/MKS/2025",
          "Pihak Pengadu": "Andi Saputra",
          "Pihak Teradu": "PT Contoh Lahan",
          "Provinsi": "Sulawesi Selatan",
          "Kabupaten": "Kota Makassar",
          "Kecamatan": "Panakkukang",
          "Desa/Kelurahan": "Tamamaung",
          "Dusun/Alamat": "Dusun 1, Jl. Pettarani No. 5",
          "Latitude": -5.1477,
          "Longitude": 119.4327,
          "Klasifikasi": "Sedang",
          "Tipologi": "letak dan batas bidang tanah",
          "Bentuk Penanganan": "Mediasi",
          "Status Kasus": "Sementara Penanganan",
          "Akar Masalah": "Tumpang tindih batas bidang",
          "Pokok Masalah": "Klaim ganda kepemilikan",
        },
      ]
    : [
        {
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
  XLSX.utils.book_append_sheet(wb, ws, "Template");
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        const parsed = rawJson.map((row) => {
          // Normalize keys
          const norm = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            norm[cleanKey] = row[k];
          });

          const tahun = norm.tahun || norm.year || new Date().getFullYear();
          const num = norm.noregistrasi || norm.noperkara || norm.nomor || "";

          const pengadu = norm.pihakpengadu || norm.pengadu || "";
          const teradu = norm.pihakteradu || norm.teradu || "";
          const penggugat = norm.pihakpenggugat || norm.penggugat || "";
          const tergugat = norm.pihaktergugat || norm.tergugat || "";
          const turut = norm.turuttergugat || norm.pihakturut || "";

          const provinsi = norm.provinsi || "";
          const kabupaten = norm.kabupaten || norm.kabupatenkota || "";
          const kecamatan = norm.kecamatan || "";
          const desa = norm.desakelurahan || norm.desa || norm.kelurahan || "";
          const dusun = norm.dusunalamat || norm.dusun || norm.alamat || "";
          const lat = norm.latitude ?? norm.lat ?? null;
          const lng = norm.longitude ?? norm.lng ?? null;

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
              tipologi: norm.tipologi || "",
              bentuk_penanganan: norm.bentukpenanganan || "",
              status: norm.status || norm.statuskasus || "Sementara Penanganan",
              akar_masalah: norm.akarmasalah || "",
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
