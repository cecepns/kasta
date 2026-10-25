import { ExternalLink, MapPin } from "lucide-react";

export const safeArray = (list) => {
  if (Array.isArray(list)) return list;
  if (typeof list === "string") {
    try {
      const parsed = JSON.parse(list);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const partyNames = (list) => {
  const arr = safeArray(list);
  if (!arr.length) return "-";
  const first = arr[0]?.nama || (arr[0]?.jenis ? `${arr[0].jenis}` : "-");
  return first + (arr.length > 1 ? ` (+${arr.length - 1})` : "");
};

export const lokasiText = (r) =>
  [r.dusun, r.desa, r.kecamatan, r.kabupaten, r.provinsi].filter(Boolean).join(", ") || r.alamat || "-";

export const renderLokasiCell = (r) => {
  const text = lokasiText(r);
  const hasCoords = r.lat != null && r.lng != null && !isNaN(+r.lat) && !isNaN(+r.lng);
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
      <span className="truncate max-w-[220px]" title={text}>{text}</span>
      {hasCoords && (
        <a
          href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex w-fit items-center gap-1 rounded bg-sand-100 px-1.5 py-0.5 text-[11px] font-medium text-clay-700 hover:bg-sand-200 hover:text-clay-900"
          title="Buka di Google Maps"
        >
          <MapPin size={12} className="text-red-500" />
          <span>Maps</span>
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
};

export const JENIS_PIHAK = ["Perorangan", "Pemerintah", "Badan Hukum", "Kelompok Masyarakat"];
export const NAMA_LABEL = {
  Perorangan: "Nama",
  Pemerintah: "Nama instansi",
  "Badan Hukum": "Nama badan hukum",
  "Kelompok Masyarakat": "Nama kelompok/perkumpulan",
};

export const TIPOLOGI = [
  "letak dan batas bidang tanah",
  "penguasaan dan pemilikan",
  "penggunaan dan pemanfaatan tanah",
  "penetapan hak dan pendaftaran tanah",
  "pemeliharaan data pendaftaran tanah",
  "tanah objek land reform",
  "tanah adat/tanah ulayat",
  "pengadaan tanah",
  "pelaksanaan putusan pengadilan",
  "informasi dan transaksi elektronik terkait pelayanan pertanahan",
  "tipologi lainnya",
];

export const KLASIFIKASI_KASUS = ["Ringan", "Sedang", "Berat"];
export const BENTUK_PENANGANAN = ["Surat Rekomendasi", "Mediasi", "Surat Balasan"];
export const STATUS_SENGKETA = [
  "Tidak Ada Penyelesaian",
  "Damai/Sepakat",
  "Sementara Penanganan",
  "Dalam proses perkara",
];

export const PENGADILAN_OPTIONS = ["Pengadilan Negeri", "Pengadilan Tata Usaha Negara"];
export const STATUS_PERKARA = ["Inkrah", "Sementara Berjalan", "Upaya Hukum"];

export const LEVELS = [
  ["tingkat_pertama", "Tingkat pertama"],
  ["banding", "Tingkat banding"],
  ["kasasi", "Tingkat kasasi"],
  ["pk", "Peninjauan kembali"],
];

const emptyLoc = { dusun: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", alamat: "", lat: null, lng: null };
export const emptyPerson = { nik: "", nama: "", alamat: "", pekerjaan: "" };
export const emptyOrg = { jenis: "Perorangan", ...emptyPerson, kedudukan: "" };

export const RECORDS = {
  sengketa: {
    label: "Sengketa",
    numKey: "no_registrasi",
    numLabel: "No. registrasi",
    typed: true,
    parties: [
      ["pengadu", "Pihak pengadu"],
      ["teradu", "Pihak teradu"],
    ],
    empty: {
      tahun: new Date().getFullYear(),
      no_registrasi: "",
      pengadu: [{ ...emptyOrg }],
      teradu: [{ ...emptyOrg }],
      ...emptyLoc,
      akar_masalah: "",
      pokok_masalah: "",
      tipologi: "",
      klasifikasi: "",
      bentuk_penanganan: "",
      status: "",
      dokumen: [],
    },
    categories: [
      { key: "status", label: "Status", options: STATUS_SENGKETA },
      { key: "klasifikasi", label: "Klasifikasi", options: KLASIFIKASI_KASUS },
      { key: "tipologi", label: "Tipologi", options: TIPOLOGI },
    ],
    columns: [
      { key: "no_registrasi", label: "No. registrasi" },
      { key: "pengadu", label: "Pihak pengadu", render: (r) => partyNames(r.pengadu) },
      { key: "teradu", label: "Pihak teradu", render: (r) => partyNames(r.teradu) },
      { key: "lokasi", label: "Lokasi (Maps)", render: renderLokasiCell },
      { key: "klasifikasi", label: "Klasifikasi" },
      { key: "status", label: "Status" },
    ],
  },
  perkara: {
    label: "Perkara",
    numKey: "no_perkara",
    numLabel: "No. perkara",
    typed: false,
    parties: [
      ["penggugat", "Pihak penggugat"],
      ["tergugat", "Pihak tergugat"],
      ["turut_tergugat", "Pihak turut tergugat"],
    ],
    empty: {
      tahun: new Date().getFullYear(),
      no_perkara: "",
      pengadilan: "Pengadilan Negeri",
      penggugat: [{ ...emptyPerson }],
      tergugat: [{ ...emptyPerson }],
      turut_tergugat: [],
      ...emptyLoc,
      status: "",
      pemenang: "",
      tingkat_pertama_no: "",
      tingkat_pertama_amar: "",
      banding_no: "",
      banding_amar: "",
      kasasi_no: "",
      kasasi_amar: "",
      pk_no: "",
      pk_amar: "",
      eksekusi_no: "",
      dokumen: [],
    },
    categories: [
      { key: "status", label: "Status", options: STATUS_PERKARA },
      { key: "pengadilan", label: "Pengadilan", options: PENGADILAN_OPTIONS },
    ],
    columns: [
      { key: "no_perkara", label: "No. perkara" },
      { key: "penggugat", label: "Pihak penggugat", render: (r) => partyNames(r.penggugat) },
      { key: "tergugat", label: "Pihak tergugat", render: (r) => partyNames(r.tergugat) },
      { key: "lokasi", label: "Lokasi (Maps)", render: renderLokasiCell },
      { key: "status", label: "Status" },
    ],
  },
};

