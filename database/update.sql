CREATE TABLE IF NOT EXISTS `rekap_harian` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `total_pesanan` int(11) DEFAULT 0,
  `total_pendapatan` decimal(10,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `rekap_harian` (`id`, `tanggal`, `total_pesanan`, `total_pendapatan`, `last_updated`) VALUES
(1, '2026-10-05', 16, 497950.00, '2026-10-06 01:39:15')
ON DUPLICATE KEY UPDATE `total_pesanan` = VALUES(`total_pesanan`), `total_pendapatan` = VALUES(`total_pendapatan`);
