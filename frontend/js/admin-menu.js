// MANAJEMEN MEJA, QR & MENU
// ============================================================
async function renderTables() {
    try {
        const response = await fetch(`${API_BASE}/meja`);
        const TABLE_DATA = await response.json();
        const container = document.getElementById('tablesContainer');
        if (!container) return;

        
        const quickAddCard = `
            <div class="table-card" style="border: 2px dashed #94a3b8; background: #f8fafc; box-shadow: none; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; min-height:180px;">
                <div style="font-weight: 700; color: #64748b; font-size: 1.05rem;">+ Meja Baru</div>
                <div style="display: flex; gap: 6px; width: 100%; padding: 0 10px;">
                    <input type="text" id="quickTableNo" placeholder="No..." style="flex:1; padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px; text-align: center; font-weight: 700; font-size: 1.05rem; width: 65%; outline:none;" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='#e2e8f0'" onkeypress="if(event.key === 'Enter') quickAddTable()">
                    <button onclick="quickAddTable()" class="action-btn btn-primary" style="padding: 6px; width: 34px; height: 34px; border-radius: 8px; display:flex; justify-content:center; align-items:center; line-height:0;" title="Simpan"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
            </div>
        `;
        
        container.innerHTML = quickAddCard + TABLE_DATA.map(t => {
            const isAvailable = t.status === 'kosong';
            return `
            <div class="table-card ${t.status}" style="position: relative;">
                <div class="table-card-icon" style="margin-bottom: 8px;"><img src="assets/logo-vertical.png" alt="Logo" style="height: 50px; width: auto; object-fit: contain;"></div>
                <div class="table-card-num">Meja ${t.nomor_meja}</div>
                <div style="position: absolute; top: 12px; right: 12px;">
                    <span class="status-badge ${isAvailable ? 'avail' : 'occ'}" style="font-size: 0.75rem; padding: 4px 8px;">${isAvailable ? 'Kosong' : 'Terisi'}</span>
                </div>
                <div class="table-card-actions" style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button onclick="printQR('${t.nomor_meja}')" title="Cetak QR" style="background:transparent; border:none; color:#1e293b; cursor:pointer; padding:8px; display:flex; transition:color 0.2s;" onmouseover="this.style.color='#ca5128'" onmouseout="this.style.color='#1e293b'">
                        <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11,11H7V7h4Zm6-4H15V9h2ZM13,17h4V13H13ZM7,17H9V15H7Z" style="fill: none; stroke: #ca5128; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
                            <path d="M8,3H4A1,1,0,0,0,3,4V8" style="fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
                            <path d="M21,8V4a1,1,0,0,0-1-1H16" style="fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
                            <path d="M3,16v4a1,1,0,0,0,1,1H8" style="fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
                            <path d="M16,21h4a1,1,0,0,0,1-1V16" style="fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
                        </svg>
                    </button>
                    <button onclick="toggleStatus(${t.id}, '${t.status}')" title="Ubah Status (Kosong/Terisi)" style="background:transparent; border:none; color:#1e293b; cursor:pointer; padding:8px; display:flex; transition:color 0.2s;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#1e293b'">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="17 1 21 5 17 9"></polyline>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                            <polyline points="7 23 3 19 7 15"></polyline>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                        </svg>
                    </button>
                    <button onclick="deleteTable(${t.id})" title="Hapus Meja" style="background:transparent; border:none; color:#1e293b; cursor:pointer; padding:8px; display:flex; transition:color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#1e293b'">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
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
        if (data.success) { 
            renderTables(); 
            renderStats(); 
        } else {
            sd_error('Gagal Hapus', data.message || 'Terjadi kesalahan saat menghapus meja');
        }
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




let currentMenuFilter = 'Semua';

window.setMenuFilter = function(cat) {
    currentMenuFilter = cat;
    renderMenu();
};

async function renderMenu() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        const MENU_DATA = await response.json();
        const grid = document.getElementById('adminMenuGrid');
        if (!grid) return;

        const filterBox = document.getElementById('menuFilterBox');
        if (filterBox) {
            const categories = ['Semua', ...new Set(MENU_DATA.map(m => m.nama_kategori).filter(Boolean))];
            filterBox.innerHTML = categories.map(cat => {
                const isActive = (cat === currentMenuFilter) ? 'active' : '';
                return `<button class="filter-pill ${isActive}" onclick="setMenuFilter('${cat}')">${cat}</button>`;
            }).join('');
        }

        let filteredData = MENU_DATA;
        if (currentMenuFilter !== 'Semua') {
            filteredData = MENU_DATA.filter(m => m.nama_kategori === currentMenuFilter);
        }

        grid.innerHTML = filteredData.map(m => {
            const isAvail = m.is_available === 1;
            const visualBox = m.gambar 
                ? `<img src="${SERVER_URL}${m.gambar}" class="menu-card-img" />`
                : `<div class="menu-card-img" style="display:flex; align-items:center; justify-content:center; background:#f1f5f9;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="34" r="18" fill="rgba(0,0,0,0.05)"/>
                        <circle cx="32" cy="32" r="18" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5"/>
                        <circle cx="32" cy="32" r="11" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                        <rect x="12" y="16" width="2" height="11" rx="1" fill="#94a3b8"/>
                        <rect x="16" y="16" width="2" height="11" rx="1" fill="#94a3b8"/>
                        <rect x="20" y="16" width="2" height="11" rx="1" fill="#94a3b8"/>
                        <path d="M12 25 v 2 c0 2.2 1.8 4 4 4 s 4-1.8 4-4 v-2 Z" fill="#94a3b8"/>
                        <rect x="15" y="31" width="2" height="18" rx="1" fill="#94a3b8"/>
                        <path d="M47 16 h 3 c 1.6 0 3 1.4 3 3 v 12 h -6 V 16 Z" fill="#94a3b8"/>
                        <rect x="47" y="31" width="6" height="18" rx="2.5" fill="#94a3b8"/>
                    </svg>
                   </div>`;

            return `
            <div class="menu-card" style="position:relative;">
                ${visualBox}
                <div class="badge-grid" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.95); padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; color:#334155; box-shadow:0 2px 5px rgba(0,0,0,0.15); z-index:2;">
                    ${m.nama_kategori || 'Kategori ' + m.kategori_id}
                </div>
                <div class="menu-card-body">
                    <div style="display:flex; flex-direction:column; align-items:flex-start; gap:6px;">
                        <div class="menu-card-title" style="margin-bottom:0;">${m.nama_menu}</div>
                        <div class="badge-list" style="background:#f1f5f9; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; color:#475569; border:1px solid #e2e8f0;">
                            ${m.nama_kategori || 'Kategori ' + m.kategori_id}
                        </div>
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-bottom:0; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${m.deskripsi || '-'}
                    </div>
                    <div class="menu-card-price" style="color: #ca5128; font-weight: 800; font-size: 1.1rem;">${rp(m.harga)}</div>
                    <div class="menu-card-footer">
                        <span id="status-badge-${m.id}" class="status-badge ${isAvail ? 'avail' : 'occ'}" style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="toggleMenuStatus(${m.id}, ${m.is_available})">${isAvail ? 'TERSEDIA' : 'HABIS'} <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M21 8A9 9 0 0 0 6 5.3L3 8"/><path d="M3 22v-6h6"/><path d="M3 16a9 9 0 0 0 15 2.7L21 16"/></svg></span>
                        <div class="menu-card-actions" style="display:flex; gap:6px;">
                            <button onclick="editMenu(${m.id})" title="Edit" style="background:transparent; border:none; color:var(--grey); cursor:pointer; padding:6px; display:flex; transition:color 0.2s;" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color='var(--grey)'">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button onclick="deleteMenu(${m.id})" title="Hapus" style="background:transparent; border:none; color:var(--grey); cursor:pointer; padding:6px; display:flex; transition:color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--grey)'">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

function setMenuView(view) {
    const grid = document.getElementById('adminMenuGrid');
    const btnGrid = document.getElementById('btnViewGrid');
    const btnList = document.getElementById('btnViewList');
    
    if (!grid) return;

    if (view === 'grid') {
        grid.className = 'menu-card-grid';
        if (btnGrid) {
            btnGrid.style.background = 'white';
            btnGrid.style.boxShadow = 'var(--shadow-sm)';
            btnGrid.style.color = 'var(--dark)';
        }
        if (btnList) {
            btnList.style.background = 'transparent';
            btnList.style.boxShadow = 'none';
            btnList.style.color = 'var(--grey)';
        }
    } else {
        grid.className = 'menu-card-grid list-mode';
        if (btnList) {
            btnList.style.background = 'white';
            btnList.style.boxShadow = 'var(--shadow-sm)';
            btnList.style.color = 'var(--dark)';
        }
        if (btnGrid) {
            btnGrid.style.background = 'transparent';
            btnGrid.style.boxShadow = 'none';
            btnGrid.style.color = 'var(--grey)';
        }
    }
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
        document.getElementById('editKategoriId').value = m.kategori_id;
            const selectedCat = _allKategoriCache.find(k => k.id == m.kategori_id);
            document.getElementById('catSelectedText-edit').innerText = selectedCat ? selectedCat.nama_kategori : '-- Pilih Kategori --';

        document.getElementById('editMenuId').value = m.id;
        document.getElementById('editNamaMenu').value = m.nama_menu;
        document.getElementById('editHarga').value = m.harga;
        document.getElementById('editDeskripsi').value = m.deskripsi || '';
        const fileInput = document.getElementById('editGambar');
        if (fileInput) fileInput.value = '';

        if (imgBox && m.gambar) {
            imgBox.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:.75rem; color:var(--grey); margin-bottom:6px;">Foto saat ini:</div>
                    <div style="position:relative; display:inline-block; width:80px; height:80px;" id="existingImgContainer">
                        <img src="${SERVER_URL}${m.gambar}" style="width:100%; height:100%; object-fit:cover; border-radius:10px; border:2px solid var(--border);"/>
                        <button type="button" onclick="removeExistingImage(event)" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">✕</button>
                    </div>
                    <input type="hidden" id="hapusFotoLama" value="false" />
                </div>
            `;
        }

        const modal = document.getElementById('editMenuModal');
        if (modal) {
            document.body.style.overflow = 'hidden';
            modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
        }
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
    <div style="position:relative; display:inline-block;">
        <img src="${e.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:10px; border:2px solid var(--success);"/>
        <button type="button" onclick="clearEditImagePreview(event)" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">✕</button>
    </div>
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
        if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + 'Nama menu dan harga wajib diisi!'; }
        return;
    }

    const formData = new FormData();
    formData.append('kategori_id', kategori_id);
    formData.append('nama_menu', nama_menu);
    formData.append('harga', harga);
    formData.append('deskripsi', deskripsi);
    if (gambarFile) formData.append('gambar', gambarFile);
    const hapusLamaInput = document.getElementById('hapusFotoLama');
    if (hapusLamaInput && hapusLamaInput.value === 'true') {
        formData.append('hapus_foto_lama', 'true');
    }

    try {
        const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'PUT', body: formData });
        const data = await res.json();
        if (data.success) {
            if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#34d399'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>' + data.message; }
            setTimeout(() => {
                closeEditModal();
                renderMenu();
            }, 800);
        } else {
            if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + data.message; }
        }
    } catch (e) {
        if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + 'Gagal terhubung ke server.'; }
    }
}

function closeEditModal() {
    const modal = document.getElementById('editMenuModal');
    if (modal) {
        modal.style.display = 'none'; document.body.style.overflow = '';
        document.body.style.overflow = '';
        const fileInput = document.getElementById('editGambar');
        if (fileInput) fileInput.value = '';
    }
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

async function openAddModal() {
    const modal = document.getElementById('addMenuModal');
    if (modal) {
        document.body.style.overflow = 'hidden';
        modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
        document.getElementById('addKategoriId').value = '';
        document.getElementById('addNamaMenu').value = '';
        document.getElementById('addHarga').value = '';
        document.getElementById('addDeskripsi').value = '';
        document.getElementById('addGambar').value = '';
        const previewContainer = document.getElementById('addImgPreviewContainer');
        if (previewContainer) previewContainer.style.display = 'none';
        
        // Populate Kategori
        try {
            const res = await fetch(`${API_BASE}/kategori`);
            const data = await res.json();
            const select = document.getElementById('addKategoriId');
            if (select) {
                window._allKategoriCache = data;
                renderKategoriOptions(select, null);
            }
        } catch (e) { console.error(e); }
    }
}

function closeAddModal() {
    const modal = document.getElementById('addMenuModal');
    if (modal) {
        modal.style.display = 'none'; document.body.style.overflow = '';
        document.body.style.overflow = '';
        const fileInput = document.getElementById('addGambar');
        if (fileInput) fileInput.value = '';
    }
}

function previewAddImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('addImgPreviewContainer');
    const previewImg = document.getElementById('addImgPreview');
    if (file && previewContainer && previewImg) {
        previewImg.src = URL.createObjectURL(file);
        
        let clearBtn = document.getElementById('addImgClearBtn');
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.id = 'addImgClearBtn';
            clearBtn.type = 'button';
            clearBtn.innerHTML = '✕';
            clearBtn.style.cssText = 'position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;';
            clearBtn.onclick = function(e) {
                e.preventDefault();
                const fileInput = document.getElementById('addGambar');
                if (fileInput) fileInput.value = '';
                previewContainer.style.display = 'none';
                previewImg.src = '';
            };
            
            // Wrap the image if not already wrapped
            if (previewImg.parentNode.id === 'addImgPreviewContainer') {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position:relative; display:inline-block; width:80px; height:80px;';
                previewImg.parentNode.insertBefore(wrapper, previewImg);
                previewImg.style.width = '100%';
                previewImg.style.height = '100%';
                wrapper.appendChild(previewImg);
                wrapper.appendChild(clearBtn);
            } else {
                previewImg.parentNode.appendChild(clearBtn);
            }

        }
        
        previewContainer.style.display = 'block';
    }
}

async function saveAddMenu() {
    const kategori_id = document.getElementById('addKategoriId').value;
    const nama_menu = document.getElementById('addNamaMenu').value.trim();
    const harga = document.getElementById('addHarga').value;
    const deskripsi = document.getElementById('addDeskripsi').value.trim();
    const imageFile = document.getElementById('addGambar')?.files[0];
    const msgEl = document.getElementById('addMenuMsg');

    if (!kategori_id || !nama_menu || !harga) {
        if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + 'Kategori, Nama, dan Harga wajib diisi!'; }
        return;
    }

    const formData = new FormData();
    formData.append('kategori_id', kategori_id);
    formData.append('nama_menu', nama_menu);
    formData.append('harga', harga);
    formData.append('deskripsi', deskripsi);
    if (imageFile) formData.append('gambar', imageFile);

    try {
        const res = await fetch(`${API_BASE}/menu`, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#34d399'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>' + result.message; }
            setTimeout(() => {
                if (msgEl) msgEl.textContent = '';
                closeAddModal();
                renderMenu();
            }, 800);
        } else {
            if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + result.message; }
        }
    } catch (e) {
        if (msgEl) { msgEl.style.display = 'flex'; msgEl.style.justifyContent = 'center'; msgEl.style.color = '#ef4444'; msgEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' + 'Gagal terhubung ke server.'; }
    }
}

function logoutAdmin() {
    sd_confirm('Keluar Sistem?', 'Anda akan keluar dari dashboard admin.', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Keluar').then(res => {
        if (res.isConfirmed) {
            if (refreshInterval) clearInterval(refreshInterval);
            localStorage.removeItem('adminSession');
            window.location.href = 'index.html';
        }
    });
}

