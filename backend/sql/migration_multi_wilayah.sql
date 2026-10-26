-- ==============================================================================
-- FILE MIGRASI DATABASE KASTA: MULTI-TENANT WILAYAH & INTEGRASI KEMENDAGRI
-- Tanggal: 26 Oktober 2026
--
-- CARA IMPORT DI PHPMYADMIN:
-- 1. Buka phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Pilih database `kasta` di menu sebelah kiri.
-- 3. Klik tab "Import" di bagian atas.
-- 4. Klik tombol "Choose File" / "Pilih File" dan pilih file ini:
--    `migration_multi_wilayah.sql`
-- 5. Klik tombol "Kirim" / "Go" di bagian bawah.
--
-- CATATAN:
-- Skrip ini dirancang AMAN (idempotent). Skrip ini secara otomatis mengecek
-- apakah kolom atau indeks sudah ada sebelum menambahkannya, sehingga tidak
-- akan menimbulkan error duplikasi meskipun di-import berulang kali.
-- ==============================================================================

USE `kasta`;

-- ------------------------------------------------------------------------------
-- 1. PROSEDUR AMAN PEMBARUAN TABEL & STRUKTUR
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS MigrateMultiWilayah;

DELIMITER $$
CREATE PROCEDURE MigrateMultiWilayah()
BEGIN
    -- 1.1 Ubah ENUM role pada tabel users agar mendukung 'superadmin' (Administrator Pusat)
    ALTER TABLE `users` 
      MODIFY COLUMN `role` ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user';

    -- 1.2 Tambah kolom provinsi pada tabel users jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'provinsi'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `provinsi` VARCHAR(100) NULL AFTER `role`;
    END IF;

    -- 1.3 Tambah kolom kabupaten pada tabel users jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'kabupaten'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `kabupaten` VARCHAR(100) NULL AFTER `provinsi`;
    END IF;

    -- 1.4 Tambah indeks kabupaten pada tabel users jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_kabupaten'
    ) THEN
        ALTER TABLE `users` ADD INDEX `idx_users_kabupaten` (`kabupaten`);
    END IF;

    -- 1.5 Tambah indeks role pada tabel users jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_role'
    ) THEN
        ALTER TABLE `users` ADD INDEX `idx_users_role` (`role`);
    END IF;

    -- 1.6 Tambah indeks kabupaten pada tabel sengketa jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sengketa' AND INDEX_NAME = 'idx_sengketa_kabupaten'
    ) THEN
        ALTER TABLE `sengketa` ADD INDEX `idx_sengketa_kabupaten` (`kabupaten`);
    END IF;

    -- 1.7 Tambah indeks kabupaten pada tabel perkara jika belum ada
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'perkara' AND INDEX_NAME = 'idx_perkara_kabupaten'
    ) THEN
        ALTER TABLE `perkara` ADD INDEX `idx_perkara_kabupaten` (`kabupaten`);
    END IF;

    -- 1.8 Update akun administrator bawaan menjadi superadmin (Administrator Pusat)
    UPDATE `users` 
    SET `role` = 'superadmin', `name` = 'Administrator Pusat' 
    WHERE `username` = 'admin';

END$$
DELIMITER ;

-- Jalankan prosedur migrasi struktur
CALL MigrateMultiWilayah();

-- Hapus prosedur sementara setelah selesai
DROP PROCEDURE IF EXISTS MigrateMultiWilayah;


-- ------------------------------------------------------------------------------
-- 2. SEED AKUN BAWAAN UNTUK UJI COBA MULTI-WILAYAH
-- ------------------------------------------------------------------------------
-- Akun yang disediakan:
-- 1. Administrator Pusat (Superadmin) : admin / admin123
-- 2. Administrator Kota Makassar      : admin_makassar / admin123
-- 3. Staff Pengguna Kota Makassar     : user_makassar / user123
-- 4. Administrator Kab. Bandung       : admin_bandung / admin123
-- 5. Staff Pengguna Kab. Bandung      : user_bandung / user123
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`name`, `username`, `password`, `role`, `provinsi`, `kabupaten`) VALUES
('Administrator Pusat', 'admin', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'superadmin', NULL, NULL),
('Admin Kota Makassar', 'admin_makassar', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'admin', 'Sulawesi Selatan', 'Kota Makassar'),
('Staff Kota Makassar', 'user_makassar', '$2a$10$1Et9rFP5.T7IwALG8FyroerNpfHH7QRNrJZ1cWdE4Z3OnBybqFyJm', 'user', 'Sulawesi Selatan', 'Kota Makassar'),
('Admin Kab. Bandung', 'admin_bandung', '$2a$10$exJ4HSA0xZ06eckb2uewQOEUz7fmvnVTdkGX7dRvfBjBG0FyJNX.W', 'admin', 'Jawa Barat', 'Kabupaten Bandung'),
('Staff Kab. Bandung', 'user_bandung', '$2a$10$1Et9rFP5.T7IwALG8FyroerNpfHH7QRNrJZ1cWdE4Z3OnBybqFyJm', 'user', 'Jawa Barat', 'Kabupaten Bandung')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `provinsi` = VALUES(`provinsi`),
  `kabupaten` = VALUES(`kabupaten`);


-- ------------------------------------------------------------------------------
-- 3. STANDARISASI DATA WILAYAH CONTOH (KEMENDAGRI)
-- ------------------------------------------------------------------------------
-- Memastikan data sengketa & perkara contoh menggunakan format kabupaten resmi:
UPDATE `sengketa` 
SET `kabupaten` = 'Kota Makassar', `provinsi` = 'Sulawesi Selatan' 
WHERE `id` = 1 AND (`kabupaten` = 'Makassar' OR `kabupaten` IS NULL);

UPDATE `perkara` 
SET `kabupaten` = 'Kota Makassar', `provinsi` = 'Sulawesi Selatan' 
WHERE `id` = 1 AND (`kabupaten` = 'Makassar' OR `kabupaten` IS NULL);
