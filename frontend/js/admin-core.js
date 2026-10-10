// Cek Role dan Login
const sessionData = localStorage.getItem('adminSession');
if (!sessionData) {
    window.location.href = 'login.html';
}
const adminInfo = JSON.parse(sessionData);

const API_BASE = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000/';
let refreshInterval = null;
let currentPageHistory = 1;
let currentPageRekap = 1;
const itemsPerPage = 10;

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
    else if (tabId === 'rekap') renderRekapHarian(); // <--- TAMBAHAN INI
    else if (tabId === 'tables') renderTables();
    else if (tabId === 'menu') renderMenu();

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
        body.innerHTML = '<div class="notif-empty">Tidak ada pesanan aktif saat ini</div>';
        return;
    }
    body.innerHTML = active.map(o => {
        const isUnread = !seenOrderIds.has(o.id);
        const waktu = new Date(o.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const icon = o.status_pesanan === 'menunggu' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M12 2v20"></path><path d="M8 2h8"></path><path d="M8 22h8"></path><path d="M15 16a3 3 0 0 0-3-3 3 3 0 0 0-3 3v6h6z"></path><path d="M15 8a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2h6z"></path></svg>' : (o.status_pesanan === 'diproses' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>');
        const iconClass = o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan' ? 'diproses' : '';
        
        let statusLabel = 'Menunggu konfirmasi';
        if (o.status_pesanan === 'diproses') statusLabel = 'Sedang dimasak di dapur';
        else if (o.status_pesanan === 'dihidangkan') statusLabel = 'Pesanan siap dihidangkan';

        return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="showAdminTab('orders'); closeNotifPanel();">
            <div class="notif-item-icon ${iconClass}">${icon}</div>
            <div class="notif-item-body">
                <div class="notif-item-title">${o.order_num} · Meja ${o.nomor_meja}</div>
                <div class="notif-item-sub">${o.nama_pelanggan || 'Pelanggan'} · ${statusLabel}</div>
                <div class="notif-item-time"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${waktu} · ${rp(o.total_harga)}</div>
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


// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const usernameEl = document.getElementById('sidebarUsername');
    const roleEl = document.getElementById('sidebarRole');
    if (usernameEl) usernameEl.textContent = adminInfo.username || 'Admin';
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

/// ============================================================
