// ============================================================
// PELANGGAN MENU - Katalog, Kategori, Keranjang & Pencarian
// ============================================================

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

// Polling berkala untuk memperbarui status menu secara otomatis tiap 5 detik
setInterval(loadMenu, 5000);