// SmartDine - Pelanggan

const API_BASE = 'http://localhost:3000/api';
const ASSET_BASE = 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table') || '01';

let allMenuItems = [];
let cart = {}; 
let currentCategory = 'all';

let activeOrders = []; 
let orderPollingTimer = null; 

function rp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('headerTableLabel').textContent = `Meja ${tableNumber}`;
  document.getElementById('subTableLabel').textContent = `Meja ${tableNumber}`;

  // === OTOMATIS UBAH STATUS MEJA JADI 'terisi' SAAT HALAMAN PELANGGAN DIBUKA ===
  try {
    const resMeja = await fetch(`${API_BASE}/meja`);
    if (resMeja.ok) {
      const tables = await resMeja.json();
      const currentTable = tables.find(t => String(t.nomor_meja) === String(tableNumber));
      if (currentTable) {
        await fetch(`${API_BASE}/meja/${currentTable.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'terisi' })
        });
      }
    }
  } catch (e) {
    console.warn('Gagal memperbarui status meja:', e);
  }
  // ===========================================================================

  loadCategories();
  loadMenu();

  const savedOrdersStr = localStorage.getItem('smartdine_active_orders');
  if (savedOrdersStr) {
    try {
      activeOrders = JSON.parse(savedOrdersStr);
      if (Array.isArray(activeOrders) && activeOrders.length > 0) {
        syncAndShowActiveOrders();
      }
    } catch (e) {
      console.warn('Gagal membaca pesanan aktif:', e);
    }
  }
});

// Sinkronisasi status dari database sebelum merender tampilan aktif
async function syncAndShowActiveOrders() {
  let validOrders = [];

  for (let i = 0; i < activeOrders.length; i++) {
    try {
      const res = await fetch(`${API_BASE}/pesanan/${activeOrders[i].orderId}`);
      if (res.ok) {
        const data = await res.json();
        let status = data.status_pesanan || 'menunggu';
        
        // Jika saat dimuat ulang statusnya sudah selesai atau dibatalkan, abaikan
        if (status === 'selesai' || status === 'dibatalkan') {
          continue;
        }

        activeOrders[i].status = status;
        activeOrders[i].nama_pelanggan = data.nama_pelanggan || activeOrders[i].nama_pelanggan;
        activeOrders[i].catatan = data.catatan || activeOrders[i].catatan;
        
        const fetchedItems = data.items || data.detail || data.order_items;
        if (fetchedItems && Array.isArray(fetchedItems) && fetchedItems.length > 0) {
          activeOrders[i].items = fetchedItems.map(it => ({
            nama_menu: it.nama_menu || it.menu_name || 'Menu',
            kuantitas: it.kuantitas || it.qty || 1,
            subtotal: it.subtotal || (it.harga * (it.kuantitas || it.qty || 1)) || 0
          }));
        }
        validOrders.push(activeOrders[i]);
      }
    } catch (e) {
      console.warn('Gagal menyinkronkan status pesanan:', e);
      validOrders.push(activeOrders[i]); 
    }
  }

  activeOrders = validOrders;
  if (activeOrders.length > 0) {
    localStorage.setItem('smartdine_active_orders', JSON.stringify(activeOrders));
    updateActiveOrderButtonState();
  } else {
    localStorage.removeItem('smartdine_active_orders');
    updateActiveOrderButtonState();
  }
}

// Mengatur visibilitas tombol status pesanan di navbar sebelah keranjang
function updateActiveOrderButtonState() {
  const btnLihat = document.getElementById('btnLihatPesanan');
  if (!btnLihat) return;

  if (activeOrders.length > 0) {
    btnLihat.classList.remove('hidden');
    btnLihat.classList.add('flex');
  } else {
    btnLihat.classList.remove('flex');
    btnLihat.classList.add('hidden');
  }
}

function openActiveOrderModal() {
  const container = document.getElementById('modalActiveOrdersContainer');
  const modal = document.getElementById('orderDetailModal');
  if (!container || !modal) return;

  if (activeOrders.length === 0) {
    container.innerHTML = `<p class="text-xs text-outline text-center py-6">Tidak ada pesanan aktif.</p>`;
  } else {
    container.innerHTML = activeOrders.map(order => createOrderCardHtml(order)).join('');
    activeOrders.forEach(order => {
      updateStatusStepperUI(order.orderId, order.status || 'menunggu');
    });
  }

  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeOrderDetailModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 250);
  }
}

// ================= KARTU PESANAN & TEMPLATE HTML =================

function createOrderCardHtml(order) {
  let paymentHtml = '';
  
  if (order.method === 'qr') {
      const qrisData = `SMARTDINE-RESTO-ORDER-${order.orderNum}-TOTAL-${order.grandTotal}`;
      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrisData)}`;
      paymentHtml = `
        <div class="mt-3 p-4 bg-surface-container rounded-2xl flex flex-col items-center text-center">
          <span class="text-[10px] font-black bg-on-surface text-white px-2 py-0.5 rounded mb-2">QRIS</span>
          <div class="p-2 bg-white rounded-xl shadow-inner border border-outline-variant/30">
            <img src="${qrImgUrl}" alt="QRIS Code" class="w-32 h-32 object-contain">
          </div>
        </div>`;
  } else if (order.method === 'card') {
      paymentHtml = `
        <div class="mt-3 p-3 bg-surface-container rounded-2xl flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">credit_card</span></div>
            <div class="text-left"><p class="text-xs font-bold">Kartu Debit/Kredit</p><p class="text-[10px] text-on-surface-variant">Selesaikan di Kasir</p></div>
        </div>`;
  } else {
      paymentHtml = `
        <div class="mt-3 p-3 bg-surface-container rounded-2xl flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0"><span class="material-symbols-outlined">payments</span></div>
            <div class="text-left"><p class="text-xs font-bold">Tunai (Cash)</p><p class="text-[10px] text-on-surface-variant">Bayar di Kasir</p></div>
        </div>`;
  }

  let itemsListHtml = '<p class="text-xs text-outline text-center py-1">Memuat rincian menu...</p>';
  if (order.items && order.items.length > 0) {
    itemsListHtml = order.items.map(it => `
      <div class="flex justify-between items-center py-1.5 border-b border-outline-variant/10 last:border-0">
        <span class="text-on-surface-variant font-medium">${it.kuantitas}x ${it.nama_menu}</span>
        <span class="font-bold text-on-surface">${rp(it.subtotal)}</span>
      </div>
    `).join('');
  }

  let infoPemesanHtml = '';
  if (order.nama_pelanggan || order.catatan) {
    infoPemesanHtml = `
    <div class="mt-4 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl flex flex-col gap-1">
      ${order.nama_pelanggan ? `<div class="text-[11px] text-on-surface"><span class="font-extrabold text-primary">👤 Pemesan:</span> ${order.nama_pelanggan}</div>` : ''}
      ${order.catatan ? `<div class="text-[11px] text-on-surface mt-0.5"><span class="font-extrabold text-primary">📝 Catatan:</span> ${order.catatan}</div>` : ''}
    </div>`;
  }

  return `
  <div class="bg-surface-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-5 mb-5" id="order-card-${order.orderId}">
    <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20 select-none">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
          <span class="material-symbols-outlined text-[16px]">receipt_long</span>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-1.5">${order.orderNum}</h3>
          <p class="text-[11px] text-primary font-bold">${rp(order.grandTotal)}</p>
        </div>
      </div>
      <span id="badge-${order.orderId}" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Menunggu</span>
    </div>

    <div class="flex flex-col">
      ${infoPemesanHtml}
      ${paymentHtml}

      <div class="mt-4 p-4 bg-surface-low border border-outline-variant/30 rounded-2xl w-full shadow-xs">
        <div class="flex items-center justify-between max-w-xs mx-auto relative px-1">
          <div class="flex flex-col items-center gap-1.5 z-10">
            <div id="step1-${order.orderId}" class="w-9 h-9 rounded-full bg-surface-lowest text-outline-variant border-2 border-outline-variant/30 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined text-[16px]">inventory_2</span>
            </div>
            <span id="text1-${order.orderId}" class="text-[10px] font-medium text-on-surface-variant/70">Menunggu</span>
          </div>
          <div class="flex-1 h-1 bg-surface-container-high mx-1 rounded-full overflow-hidden self-center -mt-4">
            <div id="line1-${order.orderId}" class="h-full w-0 bg-primary transition-all duration-500"></div>
          </div>
          <div class="flex flex-col items-center gap-1.5 z-10">
            <div id="step2-${order.orderId}" class="w-9 h-9 rounded-full bg-surface-lowest text-outline-variant border-2 border-outline-variant/30 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined text-[16px]">skillet</span>
            </div>
            <span id="text2-${order.orderId}" class="text-[10px] font-medium text-on-surface-variant/70">Diproses</span>
          </div>
          <div class="flex-1 h-1 bg-surface-container-high mx-1 rounded-full overflow-hidden self-center -mt-4">
            <div id="line2-${order.orderId}" class="h-full w-0 bg-primary transition-all duration-500"></div>
          </div>
          <div class="flex flex-col items-center gap-1.5 z-10">
            <div id="step3-${order.orderId}" class="w-9 h-9 rounded-full bg-surface-lowest text-outline-variant border-2 border-outline-variant/30 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined text-[16px]">room_service</span>
            </div>
            <span id="text3-${order.orderId}" class="text-[10px] font-medium text-on-surface-variant/70">Dihidangkan</span>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-outline-variant/20">
        <span class="text-[11px] font-extrabold text-on-surface-variant block mb-2">RINCIAN MENU</span>
        <div id="items-list-${order.orderId}" class="flex flex-col text-[11px]">
          ${itemsListHtml}
        </div>
      </div>
    </div>
  </div>
  `;
}

// ================= PROSES PENGIRIMAN PESANAN =================

async function submitOrder() {
  const items = Object.values(cart);
  if (items.length === 0) return alert('Keranjang masih kosong!');

  const btn = document.getElementById('btnSubmitOrder');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Memproses...`;
  }

  const customerName = document.getElementById('inputCustomerName')?.value.trim() || 'Meja ' + tableNumber;
  const notes = document.getElementById('inputOrderNotes')?.value.trim() || '';

  let subtotal = items.reduce((acc, curr) => acc + (curr.item.harga * curr.qty), 0);
  let tax = Math.round(subtotal * 0.10);
  let service = Math.round(subtotal * 0.05);
  let grandTotal = subtotal + tax + service;

  const orderPayload = {
    nomor_meja: tableNumber, nama_pelanggan: customerName, catatan: notes,
    metode_pembayaran: selectedPaymentMethod, total_harga: grandTotal,
    items: items.map(e => ({ menu_id: e.item.id, kuantitas: e.qty, subtotal: e.item.harga * e.qty }))
  };

  try {
    const response = await fetch(`${API_BASE}/pesanan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
    const result = await response.json();
    
    if (result.success) {
      const newOrder = {
        orderId: result.order_id,
        orderNum: result.order_num,
        grandTotal: grandTotal,
        method: selectedPaymentMethod,
        status: 'menunggu',
        nama_pelanggan: customerName,
        catatan: notes,
        items: items.map(e => ({
          nama_menu: e.item.nama_menu,
          kuantitas: e.qty,
          subtotal: e.item.harga * e.qty
        }))
      };

      activeOrders.push(newOrder); 
      localStorage.setItem('smartdine_active_orders', JSON.stringify(activeOrders));

      cart = {};
      updateCartUI();
      closeCartModal();
      updateActiveOrderButtonState();
      startOrderPolling();
      openActiveOrderModal(); // Otomatis buka pop-up status pesanan setelah submit
    } else {
      alert('Gagal membuat pesanan.');
    }
  } catch (err) {
    alert('Gagal terhubung ke server backend.');
  } finally {
    if (btn) {
      btn.disabled = false;
      selectPaymentMethod(selectedPaymentMethod, document.querySelector('.pay-method-btn') || document.body);
    }
  }
}

// ================= POLLING STATUS & SINKRONISASI DATABASE =================

function startOrderPolling() {
  if (orderPollingTimer) clearInterval(orderPollingTimer);
  if (activeOrders.length === 0) return;

  const fetchStatuses = async () => {
    let updatedOrders = []; 

    for (let i = 0; i < activeOrders.length; i++) {
      const order = activeOrders[i];

      try {
        const res = await fetch(`${API_BASE}/pesanan/${order.orderId}`);
        if (res.ok) {
          const data = await res.json();
          order.status = data.status_pesanan;
          order.nama_pelanggan = data.nama_pelanggan || order.nama_pelanggan;
          order.catatan = data.catatan || order.catatan;

          const fetchedItems = data.items || data.detail || data.order_items || data.menu_items;
          if (fetchedItems && Array.isArray(fetchedItems) && fetchedItems.length > 0) {
            order.items = fetchedItems.map(it => ({
              nama_menu: it.nama_menu || it.menu_name || 'Menu',
              kuantitas: it.kuantitas || it.qty || 1,
              subtotal: it.subtotal || (it.harga * (it.kuantitas || it.qty || 1)) || 0
            }));

            const itemsContainer = document.getElementById(`items-list-${order.orderId}`);
            if (itemsContainer) {
              itemsContainer.innerHTML = order.items.map(it => `
                <div class="flex justify-between items-center py-1.5 border-b border-outline-variant/10 last:border-0">
                  <span class="text-on-surface-variant font-medium">${it.kuantitas}x ${it.nama_menu}</span>
                  <span class="font-bold text-on-surface">${rp(it.subtotal)}</span>
                </div>
              `).join('');
            }
          }

          if (order.status === 'menunggu' || order.status === 'diproses' || order.status === 'dihidangkan') {
            updatedOrders.push(order);
          } else {
            console.log(`Pesanan ${order.orderNum} telah selesai/dibersihkan.`);
          }
        } else if (res.status === 404) {
          console.log(`Pesanan ${order.orderNum} telah dihapus oleh admin.`);
        }
      } catch (err) {
        updatedOrders.push(order); 
      }
    }

    activeOrders = updatedOrders;
    localStorage.setItem('smartdine_active_orders', JSON.stringify(activeOrders));
    updateActiveOrderButtonState();

    // Jika modal pop-up sedang terbuka, perbarui isinya secara real-time
    const modal = document.getElementById('orderDetailModal');
    if (modal && !modal.classList.contains('hidden')) {
      const container = document.getElementById('modalActiveOrdersContainer');
      if (container) {
        if (activeOrders.length === 0) {
          closeOrderDetailModal();
        } else {
          container.innerHTML = activeOrders.map(order => createOrderCardHtml(order)).join('');
          activeOrders.forEach(order => {
            updateStatusStepperUI(order.orderId, order.status || 'menunggu');
          });
        }
      }
    }

    if (activeOrders.length === 0) {
      clearInterval(orderPollingTimer);
      localStorage.removeItem('smartdine_active_orders');
    }
  };

  fetchStatuses(); 
  orderPollingTimer = setInterval(fetchStatuses, 4000); 
}

function updateStatusStepperUI(orderId, status) {
  const c1 = document.getElementById(`step1-${orderId}`), t1 = document.getElementById(`text1-${orderId}`), line1 = document.getElementById(`line1-${orderId}`);
  const c2 = document.getElementById(`step2-${orderId}`), t2 = document.getElementById(`text2-${orderId}`), line2 = document.getElementById(`line2-${orderId}`);
  const c3 = document.getElementById(`step3-${orderId}`), t3 = document.getElementById(`text3-${orderId}`);
  const badge = document.getElementById(`badge-${orderId}`);

  if (!c1) return; 

  const activeCircle = 'w-9 h-9 rounded-full bg-primary text-white border-2 border-primary flex items-center justify-center shadow-md ring-4 ring-primary/15 transition-all';
  const doneCircle = 'w-9 h-9 rounded-full bg-primary text-white border-2 border-primary flex items-center justify-center shadow-xs transition-all';
  const inactiveCircle = 'w-9 h-9 rounded-full bg-surface-lowest text-outline-variant border-2 border-outline-variant/30 flex items-center justify-center transition-all';

  if (status === 'menunggu') {
      if (badge) { badge.textContent = 'Menunggu'; badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20'; }
      c1.className = activeCircle; t1.className = 'text-[10px] font-extrabold text-primary transition-all';
      c2.className = inactiveCircle; t2.className = 'text-[10px] font-medium text-on-surface-variant/70 transition-all';
      c3.className = inactiveCircle; t3.className = 'text-[10px] font-medium text-on-surface-variant/70 transition-all';
      if (line1) line1.style.width = '0%'; if (line2) line2.style.width = '0%';
  } else if (status === 'diproses') {
      if (badge) { badge.textContent = 'Sedang Dimasak'; badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20'; }
      c1.className = doneCircle; t1.className = 'text-[10px] font-bold text-primary transition-all';
      c2.className = activeCircle; t2.className = 'text-[10px] font-extrabold text-primary transition-all';
      c3.className = inactiveCircle; t3.className = 'text-[10px] font-medium text-on-surface-variant/70 transition-all';
      if (line1) line1.style.width = '100%'; if (line2) line2.style.width = '0%';
  } else if (status === 'dihidangkan') {
      if (badge) { 
          badge.textContent = 'Pesanan sudah dihidangkan, selamat menikmati!'; 
          badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30'; 
      }
      c1.className = doneCircle; t1.className = 'text-[10px] font-bold text-primary transition-all';
      c2.className = doneCircle; t2.className = 'text-[10px] font-bold text-primary transition-all';
      c3.className = 'w-9 h-9 rounded-full bg-secondary text-white border-2 border-secondary flex items-center justify-center shadow-md ring-4 ring-secondary/15 transition-all';
      t3.className = 'text-[10px] font-extrabold text-secondary transition-all';
      if (t3) t3.textContent = 'Dihidangkan';
      if (line1) line1.style.width = '100%'; if (line2) line2.style.width = '100%';
  } else if (status === 'dibatalkan') {
      if (badge) { badge.textContent = 'Dibatalkan'; badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20'; }
  }
}

// ================= LOAD DATA BASE =================

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/kategori`);
    if (res.ok) renderCategoryPills(await res.json());
  } catch (e) { }
}

async function loadMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (res.ok) {
      allMenuItems = await res.json();
      renderMenuCards(allMenuItems);
    } 
  } catch (e) { }
}

function getMenuThumbnailHtml(item) {
  if (item.gambar && item.gambar.trim() !== '') {
    const imgUrl = item.gambar.startsWith('http') ? item.gambar : `${ASSET_BASE}/${item.gambar}`;
    return `<img src="${imgUrl}" alt="${item.nama_menu}" class="w-full h-full object-cover">`;
  }
  return `<div class="w-full h-full flex flex-col items-center justify-center bg-surface-container text-outline/60"><span class="material-symbols-outlined text-3xl">restaurant</span></div>`;
}

function renderCategoryPills(categories) {
  const container = document.getElementById('categoryContainer');
  if (!container) return;
  const isAllActive = currentCategory === 'all';
  let html = `<button onclick="filterCategory('all', this)" class="category-pill ${isAllActive ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-lowest text-on-surface'} shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold">Semua</button>`;
  categories.forEach(c => {
    const isActive = currentCategory.toLowerCase() === c.nama_kategori.toLowerCase();
    html += `<button onclick="filterCategory('${c.nama_kategori}', this)" class="category-pill ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-lowest text-on-surface'} shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold">${c.nama_kategori}</button>`;
  });
  container.innerHTML = html;
}

function renderMenuCards(items) {
  const container = document.getElementById('dishListContainer');
  const badge = document.getElementById('menuCountBadge');
  const filtered = items.filter(item => currentCategory === 'all' || (item.nama_kategori || '').toLowerCase().includes(currentCategory.toLowerCase()));
  if (badge) badge.textContent = `${filtered.length} Menu`;
  if (!container) return;
  if (filtered.length === 0) return container.innerHTML = `<div class="text-center py-10 bg-surface-lowest rounded-2xl">Tidak ada menu</div>`;

  container.innerHTML = filtered.map((item) => {
    const qty = cart[item.id] ? cart[item.id].qty : 0;
    const desc = item.deskripsi || 'Hidangan spesial SmartDine.';
    return `
      <article class="dish-card relative p-3 rounded-2xl bg-surface-lowest shadow-xs flex items-center justify-between gap-3 border border-outline-variant/15">
        <div class="flex-1 flex flex-col justify-between min-w-0 pr-1">
          <div><h4 class="font-extrabold text-sm text-on-surface truncate">${item.nama_menu}</h4><p class="text-[11px] text-on-surface-variant line-clamp-2 mt-1">${desc}</p></div>
          <div class="flex items-center justify-between mt-3 pt-1">
            <span class="text-sm font-black text-primary">${rp(item.harga)}</span>
            <div class="flex items-center bg-surface-container rounded-full p-1 gap-1">
              <button onclick="changeQty(${item.id}, -1)" class="${qty > 0 ? '' : 'hidden'} w-7 h-7 rounded-full bg-surface-lowest text-primary shadow-xs flex items-center justify-center font-bold">-</button>
              <span class="${qty > 0 ? '' : 'hidden'} px-2 text-xs font-bold text-on-surface">${qty}</span>
              <button onclick="changeQty(${item.id}, 1)" class="w-7 h-7 rounded-full bg-primary text-white shadow-xs flex items-center justify-center font-bold">+</button>
            </div>
          </div>
        </div>
        <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container shadow-inner border border-outline-variant/15 flex items-center justify-center">
          ${getMenuThumbnailHtml(item)}
        </div>
      </article>
    `;
  }).join('');
}

function changeQty(itemId, delta) {
  const item = allMenuItems.find(m => m.id === itemId);
  if (!item) return;
  if (!cart[itemId]) cart[itemId] = { item, qty: 0 };
  cart[itemId].qty += delta;
  if (cart[itemId].qty <= 0) delete cart[itemId];
  updateCartUI();
  renderMenuCards(allMenuItems);
}

function updateCartUI() {
  let totalQty = 0, subtotal = 0;
  Object.values(cart).forEach(entry => { totalQty += entry.qty; subtotal += (entry.item.harga * entry.qty); });
  if (document.getElementById('floatCartCount')) document.getElementById('floatCartCount').textContent = totalQty;
  if (document.getElementById('floatCartTotal')) document.getElementById('floatCartTotal').textContent = rp(subtotal);
  
  const floatBar = document.getElementById('floatingCartBar');
  const navBadge = document.getElementById('navCartBadge');
  if (navBadge) {
    if (totalQty > 0) { navBadge.textContent = totalQty; navBadge.classList.remove('hidden'); navBadge.classList.add('flex'); }
    else { navBadge.classList.add('hidden'); navBadge.classList.remove('flex'); }
  }
  if (floatBar) {
    if (totalQty > 0) { floatBar.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none'); floatBar.classList.add('translate-y-0', 'opacity-100'); }
    else { floatBar.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none'); floatBar.classList.remove('translate-y-0', 'opacity-100'); }
  }
}

function filterCategory(catName, btn) {
  currentCategory = catName;
  document.querySelectorAll('.category-pill').forEach(b => {
    b.classList.remove('bg-primary', 'text-on-primary');
    b.classList.add('bg-surface-lowest', 'text-on-surface');
  });
  if (btn) {
    btn.classList.remove('bg-surface-lowest', 'text-on-surface');
    btn.classList.add('bg-primary', 'text-on-primary');
  }
  renderMenuCards(allMenuItems);
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) { if (q) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden'); }
  if (!q) return renderMenuCards(allMenuItems);
  renderMenuCards(allMenuItems.filter(m => m.nama_menu.toLowerCase().includes(q) || (m.deskripsi && m.deskripsi.toLowerCase().includes(q))));
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  document.getElementById('clearSearchBtn')?.classList.add('hidden');
  renderMenuCards(allMenuItems);
}

function goToCartStep(step) {
  const stepReview = document.getElementById('cartStepReview');
  const stepPayment = document.getElementById('cartStepPayment');
  if (step === 2) {
    if (Object.keys(cart).length === 0) return alert('Keranjang Anda masih kosong!');
    const grandTotalText = document.getElementById('billGrandTotal')?.textContent || 'Rp 0';
    if (document.getElementById('paymentStepTotal')) document.getElementById('paymentStepTotal').textContent = grandTotalText;
    stepReview.classList.add('hidden'); stepPayment.classList.remove('hidden');
  } else {
    stepPayment.classList.add('hidden'); stepReview.classList.remove('hidden');
  }
}

function openCartModal() {
  goToCartStep(1);
  const modal = document.getElementById('cartModal');
  const listContainer = document.getElementById('cartItemsList');
  const items = Object.values(cart);
  if (items.length === 0) {
    listContainer.innerHTML = `<div class="text-center py-10"><p class="text-sm font-bold text-on-surface">Keranjang Anda Kosong</p></div>`;
  } else {
    listContainer.innerHTML = items.map(entry => {
      const { item, qty } = entry;
      return `
        <div class="pt-3 flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-extrabold text-on-surface truncate">${item.nama_menu}</h5>
            <span class="text-[11px] text-primary font-bold">${rp(item.harga)}</span>
          </div>
          <div class="flex items-center gap-1.5 bg-surface-container rounded-full p-1">
            <button onclick="changeQty(${item.id}, -1); openCartModal();" class="w-6 h-6 rounded-full bg-surface-lowest text-primary shadow-xs font-bold text-xs">-</button>
            <span class="w-6 text-center text-xs font-bold text-on-surface">${qty}</span>
            <button onclick="changeQty(${item.id}, 1); openCartModal();" class="w-6 h-6 rounded-full bg-primary text-white shadow-xs font-bold text-xs">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  let subtotal = items.reduce((acc, curr) => acc + (curr.item.harga * curr.qty), 0);
  let tax = Math.round(subtotal * 0.10);
  let service = Math.round(subtotal * 0.05);
  let grandTotal = subtotal + tax + service;
  document.getElementById('billSubtotal').textContent = rp(subtotal);
  document.getElementById('billTax').textContent = rp(tax);
  document.getElementById('billService').textContent = rp(service);
  document.getElementById('billGrandTotal').textContent = rp(grandTotal);

  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 250);
  }
}

let selectedPaymentMethod = 'cash';
function selectPaymentMethod(method, btn) {
  selectedPaymentMethod = method;
  
  document.querySelectorAll('.pay-method-btn').forEach(b => { 
      b.classList.remove('border-primary', 'bg-primary/10', 'text-primary'); 
      b.classList.add('border-outline-variant/30', 'bg-surface-lowest', 'text-on-surface'); 
  });
  
  if (btn) {
    btn.classList.remove('border-outline-variant/30', 'bg-surface-lowest', 'text-on-surface');
    btn.classList.add('border-primary', 'bg-primary/10', 'text-primary');
  }
  
  const hint = document.getElementById('payMethodHint');
  const btnText = document.getElementById('btnSubmitOrderText');
  
  if (method === 'cash') { 
      if (hint) hint.innerHTML = '💵 <strong>Tunai (Cash):</strong> Silakan bayar di kasir terlebih dahulu.'; 
      if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Tunai)'; 
  } else if (method === 'qr') { 
      if (hint) hint.innerHTML = '📱 <strong>QRIS:</strong> Scan QRIS lewat GoPay, OVO, dll.'; 
      if (btnText) btnText.textContent = 'Konfirmasi & Lanjut Bayar QRIS'; 
  } else if (method === 'card') { 
      if (hint) hint.innerHTML = '💳 <strong>Kartu Debit/Kredit:</strong> Gesek kartu di kasir.'; 
      if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Kartu)'; 
  }
}