-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 28, 2026 at 12:33 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restoran`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_pesanan`
--

CREATE TABLE `detail_pesanan` (
  `id` int(11) NOT NULL,
  `pesanan_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `kuantitas` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id`, `nama_kategori`) VALUES
(1, 'Cemilan'),
(2, 'Makanan Utama'),
(3, 'Dessert'),
(4, 'Minuman');

-- --------------------------------------------------------

--
-- Table structure for table `meja`
--

CREATE TABLE `meja` (
  `id` int(11) NOT NULL,
  `nomor_meja` varchar(20) NOT NULL,
  `token_qr` varchar(100) DEFAULT NULL,
  `status` enum('kosong','terisi') NOT NULL DEFAULT 'kosong',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meja`
--

INSERT INTO `meja` (`id`, `nomor_meja`, `token_qr`, `status`, `created_at`) VALUES
(1, '01', 'token-meja-01-a1b2', 'terisi', '2026-09-28 10:11:44'),
(2, '02', 'token-meja-02-c3d4', 'kosong', '2026-09-28 10:11:44'),
(3, '03', 'token-meja-03-e5f6', 'kosong', '2026-09-28 10:11:44'),
(4, '04', 'token-meja-04-g7h8', 'kosong', '2026-09-28 10:11:44'),
(5, '05', 'token-meja-05-i9j0', 'kosong', '2026-09-28 10:11:44');

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `kategori_id` int(11) NOT NULL,
  `nama_menu` varchar(150) NOT NULL,
  `harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gambar` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `kategori_id`, `nama_menu`, `harga`, `gambar`, `is_available`, `created_at`) VALUES
(1, 1, 'Tahu Crispy Sambal Matah', 15000.00, NULL, 1, '2026-09-28 10:11:44'),
(2, 1, 'Pisang Goreng Coklat Keju', 18000.00, NULL, 1, '2026-09-28 10:11:44'),
(3, 1, 'Kentang Goreng Saus Keju', 17000.00, NULL, 1, '2026-09-28 10:11:44'),
(4, 1, 'Cireng Bumbu Rujak', 14000.00, NULL, 1, '2026-09-28 10:11:44'),
(5, 2, 'Nasi Goreng Spesial', 25000.00, NULL, 1, '2026-09-28 10:11:44'),
(6, 2, 'Ayam Geprek Sambal Bawang', 23000.00, NULL, 1, '2026-09-28 10:11:44'),
(7, 2, 'Mie Ayam Bakso', 20000.00, NULL, 1, '2026-09-28 10:11:44'),
(8, 2, 'Sate Ayam Madura', 24000.00, NULL, 1, '2026-09-28 10:11:44'),
(9, 3, 'Es Krim Goreng', 20000.00, NULL, 1, '2026-09-28 10:11:44'),
(10, 3, 'Pancake Nutella', 22000.00, NULL, 1, '2026-09-28 10:11:44'),
(11, 3, 'Puding Coklat Vla', 15000.00, NULL, 1, '2026-09-28 10:11:44'),
(12, 4, 'Es Kopi Susu Gula Aren', 18000.00, NULL, 1, '2026-09-28 10:11:44'),
(13, 4, 'Es Teh Manis', 8000.00, NULL, 1, '2026-09-28 10:11:44'),
(14, 4, 'Es Jeruk Peras', 10000.00, NULL, 1, '2026-09-28 10:11:44'),
(15, 4, 'Matcha Latte', 19000.00, NULL, 1, '2026-09-28 10:11:44');

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id` int(11) NOT NULL,
  `meja_id` int(11) NOT NULL,
  `nama_pelanggan` varchar(100) DEFAULT 'Pelanggan',
  `catatan` text DEFAULT NULL,
  `metode_pembayaran` varchar(50) DEFAULT 'cash',
  `total_harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status_pesanan` enum('menunggu','diproses','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu',
  `waktu_pesan` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `peran` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama_lengkap`, `username`, `password`, `peran`) VALUES
(1, 'Tes Admin', 'admin', 'admin123', 'admin'),
(2, 'Tes dapur', 'dapur', 'dapur123', 'dapur');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_detail_pesanan` (`pesanan_id`),
  ADD KEY `fk_detail_menu` (`menu_id`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meja`
--
ALTER TABLE `meja`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nomor_meja` (`nomor_meja`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_menu_kategori` (`kategori_id`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pesanan_meja` (`meja_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `meja`
--
ALTER TABLE `meja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD CONSTRAINT `fk_detail_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `fk_menu_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_meja` FOREIGN KEY (`meja_id`) REFERENCES `meja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
