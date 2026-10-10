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

            // Hitung hanya menu yang tersedia (is_available === 1) untuk card statistik menu
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
                <div class="empty-state">
                    <div class="empty-icon"><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="24" height="24" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">

<g fill="#000000">

<path fill-rule="evenodd" d="M3.25 2.5H4v.25C4 3.44 4.56 4 5.25 4h5.5C11.44 4 12 3.44 12 2.75V2.5h.75a.75.75 0 01.75.75v3a.75.75 0 001.5 0v-3A2.25 2.25 0 0012.75 1h-.775c-.116-.57-.62-1-1.225-1h-5.5c-.605 0-1.11.43-1.225 1H3.25A2.25 2.25 0 001 3.25v10.5A2.25 2.25 0 003.25 16h9.5A2.25 2.25 0 0015 13.75v-1a.75.75 0 00-1.5 0v1a.75.75 0 01-.75.75h-9.5a.75.75 0 01-.75-.75V3.25a.75.75 0 01.75-.75zm2.25-1v1h5v-1h-5z" clip-rule="evenodd"/>

<path d="M4.75 5.5a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zM4 12.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM4.75 8.5a.75.75 0 000 1.5h2a.75.75 0 000-1.5h-2zM16 9.25a.75.75 0 01-.75.75h-4.19l1.22 1.22a.75.75 0 11-1.06 1.06l-2.5-2.5a.752.752 0 010-1.06l2.5-2.5a.75.75 0 111.06 1.06L11.06 8.5h4.19a.75.75 0 01.75.75z"/>

</g>

</svg></div>
                    <div class="empty-title">Belum Ada Pesanan Masuk</div>
                    <div class="empty-sub">Pesanan dari pelanggan via scan QR akan muncul otomatis di sini.</div>
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
                statusBadge = '<span class="status-badge badge-menunggu"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M12 2v20"></path><path d="M8 2h8"></path><path d="M8 22h8"></path><path d="M15 16a3 3 0 0 0-3-3 3 3 0 0 0-3 3v6h6z"></path><path d="M15 8a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2h6z"></path></svg> MENUNGGU</span>';
                actionButtons = `
                    <button class="action-btn btn-info" onclick="updateOrderStatus(${order.id}, 'diproses')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg> Proses Masak</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Batalkan</button>
                `;
            } else if (order.status_pesanan === 'diproses') {
                statusBadge = '<span class="status-badge badge-diproses"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg> DIMASAK</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'dihidangkan')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Siap Dihidangkan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Batalkan</button>
                `;
            } else if (order.status_pesanan === 'dihidangkan') {
                statusBadge = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Belum dibayar</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'selesai')">✅ Selesai</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Batalkan</button>
                `;
            }

            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(it => `
                    <div class="oac-item-row">
                        <div class="oac-item-name"><div class="oac-item-qty">${it.kuantitas}</div>${it.nama_menu}</div>
                        <div class="oac-item-price">${rp(it.subtotal)}</div>
                    </div>
                `).join('')
                : '<div style="color:var(--grey-light);">Tidak ada rincian item</div>';

            const catatanHtml = order.catatan ? `<div class="oac-note"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> <span><strong>Catatan:</strong> ${order.catatan}</span></div>` : '';

            return `
                <div class="order-admin-card status-${order.status_pesanan}">
                    <div class="oac-header">
                        <div>
                            <div class="oac-order-num">${order.order_num}</div>
                            <div class="oac-meta">
                                <span class="oac-meta-chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Meja ${order.nomor_meja}</span>
                                <span class="oac-meta-chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${order.nama_pelanggan || 'Pelanggan'}</span>
                                <span class="oac-meta-chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${waktu}</span>
                                <span class="oac-meta-chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> ${order.metode_pembayaran?.toUpperCase()}</span>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    ${catatanHtml}
                    <div class="oac-items">
                        ${itemsHtml}
                        <div class="oac-total-row">
                            <span>Total Tagihan</span>
                            <span class="oac-grand">${rp(order.total_harga)}</span>
                        </div>
                    </div>
                    <div class="oac-actions">${actionButtons}</div>
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
        if (data.success) { renderOrders(); renderStats(); renderHistory(); renderTables(); }
    } catch (error) { console.error(error); }
}




window._isSelectMode = false;
window._selectedOrders = new Set();
window._pressTimer = null;
window._justLongPressed = false; // Flag to prevent immediate uncheck on mouseup

window.reRenderTableOnly = function() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = window._selectedOrders.has(id);
        const tr = cb.closest('tr');
        if (window._selectedOrders.has(id)) {
            tr.style.background = '#fee2e2';
        } else {
            tr.style.background = 'transparent';
        }
    });
};

window.toggleSelectMode = function(orderId) {
    if (!window._isSelectMode) {
        window._isSelectMode = true;
        window._justLongPressed = true; // Block the immediate click event
        setTimeout(() => { window._justLongPressed = false; }, 400); // Clear flag shortly after
        
        window._selectedOrders.clear();
        if (orderId) window._selectedOrders.add(String(orderId));
        
        const trs = document.querySelectorAll('.history-tr');
        trs.forEach(tr => {
            tr.style.cursor = 'pointer';
            const id = tr.getAttribute('data-id');
            const td = tr.querySelector('.id-td');
            if (td && !td.querySelector('.row-checkbox')) {
                td.style.display = 'flex';
                td.style.alignItems = 'center';
                td.style.gap = '8px';
                td.innerHTML = `<input type="checkbox" class="row-checkbox" data-id="${id}" style="pointer-events:none;" ${window._selectedOrders.has(id) ? 'checked' : ''}>` + td.innerHTML;
            }
        });
        
        window.reRenderTableOnly();
        showTrashIcon();
    }
};

window.toggleOrderSelection = function(orderId) {
    if (window._justLongPressed) return; // Prevent toggling if we just long-pressed
    
    const id = String(orderId);
    if (window._selectedOrders.has(id)) {
        window._selectedOrders.delete(id);
    } else {
        window._selectedOrders.add(id);
    }
    
    window.reRenderTableOnly();
    
    if (window._selectedOrders.size === 0) {
        window._isSelectMode = false;
        hideTrashIcon();
        const trs = document.querySelectorAll('.history-tr');
        trs.forEach(tr => {
            tr.style.cursor = 'default';
            const cb = tr.querySelector('.row-checkbox');
            if (cb) cb.remove();
        });
    }
};

window.showTrashIcon = function() {
    let trashBtn = document.getElementById('bulkDeleteTrashBtn');
    if (!trashBtn) {
        trashBtn = document.createElement('button');
        trashBtn.id = 'bulkDeleteTrashBtn';
        trashBtn.className = 'action-btn';
        trashBtn.style.padding = '8px 12px';
        trashBtn.style.background = '#fee2e2';
        trashBtn.style.color = '#dc2626';
        trashBtn.style.border = '1px solid #fca5a5';
        trashBtn.style.borderRadius = '8px';
        trashBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Hapus Terpilih';
        trashBtn.onclick = async function() {
            if (window._selectedOrders.size === 0) return;
            if (!confirm(`Apakah Anda yakin ingin menghapus ${window._selectedOrders.size} riwayat transaksi secara permanen? Data rekap harian tidak akan berubah.`)) return;
            
            try {
                const res = await fetch(`${API_BASE}/pesanan/bulk`, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ ids: Array.from(window._selectedOrders) })
                });
                const result = await res.json();
                if (result.success) {
                    window._isSelectMode = false;
                    window._selectedOrders.clear();
                    hideTrashIcon();
                    renderHistory(); // Full reload to update table
                } else {
                    alert('Gagal menghapus: ' + result.error);
                }
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
            }
        };
        const searchInput = document.getElementById('searchHistory');
        if (searchInput && searchInput.parentNode) {
            searchInput.parentNode.insertBefore(trashBtn, searchInput.nextSibling);
        }
    }
    trashBtn.style.display = 'inline-flex';
};

window.hideTrashIcon = function() {
    const trashBtn = document.getElementById('bulkDeleteTrashBtn');
    if (trashBtn) trashBtn.style.display = 'none';
};

// ============================================================
// RIWAYAT TRANSAKSI DENGAN PENCARIAN, FILTER, & PAGINATION
// ============================================================
let _historyOrdersCache = [];

async function renderHistory() {
    const container = document.getElementById('historyContainer');
    const paginationContainer = document.getElementById('historyPagination');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        const allOrders = await res.json();
        const historyOrders = allOrders.filter(o => o.status_pesanan === 'selesai' || o.status_pesanan === 'dibatalkan');
        
        _historyOrdersCache = historyOrders;

        // Populate Dropdown Filter Meja
        const filterMejaEl = document.getElementById('filterMeja');
        if (filterMejaEl) {
            const currentSelectedMeja = filterMejaEl.value;
            const uniqueMeja = [...new Set(historyOrders.map(o => o.nomor_meja))].sort((a, b) => a - b);
            filterMejaEl.innerHTML = '<option value="">Semua Meja</option>' + 
                uniqueMeja.map(m => `<option value="${m}" ${currentSelectedMeja == m ? 'selected' : ''}>Meja ${m}</option>`).join('');
        }

        // Ambil nilai dari elemen filter dan pencarian
        const searchQuery = document.getElementById('searchHistory') ? document.getElementById('searchHistory').value.toLowerCase().trim() : '';
        const selectedMeja = filterMejaEl ? filterMejaEl.value : '';
        const selectedStatus = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';

        // Terapkan Filter & Pencarian
        const filteredOrders = historyOrders.filter(o => {
            const orderNumStr = (o.order_num || '').toLowerCase();
            const customerName = (o.nama_pelanggan || '').toLowerCase();
            
            const matchSearch = searchQuery === '' || orderNumStr.includes(searchQuery) || customerName.includes(searchQuery);
            const matchMeja = selectedMeja === '' || String(o.nomor_meja) === String(selectedMeja);
            const matchStatus = selectedStatus === '' || o.status_pesanan === selectedStatus;
            
            return matchSearch && matchMeja && matchStatus;
        });

        if (filteredOrders.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--border);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg></div><div class="empty-title">Tidak Ada Riwayat Sesuai Pencarian</div><div class="empty-sub">Coba ubah kata kunci pencarian atau kriteria filter.</div></div>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Logika Pagination 10 item per halaman
        const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        if (currentPageHistory > totalPages) currentPageHistory = totalPages;
        const startIndex = (currentPageHistory - 1) * itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

        const tbodyHtml = paginatedOrders.map(order => {
            const tglStr = new Date(order.waktu_pesan).toLocaleDateString('id-ID');
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = order.status_pesanan === 'selesai' 
                ? '<span class="status-badge badge-selesai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="20 6 9 17 4 12"></polyline></svg> SELESAI</span>'
                : '<span class="status-badge badge-dibatalkan"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> DIBATALKAN</span>';

            const itemsText = order.items && order.items.length > 0
                ? order.items.map(it => `${it.kuantitas}x ${it.nama_menu}`).join('<br>')
                : '-';

            let btnCetak = '';
            if(order.status_pesanan === 'selesai') {
                btnCetak = `<button class="action-btn btn-ghost btn-sm" style="border: 1px solid var(--border); padding: 4px 10px;" onclick="cetakStruk(${order.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Cetak</button>`;
            }

            return `
                <tr class="history-tr" data-id="${order.id}" style="border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: ${window._isSelectMode ? 'pointer' : 'default'}; ${window._isSelectMode && window._selectedOrders.has(String(order.id)) ? 'background: #fee2e2;' : ''}" 
                  onmouseover="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='var(--lighter)'" 
                  onmouseout="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='transparent'"
                  onmousedown="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                  onmouseup="clearTimeout(window._pressTimer);"
                  onmouseleave="clearTimeout(window._pressTimer);"
                  ontouchstart="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                  ontouchend="clearTimeout(window._pressTimer);"
                  onclick="if(window._justLongPressed) return; if(window._isSelectMode) { window.toggleOrderSelection('${order.id}'); } else if (window._pressTimer) { clearTimeout(window._pressTimer); }">
                    <td class="id-td" style="padding: 16px 20px; font-weight: 600; color: var(--dark); ${window._isSelectMode ? 'display: flex; align-items: center; gap: 8px;' : ''}">
                        ${window._isSelectMode ? `<input type="checkbox" class="row-checkbox" data-id="${order.id}" style="pointer-events:none;" ${window._selectedOrders.has(String(order.id)) ? 'checked' : ''}>` : ''}
                        ${order.order_num}
                    </td>
                    <td style="padding: 16px 20px; color: var(--grey);">${tglStr}, ${waktu}</td>
                    <td style="padding: 16px 20px; text-align: center; font-weight: 600;">${order.nomor_meja}</td>
                    <td style="padding: 16px 20px; font-size: 0.85rem; color: var(--grey); line-height: 1.5;">${itemsText}</td>
                    <td style="padding: 16px 20px; text-align: center; font-weight: 600; color: var(--dark);">${order.metode_pembayaran ? order.metode_pembayaran.toUpperCase() : 'CASH'}</td>
                    <td style="padding: 16px 20px; text-align: right; font-weight: 800; color: var(--brand);">${rp(order.total_harga)}</td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                            ${statusBadge}
                            ${btnCetak}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f7ece4; border-bottom: 1px solid var(--border); color: #000000;">
                            <th style="padding: 16px 20px; font-weight: 700; white-space: nowrap;">ID Pesanan</th>
                            <th style="padding: 16px 20px; font-weight: 700; white-space: nowrap;">Tgl, Jam</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Meja</th>
                            <th style="padding: 16px 20px; font-weight: 700;">Pesanan</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Metode Bayar</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: right;">Total</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Status & Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
            </div>
        `;

        renderPaginationControls(paginationContainer, currentPageHistory, totalPages, (newPage) => {
            currentPageHistory = newPage;
            renderHistory();
        });

    } catch (e) { console.error(e); }
}

// Fungsi Buka Jendela Thermal Print dengan Logo/Ikon via SERVER_URL
function cetakStruk(orderId) {
    const order = _historyOrdersCache.find(o => o.id === orderId);
    if (!order) {
        sd_error('Gagal', 'Data pesanan tidak ditemukan.');
        return;
    }

    const tgl = new Date(order.waktu_pesan).toLocaleDateString('id-ID');
    const jam = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Bagian isi struk
    let subtotalCalc = 0;
    let itemsHtmlStr = '';
    if (order.items && order.items.length) {
        itemsHtmlStr = order.items.map(it => {
            subtotalCalc += Number(it.subtotal);
            return `
                <div class="flex-between" style="margin-bottom: 4px;">
                    <div style="width: 65%;">${it.kuantitas}x ${it.nama_menu}</div>
                    <div>${rp(it.subtotal)}</div>
                </div>
            `;
        }).join('');
    }
    let taxCalc = Math.round(subtotalCalc * 0.10);
    let serviceCalc = Math.round(subtotalCalc * 0.05);
    let totalAkhir = order.total_harga || (subtotalCalc + taxCalc + serviceCalc);

    const receiptBody = `
        <div class="text-center" style="margin-bottom: 10px;">
            <div style="display:inline-block; width:50px; height:50px;">
                <svg width="100%" height="100%" viewBox="0 0 1024 948" xmlns="http://www.w3.org/2000/svg">
<path fill="#D05A2B" fill-rule="evenodd" d="M 606 716 L 606 732 L 607 733 L 608 733 L 609 732 L 620 732 L 621 733 L 625 733 L 626 734 L 628 734 L 629 735 L 630 735 L 632 737 L 633 737 L 637 741 L 637 742 L 639 744 L 639 746 L 640 747 L 640 749 L 641 750 L 641 759 L 642 759 L 643 760 L 648 760 L 649 759 L 654 759 L 655 758 L 656 758 L 658 756 L 658 747 L 657 746 L 657 742 L 656 741 L 656 739 L 655 738 L 655 737 L 654 736 L 654 735 L 653 734 L 653 733 L 651 731 L 651 730 L 644 723 L 643 723 L 642 722 L 641 722 L 639 720 L 638 720 L 637 719 L 636 719 L 635 718 L 633 718 L 632 717 L 629 717 L 628 716 L 623 716 L 622 715 L 607 715 Z M 314 417 L 315 416 L 417 416 L 419 418 L 419 432 L 418 433 L 418 442 L 419 443 L 419 500 L 418 501 L 419 504 L 418 505 L 418 515 L 419 516 L 418 517 L 418 518 L 417 519 L 316 519 L 314 517 Z M 296 396 L 295 397 L 295 537 L 296 538 L 437 538 L 437 396 Z M 75 565 L 78 587 L 146 588 L 167 611 L 189 619 L 828 619 L 851 610 L 870 588 L 935 588 L 940 585 L 940 563 L 936 561 L 527 561 L 520 488 L 523 480 L 544 459 L 549 442 L 537 353 L 530 355 L 529 429 L 524 433 L 518 429 L 513 355 L 504 355 L 500 427 L 495 433 L 488 428 L 487 355 L 480 353 L 477 359 L 468 442 L 472 457 L 497 488 L 489 561 L 80 561 Z M 746 261 L 746 273 L 745 274 L 745 280 L 746 281 L 746 452 L 745 453 L 746 457 L 745 459 L 746 463 L 746 468 L 745 469 L 746 471 L 746 475 L 745 476 L 746 479 L 746 538 L 877 538 L 878 537 L 877 533 L 877 513 L 876 512 L 876 503 L 875 502 L 875 495 L 874 494 L 874 488 L 873 487 L 873 481 L 870 469 L 870 464 L 866 452 L 866 448 L 864 444 L 863 437 L 856 416 L 854 413 L 847 393 L 840 380 L 840 378 L 824 349 L 813 332 L 788 300 L 758 270 Z M 272 261 L 270 261 L 259 270 L 229 300 L 217 314 L 192 350 L 172 387 L 172 389 L 167 398 L 162 413 L 160 416 L 154 434 L 154 437 L 152 441 L 146 465 L 143 485 L 142 486 L 142 492 L 141 493 L 141 502 L 140 503 L 139 533 L 138 534 L 139 538 L 272 538 Z M 598 208 L 600 206 L 701 206 L 703 208 L 703 309 L 702 310 L 600 310 L 598 308 L 598 307 L 599 306 L 598 305 L 598 303 L 599 302 L 599 260 L 598 259 L 599 258 L 599 252 L 598 251 L 599 250 L 599 224 L 598 223 L 599 222 L 599 221 L 598 220 Z M 314 208 L 315 207 L 320 207 L 321 206 L 416 206 L 419 209 L 419 211 L 418 212 L 418 218 L 419 219 L 419 251 L 418 252 L 418 261 L 419 262 L 419 274 L 418 275 L 418 280 L 419 281 L 419 282 L 418 283 L 418 284 L 419 285 L 419 296 L 418 297 L 418 301 L 419 302 L 419 307 L 418 308 L 418 309 L 417 310 L 316 310 L 314 308 Z M 579 188 L 580 189 L 580 196 L 579 197 L 579 240 L 580 241 L 579 243 L 579 267 L 580 268 L 579 269 L 580 270 L 579 271 L 580 272 L 580 282 L 579 283 L 579 313 L 580 315 L 579 316 L 580 317 L 580 324 L 579 325 L 579 328 L 581 330 L 617 330 L 618 329 L 619 330 L 626 330 L 627 329 L 629 330 L 648 330 L 649 329 L 651 330 L 677 330 L 678 329 L 679 330 L 683 330 L 684 329 L 689 329 L 690 330 L 691 329 L 718 330 L 723 328 L 723 188 L 722 187 L 580 187 Z M 296 187 L 295 188 L 295 329 L 297 330 L 418 330 L 419 329 L 421 330 L 423 329 L 424 330 L 428 330 L 429 329 L 433 330 L 434 329 L 437 329 L 437 187 Z M 452 151 L 452 164 L 565 164 L 565 153 L 564 152 L 564 149 L 563 148 L 563 145 L 562 144 L 562 142 L 560 139 L 560 137 L 559 136 L 559 135 L 558 134 L 558 133 L 556 131 L 556 130 L 552 126 L 552 125 L 548 121 L 547 121 L 542 116 L 541 116 L 539 114 L 538 114 L 537 113 L 536 113 L 535 112 L 534 112 L 533 111 L 532 111 L 529 109 L 527 109 L 526 108 L 524 108 L 523 107 L 519 107 L 518 106 L 499 106 L 498 107 L 494 107 L 493 108 L 491 108 L 490 109 L 488 109 L 487 110 L 486 110 L 485 111 L 484 111 L 483 112 L 482 112 L 481 113 L 480 113 L 479 114 L 478 114 L 476 116 L 475 116 L 473 118 L 472 118 L 464 126 L 464 127 L 461 130 L 461 131 L 459 133 L 459 134 L 458 135 L 458 136 L 456 139 L 456 141 L 454 144 L 454 146 L 453 147 L 453 150 Z M 102 51 L 136 29 L 180 18 L 845 18 L 901 35 L 937 65 L 957 97 L 968 137 L 968 810 L 957 851 L 926 894 L 888 919 L 852 929 L 173 929 L 123 912 L 90 885 L 66 846 L 57 807 L 57 140 L 74 85 Z M 84 39 L 55 77 L 39 128 L 39 820 L 53 867 L 80 905 L 123 935 L 165 947 L 860 947 L 902 935 L 935 914 L 970 871 L 986 818 L 986 129 L 977 92 L 950 48 L 907 15 L 852 0 L 173 0 L 125 12 Z " /><path fill="#242A2F" fill-rule="evenodd" d="M 370 772 L 371 771 L 371 768 L 373 766 L 373 765 L 375 763 L 376 763 L 377 762 L 378 762 L 379 761 L 380 761 L 381 760 L 383 760 L 384 759 L 396 759 L 397 760 L 400 760 L 401 761 L 403 761 L 404 762 L 406 762 L 407 763 L 407 774 L 406 775 L 406 776 L 400 782 L 399 782 L 398 783 L 397 783 L 396 784 L 395 784 L 394 785 L 379 785 L 378 784 L 377 784 L 371 778 L 371 776 L 370 775 Z M 872 745 L 873 744 L 873 741 L 874 740 L 874 739 L 875 738 L 875 737 L 876 736 L 876 735 L 883 728 L 885 728 L 886 727 L 888 727 L 889 726 L 897 726 L 898 727 L 900 727 L 901 728 L 903 728 L 910 735 L 910 736 L 911 737 L 911 738 L 912 739 L 912 740 L 913 741 L 913 747 L 912 748 L 873 748 L 872 747 Z M 707 708 L 707 801 L 733 801 L 733 708 Z M 885 706 L 884 707 L 881 707 L 880 708 L 878 708 L 875 710 L 873 710 L 869 713 L 866 714 L 856 724 L 854 729 L 852 731 L 852 733 L 851 734 L 851 735 L 849 738 L 849 740 L 848 741 L 848 748 L 847 749 L 847 761 L 848 762 L 848 768 L 849 769 L 849 771 L 851 774 L 851 776 L 852 777 L 853 780 L 857 785 L 857 786 L 864 793 L 865 793 L 870 797 L 871 797 L 876 800 L 879 800 L 880 801 L 882 801 L 883 802 L 887 802 L 888 803 L 904 803 L 905 802 L 908 802 L 909 801 L 912 801 L 913 800 L 915 800 L 916 799 L 923 796 L 926 793 L 927 793 L 933 787 L 933 786 L 920 774 L 918 774 L 915 777 L 914 777 L 910 780 L 909 780 L 908 781 L 906 781 L 905 782 L 900 782 L 899 783 L 893 783 L 892 782 L 887 782 L 878 776 L 878 775 L 876 773 L 876 772 L 873 768 L 873 764 L 874 763 L 938 763 L 938 745 L 937 744 L 937 741 L 936 740 L 936 738 L 935 737 L 935 734 L 934 733 L 931 726 L 929 724 L 929 723 L 927 721 L 927 720 L 919 713 L 916 712 L 914 710 L 912 710 L 909 708 L 907 708 L 906 707 L 903 707 L 902 706 Z M 826 713 L 825 713 L 822 710 L 818 708 L 813 707 L 812 706 L 798 706 L 797 707 L 794 707 L 788 710 L 785 713 L 784 713 L 779 718 L 778 720 L 777 720 L 776 719 L 776 708 L 750 708 L 750 801 L 776 801 L 776 743 L 777 742 L 777 739 L 778 737 L 784 731 L 788 730 L 789 729 L 798 729 L 804 732 L 808 737 L 809 741 L 810 742 L 810 750 L 811 751 L 811 801 L 835 801 L 836 800 L 836 735 L 835 734 L 835 729 L 832 723 L 832 721 Z M 503 706 L 495 706 L 494 707 L 492 707 L 491 708 L 490 708 L 489 709 L 488 709 L 487 710 L 486 710 L 478 718 L 478 719 L 477 720 L 477 721 L 476 722 L 476 723 L 474 726 L 473 725 L 473 708 L 448 708 L 448 801 L 472 801 L 473 800 L 473 757 L 474 756 L 474 753 L 475 752 L 475 750 L 476 749 L 476 747 L 478 745 L 478 744 L 485 737 L 486 737 L 488 735 L 490 735 L 491 734 L 494 734 L 495 733 L 500 733 L 501 732 L 503 732 Z M 355 713 L 354 714 L 355 715 L 355 717 L 356 718 L 356 720 L 357 721 L 357 723 L 359 727 L 359 730 L 361 733 L 365 731 L 369 731 L 370 730 L 372 730 L 373 729 L 377 729 L 378 728 L 392 728 L 393 729 L 395 729 L 396 730 L 398 730 L 400 731 L 405 736 L 407 740 L 407 747 L 406 748 L 404 748 L 403 747 L 400 747 L 399 746 L 396 746 L 395 745 L 388 745 L 387 744 L 380 744 L 379 745 L 373 745 L 372 746 L 365 747 L 357 751 L 350 758 L 348 762 L 347 767 L 346 768 L 346 780 L 347 781 L 348 786 L 350 790 L 352 792 L 352 793 L 353 793 L 355 795 L 355 796 L 358 797 L 362 800 L 364 800 L 365 801 L 368 801 L 369 802 L 373 802 L 374 803 L 382 803 L 383 802 L 388 802 L 389 801 L 394 800 L 398 797 L 401 796 L 401 795 L 403 794 L 406 791 L 407 792 L 407 801 L 431 801 L 431 735 L 430 734 L 430 731 L 428 728 L 428 726 L 425 722 L 425 721 L 423 719 L 423 718 L 417 713 L 416 713 L 412 710 L 409 710 L 408 709 L 406 709 L 405 708 L 402 708 L 401 707 L 395 707 L 394 706 L 386 706 L 385 707 L 376 707 L 375 708 L 371 708 L 367 710 L 364 710 L 358 713 Z M 193 708 L 193 801 L 218 801 L 218 746 L 219 745 L 219 740 L 221 736 L 226 731 L 230 729 L 240 729 L 244 731 L 249 736 L 251 741 L 251 745 L 252 746 L 252 801 L 277 801 L 277 742 L 281 734 L 289 729 L 298 729 L 303 731 L 307 735 L 310 742 L 310 800 L 311 801 L 336 801 L 336 734 L 332 720 L 322 710 L 312 706 L 297 706 L 286 710 L 273 720 L 264 710 L 254 706 L 240 706 L 230 710 L 219 721 L 218 720 L 218 708 Z M 606 702 L 634 702 L 635 703 L 638 703 L 639 704 L 642 704 L 643 705 L 644 705 L 646 707 L 647 707 L 648 708 L 649 708 L 651 710 L 652 710 L 656 714 L 656 715 L 659 718 L 659 719 L 660 720 L 660 721 L 661 722 L 661 723 L 662 724 L 662 725 L 663 726 L 663 729 L 664 730 L 664 734 L 665 735 L 665 745 L 664 746 L 664 751 L 663 752 L 663 754 L 662 755 L 662 756 L 661 757 L 661 758 L 660 759 L 660 760 L 659 761 L 659 762 L 656 765 L 656 766 L 653 769 L 652 769 L 649 772 L 648 772 L 647 773 L 646 773 L 644 775 L 641 775 L 640 776 L 638 776 L 637 777 L 634 777 L 633 778 L 606 778 L 605 777 L 605 703 Z M 516 683 L 516 707 L 515 708 L 506 708 L 506 729 L 515 729 L 516 730 L 516 775 L 517 776 L 517 783 L 518 784 L 518 787 L 520 790 L 520 792 L 523 795 L 523 796 L 524 797 L 525 797 L 528 800 L 530 800 L 531 801 L 534 801 L 535 802 L 540 802 L 541 803 L 546 803 L 547 802 L 553 802 L 554 801 L 556 801 L 557 800 L 559 800 L 564 797 L 564 777 L 561 779 L 558 779 L 557 780 L 548 780 L 547 779 L 546 779 L 544 777 L 544 776 L 542 773 L 542 730 L 543 729 L 565 729 L 565 708 L 543 708 L 542 707 L 542 683 Z M 579 679 L 579 801 L 632 801 L 633 800 L 642 800 L 643 799 L 646 799 L 647 798 L 649 798 L 650 797 L 655 796 L 656 795 L 661 793 L 663 791 L 666 790 L 669 787 L 670 787 L 681 776 L 682 773 L 684 771 L 684 770 L 688 763 L 688 761 L 689 760 L 689 758 L 690 757 L 690 754 L 691 753 L 691 749 L 692 748 L 692 731 L 691 730 L 691 726 L 690 725 L 690 723 L 689 722 L 689 720 L 688 719 L 688 716 L 687 715 L 685 710 L 683 708 L 682 705 L 678 701 L 678 700 L 671 693 L 670 693 L 665 689 L 662 688 L 660 686 L 659 686 L 658 685 L 656 685 L 651 682 L 648 682 L 647 681 L 644 681 L 643 680 L 640 680 L 639 679 Z M 124 677 L 123 678 L 113 679 L 108 682 L 106 682 L 96 690 L 92 696 L 88 706 L 88 722 L 89 723 L 89 726 L 94 735 L 98 739 L 104 742 L 106 744 L 113 746 L 116 748 L 123 749 L 130 752 L 134 752 L 140 755 L 143 755 L 150 759 L 153 763 L 153 773 L 150 775 L 149 777 L 145 779 L 142 779 L 141 780 L 129 780 L 128 779 L 119 778 L 106 771 L 100 767 L 99 765 L 84 782 L 84 784 L 88 788 L 94 792 L 109 799 L 116 800 L 117 801 L 121 801 L 122 802 L 127 802 L 128 803 L 140 803 L 141 802 L 146 802 L 151 800 L 155 800 L 166 794 L 173 787 L 175 784 L 175 782 L 177 780 L 178 773 L 179 772 L 179 758 L 178 757 L 178 753 L 172 743 L 164 737 L 158 734 L 156 734 L 151 731 L 145 730 L 138 727 L 134 727 L 133 726 L 122 723 L 117 720 L 113 714 L 113 709 L 120 701 L 122 701 L 123 700 L 139 700 L 145 703 L 150 704 L 152 706 L 162 711 L 171 699 L 175 692 L 167 686 L 159 682 L 157 682 L 150 679 L 139 678 L 138 677 Z M 706 674 L 706 696 L 733 696 L 733 673 L 707 673 Z M 598 499 L 580 499 L 580 518 L 579 519 L 540 519 L 539 520 L 539 537 L 540 538 L 598 538 Z M 641 476 L 660 476 L 661 477 L 661 478 L 662 479 L 662 481 L 661 482 L 661 497 L 659 499 L 657 499 L 656 498 L 655 499 L 654 499 L 653 498 L 652 499 L 642 499 L 641 498 L 640 498 L 639 497 L 639 478 Z M 337 438 L 337 497 L 396 497 L 396 438 Z M 701 354 L 662 354 L 661 374 L 641 375 L 641 415 L 639 417 L 621 417 L 620 437 L 600 437 L 598 435 L 598 417 L 600 415 L 619 415 L 619 375 L 600 375 L 600 395 L 580 396 L 580 476 L 598 476 L 598 458 L 600 456 L 621 457 L 621 476 L 619 478 L 600 478 L 600 497 L 621 498 L 621 538 L 639 538 L 639 519 L 658 517 L 662 520 L 662 538 L 701 538 L 701 519 L 680 518 L 680 498 L 722 496 L 721 478 L 701 477 L 700 457 L 642 458 L 639 456 L 639 437 L 641 435 L 660 435 L 661 415 L 680 415 L 681 394 L 703 395 L 703 415 L 701 417 L 683 416 L 682 435 L 722 435 L 722 375 L 702 375 Z M 580 354 L 580 373 L 598 373 L 598 354 Z M 398 354 L 398 373 L 437 373 L 437 354 Z M 357 354 L 357 373 L 376 373 L 376 354 Z M 296 354 L 296 373 L 335 373 L 335 355 L 334 354 Z M 540 310 L 539 311 L 539 329 L 557 329 L 557 310 Z M 460 310 L 459 311 L 459 329 L 477 329 L 477 310 Z M 557 249 L 539 249 L 539 268 L 537 270 L 519 270 L 519 288 L 517 290 L 499 290 L 497 288 L 497 270 L 479 270 L 479 309 L 498 309 L 499 310 L 499 329 L 517 329 L 517 310 L 518 309 L 537 309 L 537 290 L 539 288 L 557 288 Z M 499 249 L 499 267 L 517 267 L 517 249 Z M 621 229 L 621 288 L 680 288 L 680 229 Z M 337 229 L 337 288 L 396 288 L 396 229 Z M 459 208 L 459 247 L 497 247 L 497 229 L 479 229 L 477 227 L 477 208 Z M 557 187 L 519 187 L 519 247 L 537 247 L 537 228 L 538 227 L 545 227 L 546 226 L 557 226 Z M 479 187 L 479 206 L 497 206 L 497 187 Z " /></svg>
            </div>
        </div>
        <div class="text-center font-bold" style="font-size: 18px;">SmartDine Resto</div>
        <div class="text-center" style="font-size: 11px; margin-bottom: 15px;">Jl. Raya Kuliner No. 88<br>Telp: 0812-3456-7890</div>
        
        <div class="border-dashed"></div>
        
        <div class="flex-between mb-2"><span>No Pesanan:</span><span>${order.order_num || '#SD-'+order.id}</span></div>
        <div class="flex-between mb-2"><span>Meja:</span><span>${order.nomor_meja}</span></div>
        <div class="flex-between mb-2"><span>Tgl, Jam:</span><span>${tgl}, ${jam}</span></div>
        <div class="flex-between mb-2"><span>Kasir:</span><span>${adminInfo.username || 'Admin'}</span></div>
        <div class="flex-between mb-2"><span>Pelanggan:</span><span>${order.nama_pelanggan || 'Guest'}</span></div>
        
        <div class="border-dashed"></div>
        
        ${itemsHtmlStr}
        
        <div class="border-dashed"></div>
        
        <div class="flex-between mb-2">
            <span>Subtotal</span>
            <span>${rp(subtotalCalc)}</span>
        </div>
        <div class="flex-between mb-2">
            <span>Pajak (10%)</span>
            <span>${rp(taxCalc)}</span>
        </div>
        <div class="flex-between mb-2">
            <span>Layanan (5%)</span>
            <span>${rp(serviceCalc)}</span>
        </div>
        <div class="flex-between mb-2">
            <span>Metode Bayar:</span>
            <span>${order.metode_pembayaran ? order.metode_pembayaran.toUpperCase() : 'CASH'}</span>
        </div>
        
        <div class="border-dashed"></div>
        
        <div class="flex-between font-bold" style="font-size: 15px;">
            <span>TOTAL AKHIR</span>
            <span>${rp(totalAkhir)}</span>
        </div>
        
        <div class="border-dashed"></div>
        
        <div class="text-center" style="margin-top: 15px; font-size: 11px;">
            Terima kasih atas kunjungan Anda!<br>
            Powered by SmartDine System
        </div>
    `;

    // Tampilkan preview di SweetAlert
    SD_SWAL.fire({
        title: 'Preview Struk',
        html: `
            <style>
                .preview-struk { font-family: 'Courier New', Courier, monospace; font-size: 13px; padding: 15px; width: 300px; margin: 0 auto; color: #000; background: #fff; border: 1px solid #ddd; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .preview-struk .text-center { text-align: center; }
                .preview-struk .font-bold { font-weight: bold; }
                .preview-struk .border-dashed { border-bottom: 1px dashed #000; margin: 12px 0; }
                .preview-struk .flex-between { display: flex; justify-content: space-between; }
                .preview-struk .mb-2 { margin-bottom: 5px; }
            </style>
            <div class="preview-struk">
                ${receiptBody}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:text-bottom;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Cetak Struk',
        cancelButtonText: 'Batal',
        confirmButtonColor: 'var(--brand)',
        width: '400px'
    }).then((result) => {
        if (result.isConfirmed) {
            // Lanjut cetak beneran
            const printHtml = `
                <html>
                <head>
                    <title>Struk ${order.order_num}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 13px; padding: 15px; width: 300px; margin: 0 auto; color: #000; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .border-dashed { border-bottom: 1px dashed #000; margin: 12px 0; }
                        .flex-between { display: flex; justify-content: space-between; }
                        .mb-2 { margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    ${receiptBody}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500); // Beri waktu agar animasi penutupan popup induk (SweetAlert) selesai sempurna
                        };
                    </script>
                </body>
                </html>
            `;
            
            // Safeguard: Pastikan body sudah bisa di-scroll sebelum window baru memblokir thread
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.classList.remove('swal2-shown', 'swal2-height-auto');
            
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.write(printHtml);
            printWindow.document.close();
        }
    });
}

// ============================================================
