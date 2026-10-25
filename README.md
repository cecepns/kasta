# KASTA

**KASTA** adalah aplikasi web manajemen arsip digital berkas **Sengketa** dan **Perkara** pertanahan yang terhubung langsung dengan titik lokasi geografis (**OpenStreetMap, Citra Satelit Esri, Google Maps, dan Google Earth**).

Aplikasi ini dibangun untuk keperluan internal kantor dengan kontrol akses berbasis peran (**Administrator** dan **User**) sesuai dengan brief kebutuhan klien dan standar arsitektur `AGENTS.md`.

---

## 🚀 Fitur Utama

1. **Dashboard Statistik & Pilihan Tahun**
   - Menampilkan total berkas Sengketa dan Perkara.
   - Grafik batang statistik tahunan yang interaktif (klik batang tahun untuk langsung membuka arsip tahun tersebut).
   - Kartu navigasi cepat **Pilihan Tahun** dengan tombol langsung ke berkas Sengketa dan Perkara tahun terkait.

2. **Manajemen Arsip Sengketa**
   - Berkas tersusun pertahun (tabel tahun dan jumlah data).
   - Rincian tabel per tahun dengan filter kategori realtime (**Status**, **Klasifikasi**, **Tipologi**) dan pencarian debounced.
   - Kolom tabel dilengkapi **badge tautan langsung ke Google Maps**.
   - Input/Edit modal mencakup:
     - Nomor Registrasi Kasus & Tahun
     - Pihak Pengadu & Teradu (Perorangan, Pemerintah, Badan Hukum, Kelompok Masyarakat) dengan dukungan banyak pihak
     - Objek: Dusun, Desa, Kecamatan, Kabupaten, Provinsi, dan penanda titik koordinat (Leaflet + Citra Satelit + Geocoding Nominatim + input manual)
     - Riwayat Kasus: Akar Masalah, Pokok Masalah, Tipologi Kasus, Klasifikasi Kasus
     - Tindak Lanjut: Bentuk Penanganan (Surat Rekomendasi, Mediasi, Surat Balasan), Status
     - Upload hasil scan dokumen digital (PDF/gambar)

3. **Manajemen Arsip Perkara**
   - Berkas tersusun pertahun dengan filter kategori (**Status Perkara**, **Pengadilan**) dan pencarian realtime.
   - Input/Edit modal mencakup:
     - Nomor Perkara & Pengadilan (Pengadilan Negeri / PTUN)
     - Pihak Penggugat, Tergugat, dan Turut Tergugat (dapat lebih dari 1 orang)
     - Objek Perkara & penanda lokasi peta
     - Riwayat Perkara per tingkatan: Tingkat Pertama, Tingkat Banding, Kasasi, Peninjauan Kembali (Nomor & Amar Putusan dalam format multi-baris), serta Nomor BA Eksekusi
     - **Pemenang Perkara**: Memilih Penggugat atau Tergugat, dan **otomatis menampilkan ringkasan data identitas pihak pemenang** sesuai brief
     - Upload hasil scan dokumen digital

4. **Peta Sebaran Digital (MapView)**
   - Menampilkan keseluruhan titik lokasi berkas Sengketa dan Perkara yang telah diinput.
   - **Layer Switcher**: Mendukung tampilan **Peta Standar** dan **Citra Satelit** (Esri World Imagery).
   - Marker berkode warna khusus (Terracotta untuk Sengketa, Navy untuk Perkara).
   - Filter peta berdasarkan kategori (Semua, Sengketa, Perkara) dan filter tahun.
   - Popup interaktif dengan tombol **Lihat Detail Lengkap**, tautan langsung ke **Google Maps**, dan **Google Earth**.

5. **Manajemen Pengguna (Admin Only)**
   - Khusus akun Administrator dapat menambahkan, mengedit, dan menghapus akun pengguna (User & Admin).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide React, Leaflet, Recharts, React Hot Toast, Vite PWA.
- **Backend**: Node.js, Express.js, MySQL (mysql2), Multer, JWT, Bcrypt.js, CORS, Dotenv.
- **Database**: MySQL (`sql/database.sql`).

---

## 💻 Cara Menjalankan

### 1. Database
Pastikan MySQL sudah berjalan di komputer:
```bash
mysql -u root -p < backend/sql/database.sql
```
*(Database `kasta` beserta tabel dan data sampel 2025 otomatis dibuat).*

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
*Backend berjalan di: `https://api.kingcreativestudio.my.id/kasta`*
*Akun Administrator default: `admin` / `admin123`*

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
*Frontend berjalan di: `http://localhost:5173`*
# kasta
