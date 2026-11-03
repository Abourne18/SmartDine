// ============================================================
// PELANGGAN PESAN - Manajemen Pesanan Aktif, Polling & Pembatalan
// ============================================================

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
        if (data.metode_pembayaran) {
            activeOrders[i].method = data.metode_pembayaran;
        }
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            activeOrders[i].items = data.items;
        }

        validOrders.push(activeOrders[i]);
      }
    } catch (e) {
      validOrders.push(activeOrders[i]); 
    }
  }

  activeOrders = validOrders;
  if (activeOrders.length > 0) {
    localStorage.setItem(`smartdine_active_orders_${tableNumber}`, JSON.stringify(activeOrders));
    updateActiveOrderButtonState();
  } else {
    localStorage.removeItem(`smartdine_active_orders_${tableNumber}`);
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

  // Kunci scroll halaman belakang
  document.body.style.overflow = 'hidden';
  document.body.classList.add('overflow-hidden');

  if (activeOrders.length === 0) {
    container.innerHTML = `<p class="text-xs text-outline text-center py-6">Tidak ada pesanan aktif.</p>`;
  } else {
    container.innerHTML = activeOrders.map((order, idx) => createOrderCardHtml(order, idx)).join('');
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
  // Buka kunci scroll halaman belakang
  document.body.style.overflow = '';
  document.body.classList.remove('overflow-hidden');

  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 250);
  }
  if (cancelTimerInterval) clearInterval(cancelTimerInterval);
}

// ================= KARTU PESANAN =================

function createOrderCardHtml(order, index = 0) {
  const methodKey = (order.method || order.metode_pembayaran || 'cash').toLowerCase();
  let paymentHtml = '';
  if (methodKey === 'qr' || methodKey === 'qris') {
      paymentHtml = `
        <div class="mt-3 p-3 bg-surface-container rounded-2xl flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-on-surface">QRIS</p>
              <p class="text-[10px] text-on-surface-variant">Pembayaran Non-Tunai QRIS</p>
            </div>
        </div>`;
  } else if (methodKey === 'card' || methodKey === 'kartu') {
      paymentHtml = `
        <div class="mt-3 p-3 bg-surface-container rounded-2xl flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">credit_card</span>
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-on-surface">Kartu Debit/Kredit</p>
              <p class="text-[10px] text-on-surface-variant">Selesaikan di Kasir</p>
            </div>
        </div>`;
  } else {
      paymentHtml = `
        <div class="mt-3 p-3 bg-surface-container rounded-2xl flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-on-surface">Tunai (Cash)</p>
              <p class="text-[10px] text-on-surface-variant">Bayar di Kasir</p>
            </div>
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
      ${order.nama_pelanggan ? `<div class="text-[11px] text-on-surface"><span class="font-extrabold text-primary">Pemesan:</span> ${order.nama_pelanggan}</div>` : ''}
      ${order.catatan ? `<div class="text-[11px] text-on-surface mt-0.5"><span class="font-extrabold text-primary">Catatan:</span> ${order.catatan}</div>` : ''}
    </div>`;
  }

  const elapsed = Date.now() - (order.createdAt || 0);
  const remainingTime = Math.max(0, 30 - Math.floor(elapsed / 1000));
  const canCancel = order.status === 'menunggu' && remainingTime > 0;

  // Aturan Tombol "Pesan Lagi":
  // Jika sudah ada pesanan baru (activeOrders.length > 1), struk pertama / lama TIDAK menampilkan tombol "Pesan Lagi".
  // Hanya struk pesanan terakhir yang menampilkan tombol "Pesan Lagi".
  const isLatestOrder = (index === activeOrders.length - 1);
  const showOrderAgain = isLatestOrder;

  let actionButtonsHtml = '';
  if (showOrderAgain || canCancel) {
    actionButtonsHtml = `
      <div class="mt-4 pt-4 border-t border-outline-variant/20 flex gap-3">
        ${showOrderAgain ? `
          <button onclick="setAppendOrder('${order.orderId}', '${order.orderNum}')" class="flex-1 py-2.5 rounded-xl border border-primary text-primary bg-primary/5 hover:bg-primary/10 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span> Pesan Lagi
          </button>
        ` : ''}
        <button id="btnCancelOrder-${order.orderId}" onclick="cancelOrderByCustomer('${order.orderId}')" class="${showOrderAgain ? 'flex-1' : 'w-full'} py-2.5 rounded-xl bg-error text-white font-extrabold text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm ${canCancel ? '' : 'hidden'}">
          <span class="material-symbols-outlined text-[16px]">cancel</span> Batalkan (<span id="cancelTimer-${order.orderId}">${remainingTime}</span>s)
        </button>
      </div>
    `;
  }

  return `
  <div class="bg-surface-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-5 mb-5" id="order-card-${order.orderId}">
    <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20 select-none">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
          <span class="material-symbols-outlined text-[16px]">receipt_long</span>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
            ${order.orderNum}
            ${activeOrders.length > 1 ? (index === 0 ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">Awal</span>' : `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container border border-secondary/20">Tambahan #${index}</span>`) : ''}
          </h3>
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

  closeOrderDetailModal();
  cart = {};
  updateCartUI();

  const toast = document.getElementById('toastNotification');
  const msg = document.getElementById('toastMessage');

  // ATURAN ALUR:
  // 1. Jika pesanan BELUM dikonfirmasi admin (status masih 'menunggu'):
  //    Gabung ke ID pesanan yang sama.
  // 2. Jika pesanan SUDAH dikonfirmasi admin (status sudah 'diproses' / 'dihidangkan'):
  //    Buat sebagai ID pesanan baru (pelanggan memiliki 2 struk/kartu pesanan terpisah).
  if (order && order.status !== 'menunggu') {
    appendToOrderId = null;
    appendToOrderNum = null;
    if (toast && msg) {
      msg.textContent = `Pesanan ${targetNum} sedang dimasak di dapur. Menu tambahan akan dibuat sebagai pesanan baru.`;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none'), 4500);
    }
  } else {
    appendToOrderId = targetId;
    appendToOrderNum = targetNum;
    if (toast && msg) {
      msg.textContent = `Pilih menu tambahan untuk ${targetNum} (digabung ke pesanan awal)`;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none'), 4000);
    }
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
    nomor_meja: tableNumber, 
    nama_pelanggan: customerName, 
    catatan: notes,
    metode_pembayaran: selectedPaymentMethod, 
    total_harga: grandTotal,
    items: items.map(e => ({ menu_id: e.item.id, kuantitas: e.qty, subtotal: e.item.harga * e.qty }))
  };

  try {
    let response, result;

    if (appendToOrderId) {
        const targetExistingOrder = activeOrders.find(o => String(o.orderId) === String(appendToOrderId));
        // Jika status pesanan sudah bukan 'menunggu' (sudah dikonfirmasi admin/sedang dimasak), otomatis buat sebagai pesanan baru
        if (!targetExistingOrder || targetExistingOrder.status !== 'menunggu') {
            appendToOrderId = null;
            appendToOrderNum = null;
        }
    }

    if (appendToOrderId) {
        response = await fetch(`${API_BASE}/pesanan/${appendToOrderId}/tambah`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(orderPayload) 
        });
        result = await response.json();

        if (result.success) {
            const targetExistingOrder = activeOrders.find(o => String(o.orderId) === String(appendToOrderId));
            if (targetExistingOrder) {
                const newItemsFormatted = items.map(e => ({
                    nama_menu: e.item.nama_menu,
                    kuantitas: e.qty,
                    subtotal: e.item.harga * e.qty
                }));
                targetExistingOrder.items = (targetExistingOrder.items || []).concat(newItemsFormatted);
                targetExistingOrder.grandTotal = (Number(targetExistingOrder.grandTotal) || 0) + grandTotal;
                localStorage.setItem(`smartdine_active_orders_${tableNumber}`, JSON.stringify(activeOrders));
            }

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
            alert(result.message || 'Gagal menambahkan menu ke pesanan.');
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
            orderNum: result.order_num || formatOrderId(result.order_id),
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
          localStorage.setItem(`smartdine_active_orders_${tableNumber}`, JSON.stringify(activeOrders));

          cart = {};
          updateCartUI();
          closeCartModal();
          updateActiveOrderButtonState();
          startOrderPolling();
          openActiveOrderModal(); 
        } else {
          alert(result.message || 'Gagal membuat pesanan.');
        }
    }
  } catch (err) {
    console.error('Error submit order:', err);
    alert('Gagal terhubung ke server backend.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <span id="btnSubmitOrderIcon" class="material-symbols-outlined text-[18px]">payments</span>
        <span id="btnSubmitOrderText">Konfirmasi Pesanan</span>
      `;
      const activeMethodBtn = document.querySelector('.pay-method-btn.border-primary') || document.querySelector('.pay-method-btn');
      selectPaymentMethod(selectedPaymentMethod, activeMethodBtn);
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

          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            order.items = data.items.map(it => ({
              nama_menu: it.nama_menu || 'Menu',
              kuantitas: it.kuantitas || 1,
              subtotal: it.subtotal || 0
            }));
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
    localStorage.setItem(`smartdine_active_orders_${tableNumber}`, JSON.stringify(activeOrders));
    updateActiveOrderButtonState();

    const modal = document.getElementById('orderDetailModal');
    if (modal && !modal.classList.contains('hidden')) {
      const container = document.getElementById('modalActiveOrdersContainer');
      if (container) {
        if (activeOrders.length === 0) {
          closeOrderDetailModal();
        } else {
          container.innerHTML = activeOrders.map((order, idx) => createOrderCardHtml(order, idx)).join('');
          activeOrders.forEach(order => {
            updateStatusStepperUI(order.orderId, order.status || 'menunggu');
          });
        }
      }
    }

    if (activeOrders.length === 0) {
      clearInterval(orderPollingTimer);
      localStorage.removeItem(`smartdine_active_orders_${tableNumber}`);
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
      localStorage.setItem(`smartdine_active_orders_${tableNumber}`, JSON.stringify(activeOrders));
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