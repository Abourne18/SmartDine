// STATISTIK & PESANAN AKTIF
// ============================================================
async function renderStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
            const data = await res.json();
            const statOrders = document.getElementById('statOrders');
            const statRevenue = document.getElementById('statRevenue');
            const statTables = document.getElementById('statTables');
            const statMenu = document.getElementById('statMenu');

            if (statOrders) statOrders.innerText = data.total_orders || 0;
            if (statRevenue) statRevenue.innerText = rp(data.total_revenue || 0);
            if (statTables) statTables.innerText = data.total_tables || 0;

            try {
                const menuRes = await fetch(`${API_BASE}/menu`);
                if (menuRes.ok) {
                    const menuData = await menuRes.json();
                    const availableMenuCount = menuData.filter(m => m.is_available === 1).length;
                    if (statMenu) statMenu.innerText = availableMenuCount;
                } else {
                    if (statMenu) statMenu.innerText = data.total_menu || 0;
                }
            } catch (err) {
                if (statMenu) statMenu.innerText = data.total_menu || 0;
            }
        }
    } catch (e) {
        console.warn('Gagal memuat statistik:', e);
    }
}

async function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        const allOrders = await res.json();
        const orders = allOrders.filter(o => o.status_pesanan === 'menunggu' || o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan');

        const badge = document.getElementById('ordersBadge');
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center; padding:40px; color:var(--grey);">
                    <div class="empty-title" style="font-weight:700; font-size:1.1rem; margin-bottom:8px;">Belum Ada Pesanan Masuk</div>
                    <div class="empty-sub" style="font-size:0.85rem;">Pesanan dari pelanggan via scan QR akan muncul otomatis di sini.</div>
                </div>
            `;
            if (badge) badge.style.display = 'none';
            return;
        }

        if (badge) { badge.textContent = orders.length; badge.style.display = 'inline-flex'; }

        container.innerHTML = orders.map(order => {
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = '';
            let actionButtons = '';

            if (order.status_pesanan === 'menunggu') {
                statusBadge = '<span class="status-badge" style="background:#fef3c7; color:#d97706; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">MENUNGGU</span>';
                actionButtons = `
                    <button class="action-btn btn-info" onclick="updateOrderStatus(${order.id}, 'diproses')" style="padding:8px 14px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Terima Pesanan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
            } else if (order.status_pesanan === 'diproses') {
                statusBadge = '<span class="status-badge" style="background:#fef9c3; color:#ca8a04; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIMASAK</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'dihidangkan')" style="padding:8px 14px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Siap Dihidangkan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
            } else if (order.status_pesanan === 'dihidangkan') {
                statusBadge = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIHIDANGKAN</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'selesai')" style="padding:8px 14px; background:#059669; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">✅ Selesai</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
            }

            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(it => `
                    <div class="oac-item-row" style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.9rem;">
                        <div class="oac-item-name" style="display:flex; gap:8px;"><div class="oac-item-qty" style="font-weight:700;">${it.kuantitas}x</div>${it.nama_menu}</div>
                        <div class="oac-item-price" style="font-weight:600;">${rp(it.subtotal)}</div>
                    </div>
                `).join('')
                : '<div style="color:var(--grey-light);">Tidak ada rincian item</div>';

            const catatanHtml = order.catatan ? `<div class="oac-note" style="background:#f9fafb; padding:8px 12px; border-radius:6px; font-size:0.85rem; margin-bottom:12px;"><strong>Catatan:</strong> ${order.catatan}</div>` : '';

            return `
                <div class="order-admin-card" style="background:white; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div class="oac-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <div>
                            <div class="oac-order-num" style="font-weight:800; font-size:1rem; color:#111827;">${order.order_num || formatOrderId(order.id)}</div>
                            <div class="oac-meta" style="display:flex; gap:8px; font-size:0.8rem; color:#6b7280; margin-top:4px;">
                                <span>Meja ${order.nomor_meja}</span> • 
                                <span>${order.nama_pelanggan || 'Pelanggan'}</span> • 
                                <span>${waktu}</span> • 
                                <span>${order.metode_pembayaran?.toUpperCase()}</span>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    ${catatanHtml}
                    <div class="oac-items" style="border-top:1px dashed #e5e7eb; border-bottom:1px dashed #e5e7eb; padding:12px 0; margin-bottom:12px;">
                        ${itemsHtml}
                        <div class="oac-total-row" style="display:flex; justify-content:space-between; font-weight:800; margin-top:8px; font-size:0.95rem;">
                            <span>Total Tagihan</span>
                            <span class="oac-grand" style="color:#d97706;">${rp(order.total_harga)}</span>
                        </div>
                    </div>
                    <div class="oac-actions" style="display:flex; gap:8px;">${actionButtons}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error renderOrders:', error);
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/pesanan/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_pesanan: newStatus })
        });
        const data = await response.json();
        if (data.success) { 
            renderOrders(); 
            renderStats(); 
            if (typeof renderHistory === 'function') renderHistory(); 
            if (typeof renderTables === 'function') renderTables(); 
        }
    } catch (error) { 
        console.error(error); 
    }
}

// ============================================================
// RIWAYAT TRANSAKSI (FIX)
// ============================================================
let _historyOrdersCache = [];

async function renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        const allOrders = await res.json();
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