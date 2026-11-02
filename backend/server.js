const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Secret Key untuk Token JWT (Bisa diganti sesuai keinginan)
const JWT_SECRET = 'SmartDineSuperSecretKey2026';

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
    limits: { fileSize: 5 * 1024 * 1024 }
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

console.log("Mantap! Terhubung ke database MySQL: restoran");

// ============================================================
// MIDDLEWARE AUTENTIKASI & OTORISASI
// ============================================================

// Middleware Cek Token Login
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan!' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Sesi telah habis atau token tidak valid!' });
        req.user = user;
        next();
    });
};

// Middleware Cek Peran (Role)
const authorizeRole = (role) => {
    return (req, res, next) => {
        // Admin selalu punya akses, peran spesifik (seperti 'dapur') juga diizinkan jika cocok
        if (req.user.peran !== role && req.user.peran !== 'admin') {
            return res.status(403).json({ success: false, message: `Akses ditolak. Anda tidak memiliki izin!` });
        }
        next();
    };
};

// ============================================================
// AUTENTIKASI & REGISTRASI (BCRYPT & JWT)
// ============================================================

app.post('/api/register', async (req, res) => {
    const { nama_lengkap, username, password, peran } = req.body;
    if (!nama_lengkap || !username || !password || !peran) {
        return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi!' });
    }

    try {
        db.query('SELECT id FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });

            // Enkripsi password menggunakan Bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = 'INSERT INTO users (nama_lengkap, username, password, peran) VALUES (?, ?, ?, ?)';
            
            db.query(query, [nama_lengkap, username, hashedPassword, peran], (errInsert) => {
                if (errInsert) return res.status(500).json({ success: false, message: errInsert.message });
                res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
            });
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const user = results[0];
            
            // Pengecekan Bcrypt (Password Lama vs Hash Baru)
            const isMatch = await bcrypt.compare(password, user.password);
            // Fallback jika password di DB masih polos (belum di-hash saat masa transisi)
            const isMatchPlain = password === user.password;

            if (isMatch || isMatchPlain) {
                // Buat Token JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username, peran: user.peran },
                    JWT_SECRET,
                    { expiresIn: '8h' }
                );

                res.json({ 
                    success: true, 
                    message: 'Login berhasil!',
                    token: token,
                    data: { id: user.id, username: user.username, nama_lengkap: user.nama_lengkap, peran: user.peran }
                });
            } else {
                res.status(401).json({ success: false, message: 'Password salah!' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Username tidak ditemukan!' });
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

        const meja = results[0];

        // Otomatis ubah status meja menjadi 'terisi' saat diakses/scan pelanggan
        db.query('UPDATE meja SET status = "terisi" WHERE id = ?', [meja.id], (errUpdate) => {
            if (errUpdate) console.error("Gagal update status meja jadi terisi:", errUpdate.message);
            
            // Kirim data meja dengan status terbaru
            meja.status = 'terisi';
            res.json(meja);
        });
    });
});

app.post('/api/meja', authenticateToken, authorizeRole('admin'), (req, res) => {
    const { nomor_meja, status } = req.body;
    const token_qr = 'qr-' + Math.random().toString(36).substring(2, 10);
    const query = 'INSERT INTO meja (nomor_meja, token_qr, status) VALUES (?, ?, ?)';
    db.query(query, [nomor_meja, token_qr, status || 'kosong'], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Meja berhasil ditambahkan!', id: results.insertId, token_qr });
    });
});

app.put('/api/meja/:id/status', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});

app.delete('/api/meja/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
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
        ORDER BY m.is_deleted ASC, m.kategori_id ASC, m.nama_menu ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Endpoint Soft Delete Menu
app.delete('/api/menu/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
    const id = req.params.id;

    const query = 'UPDATE menu SET is_deleted = 1, is_available = 0 WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Menu berhasil di-soft-delete, riwayat transaksi tetap aman!' });
    });
});

app.post('/api/menu', authenticateToken, authorizeRole('admin'), upload.single('gambar'), (req, res) => {
    const { kategori_id, nama_menu, harga, deskripsi } = req.body;
    const gambar = req.file ? 'uploads/' + req.file.filename : null;

    if (!kategori_id || !nama_menu || !harga) {
        return res.status(400).json({ success: false, message: 'Kategori, nama menu, dan harga wajib diisi!' });
    }
    const checkQuery = 'SELECT id FROM menu WHERE LOWER(nama_menu) = LOWER(?)';
    db.query(checkQuery, [nama_menu.trim()], (errCheck, checkResults) => {
        if (errCheck) return res.status(500).json({ success: false, error: errCheck.message });

        if (checkResults.length > 0) {
            if (gambar) {
                const uploadedPath = path.join(__dirname, gambar);
                if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
            }
            return res.status(400).json({ 
                success: false, 
                message: 'Nama menu tersebut sudah ada! Menu tidak boleh sama.' 
            });
        }
        const insertQuery = 'INSERT INTO menu (kategori_id, nama_menu, harga, deskripsi, gambar, is_available) VALUES (?, ?, ?, ?, ?, 1)';
        db.query(insertQuery, [kategori_id, nama_menu.trim(), harga, deskripsi || null, gambar], (errInsert, results) => {
            if (errInsert) return res.status(500).json({ success: false, error: errInsert.message });
            res.json({ 
                success: true, 
                message: 'Menu berhasil ditambahkan!', 
                id: results.insertId,
                gambar: gambar
            });
        });
    });
});

app.put('/api/menu/:id', authenticateToken, authorizeRole('admin'), upload.single('gambar'), (req, res) => {
    const id = req.params.id;
    const { kategori_id, nama_menu, harga, deskripsi, hapus_foto_lama } = req.body;
    const gambar = req.file ? 'uploads/' + req.file.filename : null;

    if (!kategori_id || !nama_menu || !harga) {
        return res.status(400).json({ success: false, message: 'Kategori, nama menu, dan harga wajib diisi!' });
    }

    const checkQuery = 'SELECT id FROM menu WHERE LOWER(nama_menu) = LOWER(?) AND id != ?';
    db.query(checkQuery, [nama_menu.trim(), id], (errCheck, checkResults) => {
        if (errCheck) return res.status(500).json({ success: false, error: errCheck.message });

        if (checkResults.length > 0) {
            if (gambar) {
                const uploadedPath = path.join(__dirname, gambar);
                if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
            }
            return res.status(400).json({ 
                success: false, 
                message: 'Nama menu tersebut sudah digunakan oleh menu lain!' 
            });
        }

        db.query('SELECT gambar FROM menu WHERE id = ?', [id], (err, rowResults) => {
            if (err) return res.status(500).json({ error: err.message });
            const oldImage = rowResults.length > 0 ? rowResults[0].gambar : null;

            let query, params;
            let shouldDeleteOld = false;

            if (gambar) {
                query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ?, gambar = ? WHERE id = ?';
                params = [kategori_id, nama_menu.trim(), harga, deskripsi || null, gambar, id];
                shouldDeleteOld = true;
            } else if (hapus_foto_lama === 'true') {
                query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ?, gambar = NULL WHERE id = ?';
                params = [kategori_id, nama_menu.trim(), harga, deskripsi || null, id];
                shouldDeleteOld = true;
            } else {
                query = 'UPDATE menu SET kategori_id = ?, nama_menu = ?, harga = ?, deskripsi = ? WHERE id = ?';
                params = [kategori_id, nama_menu.trim(), harga, deskripsi || null, id];
            }

            db.query(query, params, (errUp, results) => {
                if (errUp) return res.status(500).json({ success: false, error: errUp.message });
                
                if (shouldDeleteOld && oldImage && oldImage.startsWith('uploads/')) {
                    const oldImagePath = path.join(__dirname, oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlink(oldImagePath, (unlinkErr) => {
                            if (unlinkErr) console.error('Gagal menghapus file lama:', unlinkErr);
                        });
                    }
                }
                
                res.json({ success: true, message: 'Menu berhasil diperbarui!' });
            });
        });
    });
});

app.put('/api/menu/:id/status', authenticateToken, authorizeRole('admin'), (req, res) => {
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

app.post('/api/kategori', authenticateToken, authorizeRole('admin'), (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi!' });
    db.query('INSERT INTO kategori (nama_kategori) VALUES (?)', [nama_kategori], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: results.insertId, nama_kategori });
    });
});

app.delete('/api/kategori/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
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

        db.query('SELECT COUNT(*) as count FROM pesanan WHERE DATE(waktu_pesan) = CURDATE()', (errCount, countRes) => {
            if (errCount) return res.status(500).json({ error: errCount.message });

            const urut = ((countRes && countRes[0] ? countRes[0].count : 0) || 0) + 1;
            const urut_str = String(urut).padStart(2, '0');
            const today = new Date();
            const tgl_str = String(today.getDate()).padStart(2, '0');

            // Generate order_num secara permanen
            const order_num = `SD-${tgl_str}${urut_str}${no_meja}`;

            // Sertakan kolom order_num saat INSERT ke tabel pesanan
            const queryPesanan = `
                INSERT INTO pesanan (order_num, meja_id, nama_pelanggan, catatan, metode_pembayaran, total_harga, status_pesanan)
                VALUES (?, ?, ?, ?, ?, ?, 'menunggu')
            `;

            db.query(
                queryPesanan, 
                [order_num, meja_id, nama_pelanggan || 'Pelanggan', catatan || '', metode_pembayaran || 'cash', total_harga || 0], 
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
        const [orders] = await db.promise().query(`SELECT status_pesanan FROM pesanan WHERE id = ?`, [pesananId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }

        const currentStatus = orders[0].status_pesanan;
        if (currentStatus === 'dihidangkan' || currentStatus === 'selesai' || currentStatus === 'dibatalkan') {
            return res.status(400).json({ 
                success: false, 
                message: `Tidak dapat menambah item. Pesanan sudah berstatus: ${currentStatus}` 
            });
        }

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

app.get('/api/pesanan', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            p.id, p.order_num, p.meja_id, p.nama_pelanggan, p.catatan, p.metode_pembayaran,
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

        rows.forEach(row => {
            if (!ordersMap.has(row.id)) {
                // Ambil order_num secara langsung dari kolom database (permanen)
                const orderNum = row.order_num || `SD-${row.id}`;

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

        res.json(Array.from(ordersMap.values()).reverse());
    });
});

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
        
        const row = results[0];
        row.order_num = row.order_num || `SD-${row.id}`;

        res.json(row);
    });
});

app.put('/api/pesanan/:id/status', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { status_pesanan } = req.body;

    const validStatuses = ['menunggu', 'diproses', 'dihidangkan', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status_pesanan)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid!' });
    }

    db.query('SELECT * FROM pesanan WHERE id = ?', [id], (errFind, rowsFind) => {
        if (errFind) return res.status(500).json({ error: errFind.message });
        if (rowsFind.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

        const currentOrder = rowsFind[0];

        // VALIDASI SERVER-SIDE UNTUK PEMBATALAN (TC-12 / TC-14)
        if (status_pesanan === 'dibatalkan') {
            // 1. Cek apakah status saat ini masih 'menunggu'
            if (currentOrder.status_pesanan !== 'menunggu') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Pesanan sudah diproses dan tidak dapat dibatalkan!' 
                });
            }

            // 2. Cek apakah batas waktu 30 detik sudah terlewati
            const waktuPesanMs = new Date(currentOrder.waktu_pesan).getTime();
            const nowMs = Date.now();
            const selisihDetik = Math.floor((nowMs - waktuPesanMs) / 1000);

            if (selisihDetik > 30) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Batas waktu pembatalan 30 detik telah lewat. Pesanan tidak dapat dibatalkan.' 
                });
            }
        }

        db.query('UPDATE pesanan SET status_pesanan = ? WHERE id = ?', [status_pesanan, id], (errUpdate) => {
            if (errUpdate) {
                console.error("Gagal update status pesanan:", errUpdate.message);
                return res.status(500).json({ error: errUpdate.message });
            }

            if (status_pesanan === 'selesai') {
                const hargaPesan = Number(currentOrder.total_harga) || 0;
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

            if (status_pesanan === 'selesai' || status_pesanan === 'dibatalkan') {
                const mejaId = currentOrder.meja_id;
                const checkActive = "SELECT COUNT(*) AS active_count FROM pesanan WHERE meja_id = ? AND status_pesanan IN ('menunggu', 'diproses', 'dihidangkan')";
                
                db.query(checkActive, [mejaId], (errCheck, resCheck) => {
                    if (!errCheck && resCheck[0].active_count === 0) {
                        db.query('UPDATE meja SET status = "kosong" WHERE id = ?', [mejaId]);
                    }
                });
            }

            res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status_pesanan}` });
        });
    });
});

app.delete('/api/pesanan/bulk', authenticateToken, authorizeRole('admin'), (req, res) => {
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

app.get('/api/stats', authenticateToken, (req, res) => {
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

app.get('/api/rekap-harian', authenticateToken, authorizeRole('admin'), (req, res) => {
    const query = 'SELECT * FROM rekap_harian ORDER BY tanggal DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

const PORT = 5500;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});