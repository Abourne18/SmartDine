// ============================================================
// PELANGGAN KERANJANG - Modal Keranjang, Kalkulasi & Pembayaran
// ============================================================

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
      if (hint) hint.innerHTML = '<strong>Tunai (Cash):</strong> Silakan bayar di kasir terlebih dahulu.'; 
      if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Tunai)'; 
  } else if (method === 'qr') { 
      if (hint) hint.innerHTML = '<strong>QRIS:</strong> Scan QRIS lewat GoPay, OVO, dll.'; 
      if (btnText) btnText.textContent = 'Konfirmasi & Lanjut Bayar QRIS'; 
  } else if (method === 'card') { 
      if (hint) hint.innerHTML = '<strong>Kartu Debit/Kredit:</strong> Gesek kartu di kasir.'; 
      if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Kartu)'; 
  }
}