// SmartDine - Pelanggan

// Ambil basis URL API secara dinamis
const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api';

const ASSET_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? window.location.origin
  : 'http://localhost:3000';

// Nomor meja
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table') || '01';

let allMenuItems = [];
let cart = {}; // { [menuId]: { item, qty } }
let currentCategory = 'all';
let lastOrderId = null;

// Thumbnail menu
function getMenuThumbnailHtml(item) {
  if (item.gambar && item.gambar.trim() !== '') {
    const imgUrl = item.gambar.startsWith('http')
      ? item.gambar
      : `${ASSET_BASE}/uploads/${item.gambar}`;
    return `<img src="${imgUrl}" alt="${item.nama_menu}" class="w-full h-full object-cover">`;
  }

  // Fallback SVG silhouette berdasarkan kategori
  const cat = (item.nama_kategori || '').toLowerCase();
  let svgContent = '';
  let bgTint = 'bg-surface-container text-outline/60';

  if (cat.includes('minum') || cat.includes('kopi') || cat.includes('drink')) {
    bgTint = 'bg-[#eaf4fc] text-[#3b82f6]/70';
    svgContent = `<svg class="w-9 h-9 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line></svg>`;
  } else if (cat.includes('snack') || cat.includes('cemilan') || cat.includes('starter')) {
    bgTint = 'bg-[#fef7e7] text-[#f59e0b]/70';
    svgContent = `<svg class="w-9 h-9 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M7 14v.01"></path><path d="M11 16v.01"></path><path d="M16 14v.01"></path><path d="M13 11v.01"></path></svg>`;
  } else if (cat.includes('dessert') || cat.includes('manis') || cat.includes('kue')) {
    bgTint = 'bg-[#fdf2f8] text-[#ec4899]/70';
    svgContent = `<svg class="w-9 h-9 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path><path d="M2 21h20"></path><path d="M7 8v3"></path><path d="M12 8v3"></path><path d="M17 8v3"></path></svg>`;
  } else {
    // Makanan Utama
    bgTint = 'bg-[#fcedeb] text-primary/60';
    svgContent = `<svg class="w-9 h-9 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a1 1 0 0 1 1 1v1a8 8 0 0 1 8 8v1H3v-1a8 8 0 0 1 8-8V5a1 1 0 0 1 1-1z"></path><line x1="2" y1="20" x2="22" y2="20"></line></svg>`;
  }

  return `
    <div class="w-full h-full flex flex-col items-center justify-center ${bgTint} p-2 text-center transition-colors">
      ${svgContent}
    </div>
  `;
}

function rp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast) return;
  toastMsg.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2200);
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('headerTableLabel').textContent = `Meja ${tableNumber}`;
  document.getElementById('subTableLabel').textContent = `Meja ${tableNumber}`;
  document.getElementById('cartModalTableInfo').textContent = `Meja ${tableNumber}`;

  loadCategories();
  loadMenu();
});

// Ambil Kategori dari Server
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/kategori`);
    if (res.ok) {
      const categories = await res.json();
      renderCategoryPills(categories);
    }
  } catch (e) {
    console.warn('Gagal memuat kategori:', e);
  }
}

function getCategorySvg(categoryName) {
  const name = (categoryName || '').toLowerCase();
  if (name === 'all' || name.includes('semua')) {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
  } else if (name.includes('makan') || name.includes('utama')) {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>`;
  } else if (name.includes('snack') || name.includes('starter') || name.includes('cemilan')) {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M7 14v.01"></path><path d="M11 16v.01"></path><path d="M16 14v.01"></path><path d="M13 11v.01"></path></svg>`;
  } else if (name.includes('minum') || name.includes('kopi') || name.includes('drink')) {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line></svg>`;
  } else if (name.includes('dessert') || name.includes('manis') || name.includes('kue')) {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path><path d="M2 21h20"></path><path d="M7 8v3"></path><path d="M12 8v3"></path><path d="M17 8v3"></path><path d="M7 4h.01"></path><path d="M12 4h.01"></path><path d="M17 4h.01"></path></svg>`;
  } else {
    return `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
  }
}

function renderCategoryPills(categories) {
  const container = document.getElementById('categoryContainer');
  if (!container) return;

  const isAllActive = currentCategory === 'all';
  let html = `
    <button onclick="filterCategory('all', this)" class="category-pill ${isAllActive ? 'active-pill bg-primary text-on-primary shadow-sm' : 'bg-surface-lowest text-on-surface shadow-xs'} shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all">
      ${getCategorySvg('all')}
      <span>Semua</span>
    </button>
  `;

  categories.forEach(c => {
    const svgIcon = getCategorySvg(c.nama_kategori);
    const isActive = currentCategory.toLowerCase() === c.nama_kategori.toLowerCase();

    html += `
      <button onclick="filterCategory('${c.nama_kategori}', this)" class="category-pill ${isActive ? 'active-pill bg-primary text-on-primary shadow-sm' : 'bg-surface-lowest text-on-surface shadow-xs'} shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-surface-container">
        ${svgIcon}
        <span>${c.nama_kategori}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

// Ambil Menu dari Server
async function loadMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    if (res.ok) {
      allMenuItems = await res.json();
      renderMenuCards(allMenuItems);
      setupHeroItem(allMenuItems);
    } else {
      document.getElementById('dishListContainer').innerHTML = `
        <div class="text-center py-8 text-on-surface-variant text-xs">Gagal mengambil daftar menu dari server.</div>
      `;
    }
  } catch (e) {
    console.error('Error loadMenu:', e);
    document.getElementById('dishListContainer').innerHTML = `
      <div class="text-center py-8 text-on-surface-variant text-xs">Tidak dapat terhubung ke server backend. Pastikan server aktif.</div>
    `;
  }
}

function setupHeroItem(items) {
  if (!items || items.length === 0) return;
  const hero = items[0];
  const heroTitle = document.getElementById('heroTitle');
  const heroPrice = document.getElementById('heroPrice');
  const heroDesc = document.getElementById('heroDesc');
  const heroImg = document.getElementById('heroImage');

  if (heroTitle) heroTitle.textContent = hero.nama_menu;
  if (heroPrice) heroPrice.textContent = rp(hero.harga);
  if (heroDesc) heroDesc.textContent = hero.deskripsi || 'Menu signature chef pilihan terlezat hari ini.';
  if (heroImg && hero.gambar) {
    heroImg.src = hero.gambar.startsWith('http') ? hero.gambar : `${ASSET_BASE}/uploads/${hero.gambar}`;
  }
}

function addHeroToCart() {
  if (allMenuItems.length > 0) {
    changeQty(allMenuItems[0].id, 1);
    showToast(`${allMenuItems[0].nama_menu} ditambahkan!`);
  }
}

function getShortDescription(item) {
  if (item.deskripsi && item.deskripsi.trim() !== '') return item.deskripsi;
  const name = (item.nama_menu || '').toLowerCase();
  if (name.includes('cireng')) return 'Cireng gurih renyah dengan cocolan bumbu rujak pedas manis.';
  if (name.includes('kentang')) return 'Kentang renyah disiram saus keju gurih creamy.';
  if (name.includes('pisang')) return 'Pisang hangat bertabur coklat leleh & parutan keju melimpah.';
  if (name.includes('tahu')) return 'Tahu krispi ditaburi sambal matah segar khas Bali.';
  if (name.includes('geprek')) return 'Ayam goreng krispi digeprek dengan sambal bawang pedas nikmat.';
  if (name.includes('mie ayam')) return 'Mie kenyal topping ayam kecap manis & 2 bakso sapi gurih.';
  if (name.includes('nasi goreng')) return 'Nasi goreng rempah istimewa dengan telur mata sapi & bakso.';
  if (name.includes('sate')) return '10 tusuk sate ayam empuk dengan bumbu kacang khas Madura.';
  if (name.includes('es krim')) return 'Roti lembut isi es krim vanila dingin digoreng renyah krispi.';
  if (name.includes('pancake')) return 'Pancake empuk ber-layer saus coklat Nutella hazelnut.';
  if (name.includes('puding')) return 'Puding coklat lembut disiram vla vanila manis nan creamy.';
  if (name.includes('jeruk')) return 'Perasan jeruk manis alami dingin penyegar dahaga.';
  if (name.includes('kopi') || name.includes('aren')) return 'Espresso mantap, susu segar, dan gula aren asli.';
  if (name.includes('kuwut')) return 'Es kelapa segar dipadu perasan jeruk nipis & biji selasih.';
  if (name.includes('teh')) return 'Teh melati seduh dingin dengan rasa manis pas.';
  if (name.includes('matcha')) return 'Matcha Uji Jepang asli dipadu susu creamy dingin/hangat.';
  return 'Hidangan lezat khas koki SmartDine.';
}

// Render Kartu Menu
function renderMenuCards(items) {
  const container = document.getElementById('dishListContainer');
  const badge = document.getElementById('menuCountBadge');
  if (!container) return;

  const filtered = items.filter(item => {
    if (currentCategory === 'all') return true;
    return (item.nama_kategori || '').toLowerCase().includes(currentCategory.toLowerCase());
  });

  if (badge) badge.textContent = `${filtered.length} Menu`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-surface-lowest rounded-2xl p-6 shadow-xs">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">dinner_dining</span>
        <p class="text-sm font-bold text-on-surface">Tidak ada menu ditemukan</p>
        <p class="text-xs text-on-surface-variant mt-1">Coba gunakan kata kunci lain atau pilih kategori Semua.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item) => {
    const qty = cart[item.id] ? cart[item.id].qty : 0;
    const desc = getShortDescription(item);

    return `
      <article class="dish-card relative p-3 rounded-2xl bg-surface-lowest shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-shadow border border-outline-variant/15">
        <div class="flex-1 flex flex-col justify-between min-w-0 pr-1">
          <div>
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
              <span class="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                ${item.nama_kategori || 'Dine-In'}
              </span>
            </div>
            <h4 class="font-extrabold text-sm text-on-surface truncate leading-tight">${item.nama_menu}</h4>
            <p class="text-[11px] text-on-surface-variant line-clamp-2 mt-1 leading-snug">${desc}</p>
          </div>

          <div class="flex items-center justify-between mt-3 pt-1">
            <span class="text-sm font-black text-primary">${rp(item.harga)}</span>

            <!-- Stepper Controls -->
            <div class="stepper-box flex items-center bg-surface-container rounded-full p-1 gap-1">
              <button onclick="changeQty(${item.id}, -1)" class="${qty > 0 ? '' : 'hidden'} w-7 h-7 rounded-full bg-surface-lowest text-primary shadow-xs flex items-center justify-center active:scale-90 transition-transform">
                <span class="material-symbols-outlined text-[15px]">remove</span>
              </button>
              <span id="qty-${item.id}" class="${qty > 0 ? '' : 'hidden'} px-2 text-xs font-bold text-on-surface">${qty}</span>
              <button onclick="changeQty(${item.id}, 1)" class="w-7 h-7 rounded-full bg-primary text-white shadow-xs flex items-center justify-center active:scale-90 transition-transform hover:bg-primary-container">
                <span class="material-symbols-outlined text-[15px]">add</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Thumbnail (Upload Foto atau Siluet SVG Kategori) -->
        <div class="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container shadow-inner border border-outline-variant/15 flex items-center justify-center">
          ${getMenuThumbnailHtml(item)}
          <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs text-[10px] font-bold flex items-center gap-0.5 z-10">
            ⭐ 4.8
          </span>
        </div>
      </article>
    `;
  }).join('');
}

// Manajemen Keranjang
function changeQty(itemId, delta) {
  const item = allMenuItems.find(m => m.id === itemId);
  if (!item) return;

  if (!cart[itemId]) {
    cart[itemId] = { item, qty: 0 };
  }

  cart[itemId].qty += delta;
  if (cart[itemId].qty <= 0) {
    delete cart[itemId];
  }

  updateCartUI();
  renderMenuCards(allMenuItems);
}

function updateCartUI() {
  let totalQty = 0;
  let subtotal = 0;

  Object.values(cart).forEach(entry => {
    totalQty += entry.qty;
    subtotal += (entry.item.harga * entry.qty);
  });

  const floatBar = document.getElementById('floatingCartBar');
  const floatCount = document.getElementById('floatCartCount');
  const floatTotal = document.getElementById('floatCartTotal');
  const navBadge = document.getElementById('navCartBadge');

  if (floatCount) floatCount.textContent = totalQty;
  if (floatTotal) floatTotal.textContent = rp(subtotal);

  if (navBadge) {
    if (totalQty > 0) {
      navBadge.textContent = totalQty;
      navBadge.classList.remove('hidden');
      navBadge.classList.add('flex');
    } else {
      navBadge.classList.add('hidden');
      navBadge.classList.remove('flex');
    }
  }

  if (floatBar) {
    if (totalQty > 0) {
      floatBar.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
      floatBar.classList.add('translate-y-0', 'opacity-100');
    } else {
      floatBar.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
      floatBar.classList.remove('translate-y-0', 'opacity-100');
    }
  }
}

// Filter Kategori & Search
function filterCategory(catName, btn) {
  currentCategory = catName;
  document.querySelectorAll('.category-pill').forEach(b => {
    b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
    b.classList.add('bg-surface-lowest', 'text-on-surface', 'shadow-xs');
  });
  if (btn) {
    btn.classList.remove('bg-surface-lowest', 'text-on-surface', 'shadow-xs');
    btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
  }
  renderMenuCards(allMenuItems);
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    if (q) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  if (!q) {
    renderMenuCards(allMenuItems);
    return;
  }

  const filtered = allMenuItems.filter(m =>
    m.nama_menu.toLowerCase().includes(q) ||
    (m.deskripsi && m.deskripsi.toLowerCase().includes(q))
  );
  renderMenuCards(filtered);
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderMenuCards(allMenuItems);
}

function goToCartStep(step) {
  const stepReview = document.getElementById('cartStepReview');
  const stepPayment = document.getElementById('cartStepPayment');
  if (!stepReview || !stepPayment) return;
  if (step === 2) {
    if (Object.keys(cart).length === 0) {
      alert('Keranjang Anda masih kosong!');
      return;
    }
    const grandTotalText = document.getElementById('billGrandTotal')?.textContent || 'Rp 0';
    const paymentStepTotal = document.getElementById('paymentStepTotal');
    if (paymentStepTotal) paymentStepTotal.textContent = grandTotalText;
    stepReview.classList.add('hidden');
    stepPayment.classList.remove('hidden');
  } else {
    stepPayment.classList.add('hidden');
    stepReview.classList.remove('hidden');
  }
}

// Modal Keranjang & Rincian Tagihan
function openCartModal() {
  goToCartStep(1);
  const modal = document.getElementById('cartModal');
  const listContainer = document.getElementById('cartItemsList');
  if (!modal || !listContainer) return;

  const items = Object.values(cart);
  if (items.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-10 flex flex-col items-center justify-center">
        <div class="w-12 h-12 mb-2 rounded-full bg-[#fceae4] flex items-center justify-center text-primary shadow-xs">
          <svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <p class="text-sm font-bold text-on-surface">Keranjang Anda Kosong</p>
        <p class="text-xs text-on-surface-variant mt-0.5">Silakan pilih menu dari daftar untuk memesan.</p>
      </div>
    `;
  } else {
    listContainer.innerHTML = items.map(entry => {
      const item = entry.item;
      const qty = entry.qty;
      return `
        <div class="pt-3 flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-extrabold text-on-surface truncate">${item.nama_menu}</h5>
            <span class="text-[11px] text-primary font-bold">${rp(item.harga)}</span>
          </div>
          <div class="flex items-center gap-1.5 bg-surface-container rounded-full p-1">
            <button onclick="changeQty(${item.id}, -1); openCartModal();" class="w-6 h-6 rounded-full bg-surface-lowest text-primary shadow-xs flex items-center justify-center font-bold text-xs">
              -
            </button>
            <span class="w-6 text-center text-xs font-bold text-on-surface">${qty}</span>
            <button onclick="changeQty(${item.id}, 1); openCartModal();" class="w-6 h-6 rounded-full bg-primary text-white shadow-xs flex items-center justify-center font-bold text-xs">
              +
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Hitung Biaya
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
  if (!modal) return;
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 250);
}

let selectedPaymentMethod = 'cash';

function selectPaymentMethod(method, btn) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(b => {
    b.classList.remove('border-primary', 'bg-primary/10', 'text-primary');
    b.classList.add('border-outline-variant/30', 'bg-surface-lowest', 'text-on-surface');
  });
  btn.classList.remove('border-outline-variant/30', 'bg-surface-lowest', 'text-on-surface');
  btn.classList.add('border-primary', 'bg-primary/10', 'text-primary');

  const hint = document.getElementById('payMethodHint');
  const btnText = document.getElementById('btnSubmitOrderText');
  const btnIcon = document.getElementById('btnSubmitOrderIcon');

  if (method === 'cash') {
    if (hint) hint.innerHTML = '💵 <strong>Tunai (Cash):</strong> Silakan bayar di kasir terlebih dahulu, pesanan akan segera diproses dan diantarkan ke meja.';
    if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Tunai)';
    if (btnIcon) btnIcon.textContent = 'payments';
  } else if (method === 'qr') {
    if (hint) hint.innerHTML = '📱 <strong>QRIS:</strong> Scan QRIS lewat GoPay, OVO, Dana, ShopeePay, atau m-Banking.';
    if (btnText) btnText.textContent = 'Konfirmasi & Lanjut Bayar QRIS';
    if (btnIcon) btnIcon.textContent = 'qr_code_2';
  } else if (method === 'card') {
    if (hint) hint.innerHTML = '💳 <strong>Kartu Debit/Kredit:</strong> Gesek / Tap kartu Visa, Mastercard, GPN di kasir.';
    if (btnText) btnText.textContent = 'Konfirmasi Pesanan (Kartu)';
    if (btnIcon) btnIcon.textContent = 'credit_card';
  }
}

// Submit Order ke Backend
async function submitOrder() {
  const items = Object.values(cart);
  if (items.length === 0) {
    alert('Keranjang masih kosong!');
    return;
  }

  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Memproses Pesanan...`;

  const customerName = document.getElementById('inputCustomerName').value.trim() || 'Pelanggan Meja ' + tableNumber;
  const notes = document.getElementById('inputOrderNotes').value.trim();

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
    items: items.map(e => ({
      menu_id: e.item.id,
      kuantitas: e.qty,
      subtotal: e.item.harga * e.qty
    }))
  };

  try {
    const response = await fetch(`${API_BASE}/pesanan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();
    if (result.success) {
      lastOrderId = result.order_id;
      const currentMethod = selectedPaymentMethod;
      cart = {};
      updateCartUI();
      closeCartModal();
      openQrisModal(result.order_num, grandTotal, currentMethod);
    } else {
      alert('Gagal membuat pesanan: ' + (result.message || 'Terjadi kesalahan'));
    }
  } catch (err) {
    console.error('Error submitOrder:', err);
    alert('Gagal terhubung ke server backend.');
  } finally {
    btn.disabled = false;
    selectPaymentMethod(selectedPaymentMethod, document.querySelector(`.pay-method-btn`));
  }
}

// QRIS & Confirmation Modal
function openQrisModal(orderNum, grandTotal, method = 'cash') {
  const modal = document.getElementById('qrisModal');
  document.getElementById('qrisOrderNum').textContent = orderNum || '#SD-0001';
  document.getElementById('qrisGrandTotal').textContent = rp(grandTotal);

  const qrisBox = document.getElementById('qrisContainer');
  if (qrisBox) {
    if (method === 'qr') {
      const qrisData = `SMARTDINE-RESTO-ORDER-${orderNum}-TOTAL-${grandTotal}`;
      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrisData)}`;
      qrisBox.innerHTML = `
        <div class="flex items-center justify-between w-full mb-3 px-1">
          <span class="text-xs font-black tracking-wider bg-on-surface text-white px-2 py-0.5 rounded">QRIS</span>
          <span class="text-[11px] text-secondary font-bold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> Verifikasi Otomatis
          </span>
        </div>
        <div class="p-3 bg-white rounded-xl shadow-inner border border-outline-variant/30">
          <img id="qrisImage" src="${qrImgUrl}" alt="QRIS Code" class="w-48 h-48 object-contain">
        </div>
        <p class="text-[11px] text-on-surface-variant mt-3 max-w-xs leading-relaxed">
          Silakan scan kode QRIS di atas melalui GoPay, OVO, Dana, ShopeePay, BCA, atau m-Banking apa pun.
        </p>
        <div class="mt-3 w-full bg-surface-lowest p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
          <span class="text-on-surface-variant">Total Tagihan:</span>
          <span class="font-extrabold text-primary text-sm">${rp(grandTotal)}</span>
        </div>
      `;
    } else if (method === 'card') {
      qrisBox.innerHTML = `
        <div class="flex items-center justify-between w-full mb-3 px-1">
          <span class="text-xs font-black tracking-wider bg-primary text-white px-2 py-0.5 rounded">KARTU DEBIT / KREDIT</span>
          <span class="text-[11px] text-secondary font-bold">EDC Kasir</span>
        </div>
        <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary my-2 shadow-xs">
          <span class="material-symbols-outlined text-4xl">credit_card</span>
        </div>
        <h4 class="text-sm font-extrabold text-on-surface mt-1">Pembayaran Kartu Terdaftar</h4>
        <p class="text-[11px] text-on-surface-variant mt-1.5 max-w-xs leading-relaxed">
          Pesanan Anda telah diterima dapur. Silakan gesek atau tap kartu <strong>Visa, Mastercard, atau GPN</strong> di mesin EDC kasir saat pembayaran.
        </p>
        <div class="mt-3 w-full bg-surface-lowest p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
          <span class="text-on-surface-variant">Total Tagihan:</span>
          <span class="font-extrabold text-primary text-sm">${rp(grandTotal)}</span>
        </div>
      `;
    } else {
      // Cash
      qrisBox.innerHTML = `
        <div class="flex items-center justify-between w-full mb-3 px-1">
          <span class="text-xs font-black tracking-wider bg-secondary text-white px-2 py-0.5 rounded">TUNAI (CASH)</span>
          <span class="text-[11px] text-secondary font-bold">Bayar di Kasir</span>
        </div>
        <div class="w-20 h-20 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center my-2 shadow-xs">
          <span class="material-symbols-outlined text-4xl">payments</span>
        </div>
        <h4 class="text-sm font-extrabold text-on-surface mt-1">Pembayaran Tunai di Kasir</h4>
        <p class="text-[11px] text-on-surface-variant mt-1.5 max-w-xs leading-relaxed">
          Silakan melakukan pembayaran di kasir. Setelah pembayaran dikonfirmasi, pesanan Anda akan segera kami proses dan antarkan ke meja.
        </p>
        <div class="mt-3 w-full bg-surface-lowest p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
          <span class="text-on-surface-variant">Total Tagihan:</span>
          <span class="font-extrabold text-primary text-sm">${rp(grandTotal)}</span>
        </div>
      `;
    }
  }

  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);

  if (lastOrderId) {
    startOrderPolling(lastOrderId);
  }
}

function closeQrisModal() {
  const modal = document.getElementById('qrisModal');
  if (!modal) return;
  if (orderPollingTimer) clearInterval(orderPollingTimer);
  modal.classList.add('opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 250);
}

let orderPollingTimer = null;

function updateStatusStepper(status) {
  const c1 = document.getElementById('step1Circle');
  const t1 = document.getElementById('step1Text');
  const line1_2 = document.getElementById('line1_2');

  const c2 = document.getElementById('step2Circle');
  const t2 = document.getElementById('step2Text');
  const line2_3 = document.getElementById('line2_3');

  const c3 = document.getElementById('step3Circle');
  const t3 = document.getElementById('step3Text');
  const badge = document.getElementById('orderStatusBadge');

  if (!c1 || !c2 || !c3) return;

  const activeCircleClass = 'w-11 h-11 rounded-full bg-primary text-on-primary border-2 border-primary flex items-center justify-center shadow-md ring-4 ring-primary/15 transition-all';
  const doneCircleClass = 'w-11 h-11 rounded-full bg-primary text-on-primary border-2 border-primary flex items-center justify-center shadow-xs transition-all';
  const inactiveCircleClass = 'w-11 h-11 rounded-full bg-surface-lowest text-outline-variant border-2 border-outline-variant/30 flex items-center justify-center transition-all';

  const activeTextClass = 'text-[11px] font-extrabold text-primary transition-all';
  const doneTextClass = 'text-[11px] font-bold text-primary transition-all';
  const inactiveTextClass = 'text-[11px] font-medium text-on-surface-variant/70 transition-all';

  if (status === 'menunggu') {
    if (badge) {
      badge.textContent = 'Menunggu';
      badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20';
    }
    c1.className = activeCircleClass;
    t1.className = activeTextClass;
    if (line1_2) line1_2.style.width = '0%';

    c2.className = inactiveCircleClass;
    t2.className = inactiveTextClass;
    if (line2_3) line2_3.style.width = '0%';

    c3.className = inactiveCircleClass;
    t3.className = inactiveTextClass;
  } else if (status === 'diproses') {
    if (badge) {
      badge.textContent = 'Sedang Dimasak';
      badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20';
    }
    c1.className = doneCircleClass;
    t1.className = doneTextClass;
    if (line1_2) line1_2.style.width = '100%';

    c2.className = activeCircleClass;
    t2.className = activeTextClass;
    if (line2_3) line2_3.style.width = '0%';

    c3.className = inactiveCircleClass;
    t3.className = inactiveTextClass;
  } else if (status === 'selesai') {
    if (badge) {
      badge.textContent = 'Siap Diantar';
      badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30';
    }
    c1.className = doneCircleClass;
    t1.className = doneTextClass;
    if (line1_2) line1_2.style.width = '100%';

    c2.className = doneCircleClass;
    t2.className = doneTextClass;
    if (line2_3) line2_3.style.width = '100%';

    c3.className = 'w-11 h-11 rounded-full bg-secondary text-white border-2 border-secondary flex items-center justify-center shadow-md ring-4 ring-secondary/15 transition-all';
    t3.className = 'text-[11px] font-extrabold text-secondary transition-all';
  } else if (status === 'dibatalkan') {
    if (badge) {
      badge.textContent = 'Dibatalkan';
      badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20';
    }
    const list = document.getElementById('statusStepperList');
    if (list) {
      list.innerHTML = `<div class="p-3 rounded-xl bg-error/10 text-error text-xs font-bold flex items-center justify-center gap-2 border border-error/20 w-full text-center">
        <svg class="w-4 h-4 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        Pesanan dibatalkan oleh restoran.
      </div>`;
    }
  }
}

function startOrderPolling(orderId) {
  if (orderPollingTimer) clearInterval(orderPollingTimer);
  if (!orderId) return;

  updateStatusStepper('menunggu');

  orderPollingTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/pesanan/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        updateStatusStepper(data.status_pesanan);
        if (data.status_pesanan === 'selesai' || data.status_pesanan === 'dibatalkan') {
          clearInterval(orderPollingTimer);
        }
      }
    } catch (err) {
      console.warn('Polling status error:', err);
    }
  }, 3000);
}

function showNavTab(tab) {
  if (tab === 'menu') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
