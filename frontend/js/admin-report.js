// ============================================================
// RIWAYAT TRANSAKSI (Fungsi untuk Tab History)
// ============================================================
let _historyOrdersCache = [];

async function renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        const allOrders = await res.json();
        
        // Filter khusus untuk history: hanya ambil status 'selesai' atau 'dibatalkan'
        const historyOrders = allOrders.filter(o => o.status_pesanan === 'selesai' || o.status_pesanan === 'dibatalkan');
        
        _historyOrdersCache = historyOrders;

        if (historyOrders.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--grey);">Tidak ada riwayat transaksi.</div>`;
            return;
        }

        const tbodyHtml = historyOrders.map(order => {
            const tglStr = new Date(order.waktu_pesan).toLocaleDateString('id-ID');
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = order.status_pesanan === 'selesai' 
                ? '<span style="background:#d1fae5; color:#065f46; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">SELESAI</span>'
                : '<span style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIBATALKAN</span>';

            const itemsText = order.items && order.items.length > 0
                ? order.items.map(it => `${it.kuantitas}x ${it.nama_menu}`).join(', ')
                : '-';

            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 16px; font-weight: 600;">${order.order_num || 'SD-' + String(order.id).padStart(4, '0')}</td>
                    <td style="padding: 12px 16px; color: #6b7280;">${tglStr}, ${waktu}</td>
                    <td style="padding: 12px 16px; text-align: center; font-weight: 600;">Meja ${order.nomor_meja}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; color: #374151;">${itemsText}</td>
                    <td style="padding: 12px 16px; text-align: center; font-weight: 600;">${order.metode_pembayaran ? order.metode_pembayaran.toUpperCase() : 'CASH'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #d97706;">${rp(order.total_harga)}</td>
                    <td style="padding: 12px 16px; text-align: center;">${statusBadge}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #374151;">
                            <th style="padding: 12px 16px; font-weight: 700;">ID Pesanan</th>
                            <th style="padding: 12px 16px; font-weight: 700;">Tgl, Jam</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Meja</th>
                            <th style="padding: 12px 16px; font-weight: 700;">Pesanan</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Metode Bayar</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Total</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) { 
        console.error('Error renderHistory:', e); 
    }
}