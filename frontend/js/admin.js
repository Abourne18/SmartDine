// Cek Role dan Login
const sessionData = localStorage.getItem('adminSession');
if (!sessionData) {
    alert('Akses Ditolak! Anda harus login terlebih dahulu.');
    window.location.href = 'login.html';
}
const adminInfo = JSON.parse(sessionData);

// Sidebar
function showAdminTab(tabId, event) {
  document.querySelectorAll('main > div[id^="atab-"]').forEach(el => { el.style.display = 'none'; });
  document.getElementById('atab-' + tabId).style.display = 'block';

  if(event) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }

  if (tabId === 'tables') renderTables();
  else if (tabId === 'qr') renderQR();
  else if (tabId === 'menu') renderMenu();
}

// Meja/QR
async function renderTables() {
  try {
    const response = await fetch('http://localhost:3000/api/meja');
    const TABLE_DATA = await response.json();
    document.getElementById('statTables').innerText = TABLE_DATA.length;
    document.getElementById('tablesContainer').innerHTML = TABLE_DATA.map(t => {
      const isAvailable = t.status === 'kosong';
      const badgeClass = isAvailable ? 'avail' : 'occ';
      const statusText = t.status.toUpperCase();
      return `
      <div class="card-box">
        <div class="emoji-box">🪑</div>
        <div class="info-box">
          <strong style="font-size:1.1rem">Meja ${t.nomor_meja}</strong><br/>
          <span class="status-badge ${badgeClass}" style="cursor:pointer;" onclick="toggleStatus(${t.id}, '${t.status}')" title="Klik untuk ubah status">${statusText} 🔄</span>
        </div>
      </div>`;
    }).join('');
  } catch (error) { console.error('Error:', error); }
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'kosong' ? 'terisi' : 'kosong';
    try {
        const response = await fetch(`http://localhost:3000/api/meja/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if(data.success) renderTables();
    } catch (error) { console.error('Error:', error); }
}

async function addTableItem() {
    const nomor = document.getElementById('newTableNo').value;
    const status = document.getElementById('newTableStatus').value;
    if(!nomor) return alert('Nomor meja tidak boleh kosong!');

    try {
        const response = await fetch('http://localhost:3000/api/meja', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomor_meja: nomor, status: status })
        });
        const result = await response.json();
        if(result.success) {
            alert('Meja berhasil ditambahkan!');
            document.getElementById('newTableNo').value = ''; 
            document.getElementById('newTableStatus').value = 'kosong'; 
            showAdminTab('tables'); 
        }
    } catch (error) { console.error('Error:', error); }
}

async function renderQR() {
  try {
    const response = await fetch('http://localhost:3000/api/meja');
    const TABLE_DATA = await response.json();
    document.getElementById('qrContainer').innerHTML = TABLE_DATA.map(t => {
      const qrImageUrl = t.token_qr ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${t.token_qr}` : '';
      const qrImgTag = t.token_qr ? `<img src="${qrImageUrl}" alt="QR Meja ${t.nomor_meja}" class="qr-canvas" style="width:160px; height:160px;">` : `<div class="qr-canvas" style="width:160px; height:160px; display:flex; align-items:center; justify-content:center; background:#eee;">Kosong</div>`;
      return `
      <div class="qr-wrapper">
        <h3>Meja ${t.nomor_meja}</h3>
        ${qrImgTag}
        <button class="action-btn" style="margin-top:15px; width:100%; background:var(--brand); color:white;" onclick="window.open('${qrImageUrl}', '_blank')">Cetak QR</button>
      </div>`;
    }).join('');
  } catch (error) { console.error('Error:', error); }
}

// Menu
async function renderMenu() {
  try {
    const response = await fetch('http://localhost:3000/api/menu');
    const MENU_DATA = await response.json();
    
    document.getElementById('adminMenuGrid').innerHTML = MENU_DATA.map(m => {
      const isAvail = m.is_available === 1;
      const badgeClass = isAvail ? 'avail' : 'occ';
      const statusText = isAvail ? 'TERSEDIA' : 'HABIS';
      const hargaRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(m.harga);
      
      return `
      <div class="card-box">
        <div class="emoji-box">🍽️</div>
        <div class="info-box">
          <strong style="font-size:1.1rem">${m.nama_menu}</strong><br/>
          <small style="color: #666;">ID Kategori: ${m.kategori_id} | ${hargaRupiah}</small><br/>
          <span class="status-badge ${badgeClass}" style="cursor:pointer; margin-top: 5px;" onclick="toggleMenuStatus(${m.id}, ${m.is_available})" title="Klik untuk ubah ketersediaan">${statusText} 🔄</span>
        </div>
      </div>`;
    }).join('');
  } catch (error) { console.error('Error:', error); }
}

async function toggleMenuStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
        const response = await fetch(`http://localhost:3000/api/menu/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: newStatus })
        });
        const data = await response.json();
        if(data.success) renderMenu(); 
    } catch (error) { console.error('Error:', error); }
}

async function addMenuItem() {
    const kategori_id = document.getElementById('newKategoriId').value;
    const nama_menu = document.getElementById('newName').value;
    const harga = document.getElementById('newPrice').value;

    if(!kategori_id || !nama_menu || !harga) return alert('Semua kolom menu harus diisi!');

    try {
        const response = await fetch('http://localhost:3000/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kategori_id, nama_menu, harga })
        });
        const result = await response.json();

        if(result.success) {
            alert('Menu berhasil ditambahkan!');
            document.getElementById('newKategoriId').value = '';
            document.getElementById('newName').value = '';
            document.getElementById('newPrice').value = '';
            showAdminTab('menu'); 
        } else {
            alert('Gagal menyimpan menu.');
        }
    } catch (error) { console.error('Error:', error); }
}

// Kategori
async function renderKategori() {
    try {
        const response = await fetch('http://localhost:3000/api/kategori');
        const KATEGORI_DATA = await response.json();
        const selectKategori = document.getElementById('newKategoriId');
        
        selectKategori.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>' + 
            KATEGORI_DATA.map(k => `<option value="${k.id}">${k.nama_kategori}</option>`).join('');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('newKategoriId').innerHTML = '<option value="" disabled selected>Gagal memuat kategori</option>';
    }
}

// Logout
function logoutAdmin() {
    localStorage.removeItem('adminSession');
    alert('Anda telah keluar.');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Hak akses
  if (adminInfo.peran === 'dapur') {
      document.getElementById('nav-addtable').style.display = 'none';
      document.getElementById('nav-addmenu').style.display = 'none';
      document.getElementById('roleSubtitle').innerText = 'Panel Kasir / Dapur';
  } else {
      document.getElementById('roleSubtitle').innerText = 'Panel Admin Khusus';
  }
  renderTables();
  renderQR();
  renderMenu();
  renderKategori();
});
