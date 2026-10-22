const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(cors());

// Direktori untuk file gambar yang diunggah
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Konfigurasi Multer untuk unggah berkas gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'menu-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Maksimal 5MB
});

// Koneksi ke Database 'Restoran' di MySQL XAMPP
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restoran',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("Mantap! Terhubung ke database MySQL: restoran (Pool Mode)");

// Format order_num dinamis (tanpa perlu kolom di database)

// ============================================================
// AUTENTIKASI & PENGGUNA
// ============================================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            const user = results[0];
            res.json({ 
                success: true, 
                message: 'Login berhasil!',
                data: {
                    nama_lengkap: user.nama_lengkap,
                    peran: user.peran                
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah!' });
        }
    });
});

// ============================================================
// MANAJEMEN MEJA
// ============================================================

app.get('/api/meja', (req, res) => {
    const query = 'SELECT * FROM meja ORDER BY CAST(nomor_meja AS UNSIGNED), nomor_meja ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/meja/cari', (req, res) => {
    const { nomor, token } = req.query;
    let query = 'SELECT * FROM meja WHERE ';
    const params = [];
    if (token) {
        query += 'token_qr = ? LIMIT 1';
        params.push(token);
    } else if (nomor) {
        query += 'nomor_meja = ? LIMIT 1';
        params.push(nomor);
    } else {
        return res.status(400).json({ error: 'Parameter nomor atau token diperlukan' });
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Meja tidak ditemukan' });
        res.json(results[0]);
    });
});

app.post('/api/meja', (req, res) => {
    const { nomor_meja, status } = req.body;
    const token_qr = 'qr-' + Math.random().toString(36).substring(2, 10);
    const query = 'INSERT INTO meja (nomor_meja, token_qr, status) VALUES (?, ?, ?)';
    db.query(query, [nomor_meja, token_qr, status || 'kosong'], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Meja berhasil ditambahkan!', id: results.insertId, token_qr });
    });
});

app.put('/api/meja/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});

app.delete('/api/meja/:id', (req, res) => {
    const id = req.params.id;
    
    db.query("SELECT COUNT(*) as aktif FROM pesanan WHERE meja_id = ? AND status_pesanan NOT IN ('selesai', 'dibatalkan')", [id], (errCek, resCek) => {
        if (errCek) return res.status(500).json({ error: errCek.message });
        
        if (resCek[0].aktif > 0) {
            return res.status(400).json({ success: false, message: 'Tidak dapat menghapus meja karena masih ada pesanan yang belum selesai di meja ini!' });
        }
        
        const query = 'DELETE FROM meja WHERE id = ?';
        db.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Meja berhasil dihapus!' });
        });
    });
});

// ============================================================
// MANAJEMEN MENU & KATEGORI
// ============================================================

app.get('/api/menu', (req, res) => {
    const query = `
        SELECT m.*, k.nama_kategori 
        FROM menu m 
        LEFT JOIN kategori k ON m.kategori_id = k.id 
        ORDER BY m.kategori_id ASC, m.nama_menu ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/menu', upload.single('gambar'), (req, res) => {
    const { kategori_id, nama_menu, harga, deskripsi } = req.body;
    const gambar = req.file ? 'uploads/' + req.file.filename : null;

    if (!kategori_id || !nama_menu || !harga) {
        return res.status(400).json({ success: false, message: 'Kategori, nama menu, dan harga wajib diisi!' });
    }

    const query = 'INSERT INTO menu (kategori_id, nama_menu, harga, deskripsi, gambar, is_available) VALUES (?, ?, ?, ?, ?, 1)';
    db.query(query, [kategori_id, nama_menu, harga, deskripsi || null, gambar], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            success: true, 
            message: 'Menu berhasil ditambahkan!', 
            id: results.insertId,
            gambar: gambar
        });
    });
});

app.put('/api/menu/:id', upload.single('gambar'), (req, res) => {
    const id = req.params.id;
    const { kategori_id, nama_menu, harga, deskripsi, hapus_foto_lama } = req.body;
    const gambar = req.file ? 'uploads/' + req.file.filename : null;

    if (!kategori_id || !nama_menu || !harga) {
        return res.status(400).json({ success: false, message: 'Kategori, nama menu, dan harga wajib diisi!' });
    }

    db.query('SELECT gambar FROM menu WHERE id = ?', [id], (err, rowResults) => {
        if (err) return res.status(500).json({ error: err.message });
        const oldImage = rowResults.length > 0 ? rowResults[0].gambar : null;

        let query, params;
        let shouldDeleteOld = false;

        if (gambar) {
            query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ?, gambar = ? WHERE id = ?';
            params = [kategori_id, nama_menu, harga, deskripsi || null, gambar, id];
            shouldDeleteOld = true;
        } else if (hapus_foto_lama === 'true') {
            query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ?, gambar = NULL WHERE id = ?';
            params = [kategori_id, nama_menu, harga, deskripsi || null, id];
            shouldDeleteOld = true;
        } else {
            query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ? WHERE id = ?';
            params = [kategori_id, nama_menu, harga, deskripsi || null, id];
        }

        db.query(query, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (shouldDeleteOld && oldImage && oldImage.startsWith('uploads/')) {
                const oldImagePath = path.join(__dirname, oldImage);
                fs.unlink(oldImagePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Gagal menghapus file lama:', unlinkErr);
                });
            }
            
            res.json({ success: true, message: 'Menu berhasil diperbarui!' });
        });
    });
});

app.put('/api/menu/:id/status', (req, res) => {
    const id = req.params.id;
    const { is_available } = req.body; 
    const query = 'UPDATE menu SET is_available = ? WHERE id = ?';
    db.query(query, [is_available, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status ketersediaan menu berhasil diubah!' });
    });
});

app.get('/api/kategori', (req, res) => {
    db.query('SELECT * FROM kategori ORDER BY id ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/kategori', (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi!' });
    db.query('INSERT INTO kategori (nama_kategori) VALUES (?)', [nama_kategori], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: results.insertId, nama_kategori });
    });
});

app.delete('/api/kategori/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT COUNT(*) as count FROM menu WHERE kategori_id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Kategori tidak bisa dihapus karena masih digunakan oleh menu!' });
        }
        db.query('DELETE FROM kategori WHERE id = ?', [id], (err, deleteResult) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    });
});

// ============================================================
// MANAJEMEN PESANAN (ORDER FLOW)
// ============================================================

app.post('/api/pesanan', (req, res) => {
    const { nomor_meja, nama_pelanggan, catatan, metode_pembayaran, total_harga, items } = req.body;

    if (!nomor_meja || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Data pesanan kurang lengkap!' });
    }

    db.query('SELECT id, nomor_meja FROM meja WHERE nomor_meja = ?', [nomor_meja], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Meja tidak terdaftar di sistem!' });
        }

        const meja_id = results[0].id;
        const no_meja = String(results[0].nomor_meja || nomor_meja).padStart(2, '0');

        // Hitung urutan pesanan hari ini untuk membuat ID unik: SD-[Tanggal][Meja][Urutan]
        db.query('SELECT COUNT(*) as count FROM pesanan WHERE DATE(waktu_pesan) = CURDATE()', (errCount, countRes) => {
            if (errCount) return res.status(500).json({ error: errCount.message });

            const urut = ((countRes && countRes[0] ? countRes[0].count : 0) || 0) + 1;
            const urut_str = String(urut).padStart(2, '0');
            const today = new Date();
            const tgl_str = String(today.getDate()).padStart(2, '0');

            // Format ID dinamis: SD-[Tanggal 2 digit][Nomor Urut 2 digit][Nomor Meja 2 digit]
            // Contoh: Tanggal 05, Urutan 01, Meja 02 -> SD-050102
            const order_num = `SD-${tgl_str}${urut_str}${no_meja}`;

            const queryPesanan = `
                INSERT INTO pesanan (meja_id, nama_pelanggan, catatan, metode_pembayaran, total_harga, status_pesanan)
                VALUES (?, ?, ?, ?, ?, 'menunggu')
            `;

            db.query(
                queryPesanan, 
                [meja_id, nama_pelanggan || 'Pelanggan', catatan || '', metode_pembayaran || 'cash', total_harga || 0], 
                (err, result) => {
                if (err) {
                    console.error("ERROR DATABASE:", err.message);
                    return res.status(500).json({ error: err.message });
                }

                const pesanan_id = result.insertId;

                const detailValues = items.map(item => [
                    pesanan_id,
                    item.menu_id,
                    item.kuantitas || 1,
                    item.subtotal || 0
                ]);

                db.query('INSERT INTO detail_pesanan (pesanan_id, menu_id, kuantitas, subtotal) VALUES ?', [detailValues], (err) => {
                    if (err) {
                        console.error("ERROR DATABASE:", err.message);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ 
                        success: true, 
                        message: 'Pesanan berhasil dibuat!', 
                        order_id: pesanan_id,
                        order_num: order_num
                    });
                });
            });
        });
    });
});

app.put('/api/pesanan/:id/tambah', async (req, res) => {
    const pesananId = req.params.id;
    const { items, total_harga } = req.body; 

    try {
        await db.promise().query(`UPDATE pesanan SET total_harga = total_harga + ? WHERE id = ?`, [total_harga, pesananId]);

        for (let item of items) {
            await db.promise().query(
                `INSERT INTO detail_pesanan (pesanan_id, menu_id, kuantitas, subtotal) VALUES (?, ?, ?, ?)`, 
                [pesananId, item.menu_id, item.kuantitas, item.subtotal]
            );
        }

        res.json({ success: true, message: 'Item berhasil ditambahkan ke pesanan' });
    } catch (err) {
        console.error('Error saat menambah pesanan:', err);
        res.status(500).json({ success: false, error: 'Gagal menambahkan pesanan' });
    }
});

app.get('/api/pesanan', (req, res) => {
    const query = `
        SELECT 
            p.id, p.meja_id, p.nama_pelanggan, p.catatan, p.metode_pembayaran,
            p.total_harga, p.status_pesanan, p.waktu_pesan,
            m.nomor_meja,
            dp.id AS detail_id, dp.menu_id, dp.kuantitas, dp.subtotal,
            mn.nama_menu, mn.harga AS menu_harga
        FROM pesanan p
        JOIN meja m ON p.meja_id = m.id
        LEFT JOIN detail_pesanan dp ON p.id = dp.pesanan_id
        LEFT JOIN menu mn ON dp.menu_id = mn.id
        ORDER BY p.id ASC
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("🔥 ERROR DATABASE:", err.message);
            return res.status(500).json({ error: err.message });
        }

        const ordersMap = new Map();
        const dateCounters = {};

        rows.forEach(row => {
            if (!ordersMap.has(row.id)) {
                // Hitung nomor urut harian dinamis (SD-[Tanggal][Urutan][Meja])
                const d = new Date(row.waktu_pesan);
                const tglKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                dateCounters[tglKey] = (dateCounters[tglKey] || 0) + 1;
                const urutStr = String(dateCounters[tglKey]).padStart(2, '0');
                const tglStr = String(d.getDate()).padStart(2, '0');
                const mejaStr = String(row.nomor_meja || 0).padStart(2, '0');
                const orderNum = `SD-${tglStr}${urutStr}${mejaStr}`;

                ordersMap.set(row.id, {
                    id: row.id,
                    order_num: orderNum,
                    meja_id: row.meja_id,
                    nomor_meja: row.nomor_meja,
                    nama_pelanggan: row.nama_pelanggan,
                    catatan: row.catatan,
                    metode_pembayaran: row.metode_pembayaran,
                    total_harga: row.total_harga,
                    status_pesanan: row.status_pesanan,
                    waktu_pesan: row.waktu_pesan,
                    items: []
                });
            }

            if (row.detail_id) {
                ordersMap.get(row.id).items.push({
                    detail_id: row.detail_id,
                    menu_id: row.menu_id,
                    nama_menu: row.nama_menu || 'Menu Terhapus',
                    kuantitas: row.kuantitas,
                    subtotal: row.subtotal,
                    harga: row.menu_harga
                });
            }
        });

        // Tampilkan pesanan terbaru di bagian atas (DESC)
        res.json(Array.from(ordersMap.values()).reverse());
    });
});

app.get('/api/pesanan/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT p.*, m.nomor_meja,
            (SELECT COUNT(*) FROM pesanan p2 WHERE DATE(p2.waktu_pesan) = DATE(p.waktu_pesan) AND p2.id <= p.id) AS urut_harian
        FROM pesanan p
        JOIN meja m ON p.meja_id = m.id
        WHERE p.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        
        const row = results[0];
        const d = new Date(row.waktu_pesan);
        const tglStr = String(d.getDate()).padStart(2, '0');
        const urutStr = String(row.urut_harian || 1).padStart(2, '0');
        const mejaStr = String(row.nomor_meja || 0).padStart(2, '0');
        row.order_num = `SD-${tglStr}${urutStr}${mejaStr}`;

        res.json(row);
    });
});

// Endpoint Ubah Status
app.put('/api/pesanan/:id/status', (req, res) => {
    const id = req.params.id;
    const { status_pesanan } = req.body;

    const validStatuses = ['menunggu', 'diproses', 'dihidangkan', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status_pesanan)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid!' });
    }

    db.query('UPDATE pesanan SET status_pesanan = ? WHERE id = ?', [status_pesanan, id], (errUpdate) => {
        if (errUpdate) {
            console.error("Gagal update status pesanan:", errUpdate.message);
            return res.status(500).json({ error: errUpdate.message });
        }

        // Rekap harian dan pendapatan bertambah saat status mencapai 'selesai'
        if (status_pesanan === 'selesai') {
            db.query("SELECT total_harga FROM pesanan WHERE id = ?", [id], (errTotal, rowsTotal) => {
                if (!errTotal && rowsTotal.length > 0) {
                    const hargaPesan = Number(rowsTotal[0].total_harga) || 0;
                    
                    const sqlRekap = `
                        INSERT INTO rekap_harian (tanggal, total_pesanan, total_pendapatan) 
                        VALUES (CURDATE(), 1, ?) 
                        ON DUPLICATE KEY UPDATE 
                        total_pesanan = total_pesanan + 1, 
                        total_pendapatan = total_pendapatan + ?
                    `;
                    db.query(sqlRekap, [hargaPesan, hargaPesan], (errRekap) => {
                        if (errRekap) console.error("Gagal update rekap harian:", errRekap.message);
                    });
                }
            });
        }

        // Kosongkan meja jika pesanan sudah selesai atau dibatalkan
        if (status_pesanan === 'selesai' || status_pesanan === 'dibatalkan') {
            db.query('SELECT meja_id FROM pesanan WHERE id = ?', [id], (errMeja, resMeja) => {
                if (!errMeja && resMeja.length > 0) {
                    const mejaId = resMeja[0].meja_id;
                    const checkActive = "SELECT COUNT(*) AS active_count FROM pesanan WHERE meja_id = ? AND status_pesanan IN ('menunggu', 'diproses', 'dihidangkan')";
                    
                    db.query(checkActive, [mejaId], (errCheck, resCheck) => {
                        if (!errCheck && resCheck[0].active_count === 0) {
                            db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [mejaId]);
                        }
                    });
                }
            });
        }

        res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status_pesanan}` });
    });
});

app.delete('/api/pesanan/bulk', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada ID yang diberikan' });
    }

    db.query('DELETE FROM detail_pesanan WHERE pesanan_id IN (?)', [ids], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        db.query('DELETE FROM pesanan WHERE id IN (?)', [ids], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: `${result.affectedRows} riwayat berhasil dihapus.` });
        });
    });
});

// ============================================================
// STATISTIK DASHBOARD & LAPORAN
// ============================================================

app.get('/api/stats', (req, res) => {
    const sqlRekap = "SELECT total_pesanan, total_pendapatan FROM rekap_harian WHERE tanggal = CURDATE()";
    const sqlMeja = "SELECT COUNT(*) AS total_meja FROM meja";
    const sqlMenu = "SELECT COUNT(*) AS total_menu FROM menu";

    db.query(sqlRekap, (err1, rekapRows) => {
        if (err1) return res.status(500).json({ error: err1.message });
        
        let totalOrders = 0;
        let totalRevenue = 0;

        if (rekapRows.length > 0) {
            totalOrders = rekapRows[0].total_pesanan;
            totalRevenue = rekapRows[0].total_pendapatan;
        }

        db.query(sqlMeja, (err2, mejaRows) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            db.query(sqlMenu, (err3, menuRows) => {
                if (err3) return res.status(500).json({ error: err3.message });

                res.json({
                    total_orders: totalOrders,
                    total_revenue: totalRevenue,
                    total_tables: mejaRows[0].total_meja,
                    total_menu: menuRows[0].total_menu
                });
            });
        });
    });
});

app.get('/api/rekap-harian', (req, res) => {
    const query = 'SELECT * FROM rekap_harian ORDER BY tanggal DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Jalankan server di port 5500
const PORT = 5500;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sudah terhubung ke http://localhost:${PORT}`);
});