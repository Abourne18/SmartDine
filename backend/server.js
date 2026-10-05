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
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restoran'
});

db.connect((err) => {
    if (err) {
        console.error("Gagal konek ke database:", err.message);
        return;
    }
    console.log("Mantap! Terhubung ke database MySQL: restoran");
});

// ============================================================
// AUTENTIKASI & PENGGUNA
// ============================================================

// Login
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

// Registrasi Akun Baru
app.post('/api/register', (req, res) => {
    const { nama_lengkap, username, password, peran } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah terdaftar! Gunakan yang lain.' });
        }
        const query = 'INSERT INTO users (nama_lengkap, username, password, peran) VALUES (?, ?, ?, ?)';
        db.query(query, [nama_lengkap, username, password, peran || 'dapur'], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Pendaftaran berhasil! Silakan login.' });
        });
    });
});

// ============================================================
// MANAJEMEN MEJA
// ============================================================

// Mengambil semua meja
app.get('/api/meja', (req, res) => {
    const query = 'SELECT * FROM meja ORDER BY CAST(nomor_meja AS UNSIGNED), nomor_meja ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Cari meja berdasarkan nomor atau token
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

// Tambah Meja Baru
app.post('/api/meja', (req, res) => {
    const { nomor_meja, status } = req.body;
    const token_qr = 'qr-' + Math.random().toString(36).substring(2, 10);
    const query = 'INSERT INTO meja (nomor_meja, token_qr, status) VALUES (?, ?, ?)';
    db.query(query, [nomor_meja, token_qr, status || 'kosong'], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Meja berhasil ditambahkan!', id: results.insertId, token_qr });
    });
});

// Ubah Status Meja (kosong / terisi)
app.put('/api/meja/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});

// ============================================================
// MANAJEMEN MENU & KATEGORI
// ============================================================

// Daftar Menu (dengan info nama kategori)
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

// Tambah Menu Baru (Mendukung Unggah Gambar)
app.post('/api/menu', upload.single('gambar'), (req, res) => {
    const { kategori_id, nama_menu, harga } = req.body;
    const gambar = req.file ? 'uploads/' + req.file.filename : null;

    if (!kategori_id || !nama_menu || !harga) {
        return res.status(400).json({ success: false, message: 'Kategori, nama menu, dan harga wajib diisi!' });
    }

    const query = 'INSERT INTO menu (kategori_id, nama_menu, harga, gambar, is_available) VALUES (?, ?, ?, ?, 1)';
    db.query(query, [kategori_id, nama_menu, harga, gambar], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            success: true, 
            message: 'Menu berhasil ditambahkan!', 
            id: results.insertId,
            gambar: gambar
        });
    });
});

// Ubah Status Ketersediaan Menu (1 = Tersedia, 0 = Habis)
app.put('/api/menu/:id/status', (req, res) => {
    const id = req.params.id;
    const { is_available } = req.body; 
    const query = 'UPDATE menu SET is_available = ? WHERE id = ?';
    db.query(query, [is_available, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status ketersediaan menu berhasil diubah!' });
    });
});

// Ambil daftar Kategori
app.get('/api/kategori', (req, res) => {
    db.query('SELECT * FROM kategori ORDER BY id ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ============================================================
// MANAJEMEN PESANAN (ORDER FLOW)
// ============================================================

// Buat Pesanan Baru (dari sisi Pelanggan)
app.post('/api/pesanan', (req, res) => {
    // 1. Tangkap 'nomor_meja', bukan 'meja_id'
    const { nomor_meja, nama_pelanggan, catatan, metode_pembayaran, total_harga, items } = req.body;

    if (!nomor_meja || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Data pesanan atau item tidak lengkap!' });
    }

    // 2. Cari 'meja_id' dari database berdasarkan 'nomor_meja'
    db.query('SELECT id FROM meja WHERE nomor_meja = ?', [nomor_meja], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Jika meja tidak ditemukan
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Meja tidak terdaftar di sistem!' });
        }

        const meja_id = results[0].id; // Dapat ID meja (integer)

        // 3. Simpan ke tabel pesanan
        const queryPesanan = `
            INSERT INTO pesanan (meja_id, nama_pelanggan, catatan, metode_pembayaran, total_harga, status_pesanan)
            VALUES (?, ?, ?, ?, ?, 'menunggu')
        `;

        db.query(
            queryPesanan, 
            [meja_id, nama_pelanggan || 'Pelanggan', catatan || '', metode_pembayaran || 'cash', total_harga || 0], 
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                const pesanan_id = result.insertId;

                // 4. Masukkan setiap detail pesanan
                const detailValues = items.map(item => [
                    pesanan_id,
                    item.menu_id,
                    item.kuantitas || 1,
                    item.subtotal || 0
                ]);

                const queryDetail = 'INSERT INTO detail_pesanan (pesanan_id, menu_id, kuantitas, subtotal) VALUES ?';
                db.query(queryDetail, [detailValues], (errDetail) => {
                    if (errDetail) console.error("Gagal menyimpan detail pesanan:", errDetail.message);

                    // 5. Update status meja menjadi 'terisi'
                    db.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja_id]);

                    res.json({ 
                        success: true, 
                        message: 'Pesanan berhasil dibuat!', 
                        order_id: pesanan_id,
                        order_num: '#SD-' + String(pesanan_id).padStart(4, '0')
                    });
                });
            }
        );
    });
});

// Ambil Semua Pesanan beserta item detailnya (untuk Dapur & Kasir)
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
        ORDER BY p.id DESC
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Kelompokkan data per pesanan
        const ordersMap = new Map();

        rows.forEach(row => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    order_num: '#SD-' + String(row.id).padStart(4, '0'),
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

        res.json(Array.from(ordersMap.values()));
    });
});

// Ambil Status Pesanan Tertentu (untuk Pelanggan tracking)
app.get('/api/pesanan/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT p.*, m.nomor_meja 
        FROM pesanan p
        JOIN meja m ON p.meja_id = m.id
        WHERE p.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        res.json(results[0]);
    });
});

// Ubah Status Pesanan ('menunggu', 'diproses', 'selesai', 'dibatalkan')
app.put('/api/pesanan/:id/status', (req, res) => {
    const id = req.params.id;
    const { status_pesanan } = req.body;

    const validStatuses = ['menunggu', 'diproses', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status_pesanan)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid!' });
    }

    const query = 'UPDATE pesanan SET status_pesanan = ? WHERE id = ?';
    db.query(query, [status_pesanan, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Jika pesanan selesai atau dibatalkan, periksa apakah masih ada pesanan aktif lain di meja tersebut
        if (status_pesanan === 'selesai' || status_pesanan === 'dibatalkan') {
            db.query('SELECT meja_id FROM pesanan WHERE id = ?', [id], (errMeja, resMeja) => {
                if (!errMeja && resMeja.length > 0) {
                    const mejaId = resMeja[0].meja_id;
                    const checkActive = `
                        SELECT COUNT(*) AS active_count 
                        FROM pesanan 
                        WHERE meja_id = ? AND status_pesanan IN ('menunggu', 'diproses')
                    `;
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

// ============================================================
// STATISTIK DASHBOARD ADMIN
// ============================================================
app.get('/api/stats', (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM pesanan) AS total_orders,
            (SELECT COALESCE(SUM(total_harga), 0) FROM pesanan WHERE status_pesanan != 'dibatalkan') AS total_revenue,
            (SELECT COUNT(*) FROM meja) AS total_tables,
            (SELECT COUNT(*) FROM menu WHERE is_available = 1) AS total_menu
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// Jalankan server di port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sudah terhubung ke http://localhost:${PORT}`);
});