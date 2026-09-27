-- ============================================================
-- SMARTDINE DATABASE SCHEMA & SEED DATA
-- Database: `restoran`
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB (XAMPP)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `restoran` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `restoran`;

-- ------------------------------------------------------------
-- 1. Table structure for `users`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_lengkap` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `peran` ENUM('admin', 'dapur') NOT NULL DEFAULT 'dapur',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Table structure for `kategori`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kategori` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kategori` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Table structure for `meja`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meja` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomor_meja` VARCHAR(20) NOT NULL UNIQUE,
  `token_qr` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('kosong', 'terisi') NOT NULL DEFAULT 'kosong',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Table structure for `menu`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `menu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kategori_id` INT NOT NULL,
  `nama_menu` VARCHAR(150) NOT NULL,
  `harga` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `gambar` VARCHAR(255) DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_menu_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Table structure for `pesanan`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pesanan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `meja_id` INT NOT NULL,
  `nama_pelanggan` VARCHAR(100) DEFAULT 'Pelanggan',
  `catatan` TEXT DEFAULT NULL,
  `metode_pembayaran` VARCHAR(50) DEFAULT 'cash',
  `total_harga` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status_pesanan` ENUM('menunggu', 'diproses', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
  `waktu_pesan` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pesanan_meja` FOREIGN KEY (`meja_id`) REFERENCES `meja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Table structure for `detail_pesanan`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detail_pesanan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pesanan_id` INT NOT NULL,
  `menu_id` INT NOT NULL,
  `kuantitas` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_detail_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA (DATA AWAL)
-- ============================================================

-- Data Users (admin & dapur)
INSERT INTO `users` (`id`, `nama_lengkap`, `username`, `password`, `peran`) VALUES
(1, 'Administrator Resto', 'admin', 'admin123', 'admin'),
(2, 'Staf Dapur & Kasir', 'dapur', 'dapur123', 'dapur')
ON DUPLICATE KEY UPDATE `nama_lengkap` = VALUES(`nama_lengkap`);

-- Data Kategori
INSERT INTO `kategori` (`id`, `nama_kategori`) VALUES
(1, 'Cemilan'),
(2, 'Makanan Utama'),
(3, 'Dessert'),
(4, 'Minuman')
ON DUPLICATE KEY UPDATE `nama_kategori` = VALUES(`nama_kategori`);

-- Data Meja
INSERT INTO `meja` (`id`, `nomor_meja`, `token_qr`, `status`) VALUES
(1, '01', 'token-meja-01-a1b2', 'kosong'),
(2, '02', 'token-meja-02-c3d4', 'kosong'),
(3, '03', 'token-meja-03-e5f6', 'kosong'),
(4, '04', 'token-meja-04-g7h8', 'kosong'),
(5, '05', 'token-meja-05-i9j0', 'kosong')
ON DUPLICATE KEY UPDATE `nomor_meja` = VALUES(`nomor_meja`);

-- Data Menu
INSERT INTO `menu` (`id`, `kategori_id`, `nama_menu`, `harga`, `is_available`) VALUES
-- Cemilan (kategori 1)
(1, 1, 'Tahu Crispy Sambal Matah', 15000.00, 1),
(2, 1, 'Pisang Goreng Coklat Keju', 18000.00, 1),
(3, 1, 'Kentang Goreng Saus Keju', 17000.00, 1),
(4, 1, 'Cireng Bumbu Rujak', 14000.00, 1),

-- Makanan Utama (kategori 2)
(5, 2, 'Nasi Goreng Spesial', 25000.00, 1),
(6, 2, 'Ayam Geprek Sambal Bawang', 23000.00, 1),
(7, 2, 'Mie Ayam Bakso', 20000.00, 1),
(8, 2, 'Sate Ayam Madura', 24000.00, 1),

-- Dessert (kategori 3)
(9, 3, 'Es Krim Goreng', 20000.00, 1),
(10, 3, 'Pancake Nutella', 22000.00, 1),
(11, 3, 'Puding Coklat Vla', 15000.00, 1),

-- Minuman (kategori 4)
(12, 4, 'Es Kopi Susu Gula Aren', 18000.00, 1),
(13, 4, 'Es Teh Manis', 8000.00, 1),
(14, 4, 'Es Jeruk Peras', 10000.00, 1),
(15, 4, 'Matcha Latte', 19000.00, 1)
ON DUPLICATE KEY UPDATE `nama_menu` = VALUES(`nama_menu`), `harga` = VALUES(`harga`);
