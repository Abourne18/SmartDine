const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Koneksi ke Database 'Restoran' di MySQL XAMPP
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

// API endpoint untuk Login (Sesuai dengan tabel users yang baru)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Kita cek username dan password di tabel users
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            // Ambil data user yang berhasil login
            const user = results[0];
            
            res.json({ 
                success: true, 
                message: 'Login berhasil!',
                data: {
                    nama_lengkap: user.nama_lengkap, // Mengambil kolom nama_lengkap
                    peran: user.peran                // Mengambil kolom peran ('admin' atau 'dapur')
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah!' });
        }
    });
});

// API endpoint untuk mengambil data meja
app.get('/api/meja', (req, res) => {
    const query = 'SELECT * FROM meja';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- API BARU: Tambah Meja ---
app.post('/api/meja', (req, res) => {
    const { nomor_meja, status } = req.body;
    
    // Generate Token QR otomatis secara acak (kombinasi angka & huruf)
    const token_qr = Math.random().toString(36).substring(2, 15);
    
    // Query INSERT tanpa 'id' karena MySQL akan otomatis mengurutkannya (AUTO_INCREMENT)
    const query = 'INSERT INTO meja (nomor_meja, token_qr, status) VALUES (?, ?, ?)';
    
    db.query(query, [nomor_meja, token_qr, status], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Meja berhasil ditambahkan!' });
    });
});

// --- API BARU: Ubah Status Meja (Kosong/Terisi) ---
app.put('/api/meja/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});

// --- API BARU: Ambil Daftar Menu ---
app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM menu', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- API BARU: Tambah Menu ---
app.post('/api/menu', (req, res) => {
    // Menyesuaikan dengan kolom: kategori_id, nama_menu, harga
    const { kategori_id, nama_menu, harga } = req.body;
    
    // is_available kita set default 1 (Tersedia) saat pertama dibuat
    const query = 'INSERT INTO menu (kategori_id, nama_menu, harga, is_available) VALUES (?, ?, ?, 1)';
    
    db.query(query, [kategori_id, nama_menu, harga], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Menu berhasil ditambahkan!' });
    });
});

// --- API BARU: Ubah Status Ketersediaan Menu (Tersedia/Habis) ---
app.put('/api/menu/:id/status', (req, res) => {
    const id = req.params.id;
    const { is_available } = req.body; 
    
    const query = 'UPDATE menu SET is_available = ? WHERE id = ?';
    db.query(query, [is_available, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status menu berhasil diubah!' });
    });
});

// --- API BARU: Ambil Daftar Kategori ---
app.get('/api/kategori', (req, res) => {
    // Asumsi tabel bernama 'kategori'
    db.query('SELECT * FROM kategori', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Jalankan server di port 3000
app.listen(3000, () => {
    console.log('Server Backend Node.js berjalan di http://localhost:3000');
});