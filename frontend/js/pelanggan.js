// SmartDine - Pelanggan (Frontend Script)

const API_BASE = 'http://localhost:3000/api';
const ASSET_BASE = 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table') || '01';

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

document.addEventListener('DOMContentLoaded', async () => {
  const labelMeja1 = document.getElementById('headerTableLabel');
  const labelMeja2 = document.getElementById('subTableLabel');
  if (labelMeja1) labelMeja1.textContent = `Meja ${tableNumber}`;
  if (labelMeja2) labelMeja2.textContent = `Meja ${tableNumber}`;

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

// ================= STATUS & POLLING PESANAN AKTIF =================

async function syncAndShowActiveOrders() {
  let validOrders = [];

  for (let i = 0; i < activeOrders.length; i++) {
    try {
      const res = await fetch(`${API_BASE}/pesanan/${activeOrders[i].orderId}`);
      if (res.ok) {
        const data = await res.json();
        let status = data.status_pesanan || 'menunggu';
        
        if (status === 'selesai' || status === 'dibatalkan') {
          if (status === 'dibatalkan') {
            showCancelPopup(activeOrders[i].orderNum);
          }
          continue;
        }

        activeOrders[i].status = status;
        activeOrders[i].nama_pelanggan = data.nama_pelanggan || activeOrders[i].nama_pelanggan;
        activeOrders[i].catatan = data.catatan || activeOrders[i].catatan;
        
        if (data.total_harga) {
            activeOrders[i].grandTotal = data.total_harga;
        }

        validOrders.push(activeOrders[i]);
      }
    } catch (e) {
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

    if (cancelTimerInterval) clearInterval(cancelTimerInterval);
    cancelTimerInterval = setInterval(updateCancelButtonsUI, 1000);
    updateCancelButtonsUI(); 
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
  if (cancelTimerInterval) clearInterval(cancelTimerInterval);
}

// ================= KARTU PESANAN =================

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

  const elapsed = Date.now() - (order.createdAt || 0);
  const remainingTime = Math.max(0, 30 - Math.floor(elapsed / 1000));
  const canCancel = order.status === 'menunggu' && remainingTime > 0;

  let actionButtonsHtml = `
    <div class="mt-4 pt-4 border-t border-outline-variant/20 flex gap-3">
      <button onclick="setAppendOrder('${order.orderId}', '${order.orderNum}')" class="flex-1 py-2.5 rounded-xl border border-primary text-primary bg-primary/5 hover:bg-primary/10 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm">
        <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span> Pesan Lagi
      </button>
      <button id="btnCancelOrder-${order.orderId}" onclick="cancelOrderByCustomer('${order.orderId}')" class="flex-1 py-2.5 rounded-xl bg-error text-white font-extrabold text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm ${canCancel ? '' : 'hidden'}">
        <span class="material-symbols-outlined text-[16px]">cancel</span> Batalkan (<span id="cancelTimer-${order.orderId}">${remainingTime}</span>s)
      </button>
    </div>
  `;

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

      ${actionButtonsHtml}
    </div>
  </div>
  `;
}

// ================= MERGE ORDER =================

function setAppendOrder(orderId, orderNum) {
  const order = activeOrders.find(o => String(o.orderId) === String(orderId));
  const targetId = order ? order.orderId : orderId;
  const targetNum = order ? order.orderNum : orderNum;

  appendToOrderId = targetId;
  appendToOrderNum = targetNum;
  closeOrderDetailModal();
  
  cart = {};
  updateCartUI();
  
  const toast = document.getElementById('toastNotification');
  const msg = document.getElementById('toastMessage');
  if(toast && msg) {
    msg.textContent = `Pilih menu tambahan untuk ${targetNum}`;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none'), 4000);
  }
}

// ================= PENGIRIMAN PESANAN =================

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
    let response, result;

    if (appendToOrderId) {
        response = await fetch(`${API_BASE}/pesanan/${appendToOrderId}/tambah`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(orderPayload) 
        });
        result = await response.json();

        if (result.success) {
            alert(`Berhasil! Menu ditambahkan ke pesanan ${appendToOrderNum}`);
            appendToOrderId = null;
            appendToOrderNum = null;
            
            cart = {};
            updateCartUI();
            closeCartModal();
            
            if (orderPollingTimer) clearInterval(orderPollingTimer);
            await syncAndShowActiveOrders();
            startOrderPolling();
            setTimeout(openActiveOrderModal, 300);
        } else {
            alert('Gagal menambahkan menu ke pesanan.');
            if (btn) btn.disabled = false;
        }
    } else {
        response = await fetch(`${API_BASE}/pesanan`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(orderPayload) 
        });
        result = await response.json();
        
        if (result.success) {
          const newOrder = {
            orderId: result.order_id,
            orderNum: result.order_num,
            grandTotal: grandTotal,
            method: selectedPaymentMethod,
            status: 'menunggu',
            createdAt: Date.now(),
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
          openActiveOrderModal(); 
        } else {
          alert('Gagal membuat pesanan.');
          if (btn) btn.disabled = false;
        }
    }
  } catch (err) {
    console.error(err);
    alert('Gagal terhubung ke server backend.');
    if (btn) btn.disabled = false;
  } finally {
    if (btn) {
      btn.disabled = false;
      selectPaymentMethod(selectedPaymentMethod, document.querySelector('.pay-method-btn') || document.body);
    }
  }
}

// ================= POLLING STATUS =================

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

          if (data.total_harga) {
              order.grandTotal = data.total_harga;
          }

          const resDetail = await fetch(`${API_BASE}/pesanan`);
          if (resDetail.ok) {
            const allOrders = await resDetail.json();
            const found = allOrders.find(o => String(o.id) === String(order.orderId));
            if (found && found.items) {
              order.items = found.items.map(it => ({
                nama_menu: it.nama_menu || 'Menu',
                kuantitas: it.kuantitas || 1,
                subtotal: it.subtotal || 0
              }));
            }
          }

          if (order.status === 'menunggu' || order.status === 'diproses' || order.status === 'dihidangkan') {
            updatedOrders.push(order);
          } else {
            if (order.status === 'dibatalkan') {
              showCancelPopup(order.orderNum);
            }
          }
        } else if (res.status === 404) {
          showCancelPopup(order.orderNum);
        }
      } catch (err) {
        updatedOrders.push(order); 
      }
    }

    activeOrders = updatedOrders;
    localStorage.setItem('smartdine_active_orders', JSON.stringify(activeOrders));
    updateActiveOrderButtonState();

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
          badge.textContent = 'Pesanan dihidangkan!'; 
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

// ================= LOAD DATA BASE & TAMPILAN MENU =================

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
      renderMenuTerlaris(allMenuItems);
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

// ================= BAGIAN MENU TERLARIS =================
function renderMenuTerlaris(items) {
  const container = document.getElementById('terlarisContainer');
  const section = document.getElementById('terlarisSection');
  if (!container || !section) return;

  let availableItems = items.filter(m => m.is_available != 0 && m.is_available !== false);
  let terlarisItems = availableItems.slice(0, 4); 

  if (terlarisItems.length === 0) {
    section.classList.add('hidden');
    return;
  }
  
  section.classList.remove('hidden');
  
  container.innerHTML = terlarisItems.map(item => {
    const qty = cart[item.id] ? cart[item.id].qty : 0;
    return `
      <article class="relative w-36 shrink-0 bg-surface-lowest rounded-2xl shadow-sm border border-outline-variant/15 flex flex-col overflow-hidden">
        <div class="h-28 w-full bg-surface-container relative">
           ${getMenuThumbnailHtml(item)}
           <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-black text-primary flex items-center gap-0.5 shadow-sm">
             <span class="material-symbols-outlined text-[12px]">local_fire_department</span> Top
           </div>
        </div>
        <div class="p-2.5 flex flex-col flex-1">
          <h4 class="font-extrabold text-xs text-on-surface line-clamp-2 mb-1 leading-snug">${item.nama_menu}</h4>
          <div class="mt-auto pt-2 flex items-center justify-between">
            <span class="text-xs font-black text-primary">${rp(item.harga)}</span>
            <div class="flex items-center bg-surface-container rounded-full p-0.5 relative z-20">
              <button onclick="changeQty(${item.id}, -1)" class="${qty > 0 ? '' : 'hidden'} w-6 h-6 rounded-full bg-surface-lowest text-primary shadow-xs flex items-center justify-center font-bold text-xs">-</button>
              <span class="${qty > 0 ? '' : 'hidden'} px-1.5 text-[10px] font-bold text-on-surface">${qty}</span>
              <button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 rounded-full bg-primary text-white shadow-xs flex items-center justify-center font-bold text-xs">+</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
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
    const isHabis = item.is_available == 0 || item.is_available === false;

    return `
      <article class="dish-card relative p-3 rounded-2xl bg-surface-lowest shadow-xs flex items-center justify-between gap-3 border border-outline-variant/15 ${isHabis ? 'opacity-60 grayscale transition-all' : ''}">
        ${isHabis ? `<div class="absolute inset-0 z-10 rounded-2xl cursor-not-allowed" title="Menu sedang habis"></div>` : ''}
        
        <div class="flex-1 flex flex-col justify-between min-w-0 pr-1 relative z-0">
          <div>
            <h4 class="font-extrabold text-sm text-on-surface truncate">${item.nama_menu}</h4>
            <p class="text-[11px] text-on-surface-variant line-clamp-2 mt-1">${desc}</p>
          </div>
          <div class="flex items-center justify-between mt-3 pt-1">
            <span class="text-sm font-black text-primary">${rp(item.harga)}</span>
            
            ${isHabis ? `
                <span class="text-[10px] font-bold text-error bg-error/10 px-2 py-1 rounded border border-error/20 z-20 relative">Habis Terjual</span>
            ` : `
                <div class="flex items-center bg-surface-container rounded-full p-1 gap-1 relative z-20">
                  <button onclick="changeQty(${item.id}, -1)" class="${qty > 0 ? '' : 'hidden'} w-7 h-7 rounded-full bg-surface-lowest text-primary shadow-xs flex items-center justify-center font-bold">-</button>
                  <span class="${qty > 0 ? '' : 'hidden'} px-2 text-xs font-bold text-on-surface">${qty}</span>
                  <button onclick="changeQty(${item.id}, 1)" class="w-7 h-7 rounded-full bg-primary text-white shadow-xs flex items-center justify-center font-bold">+</button>
                </div>
            `}
          </div>
        </div>
        
        <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container shadow-inner border border-outline-variant/15 flex items-center justify-center relative z-0">
          ${isHabis ? `
            <div class="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                <span class="text-white text-[10px] font-black tracking-widest border border-white/60 px-2 py-1 rounded shadow-sm bg-black/30">KOSONG</span>
            </div>
          ` : ''}
          ${getMenuThumbnailHtml(item)}
        </div>
      </article>
    `;
  }).join('');
}

function changeQty(itemId, delta) {
  const item = allMenuItems.find(m => m.id === itemId);
  if (!item) return;

  if (delta > 0 && (item.is_available == 0 || item.is_available === false)) {
      return; 
  }

  if (!cart[itemId]) cart[itemId] = { item, qty: 0 };
  cart[itemId].qty += delta;
  if (cart[itemId].qty <= 0) delete cart[itemId];
  
  updateCartUI();
  renderMenuCards(allMenuItems);
  renderMenuTerlaris(allMenuItems);
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
  const terlarisSec = document.getElementById('terlarisSection');
  const titleDaftar = document.getElementById('titleDaftarMenu');

  if (clearBtn) { if (q) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden'); }
  
  if (!q) {
      if(terlarisSec) terlarisSec.classList.remove('hidden');
      if(titleDaftar) titleDaftar.textContent = 'Daftar Pilihan Menu';
      return renderMenuCards(allMenuItems);
  }
  
  if(terlarisSec) terlarisSec.classList.add('hidden');
  if(titleDaftar) titleDaftar.textContent = 'Hasil Pencarian';
  
  renderMenuCards(allMenuItems.filter(m => m.nama_menu.toLowerCase().includes(q) || (m.deskripsi && m.deskripsi.toLowerCase().includes(q))));
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const terlarisSec = document.getElementById('terlarisSection');
  const titleDaftar = document.getElementById('titleDaftarMenu');
  
  if (input) input.value = '';
  document.getElementById('clearSearchBtn')?.classList.add('hidden');
  
  if(terlarisSec) terlarisSec.classList.remove('hidden');
  if(titleDaftar) titleDaftar.textContent = 'Daftar Pilihan Menu';
  
  renderMenuCards(allMenuItems);
}

// ================= MODAL & CHECKOUT =================

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
  const titleEl = document.querySelector('#cartStepReview h3');
  
  if (titleEl) {
      titleEl.textContent = appendToOrderId ? `Tambahan untuk (${appendToOrderNum})` : 'Keranjang Pesanan';
  }

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

// ================= LOGIKA PEMBATALAN OLEH PELANGGAN & POP-UP =================

function updateCancelButtonsUI() {
  activeOrders.forEach(order => {
    const btn = document.getElementById(`btnCancelOrder-${order.orderId}`);
    const timerSpan = document.getElementById(`cancelTimer-${order.orderId}`);
    
    if (btn && !btn.classList.contains('hidden')) {
      const elapsed = Date.now() - (order.createdAt || 0);
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
      
      if (remaining <= 0 || order.status !== 'menunggu') {
        btn.classList.add('hidden');
      } else {
        if (timerSpan) timerSpan.textContent = remaining;
      }
    }
  });
}

async function cancelOrderByCustomer(orderId) {
  const confirmCancel = confirm("Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat dikembalikan.");
  if (!confirmCancel) return;
  
  const btn = document.getElementById(`btnCancelOrder-${orderId}`);
  if(btn) { 
      btn.disabled = true; 
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Membatalkan...`; 
  }
  
  try {
    const targetOrder = activeOrders.find(o => String(o.orderId) === String(orderId));
    const realId = targetOrder ? targetOrder.orderId : orderId;

    const res = await fetch(`${API_BASE}/pesanan/${realId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_pesanan: 'dibatalkan' })
    });
    
    if(res.ok) {
      alert("Pesanan berhasil dibatalkan.");
      activeOrders = activeOrders.filter(o => String(o.orderId) !== String(orderId));
      localStorage.setItem('smartdine_active_orders', JSON.stringify(activeOrders));
      updateActiveOrderButtonState();
      closeOrderDetailModal();
    } else {
      alert("Gagal membatalkan pesanan. Mungkin pesanan sudah diproses oleh dapur.");
      if(btn) {
          btn.disabled = false;
          btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">cancel</span> Batalkan`;
      }
    }
  } catch (e) {
    alert("Terjadi kesalahan jaringan saat membatalkan pesanan.");
    if(btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">cancel</span> Batalkan`;
    }
  }
}

function showCancelPopup(orderNum) {
  const popupId = `cancelPopup-${orderNum}`;
  if (document.getElementById(popupId)) return;

  const modalHtml = `
    <div id="${popupId}" class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex flex-col justify-center p-4 opacity-0 transition-opacity duration-300">
      <div class="w-full max-w-sm mx-auto bg-surface-lowest rounded-3xl shadow-2xl p-6 text-center transform scale-95 transition-transform duration-300">
        <div class="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 border border-error/20">
          <span class="material-symbols-outlined text-3xl">cancel</span>
        </div>
        <h3 class="text-lg font-extrabold text-on-surface mb-2">Pesanan Dibatalkan</h3>
        <p class="text-xs text-on-surface-variant mb-6 leading-relaxed">
          Mohon maaf, pesanan Anda dengan nomor <strong class="text-primary">${orderNum}</strong> telah dibatalkan. Silakan hubungi kasir atau pelayan untuk informasi lebih lanjut.
        </p>
        <button onclick="closeCancelPopup('${orderNum}')" class="w-full py-3 rounded-xl bg-error hover:bg-red-700 text-white font-extrabold text-xs active:scale-95 transition-all shadow-md">
          Tutup Pemberitahuan
        </button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.getElementById(popupId);
  
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.querySelector('.transform').classList.remove('scale-95');
  }, 10);
}

function closeCancelPopup(orderNum) {
  const modal = document.getElementById(`cancelPopup-${orderNum}`);
  if (modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('.transform').classList.add('scale-95');
    setTimeout(() => modal.remove(), 300);
  }
}


// Polling sederhana untuk update status menu secara otomatis tiap 5 detik
setInterval(loadMenu, 5000);
