// Cek Role dan Login
const sessionData = localStorage.getItem('adminSession');
if (!sessionData) {
    window.location.href = 'login.html';
}
const adminInfo = JSON.parse(sessionData);

const API_BASE = window.location.protocol + '//' + window.location.hostname + ':3000/api';
const SERVER_URL = window.location.protocol + '//' + window.location.hostname + ':3000/';
let refreshInterval = null;

// ============================================================
// SWEETALERT2 – SmartDine Branded Helpers
// ============================================================
const SD_SWAL = Swal.mixin({
    customClass: {
        popup: 'sd-swal-popup',
        confirmButton: 'sd-swal-confirm',
        cancelButton: 'sd-swal-cancel',
        title: 'sd-swal-title',
    },
    buttonsStyling: false,
});

function sd_alert(title, text, icon = 'info') {
    return SD_SWAL.fire({ title, text, icon, confirmButtonText: 'OK' });
}

function sd_success(title, text) {
    return SD_SWAL.fire({ title, text, icon: 'success', confirmButtonText: 'OK', timer: 2500, timerProgressBar: true });
}

function sd_error(title, text) {
    return SD_SWAL.fire({ title, text, icon: 'error', confirmButtonText: 'Tutup' });
}

function sd_confirm(title, text, confirmText = 'Ya, Hapus!') {
    return SD_SWAL.fire({
        title, text, icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Batal',
        reverseButtons: true,
    });
}

function sd_toast(title, icon = 'success') {
    Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2500, timerProgressBar: true });
}

function rp(num) {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
}

// Sidebar Navigation
function showAdminTab(tabId, event) {
    document.querySelectorAll('.admin-content > div[id^="atab-"]').forEach(el => { el.style.display = 'none'; });
    const target = document.getElementById('atab-' + tabId);
    if (target) {
        target.style.display = 'block';
        target.classList.remove('fade-in');
        void target.offsetWidth;
        target.classList.add('fade-in');
    }

    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const navTarget = document.getElementById('nav-' + tabId);
    if (navTarget) navTarget.classList.add('active');

    sessionStorage.setItem('adminActiveTab', tabId);
    if (typeof _patchTabUI === 'function') _patchTabUI(tabId);

    if (tabId === 'orders') renderOrders();
    else if (tabId === 'history') renderHistory();
    else if (tabId === 'tables') renderTables();
    else if (tabId === 'qr') renderQR();
    else if (tabId === 'menu') renderMenu();
    else if (tabId === 'add') renderKategori();

    renderStats();
}

// ============================================================
// NOTIFICATION BELL SYSTEM
// ============================================================
let seenOrderIds = new Set(JSON.parse(sessionStorage.getItem('seenOrderIds') || '[]'));
let notifOrders = [];

function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.toggle('open');
}

function closeNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('open');
}

document.addEventListener('click', (e) => {
    const bell = document.getElementById('notifBell');
    const panel = document.getElementById('notifPanel');
    if (!bell || !panel) return;
    if (!bell.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove('open');
    }
});

function markAllRead() {
    notifOrders.forEach(o => seenOrderIds.add(o.id));
    sessionStorage.setItem('seenOrderIds', JSON.stringify([...seenOrderIds]));
    renderNotifPanel(notifOrders);
    const dot = document.getElementById('notifDot');
    const cnt = document.getElementById('notifCount');
    if (dot) dot.style.display = 'none';
    if (cnt) cnt.style.display = 'none';
}

function renderNotifPanel(orders) {
    const body = document.getElementById('notifPanelBody');
    if (!body) return;
    const active = orders.filter(o => o.status_pesanan === 'menunggu' || o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan');
    if (active.length === 0) {
        body.innerHTML = '<div class="notif-empty">🎉 Tidak ada pesanan aktif saat ini</div>';
        return;
    }
    body.innerHTML = active.map(o => {
        const isUnread = !seenOrderIds.has(o.id);
        const waktu = new Date(o.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const icon = o.status_pesanan === 'menunggu' ? '⏳' : (o.status_pesanan === 'diproses' ? '🍳' : '🍽️');
        const iconClass = o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan' ? 'diproses' : '';
        
        let statusLabel = 'Menunggu konfirmasi';
        if (o.status_pesanan === 'diproses') statusLabel = 'Sedang dimasak di dapur';
        else if (o.status_pesanan === 'dihidangkan') statusLabel = 'Pesanan siap dihidangkan';

        return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="showAdminTab('orders'); closeNotifPanel();">
            <div class="notif-item-icon ${iconClass}">${icon}</div>
            <div class="notif-item-body">
                <div class="notif-item-title">${o.order_num || '#SD-' + o.id} · Meja ${o.nomor_meja}</div>
                <div class="notif-item-sub">${o.nama_pelanggan || 'Pelanggan'} · ${statusLabel}</div>
                <div class="notif-item-time">🕐 ${waktu} · ${rp(o.total_harga)}</div>
            </div>
        </div>`;
    }).join('');
}

async function pollNotifications() {
    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        if (!res.ok) return;
        const allOrders = await res.json();
        const active = allOrders.filter(o => o.status_pesanan === 'menunggu' || o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan');
        notifOrders = active;

        const newOrders = active.filter(o => !seenOrderIds.has(o.id));
        const unreadCount = newOrders.length;

        const dot = document.getElementById('notifDot');
        const cnt = document.getElementById('notifCount');
        if (unreadCount > 0) {
            if (dot) dot.style.display = 'block';
            if (cnt) { cnt.textContent = unreadCount > 9 ? '9+' : unreadCount; cnt.style.display = 'flex'; }
            if (newOrders.length > 0) {
                newOrders.forEach(o => seenOrderIds.add(o.id));
                sessionStorage.setItem('seenOrderIds', JSON.stringify([...seenOrderIds]));
            }
        } else {
            if (dot) dot.style.display = 'none';
            if (cnt) cnt.style.display = 'none';
        }
        renderNotifPanel(active);
    } catch(e) {}
}

// ============================================================
// STATISTIK & PESANAN
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
            if (statMenu) statMenu.innerText = data.total_menu || 0;
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
                    <div class="empty-icon">📋</div>
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
                statusBadge = '<span class="status-badge badge-menunggu">⏳ MENUNGGU</span>';
                actionButtons = `
                    <button class="action-btn btn-info" onclick="updateOrderStatus(${order.id}, 'diproses')">👨‍🍳 Proses Masak</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')">❌ Batalkan</button>
                `;
            } else if (order.status_pesanan === 'diproses') {
                statusBadge = '<span class="status-badge badge-diproses">🍳 DIMASAK</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'dihidangkan')">🍽️ Siap Dihidangkan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')">❌ Batalkan</button>
                `;
            } else if (order.status_pesanan === 'dihidangkan') {
                statusBadge = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">💸 Belum dibayar</span>';
                actionButtons = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'selesai')">✅ Selesai</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')">❌ Batalkan</button>
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

            const catatanHtml = order.catatan ? `<div class="oac-note">📝 <span><strong>Catatan:</strong> ${order.catatan}</span></div>` : '';

            return `
                <div class="order-admin-card status-${order.status_pesanan}">
                    <div class="oac-header">
                        <div>
                            <div class="oac-order-num">${order.order_num || '#SD-' + order.id}</div>
                            <div class="oac-meta">
                                <span class="oac-meta-chip">📍 Meja ${order.nomor_meja}</span>
                                <span class="oac-meta-chip">👤 ${order.nama_pelanggan || 'Pelanggan'}</span>
                                <span class="oac-meta-chip">🕐 ${waktu}</span>
                                <span class="oac-meta-chip">💳 ${order.metode_pembayaran?.toUpperCase()}</span>
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

async function renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        const allOrders = await res.json();
        const orders = allOrders.filter(o => o.status_pesanan === 'selesai' || o.status_pesanan === 'dibatalkan');

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-title">Belum Ada Riwayat</div><div class="empty-sub">Pesanan yang selesai atau dibatalkan akan muncul di sini.</div></div>`;
            return;
        }

        container.innerHTML = orders.map(order => {
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = order.status_pesanan === 'selesai' 
                ? '<span class="status-badge badge-selesai">✅ SELESAI</span>'
                : '<span class="status-badge badge-dibatalkan">❌ DIBATALKAN</span>';

            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(it => `<div class="oac-item-row"><div class="oac-item-name"><div class="oac-item-qty">${it.kuantitas}</div>${it.nama_menu}</div><div class="oac-item-price">${rp(it.subtotal)}</div></div>`).join('')
                : '';

            return `
                <div class="order-admin-card">
                    <div class="oac-header">
                        <div>
                            <div class="oac-order-num">${order.order_num || '#SD-' + order.id}</div>
                            <div class="oac-meta">
                                <span class="oac-meta-chip">📍 Meja ${order.nomor_meja}</span>
                                <span class="oac-meta-chip">👤 ${order.nama_pelanggan || 'Pelanggan'}</span>
                                <span class="oac-meta-chip">🕐 ${waktu}</span>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="oac-items">${itemsHtml}
                        <div class="oac-total-row"><span>Total</span><span class="oac-grand">${rp(order.total_harga)}</span></div>
                    </div>
                </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/pesanan/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_pesanan: newStatus })
        });
        const data = await response.json();
        if (data.success) { renderOrders(); renderStats(); }
    } catch (error) { console.error(error); }
}

// ============================================================
// MANAJEMEN MEJA, QR & MENU
// ============================================================
async function renderTables() {
    try {
        const response = await fetch(`${API_BASE}/meja`);
        const TABLE_DATA = await response.json();
        const container = document.getElementById('tablesContainer');
        if (!container) return;

        container.innerHTML = TABLE_DATA.map(t => {
            const isAvailable = t.status === 'kosong';
            return `
            <div class="table-card ${t.status}">
                <div class="table-card-icon">${isAvailable ? '🪑' : '👥'}</div>
                <div class="table-card-num">Meja ${t.nomor_meja}</div>
                <div class="table-badge-wrap">
                    <span class="status-badge ${isAvailable ? 'avail' : 'occ'}" style="cursor:pointer;" onclick="toggleStatus(${t.id}, '${t.status}')">${isAvailable ? '✅ Kosong' : '🔴 Terisi'}</span>
                </div>
                <div class="table-card-actions">
                    <button class="action-btn btn-ghost btn-sm" onclick="toggleStatus(${t.id}, '${t.status}')">🔄 Ubah</button>
                    <button class="action-btn btn-danger btn-sm" onclick="deleteTable(${t.id})">🗑 Hapus</button>
                </div>
            </div>`;
        }).join('');
    } catch (error) { console.error(error); }
}

async function deleteTable(id) {
    const result = await sd_confirm('Hapus Meja?', 'Tindakan ini tidak dapat dibatalkan.');
    if (!result.isConfirmed) return;
    try {
        const res = await fetch(`${API_BASE}/meja/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { renderTables(); renderStats(); renderQR(); }
    } catch (e) { console.error(e); }
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'kosong' ? 'terisi' : 'kosong';
    try {
        await fetch(`${API_BASE}/meja/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        renderTables(); renderStats();
    } catch (error) { console.error(error); }
}

async function addTableItem() {
    const nomor = document.getElementById('newTableNo').value.trim();
    const status = document.getElementById('newTableStatus').value;
    if (!nomor) { sd_alert('Peringatan', 'Nomor meja tidak boleh kosong!', 'warning'); return; }

    try {
        const res = await fetch(`${API_BASE}/meja`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomor_meja: nomor, status })
        });
        const result = await res.json();
        if (result.success) {
            sd_toast('Meja berhasil ditambahkan!');
            document.getElementById('newTableNo').value = '';
            showAdminTab('tables');
        }
    } catch (e) { console.error(e); }
}

async function renderQR() {
    try {
        const response = await fetch(`${API_BASE}/meja`);
        const TABLE_DATA = await response.json();
        const container = document.getElementById('qrContainer');
        if (!container) return;

        container.innerHTML = TABLE_DATA.map(t => {
            const customerUrl = `${window.location.origin}/frontend/pelanggan.html?table=${t.nomor_meja}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(customerUrl)}`;
            return `
            <div class="qr-premium-card">
                <div class="qr-card-top">
                    <div class="qr-brand-badge">🍽️ SmartDine</div>
                    <div class="qr-table-label">Meja ${t.nomor_meja}</div>
                    <div class="qr-scan-hint">📱 Scan untuk memesan</div>
                </div>
                <div class="qr-img-wrap"><img src="${qrImageUrl}" class="qr-img-main" loading="lazy"></div>
                <div class="qr-card-bottom">
                    <div class="qr-url-text">pelanggan.html?table=${t.nomor_meja}</div>
                    <div class="qr-card-actions">
                        <button class="action-btn btn-primary" onclick="window.open('${qrImageUrl}', '_blank')">🖨️ Cetak</button>
                        <button class="action-btn btn-ghost" onclick="window.open('${customerUrl}', '_blank')">👁 Preview</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function renderMenu() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        const MENU_DATA = await response.json();
        const grid = document.getElementById('adminMenuGrid');
        if (!grid) return;

        grid.innerHTML = MENU_DATA.map(m => {
            const isAvail = m.is_available === 1;
            const visualBox = m.gambar 
                ? `<img src="${SERVER_URL}${m.gambar}" class="menu-card-img" />`
                : `<div class="menu-card-img">🍽️</div>`;

            return `
            <div class="menu-card">
                ${visualBox}
                <div class="menu-card-body">
                    <div class="menu-card-title">${m.nama_menu}</div>
                    <div class="menu-card-cat">${m.nama_kategori || 'Kategori ' + m.kategori_id}</div>
                    <div class="menu-card-price">${rp(m.harga)}</div>
                    <div class="menu-card-footer">
                        <span class="status-badge ${isAvail ? 'avail' : 'occ'}" style="cursor:pointer;" onclick="toggleMenuStatus(${m.id}, ${m.is_available})">${isAvail ? 'TERSEDIA' : 'HABIS'} 🔄</span>
                        <div class="menu-card-actions">
                            <button onclick="editMenu(${m.id})" class="action-btn btn-ghost btn-sm">✏️</button>
                            <button onclick="deleteMenu(${m.id})" class="action-btn btn-danger btn-sm">🗑</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

function setMenuView(view) {
    const grid = document.getElementById('adminMenuGrid');
    if (!grid) return;
    if (view === 'grid') grid.className = 'menu-card-grid';
    else grid.className = 'menu-card-grid list-mode';
}

async function deleteMenu(id) {
    const res = await sd_confirm('Hapus Menu?', 'Menu akan dihapus permanen.');
    if (!res.isConfirmed) return;
    try {
        await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
        renderMenu(); renderStats();
    } catch (e) { console.error(e); }
}

async function toggleMenuStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
        await fetch(`${API_BASE}/menu/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: newStatus })
        });
        renderMenu();
    } catch (e) { console.error(e); }
}

let _allKategoriCache = [];
async function editMenu(id) {
    const msgEl = document.getElementById('editMenuMsg');
    if (msgEl) msgEl.textContent = '';
    const imgBox = document.getElementById('editImgPreviewBox');
    if (imgBox) imgBox.innerHTML = '';

    try {
        const resMenu = await fetch(`${API_BASE}/menu`);
        const menus = await resMenu.json();
        const m = menus.find(x => x.id === id);
        if (!m) { sd_error('Tidak Ditemukan', 'Data menu tidak ditemukan.'); return; }

        const resKat = await fetch(`${API_BASE}/kategori`);
        _allKategoriCache = await resKat.json();
        const editKatSel = document.getElementById('editKategoriId');
        if (editKatSel) {
            editKatSel.innerHTML = _allKategoriCache.map(k =>
                `<option value="${k.id}" ${k.id === m.kategori_id ? 'selected' : ''}>${k.nama_kategori}</option>`
            ).join('');
        }

        document.getElementById('editMenuId').value = m.id;
        document.getElementById('editNamaMenu').value = m.nama_menu;
        document.getElementById('editHarga').value = m.harga;
        document.getElementById('editDeskripsi').value = m.deskripsi || '';

        if (imgBox && m.gambar) {
            imgBox.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:.75rem; color:var(--grey); margin-bottom:6px;">Foto saat ini:</div>
                    <img src="${SERVER_URL}${m.gambar}" style="width:80px; height:80px; object-fit:cover; border-radius:10px; border:2px solid var(--border);"/>
                </div>
            `;
        }

        const modal = document.getElementById('editMenuModal');
        if (modal) modal.style.display = 'flex';
    } catch (e) {
        sd_error('Gagal Memuat', 'Data menu tidak dapat dimuat.');
    }
}

function previewEditImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const box = document.getElementById('editImgPreviewBox');
        if (!box) return;
        const existing = box.querySelector('.new-preview');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.className = 'new-preview';
        div.style.cssText = 'text-align:center;';
        div.innerHTML = `
            <div style="font-size:.75rem; color:var(--success); margin-bottom:6px;">Foto baru:</div>
            <img src="${e.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:10px; border:2px solid var(--success);"/>
        `;
        box.appendChild(div);
    };
    reader.readAsDataURL(file);
}

async function saveEditMenu() {
    const id = document.getElementById('editMenuId').value;
    const kategori_id = document.getElementById('editKategoriId').value;
    const nama_menu = document.getElementById('editNamaMenu').value.trim();
    const harga = document.getElementById('editHarga').value;
    const deskripsi = document.getElementById('editDeskripsi').value.trim();
    const gambarFile = document.getElementById('editGambar').files[0];
    const msgEl = document.getElementById('editMenuMsg');

    if (!nama_menu || !harga) {
        if (msgEl) { msgEl.textContent = '⚠️ Nama menu dan harga wajib diisi!'; }
        return;
    }

    const formData = new FormData();
    formData.append('kategori_id', kategori_id);
    formData.append('nama_menu', nama_menu);
    formData.append('harga', harga);
    formData.append('deskripsi', deskripsi);
    if (gambarFile) formData.append('gambar', gambarFile);

    try {
        const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'PUT', body: formData });
        const data = await res.json();
        if (data.success) {
            if (msgEl) { msgEl.style.color = '#10b981'; msgEl.textContent = '✅ ' + data.message; }
            setTimeout(() => {
                closeEditModal();
                renderMenu();
            }, 800);
        } else {
            if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.textContent = '⚠️ ' + data.message; }
        }
    } catch (e) {
        if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.textContent = '⚠️ Gagal terhubung ke server.'; }
    }
}

function closeEditModal() {
    const modal = document.getElementById('editMenuModal');
    if (modal) modal.style.display = 'none';
}

function previewMenuImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImg) previewImg.src = e.target.result;
            if (previewContainer) previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';
    }
}

async function addMenuItem() {
    const kategori_id = document.getElementById('newKategoriId').value;
    const nama_menu = document.getElementById('newName').value.trim();
    const harga = document.getElementById('newPrice').value;
    const imageFile = document.getElementById('newImage')?.files[0];

    if (!kategori_id || !nama_menu || !harga) { sd_alert('Peringatan', 'Lengkapi form!', 'warning'); return; }

    const formData = new FormData();
    formData.append('kategori_id', kategori_id);
    formData.append('nama_menu', nama_menu);
    formData.append('harga', harga);
    if (imageFile) formData.append('gambar', imageFile);

    try {
        const res = await fetch(`${API_BASE}/menu`, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            sd_toast('Menu berhasil ditambahkan!');
            document.getElementById('newKategoriId').value = '';
            document.getElementById('newName').value = '';
            document.getElementById('newPrice').value = '';
            const previewContainer = document.getElementById('imagePreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
            showAdminTab('menu');
        }
    } catch (e) { console.error(e); }
}

async function renderKategori() {
    try {
        const res = await fetch(`${API_BASE}/kategori`);
        const data = await res.json();
        const select = document.getElementById('newKategoriId');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>' + 
                data.map(k => `<option value="${k.id}">${k.nama_kategori}</option>`).join('');
        }
    } catch (e) { console.error(e); }
}

function logoutAdmin() {
    sd_confirm('Keluar Sistem?', 'Anda akan keluar dari dashboard admin.', '🚪 Keluar').then(res => {
        if (res.isConfirmed) {
            if (refreshInterval) clearInterval(refreshInterval);
            localStorage.removeItem('adminSession');
            window.location.href = 'index.html';
        }
    });
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const usernameEl = document.getElementById('sidebarUsername');
    const roleEl = document.getElementById('sidebarRole');
    const avatarEl = document.getElementById('sidebarAvatarLetter');
    if (usernameEl) usernameEl.textContent = adminInfo.username || 'Admin';
    if (avatarEl) avatarEl.textContent = (adminInfo.username || 'A')[0].toUpperCase();
    if (roleEl) roleEl.textContent = adminInfo.peran === 'dapur' ? 'Kasir / Dapur' : 'Administrator';

    const savedTab = sessionStorage.getItem('adminActiveTab') || 'orders';
    showAdminTab(savedTab);
    renderStats();
    pollNotifications();

    refreshInterval = setInterval(() => {
        pollNotifications();
        const ordersTab = document.getElementById('atab-orders');
        if (ordersTab && ordersTab.style.display !== 'none') {
            renderOrders();
            renderStats();
        }
    }, 8000);
});