import re

with open('c:/Documents/SmartDine/FromGit/backend/server.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update the POST /api/pesanan insertion logic
old_post = r"""        const meja_id = results\[0\]\.id;

        const queryPesanan = `
            INSERT INTO pesanan \(meja_id, nama_pelanggan, catatan, metode_pembayaran, total_harga, status_pesanan\)
            VALUES \(\?, \?, \?, \?, \?, 'menunggu'\)
        `;

        db\.query\(
            queryPesanan, 
            \[meja_id, nama_pelanggan \|\| 'Pelanggan', catatan \|\| '', metode_pembayaran \|\| 'cash', total_harga \|\| 0\], 
            \(err, result\) => \{"""

new_post = r"""        const meja_id = results[0].id;

        // Hitung no urut harian untuk order_num
        db.query('SELECT COUNT(*) AS count FROM pesanan WHERE DATE(waktu_pesan) = CURDATE()', (errCount, countResults) => {
            if (errCount) return res.status(500).json({ error: errCount.message });

            const dailySeq = countResults[0].count + 1;
            const seqFormatted = String(dailySeq).padStart(2, '0');
            const mejaFormatted = String(nomor_meja).padStart(2, '0');
            const dayFormatted = String(new Date().getDate()).padStart(2, '0');
            
            const generatedOrderNum = `SD-${dayFormatted}${mejaFormatted}${seqFormatted}`;

            const queryPesanan = `
                INSERT INTO pesanan (meja_id, nama_pelanggan, catatan, metode_pembayaran, total_harga, status_pesanan, order_num)
                VALUES (?, ?, ?, ?, ?, 'menunggu', ?)
            `;

            db.query(
                queryPesanan, 
                [meja_id, nama_pelanggan || 'Pelanggan', catatan || '', metode_pembayaran || 'cash', total_harga || 0, generatedOrderNum], 
                (err, result) => {"""

js = re.sub(old_post, new_post, js)

# Also need to close the extra bracket for db.query inside POST
old_post_end = r"""                        order_num: '#SD-' \+ String\(pesanan_id\)\.padStart\(4, '0'\)
                    \}\);
                \}\);
            \}
        \);
    \}\);
\}\);"""

new_post_end = r"""                        order_num: generatedOrderNum
                    });
                });
            }
        );
        }); // tutup db.query count
    });
});"""

js = re.sub(old_post_end, new_post_end, js)


# 2. Update GET /api/pesanan to use row.order_num
old_get = r"order_num: '#SD-' \+ String\(row\.id\)\.padStart\(4, '0'\),"
new_get = r"order_num: row.order_num || ('SD-' + String(row.id).padStart(4, '0')),"
js = re.sub(old_get, new_get, js)

with open('c:/Documents/SmartDine/FromGit/backend/server.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("server.js patched for new order_num logic.")
