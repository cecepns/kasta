CREATE DATABASE IF NOT EXISTS kasta CHARACTER SET utf8mb4;
USE kasta;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  INDEX (tahun)
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
  INDEX (tahun)
);

-- Akun default bawaan:
-- 1. Administrator : admin / admin123
-- 2. Staff Pengguna: user / user123
INSERT INTO users (id, name, username, password, role) VALUES
(1, 'Administrator', 'admin', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'admin'),
(2, 'Staff Pengguna', 'user', '$2a$10$1Et9rFP5.T7IwALG8FyroerNpfHH7QRNrJZ1cWdE4Z3OnBybqFyJm', 'user')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO sengketa (tahun,no_registrasi,pengadu,teradu,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,akar_masalah,pokok_masalah,tipologi,klasifikasi,bentuk_penanganan,status,dokumen) VALUES
(2025,'REG/001/2025','[{"jenis":"Perorangan","nik":"7371000000000001","nama":"Andi Saputra","alamat":"Jl. Pettarani No. 5","pekerjaan":"Petani"}]','[{"jenis":"Badan Hukum","nama":"PT Contoh Lahan","kedudukan":"Makassar"}]','Panakkukang','Panakkukang','Makassar','Sulawesi Selatan','Panakkukang, Makassar',-5.1477,119.4327,'Tumpang tindih bidang','Batas bidang tanah','letak dan batas bidang tanah','Sedang','Mediasi','Sementara Penanganan','[]');
INSERT INTO perkara (tahun,no_perkara,pengadilan,penggugat,tergugat,turut_tergugat,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,status,tingkat_pertama_no,tingkat_pertama_amar,pemenang,dokumen) VALUES
(2025,'12/Pdt.G/2025/PN Mks','Pengadilan Negeri','[{"nik":"7371000000000002","nama":"Budi Santoso","alamat":"Jl. Veteran","pekerjaan":"Wiraswasta"}]','[{"nik":"7371000000000003","nama":"Siti Aminah","alamat":"Jl. Urip","pekerjaan":"PNS"}]','[]','Mamajang','Mamajang','Makassar','Sulawesi Selatan','Mamajang, Makassar',-5.1650,119.4130,'Sementara Berjalan','12/Pdt.G/2025/PN Mks','Mengabulkan gugatan sebagian','penggugat','[]');
