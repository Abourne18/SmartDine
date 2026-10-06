-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: restoran
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `detail_pesanan`
--

DROP TABLE IF EXISTS `detail_pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detail_pesanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pesanan_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `kuantitas` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `fk_detail_pesanan` (`pesanan_id`),
  KEY `fk_detail_menu` (`menu_id`),
  CONSTRAINT `fk_detail_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_pesanan`
--

LOCK TABLES `detail_pesanan` WRITE;
/*!40000 ALTER TABLE `detail_pesanan` DISABLE KEYS */;
INSERT INTO `detail_pesanan` VALUES (1,1,7,2,40000.00),(2,2,4,1,14000.00),(3,3,4,1,14000.00),(4,4,11,1,15000.00),(5,5,2,1,18000.00),(6,6,15,1,19000.00),(7,7,4,1,14000.00),(8,8,16,1,1000.00),(9,9,16,2,2000.00),(10,10,13,1,8000.00),(11,10,15,1,19000.00),(12,11,14,1,10000.00),(13,11,16,1,1000.00),(14,12,3,1,17000.00),(15,12,4,5,70000.00),(16,12,8,2,48000.00),(17,12,11,2,30000.00),(18,12,14,2,20000.00),(19,12,10,1,22000.00),(20,12,12,2,36000.00),(21,12,15,2,38000.00),(22,13,13,1,8000.00),(23,13,15,1,19000.00),(24,13,16,1,1000.00),(25,14,3,2,34000.00),(26,15,13,1,8000.00),(27,15,15,1,19000.00),(28,15,16,1,1000.00),(29,16,13,1,8000.00),(30,16,16,1,1000.00),(31,17,13,1,8000.00),(32,17,16,1,1000.00),(33,18,13,1,8000.00),(34,18,16,1,1000.00),(35,19,4,1,14000.00),(36,20,4,1,14000.00),(37,21,2,1,18000.00),(38,21,4,1,14000.00),(39,22,4,1,14000.00),(40,23,1,1,15000.00),(41,23,4,1,14000.00),(42,23,6,1,23000.00),(43,24,4,1,14000.00),(44,25,4,1,14000.00),(45,26,4,1,14000.00),(46,27,16,1,1000.00),(47,28,1,2,30000.00),(48,28,4,2,28000.00),(49,29,4,1,14000.00),(50,30,3,1,17000.00),(51,31,1,1,15000.00);
/*!40000 ALTER TABLE `detail_pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori`
--

DROP TABLE IF EXISTS `kategori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kategori` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori`
--

LOCK TABLES `kategori` WRITE;
/*!40000 ALTER TABLE `kategori` DISABLE KEYS */;
INSERT INTO `kategori` VALUES (1,'Cemilan'),(2,'Makanan Utama'),(3,'Dessert'),(4,'Minuman');
/*!40000 ALTER TABLE `kategori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meja`
--

DROP TABLE IF EXISTS `meja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomor_meja` varchar(20) NOT NULL,
  `token_qr` varchar(100) DEFAULT NULL,
  `status` enum('kosong','terisi') NOT NULL DEFAULT 'kosong',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nomor_meja` (`nomor_meja`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meja`
--

LOCK TABLES `meja` WRITE;
/*!40000 ALTER TABLE `meja` DISABLE KEYS */;
INSERT INTO `meja` VALUES (1,'01','token-meja-01-a1b2','kosong','2026-09-27 14:13:15'),(2,'02','token-meja-02-c3d4','kosong','2026-09-27 14:13:15'),(3,'03','token-meja-03-e5f6','kosong','2026-09-27 14:13:15'),(4,'04','token-meja-04-g7h8','kosong','2026-09-27 14:13:15'),(5,'05','token-meja-05-i9j0','kosong','2026-09-27 14:13:15'),(6,'08',NULL,'kosong','2026-10-03 15:47:37'),(7,'TDD-99',NULL,'kosong','2026-10-04 17:15:31');
/*!40000 ALTER TABLE `meja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kategori_id` int(11) NOT NULL,
  `nama_menu` varchar(150) NOT NULL,
  `harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gambar` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deskripsi` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_menu_kategori` (`kategori_id`),
  CONSTRAINT `fk_menu_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu`
--

LOCK TABLES `menu` WRITE;
/*!40000 ALTER TABLE `menu` DISABLE KEYS */;
INSERT INTO `menu` VALUES (1,1,'Tahu Crispy Sambal Matah',15000.00,'uploads/menu-1791267096210-663802173.jpg',1,'2026-09-27 14:13:15','Tahu renyah dengan sambal matah Bali segar.'),(2,1,'Pisang Coklat Keju',18000.00,'uploads/menu-1791265863068-127841881.jpg',1,'2026-09-27 14:13:15','Pisang goreng dengan taburan coklat dan keju.'),(3,1,'Kentang Keju',17000.00,'uploads/menu-1791265962227-693706886.jpg',1,'2026-09-27 14:13:15','Kentang renyah bersaus keju lumer.'),(4,1,'Cireng Bumbu Rujak',14000.00,'uploads/menu-1791278230270-568782129.jpg',1,'2026-09-27 14:13:15','Aci goreng kenyal dengan bumbu rujak pedas.'),(5,2,'Nasi Goreng Spesial',25000.00,'uploads/menu-1791267441324-64234589.jpg',1,'2026-09-27 14:13:15','Nasi goreng kaya rempah dengan telur dan ayam.'),(6,2,'Ayam Geprek Sambal Bawang',23000.00,'uploads/menu-1791267136455-874350998.jpg',1,'2026-09-27 14:13:15','Ayam renyah geprek bersambal bawang pedas.'),(7,2,'Mie Ayam Bakso',20000.00,'uploads/menu-1791267167274-28784447.jpg',1,'2026-09-27 14:13:15','Mie kenyal bertabur ayam kecap dan bakso sapi.'),(8,2,'Sate Ayam Madura',24000.00,'uploads/menu-1791269484098-818530226.jpg',1,'2026-09-27 14:13:15','Sate ayam empuk dengan saus kacang Madura.'),(9,3,'Es Krim Goreng',20000.00,'uploads/menu-1791269544349-354987692.jpg',1,'2026-09-27 14:13:15','Roti renyah berisi es krim dingin yang lumer.'),(10,3,'Pancake Nutella',22000.00,'uploads/menu-1791269571085-677866715.jpg',1,'2026-09-27 14:13:15','Panekuk lembut dengan olesan Nutella tebal.'),(11,3,'Puding Coklat Vla',15000.00,'uploads/menu-1791269607179-642007270.jpg',1,'2026-09-27 14:13:15','Puding coklat legit bersaus vla vanilla segar.'),(12,4,'Es Kopi Susu Gula Aren',18000.00,'uploads/menu-1791270129269-695488145.jpg',1,'2026-09-27 14:13:15','Espresso creamy dengan legit gula aren asli.'),(13,4,'Es Teh Manis',8000.00,'uploads/menu-1791270316422-790849909.jpg',1,'2026-09-27 14:13:15','Es teh klasik pelepas dahaga.'),(14,4,'Es Jeruk Peras',10000.00,'uploads/menu-1791269715599-491988951.jpg',1,'2026-09-27 14:13:15','Perasan jeruk asli yang segar nan manis.'),(15,4,'Matcha Latte',19000.00,'uploads/menu-1791270373910-806470017.jpg',1,'2026-09-27 14:13:15','Susu teh hijau Jepang yang menenangkan.'),(16,4,'Es Kuwut',15000.00,'uploads/menu-1791270288059-287450306.jpg',1,'2026-09-27 14:29:50','Es kuwut dengan  jeruk nipis yang segar.');
/*!40000 ALTER TABLE `menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pesanan`
--

DROP TABLE IF EXISTS `pesanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pesanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meja_id` int(11) NOT NULL,
  `nama_pelanggan` varchar(100) DEFAULT 'Pelanggan',
  `catatan` text DEFAULT NULL,
  `metode_pembayaran` varchar(50) DEFAULT 'cash',
  `total_harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status_pesanan` enum('menunggu','diproses','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu',
  `waktu_pesan` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pesanan_meja` (`meja_id`),
  CONSTRAINT `fk_pesanan_meja` FOREIGN KEY (`meja_id`) REFERENCES `meja` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pesanan`
--

LOCK TABLES `pesanan` WRITE;
/*!40000 ALTER TABLE `pesanan` DISABLE KEYS */;
INSERT INTO `pesanan` VALUES (1,1,'Budi Test','','qris',46000.00,'selesai','2026-10-03 15:42:34'),(2,6,'gg','','qris',16100.00,'selesai','2026-10-03 15:47:37'),(3,2,'Pelanggan Meja 02','','qris',16100.00,'selesai','2026-10-03 17:14:51'),(4,2,'Pelanggan Meja 02','','qris',17250.00,'selesai','2026-10-03 17:15:40'),(5,2,'Pelanggan Meja 02','','qris',20700.00,'selesai','2026-10-03 17:16:42'),(6,1,'Pelanggan Meja 01','','upi',19950.00,'','2026-10-04 14:35:55'),(7,6,'Pelanggan Meja 06','','qris',16100.00,'','2026-10-04 15:34:29'),(8,6,'Pelanggan Meja 06','','qr',1150.00,'','2026-10-04 16:19:18'),(9,6,'Pelanggan Meja 06','','card',2300.00,'','2026-10-04 16:20:24'),(10,6,'Pelanggan Meja 06','','card',31050.00,'','2026-10-04 16:26:38'),(11,6,'Pelanggan Meja 06','','card',12650.00,'','2026-10-04 16:26:51'),(12,5,'Pelanggan Meja 05','','cash',295050.00,'','2026-10-04 16:27:23'),(13,6,'Pelanggan Meja 06','','qr',32200.00,'','2026-10-04 16:31:32'),(14,5,'Pelanggan Meja 05','','upi',35700.00,'','2026-10-04 16:31:52'),(15,6,'Pelanggan Meja 06','','card',32200.00,'','2026-10-04 16:32:03'),(16,6,'Pelanggan Meja 06','','card',10350.00,'','2026-10-04 16:38:41'),(17,6,'Pelanggan Meja 06','','cash',10350.00,'','2026-10-04 16:42:49'),(18,6,'Pelanggan Meja 06','','card',10350.00,'','2026-10-04 16:50:37'),(19,7,'TDD Test Runner','Pedas TDD Test','cash',14000.00,'','2026-10-04 17:15:31'),(20,7,'TDD Test Runner','Pedas TDD Test','cash',14000.00,'selesai','2026-10-04 17:18:16'),(21,1,'Pelanggan Meja 01','','cash',36800.00,'selesai','2026-10-04 17:20:23'),(22,7,'TDD Test Runner','Pedas TDD Test','cash',14000.00,'selesai','2026-10-04 17:46:23'),(23,1,'Pelanggan Meja 01','','qr',59800.00,'','2026-10-04 17:53:55'),(24,7,'TDD Test Runner','Pedas TDD Test','cash',14000.00,'','2026-10-05 07:53:44'),(25,7,'TDD Test Runner','Pedas TDD Test','cash',14000.00,'','2026-10-05 07:59:51'),(26,1,'Meja 01','','qr',16100.00,'','2026-10-05 08:44:23'),(27,1,'Meja 01','','cash',1150.00,'','2026-10-05 08:45:18'),(28,1,'Meja 01','','cash',66700.00,'','2026-10-05 13:09:42'),(29,6,'Meja 08','','qr',16100.00,'','2026-10-06 02:53:09'),(30,6,'Meja 08','','qr',19550.00,'dibatalkan','2026-10-06 08:56:57'),(31,6,'Meja 08','','qr',17250.00,'','2026-10-06 09:30:55');
/*!40000 ALTER TABLE `pesanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rekap_harian`
--

DROP TABLE IF EXISTS `rekap_harian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rekap_harian` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `total_pesanan` int(11) DEFAULT 0,
  `total_pendapatan` decimal(10,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tanggal` (`tanggal`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rekap_harian`
--

LOCK TABLES `rekap_harian` WRITE;
/*!40000 ALTER TABLE `rekap_harian` DISABLE KEYS */;
INSERT INTO `rekap_harian` VALUES (1,'2026-10-05',16,497950.00,'2026-10-05 18:39:15');
/*!40000 ALTER TABLE `rekap_harian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `peran` enum('admin','dapur') NOT NULL DEFAULT 'dapur',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator Resto','admin','admin123','admin','2026-09-27 14:13:15'),(2,'Staf Dapur & Kasir','dapur','dapur123','dapur','2026-09-27 14:13:15'),(3,'paijo','mindae','123','dapur','2026-10-03 16:12:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-06 16:55:23
