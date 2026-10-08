const fs = require('fs');
let js = fs.readFileSync('c:/Documents/SmartDine/FromGit/backend/server.js', 'utf8');

const targetStr = `// Ubah Status Meja (kosong / terisi)
app.put('/api/meja/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});`;

const newEndpoint = `// Ubah Status Meja (kosong / terisi)
app.put('/api/meja/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body; 
    const query = 'UPDATE meja SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Status meja berhasil diubah!' });
    });
});

// Hapus Meja
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
});`;

// strip spaces to check if it's there
const strippedJs = js.replace(/\s+/g, '');
const strippedTarget = targetStr.replace(/\s+/g, '');

if (strippedJs.includes(strippedTarget)) {
    const idx = js.indexOf("app.put('/api/meja/:id/status'");
    if (idx !== -1) {
        const blockEnd = js.indexOf("});\n});", idx) + 7;
        const actualTarget = js.substring(js.lastIndexOf("// Ubah Status Meja", idx), blockEnd);
        js = js.replace(actualTarget, newEndpoint);
        fs.writeFileSync('c:/Documents/SmartDine/FromGit/backend/server.js', js);
        console.log("Success adding DELETE endpoint");
    } else {
        console.log("Could not find index of app.put");
    }
} else {
    console.log("Could not find target logic in server.js");
}
