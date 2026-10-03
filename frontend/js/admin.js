// Cek Role dan Login
const sessionData = localStorage.getItem('adminSession');
if (!sessionData) {
    alert('Akses Ditolak! Anda harus login terlebih dahulu.');
    window.location.href = 'login.html';
}
const adminInfo = JSON.parse(sessionData);

const API_BASE = 'http://localhost:3000/api';
let refreshInterval = null;

function rp(num) {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
}

// Sidebar Navigation
function showAdminTab(tabId, event) {
    document.querySelectorAll('main > div[id^="atab-"]').forEach(el => { el.style.display = 'none'; });
    const target = document.getElementById('atab-' + tabId);
    if (target) target.style.display = 'block';

    if (event) {
        document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    if (tabId === 'orders') renderOrders();
    else if (tabId === 'tables') renderTables();
    else if (tabId === 'qr') renderQR();
    else if (tabId === 'menu') renderMenu();
    else if (tabId === 'add') renderKategori();

    renderStats();
}

// ============================================================
// STATISTIK DASHBOARD
// ============================================================
async function renderStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
            const data = await res.json();
            const statOrders = document.getElementById('statOrders');
            const statRevenue = document.getElementById('statRevenue');
            const statTables = document.getElementById('statTables');

            if (statOrders) statOrders.innerText = data.total_orders || 0;
            if (statRevenue) statRevenue.innerText = rp(data.total_revenue || 0);
            if (statTables) statTables.innerText = data.total_tables || 0;
        }
    } catch (e) {
        console.warn('Gagal memuat statistik:', e);
    }
}

// ============================================================
// PANTAUAN PESANAN (DAPUR & KASIR)
// ============================================================
async function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        const orders = await res.json();

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-order-state">
                    <div class="emoji">📋</div>
                    <h3>Belum Ada Pesanan Masuk</h3>
                    <p>Pesanan dari pelanggan via scan QR akan muncul otomatis di sini.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            // Status styling
            let statusBadge = '';
            let actionButtons = '';
            
            if (order.status_pesanan === 'menunggu') {
                statusBadge = '<span class="status-badge-lg badge-menunggu">⏳ MENUNGGU KONFIRMASI</span>';
                actionButtons = `
                    <button class="action-btn btn-proses" onclick="updateOrderStatus(${order.id}, 'diproses')">👨‍🍳 Proses Masak</button>
                    <button class="action-btn btn-batal" onclick="updateOrderStatus(${order.id}, 'dibatalkan')">❌ Batalkan</button>
                `;
            } else if (order.status_pesanan === 'diproses') {
                statusBadge = '<span class="status-badge-lg badge-diproses">🍳 SEDANG DIMASAK</span>';
                actionButtons = `
                    <button class="action-btn btn-selesai" onclick="updateOrderStatus(${order.id}, 'selesai')">✅ Selesai & Antar</button>
                    <button class="action-btn btn-batal" onclick="updateOrderStatus(${order.id}, 'dibatalkan')">❌ Batalkan</button>
                `;
            } else if (order.status_pesanan === 'selesai') {
                statusBadge = '<span class="status-badge-lg badge-selesai">✅ SELESAI</span>';
                actionButtons = `<span class="text-status-selesai">Pesanan telah disajikan</span>`;
            } else if (order.status_pesanan === 'dibatalkan') {
                statusBadge = '<span class="status-badge-lg badge-dibatalkan">❌ DIBATALKAN</span>';
                actionButtons = `<span class="text-status-batal">Pesanan dibatalkan</span>`;
            }

            // Render list items
            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(it => `
                    <div class="order-item-row">
                        <span><strong>${it.kuantitas}x</strong> ${it.nama_menu}</span>
                        <span class="order-item-price">${rp(it.subtotal)}</span>
                    </div>
                `).join('')
                : '<div class="order-no-items">Tidak ada rincian item</div>';

            const catatanHtml = order.catatan 
                ? `<div class="order-notes">
                    <strong>Catatan:</strong> ${order.catatan}
                   </div>`
                : '';

            return `
                <div class="order-admin-card" style="margin-bottom:18px;">
                    <div class="oac-header-inner">
                        <div>
                            <span class="order-number">${order.order_num || '#SD-' + order.id}</span>
                            <span class="table-badge">📍 Meja ${order.nomor_meja}</span>
                            <div class="order-meta">
                                Pemesan: <strong>${order.nama_pelanggan || 'Pelanggan'}</strong> · ${waktu} · Bayar: <span class="order-pay-method">${order.metode_pembayaran}</span>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>

                    ${catatanHtml}

                    <div class="order-item-list">
                        ${itemsHtml}
                        <div class="order-total-row">
                            <span>Total Tagihan:</span>
                            <span class="order-total-amount">${rp(order.total_harga)}</span>
                        </div>
                    </div>

                    <div class="order-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error saat render pesanan:', error);
        container.innerHTML = `<div class="error-msg">Gagal memuat pesanan dari server Node.js. Pastikan server backend sedang berjalan.</div>`;
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
            renderTables();
        } else {
            alert('Gagal update status: ' + data.message);
        }
    } catch (error) {
        console.error('Error update order status:', error);
        alert('Gagal terhubung ke server.');
    }
}

// ============================================================
// MANAJEMEN MEJA & STATUS
// ============================================================
async function renderTables() {
    try {
        const response = await fetch(`${API_BASE}/meja`);
        const TABLE_DATA = await response.json();
        const statTables = document.getElementById('statTables');
        if (statTables) statTables.innerText = TABLE_DATA.length;

        const container = document.getElementById('tablesContainer');
        if (!container) return;

        container.innerHTML = TABLE_DATA.map(t => {
            const isAvailable = t.status === 'kosong';
            const badgeClass = isAvailable ? 'avail' : 'occ';
            const statusText = t.status.toUpperCase();
            return `
            <div class="card-box">
                <div class="emoji-box">🪑</div>
                <div class="info-box">
                    <strong style="font-size:1.1rem">Meja ${t.nomor_meja}</strong><br/>
                    <span class="status-badge ${badgeClass} menu-status-badge" onclick="toggleStatus(${t.id}, '${t.status}')" title="Klik untuk ubah status">${statusText} 🔄</span>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error renderTables:', error);
    }
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'kosong' ? 'terisi' : 'kosong';
    try {
        const response = await fetch(`${API_BASE}/meja/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
            renderTables();
            renderStats();
        }
    } catch (error) {
        console.error('Error toggleStatus:', error);
    }
}

async function addTableItem() {
    const nomor = document.getElementById('newTableNo').value.trim();
    const status = document.getElementById('newTableStatus').value;
    if (!nomor) return alert('Nomor meja tidak boleh kosong!');

    try {
        const response = await fetch(`${API_BASE}/meja`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomor_meja: nomor, status: status })
        });
        const result = await response.json();
        if (result.success) {
            alert('Meja berhasil ditambahkan!');
            document.getElementById('newTableNo').value = ''; 
            document.getElementById('newTableStatus').value = 'kosong'; 
            showAdminTab('tables'); 
        }
    } catch (error) {
        console.error('Error addTableItem:', error);
    }
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
            <div class="qr-wrapper">
                <h3>Meja ${t.nomor_meja}</h3>
                <img src="${qrImageUrl}" alt="QR Meja ${t.nomor_meja}" class="qr-canvas">
                <small class="qr-url-text">pelanggan.html?table=${t.nomor_meja}</small>
                <div class="qr-btn-group">
                    <button class="action-btn btn-qr-cetak" onclick="window.open('${qrImageUrl}', '_blank')">Cetak QR</button>
                    <button class="action-btn btn-qr-test" onclick="window.open('${customerUrl}', '_blank')" title="Uji Tampilan Pelanggan">Buka Menu</button>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error renderQR:', error);
    }
}

// ============================================================
// MANAJEMEN MENU & KATEGORI
// ============================================================
async function renderMenu() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        const MENU_DATA = await response.json();
        const grid = document.getElementById('adminMenuGrid');
        if (!grid) return;

        grid.innerHTML = MENU_DATA.map(m => {
            const isAvail = m.is_available === 1;
            const badgeClass = isAvail ? 'avail' : 'occ';
            const statusText = isAvail ? 'TERSEDIA' : 'HABIS';

            const visualBox = m.gambar 
                ? `<img src="http://localhost:3000/${m.gambar}" alt="${m.nama_menu}" class="menu-img" />`
                : `<div class="emoji-box">🍽️</div>`;

            return `
            <div class="card-box">
                ${visualBox}
                <div class="info-box">
                    <strong style="font-size:1.1rem">${m.nama_menu}</strong><br/>
                    <small class="menu-meta">Kategori: ${m.nama_kategori || 'Kategori ' + m.kategori_id} | ${rp(m.harga)}</small>
                    <span class="status-badge ${badgeClass} menu-status-badge" onclick="toggleMenuStatus(${m.id}, ${m.is_available})" title="Klik untuk ubah ketersediaan">${statusText} 🔄</span>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error renderMenu:', error);
    }
}

function previewMenuImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';
    }
}

async function toggleMenuStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
        const response = await fetch(`${API_BASE}/menu/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: newStatus })
        });
        const data = await response.json();
        if (data.success) renderMenu(); 
    } catch (error) {
        console.error('Error toggleMenuStatus:', error);
    }
}

async function addMenuItem() {
    const kategori_id = document.getElementById('newKategoriId').value;
    const nama_menu = document.getElementById('newName').value.trim();
    const harga = document.getElementById('newPrice').value;
    const imageInput = document.getElementById('newImage');
    const imageFile = imageInput && imageInput.files ? imageInput.files[0] : null;

    if (!kategori_id || !nama_menu || !harga) return alert('Kategori, nama menu, dan harga harus diisi!');

    const formData = new FormData();
    formData.append('kategori_id', kategori_id);
    formData.append('nama_menu', nama_menu);
    formData.append('harga', harga);
    if (imageFile) {
        formData.append('gambar', imageFile);
    }

    try {
        const response = await fetch(`${API_BASE}/menu`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            alert('Menu berhasil ditambahkan!');
            document.getElementById('newKategoriId').value = '';
            document.getElementById('newName').value = '';
            document.getElementById('newPrice').value = '';
            if (imageInput) imageInput.value = '';
            const previewContainer = document.getElementById('imagePreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
            showAdminTab('menu'); 
        } else {
            alert('Gagal menyimpan menu: ' + (result.message || ''));
        }
    } catch (error) {
        console.error('Error addMenuItem:', error);
        alert('Gagal menyimpan menu. Pastikan server berjalan.');
    }
}

async function renderKategori() {
    try {
        const response = await fetch(`${API_BASE}/kategori`);
        const KATEGORI_DATA = await response.json();
        const selectKategori = document.getElementById('newKategoriId');
        if (!selectKategori) return;

        selectKategori.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>' + 
            KATEGORI_DATA.map(k => `<option value="${k.id}">${k.nama_kategori}</option>`).join('');
    } catch (error) {
        console.error('Error renderKategori:', error);
    }
}

// Logout
function logoutAdmin() {
    if (refreshInterval) clearInterval(refreshInterval);
    localStorage.removeItem('adminSession');
    alert('Anda telah keluar.');
    window.location.href = 'index.html';
}

// Inisialisasi awal saat Admin Dashboard dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Hak akses role
    if (adminInfo.peran === 'dapur') {
        const navAddTable = document.getElementById('nav-addtable');
        const navAddMenu = document.getElementById('nav-addmenu');
        if (navAddTable) navAddTable.style.display = 'none';
        if (navAddMenu) navAddMenu.style.display = 'none';
        const roleSub = document.getElementById('roleSubtitle');
        if (roleSub) roleSub.innerText = 'Panel Kasir / Dapur';
    } else {
        const roleSub = document.getElementById('roleSubtitle');
        if (roleSub) roleSub.innerText = 'Panel Admin Khusus';
    }

    renderOrders();
    renderTables();
    renderStats();
    renderKategori();

    // Auto-refresh daftar pesanan & statistik setiap 8 detik untuk dapur/kasir
    refreshInterval = setInterval(() => {
        const ordersTab = document.getElementById('atab-orders');
        if (ordersTab && ordersTab.style.display !== 'none') {
            renderOrders();
            renderStats();
        }
    }, 8000);
});