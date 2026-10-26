CREATE DATABASE IF NOT EXISTS kasta CHARACTER SET utf8mb4;
USE kasta;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin','user') NOT NULL DEFAULT 'user',
  provinsi VARCHAR(100) NULL,
  kabupaten VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (kabupaten),
  INDEX (role)
);

CREATE TABLE IF NOT EXISTS sengketa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun SMALLINT NOT NULL,
  no_registrasi VARCHAR(100) NOT NULL,
  pengadu JSON, teradu JSON,
  dusun VARCHAR(100), desa VARCHAR(100), kecamatan VARCHAR(100), kabupaten VARCHAR(100), provinsi VARCHAR(100),
  alamat VARCHAR(500), lat DECIMAL(10,7), lng DECIMAL(10,7),
  akar_masalah TEXT, pokok_masalah TEXT, tipologi VARCHAR(150), klasifikasi VARCHAR(20),
  bentuk_penanganan VARCHAR(50), status VARCHAR(50),
  dokumen JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (tahun),
  INDEX (kabupaten)
);

CREATE TABLE IF NOT EXISTS perkara (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun SMALLINT NOT NULL,
  no_perkara VARCHAR(100) NOT NULL,
  pengadilan VARCHAR(50),
  penggugat JSON, tergugat JSON, turut_tergugat JSON,
  dusun VARCHAR(100), desa VARCHAR(100), kecamatan VARCHAR(100), kabupaten VARCHAR(100), provinsi VARCHAR(100),
  alamat VARCHAR(500), lat DECIMAL(10,7), lng DECIMAL(10,7),
  status VARCHAR(50),
  tingkat_pertama_no VARCHAR(100), tingkat_pertama_amar TEXT,
  banding_no VARCHAR(100), banding_amar TEXT,
  kasasi_no VARCHAR(100), kasasi_amar TEXT,
  pk_no VARCHAR(100), pk_amar TEXT,
  eksekusi_no VARCHAR(100),
  pemenang VARCHAR(20),
  dokumen JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (tahun),
  INDEX (kabupaten)
);

-- Akun default bawaan:
-- 1. Administrator Pusat (Superadmin) : admin / admin123
-- 2. Administrator Wilayah Makassar   : admin_makassar / admin123
-- 3. Staff Pengguna Wilayah Makassar  : user_makassar / user123
-- 4. Administrator Wilayah Bandung    : admin_bandung / admin123
-- 5. Staff Pengguna Wilayah Bandung   : user_bandung / user123
INSERT INTO users (id, name, username, password, role, provinsi, kabupaten) VALUES
(1, 'Administrator Pusat', 'admin', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'superadmin', NULL, NULL),
(2, 'Admin Kota Makassar', 'admin_makassar', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'admin', 'Sulawesi Selatan', 'Kota Makassar'),
(3, 'Staff Kota Makassar', 'user_makassar', '$2a$10$1Et9rFP5.T7IwALG8FyroerNpfHH7QRNrJZ1cWdE4Z3OnBybqFyJm', 'user', 'Sulawesi Selatan', 'Kota Makassar'),
(4, 'Admin Kab. Bandung', 'admin_bandung', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'admin', 'Jawa Barat', 'Kabupaten Bandung'),
(5, 'Staff Kab. Bandung', 'user_bandung', '$2a$10$1Et9rFP5.T7IwALG8FyroerNpfHH7QRNrJZ1cWdE4Z3OnBybqFyJm', 'user', 'Jawa Barat', 'Kabupaten Bandung')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), provinsi=VALUES(provinsi), kabupaten=VALUES(kabupaten);

INSERT INTO sengketa (id, tahun, no_registrasi, pengadu, teradu, dusun, desa, kecamatan, kabupaten, provinsi, alamat, lat, lng, akar_masalah, pokok_masalah, tipologi, klasifikasi, bentuk_penanganan, status, dokumen) VALUES
(1, 2025, 'REG/001/MKS/2025', '[{"jenis":"Perorangan","nik":"7371000000000001","nama":"Andi Saputra","alamat":"Jl. Pettarani No. 5","pekerjaan":"Petani"}]', '[{"jenis":"Badan Hukum","nama":"PT Contoh Lahan","kedudukan":"Makassar"}]', 'Dusun 1', 'Tamamaung', 'Panakkukang', 'Kota Makassar', 'Sulawesi Selatan', 'Tamamaung, Panakkukang, Kota Makassar, Sulawesi Selatan', -5.1477, 119.4327, 'Tumpang tindih bidang', 'Batas bidang tanah', 'letak dan batas bidang tanah', 'Sedang', 'Mediasi', 'Sementara Penanganan', '[]'),
(2, 2025, 'REG/002/BDG/2025', '[{"jenis":"Perorangan","nik":"3204000000000001","nama":"Asep Sunandar","alamat":"Jl. Raya Cileunyi No. 10","pekerjaan":"Wiraswasta"}]', '[{"jenis":"Perorangan","nik":"3204000000000002","nama":"Dadang Hidayat","alamat":"Cileunyi","pekerjaan":"Petani"}]', 'Dusun Cimekar', 'Cileunyi Kulon', 'Cileunyi', 'Kabupaten Bandung', 'Jawa Barat', 'Cileunyi Kulon, Cileunyi, Kabupaten Bandung, Jawa Barat', -6.9383, 107.7441, 'Klaim waris belum terbagi', 'Kepemilikan hak atas tanah', 'penguasaan dan pemilikan', 'Ringan', 'Mediasi', 'Damai/Sepakat', '[]')
ON DUPLICATE KEY UPDATE id=VALUES(id);

INSERT INTO perkara (id, tahun, no_perkara, pengadilan, penggugat, tergugat, turut_tergugat, dusun, desa, kecamatan, kabupaten, provinsi, alamat, lat, lng, status, tingkat_pertama_no, tingkat_pertama_amar, pemenang, dokumen) VALUES
(1, 2025, '12/Pdt.G/2025/PN Mks', 'Pengadilan Negeri', '[{"nik":"7371000000000002","nama":"Budi Santoso","alamat":"Jl. Veteran","pekerjaan":"Wiraswasta"}]', '[{"nik":"7371000000000003","nama":"Siti Aminah","alamat":"Jl. Urip","pekerjaan":"PNS"}]', '[]', 'Lingkungan 2', 'Mamajang Luar', 'Mamajang', 'Kota Makassar', 'Sulawesi Selatan', 'Mamajang Luar, Mamajang, Kota Makassar, Sulawesi Selatan', -5.1650, 119.4130, 'Sementara Berjalan', '12/Pdt.G/2025/PN Mks', 'Mengabulkan gugatan sebagian', 'penggugat', '[]'),
(2, 2025, '45/Pdt.G/2025/PN Blb', 'Pengadilan Negeri', '[{"nik":"3204000000000003","nama":"H. Rahmat","alamat":"Jl. Al-Fathu No. 2","pekerjaan":"Pedagang"}]', '[{"nik":"3204000000000004","nama":"Iwan Kurniawan","alamat":"Soreang","pekerjaan":"Swasta"}]', '[]', 'Kampung Sadu', 'Soreang', 'Soreang', 'Kabupaten Bandung', 'Jawa Barat', 'Soreang, Soreang, Kabupaten Bandung, Jawa Barat', -7.0253, 107.5186, 'Inkrah', '45/Pdt.G/2025/PN Blb', 'Menolak gugatan penggugat seluruhnya', 'tergugat', '[]')
ON DUPLICATE KEY UPDATE id=VALUES(id);
