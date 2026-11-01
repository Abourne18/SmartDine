// ============================================================
// PELANGGAN CORE - Konfigurasi, Variabel Global & Inisialisasi Meja
// ============================================================

const API_BASE = '/api';
const ASSET_BASE = '';

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table') || urlParams.get('meja') || '01';

let allMenuItems = [];
let cart = {}; 
let currentCategory = 'all';

let activeOrders = []; 
let orderPollingTimer = null; 
let cancelTimerInterval = null; 

// Variabel untuk mode "Pesan Lagi" (Gabung Pesanan)
let appendToOrderId = null;
let appendToOrderNum = null;

function rp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function formatOrderId(id) {
  return 'SD-' + String(id || 0).padStart(4, '0');
}

document.addEventListener('DOMContentLoaded', async () => {
  let isTableValid = false;

  try {
    const resMeja = await fetch(`${API_BASE}/meja`);
    if (resMeja.ok) {
      const tables = await resMeja.json();
      const currentTable = tables.find(t => String(t.nomor_meja) === String(tableNumber));
      
      if (currentTable) {
        // Cek apakah meja sudah berstatus 'terisi' di server dan perangkat ini belum pernah memakainya
        const activeDeviceTable = localStorage.getItem('smartdine_current_table');
        
        if (currentTable.status === 'terisi' && activeDeviceTable !== String(tableNumber)) {
          // Cek apakah perangkat ini punya pesanan aktif di meja tersebut
          const savedOrders = localStorage.getItem(`smartdine_active_orders_${tableNumber}`);
          if (!savedOrders) {
            alert(`Maaf, Meja ${tableNumber} sedang digunakan oleh perangkat/pelanggan lain.`);
            window.location.href = 'index.html';
            return;
          }
        }

        isTableValid = true;
        // Tandai perangkat ini sedang aktif di meja tersebut
        localStorage.setItem('smartdine_current_table', String(tableNumber));

        await fetch(`${API_BASE}/meja/${currentTable.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'terisi' })
        });
      }
    }
  } catch (e) {
    console.warn('Gagal memverifikasi meja:', e);
  }

  // Jika meja tidak valid/tidak terdaftar, langsung lempar kembali ke index.html
  if (!isTableValid) {
    alert(`Nomor meja "${tableNumber}" tidak terdaftar dalam sistem. Anda akan dialihkan ke halaman utama.`);
    window.location.href = 'index.html';
    return;
  }

  const labelMeja1 = document.getElementById('headerTableLabel');
  const labelMeja2 = document.getElementById('subTableLabel');
  if (labelMeja1) labelMeja1.textContent = `Meja ${tableNumber}`;
  if (labelMeja2) labelMeja2.textContent = `Meja ${tableNumber}`;

  // Panggil fungsi dari modul lain jika sudah tersedia
  if (typeof loadCategories === 'function') loadCategories();
  if (typeof loadMenu === 'function') loadMenu();

  // Menggunakan key localStorage spesifik per nomor meja
  const savedOrdersStr = localStorage.getItem(`smartdine_active_orders_${tableNumber}`);
  if (savedOrdersStr) {
    try {
      activeOrders = JSON.parse(savedOrdersStr);
      if (Array.isArray(activeOrders) && activeOrders.length > 0) {
        if (typeof syncAndShowActiveOrders === 'function') syncAndShowActiveOrders();
      }
    } catch (e) {
      console.warn('Gagal membaca pesanan aktif:', e);
    }
  }
});