-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 06, 2026 at 04:02 AM
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

--
-- Dumping data for table `detail_pesanan`
--

INSERT INTO `detail_pesanan` (`id`, `pesanan_id`, `menu_id`, `kuantitas`, `subtotal`) VALUES
(1, 1, 4, 1, 14000.00),
(2, 2, 3, 1, 17000.00),
(3, 3, 3, 3, 51000.00),
(4, 4, 4, 1, 14000.00),
(5, 5, 3, 1, 17000.00),
(6, 5, 4, 1, 14000.00),
(7, 6, 3, 2, 34000.00),
(8, 7, 3, 1, 17000.00),
(9, 7, 4, 1, 14000.00),
(10, 7, 6, 1, 23000.00),
(11, 8, 12, 1, 18000.00),
(12, 8, 13, 1, 8000.00),
(13, 8, 14, 1, 10000.00),
(14, 9, 12, 3, 54000.00),
(15, 10, 3, 1, 17000.00),
(16, 11, 2, 1, 18000.00),
(17, 12, 9, 1, 20000.00),
(18, 13, 2, 1, 18000.00),
(19, 13, 14, 1, 10000.00),
(20, 14, 5, 1, 25000.00),
(21, 15, 4, 3, 42000.00),
(22, 16, 8, 2, 48000.00),
(23, 17, 3, 3, 51000.00),
(24, 18, 14, 1, 10000.00),
(25, 19, 3, 1, 17000.00),
(26, 20, 2, 1, 18000.00),
(27, 21, 13, 1, 8000.00),
(28, 22, 8, 1, 24000.00),
(29, 23, 3, 1, 17000.00),
(30, 23, 4, 1, 14000.00),
(31, 24, 4, 1, 14000.00),
(32, 25, 4, 1, 14000.00),
(33, 26, 4, 2, 28000.00),
(34, 27, 3, 1, 17000.00),
(35, 27, 4, 1, 14000.00),
(36, 28, 2, 1, 18000.00),
(37, 29, 10, 1, 22000.00),
(38, 30, 4, 1, 14000.00);

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
(1, '01', 'token-meja-01-a1b2', 'kosong', '2026-09-28 10:11:44'),
(2, '02', 'token-meja-02-c3d4', 'kosong', '2026-09-28 10:11:44'),
(3, '03', 'token-meja-03-e5f6', 'kosong', '2026-09-28 10:11:44'),
(4, '04', 'token-meja-04-g7h8', 'kosong', '2026-09-28 10:11:44'),
(5, '05', 'token-meja-05-i9j0', 'kosong', '2026-09-28 10:11:44'),
(6, 'VIP-1', 'qr-ounq8jdx', 'kosong', '2026-10-05 13:25:52'),
(7, 'TDD-99', 'qr-d00wphe5', 'kosong', '2026-10-05 13:32:18');

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
  `status_pesanan` enum('menunggu','diproses','dihidangkan','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu',
  `waktu_pesan` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pesanan`
--

INSERT INTO `pesanan` (`id`, `meja_id`, `nama_pelanggan`, `catatan`, `metode_pembayaran`, `total_harga`, `status_pesanan`, `waktu_pesan`) VALUES
(1, 1, 'Pelanggan Meja 01', '', 'cash', 16100.00, 'dibatalkan', '2026-10-05 00:21:17'),
(2, 2, 'Alifian', 'tes2', 'cash', 19550.00, 'selesai', '2026-10-05 00:27:57'),
(3, 1, 'Pelanggan Meja 01', '', 'cash', 58650.00, 'dibatalkan', '2026-10-05 01:51:34'),
(4, 1, 'Pelanggan Meja 01', '', 'cash', 16100.00, 'selesai', '2026-10-05 06:33:45'),
(5, 1, 'Pelanggan Meja 01', '', 'cash', 35650.00, 'selesai', '2026-10-05 06:39:39'),
(6, 1, 'Alifian', 'tes 3', 'cash', 39100.00, 'dibatalkan', '2026-10-05 06:40:54'),
(7, 3, 'Meja 03', '', 'qr', 62100.00, 'dibatalkan', '2026-10-05 06:45:05'),
(8, 3, 'Meja 03', '', 'qr', 41400.00, 'selesai', '2026-10-05 06:45:30'),
(9, 3, 'Alifian', 'adasda', 'cash', 62100.00, 'selesai', '2026-10-05 06:45:55'),
(10, 3, 'Alifian', 'Pake garpu ya kak', 'cash', 19550.00, 'dibatalkan', '2026-10-05 06:51:43'),
(11, 3, 'Alifian', 'Pake garpu ya kak', 'cash', 20700.00, 'dibatalkan', '2026-10-05 06:55:32'),
(12, 3, 'Alifian', 'Pake garpu ya kak tes lagi', 'cash', 23000.00, 'dibatalkan', '2026-10-05 06:55:56'),
(13, 3, 'Meja 03', '', 'cash', 32200.00, 'dibatalkan', '2026-10-05 06:59:39'),
(14, 3, 'alifian', 'tes123', 'cash', 28750.00, 'dibatalkan', '2026-10-05 06:59:57'),
(15, 5, 'Alifian', 'Tes13124124', 'cash', 48300.00, 'selesai', '2026-10-05 07:29:36'),
(16, 5, 'Alifian', 'Tes13124124', 'cash', 55200.00, 'selesai', '2026-10-05 07:30:28'),
(17, 5, 'Alifian', 'Tes13124124', 'cash', 58650.00, 'selesai', '2026-10-05 07:34:14'),
(18, 5, 'Meja 05', '', 'cash', 11500.00, 'selesai', '2026-10-05 08:02:46'),
(19, 5, 'Meja 05', '', 'cash', 19550.00, 'selesai', '2026-10-05 08:07:21'),
(20, 5, 'Meja 05', '', 'cash', 20700.00, 'selesai', '2026-10-05 08:09:31'),
(21, 5, 'Meja 05', '', 'cash', 9200.00, 'selesai', '2026-10-05 08:13:02'),
(22, 5, 'Meja 05', '', 'cash', 27600.00, 'selesai', '2026-10-05 08:49:44'),
(23, 5, 'Meja 05', '', 'cash', 35650.00, 'dibatalkan', '2026-10-05 09:02:59'),
(24, 1, 'Meja 01', '', 'cash', 16100.00, 'dibatalkan', '2026-10-05 09:15:16'),
(25, 5, 'tessssssssssssssss', 'bjsfbjaksbfjkas', 'cash', 16100.00, 'selesai', '2026-10-05 09:18:03'),
(26, 5, 'Meja 05', '', 'cash', 32200.00, 'dibatalkan', '2026-10-05 09:21:48'),
(27, 5, 'Meja 05', '', 'cash', 35650.00, 'selesai', '2026-10-05 09:48:03'),
(28, 5, 'Meja 05', '', 'cash', 20700.00, 'selesai', '2026-10-05 10:25:56'),
(29, 6, 'Meja VIP-1', '', 'cash', 25300.00, 'dibatalkan', '2026-10-05 13:29:40'),
(30, 7, 'Meja TDD-99', '', 'cash', 16100.00, 'dibatalkan', '2026-10-05 13:33:56');

-- --------------------------------------------------------

--
-- Table structure for table `rekap_harian`
--

CREATE TABLE `rekap_harian` (
  `id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `total_pesanan` int(11) DEFAULT 0,
  `total_pendapatan` decimal(10,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rekap_harian`
--

INSERT INTO `rekap_harian` (`id`, `tanggal`, `total_pesanan`, `total_pendapatan`, `last_updated`) VALUES
(1, '2026-10-05', 16, 497950.00, '2026-10-06 01:39:15');

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
-- Indexes for table `rekap_harian`
--
ALTER TABLE `rekap_harian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tanggal` (`tanggal`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `meja`
--
ALTER TABLE `meja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `rekap_harian`
--
ALTER TABLE `rekap_harian`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
