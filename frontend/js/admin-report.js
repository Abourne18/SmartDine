// ============================================================
// RIWAYAT TRANSAKSI & BULK DELETE
// ============================================================
window._isSelectMode = false;
window._selectedOrders = new Set();
window._pressTimer = null;
window._justLongPressed = false;
let _historyOrdersCache = [];

window.updateBulkActionUI = function() {
    const bulkBox = document.getElementById('historyBulkActions');
    const bulkText = document.getElementById('bulkDeleteText');
    const bulkBtn = document.getElementById('btnBulkDeleteHistory');
    if (!bulkBox) return;

    if (window._isSelectMode) {
        bulkBox.style.display = 'inline-flex';
        const count = window._selectedOrders.size;
        if (bulkText) bulkText.textContent = count > 0 ? `Hapus Terpilih (${count})` : 'Hapus Terpilih';
        if (bulkBtn) {
            bulkBtn.style.opacity = count > 0 ? '1' : '0.5';
            bulkBtn.style.pointerEvents = count > 0 ? 'auto' : 'none';
        }
    } else {
        bulkBox.style.display = 'none';
    }
};

window.toggleSelectMode = function(orderId) {
    if (!window._isSelectMode) {
        window._isSelectMode = true;
        window._justLongPressed = true;
        setTimeout(() => { window._justLongPressed = false; }, 400);

        window._selectedOrders.clear();
        if (orderId) window._selectedOrders.add(String(orderId));

        window.updateBulkActionUI();
        renderHistory();
    }
};

window.toggleOrderSelection = function(orderId) {
    if (window._justLongPressed) return;
    const id = String(orderId);
    if (window._selectedOrders.has(id)) window._selectedOrders.delete(id);
    else window._selectedOrders.add(id);

    window.updateBulkActionUI();
    window.reRenderHistoryTableOnly();
};

window.toggleSelectAllHistory = function(selectAll) {
    const checkboxes = document.querySelectorAll('.history-checkbox');
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        if (selectAll) window._selectedOrders.add(String(id));
        else window._selectedOrders.delete(String(id));
    });
    window.updateBulkActionUI();
    window.reRenderHistoryTableOnly();
};

window.cancelHistorySelectMode = function() {
    window._isSelectMode = false;
    window._selectedOrders.clear();
    window.updateBulkActionUI();
    renderHistory();
};

window.reRenderHistoryTableOnly = function() {
    const trs = document.querySelectorAll('.history-tr');
    let allChecked = trs.length > 0;
    trs.forEach(tr => {
        const id = tr.getAttribute('data-id');
        const isChecked = window._selectedOrders.has(String(id));
        const cb = tr.querySelector('.history-checkbox');
        if (cb) cb.checked = isChecked;

        if (isChecked) tr.style.background = '#fee2e2';
        else { tr.style.background = 'transparent'; allChecked = false; }
    });

    const selectAllCb = document.getElementById('selectAllHistory');
    if (selectAllCb) selectAllCb.checked = allChecked;
};

window.executeBulkDeleteHistory = async function() {
    if (window._selectedOrders.size === 0) return;
    const count = window._selectedOrders.size;

    const confirmRes = await sd_confirm('Hapus Riwayat Transaksi?', `Apakah Anda yakin ingin menghapus ${count} riwayat transaksi secara permanen? Data rekap harian tetap aman.`);
    if (!confirmRes.isConfirmed) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/pesanan/bulk`, {
            method: 'DELETE',
            body: JSON.stringify({ ids: Array.from(window._selectedOrders) })
        });
        const result = await res.json();
        if (result.success) {
            sd_toast(result.message || `${count} riwayat berhasil dihapus.`, 'success');
            window._isSelectMode = false;
            window._selectedOrders.clear();
            window.updateBulkActionUI();
            await renderHistory();
            if (typeof renderStats === 'function') renderStats();
        } else {
            sd_error('Gagal Menghapus', result.message || result.error);
        }
    } catch (e) {
        console.error('Error delete bulk:', e);
        sd_error('Error', 'Terjadi kesalahan jaringan saat menghapus riwayat.');
    }
};

async function renderHistory() {
    const container = document.getElementById('historyContainer');
    const paginationContainer = document.getElementById('historyPagination');
    if (!container) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/pesanan`);
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        const allOrders = await res.json();

        const filterMejaEl = document.getElementById('filterMeja');
        if (filterMejaEl && filterMejaEl.options.length <= 1) {
            const tableNumbers = Array.from(new Set(allOrders.map(o => o.nomor_meja).filter(Boolean))).sort((a,b) => Number(a) - Number(b));
            tableNumbers.forEach(num => {
                const opt = document.createElement('option');
                opt.value = num;
                opt.textContent = `Meja ${num}`;
                filterMejaEl.appendChild(opt);
            });
        }

        let historyOrders = allOrders.filter(o => o.status_pesanan === 'selesai' || o.status_pesanan === 'dibatalkan');

        const searchInput = document.getElementById('searchHistory');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (query) {
            historyOrders = historyOrders.filter(o => {
                const orderNum = (o.order_num || `SD-${String(o.id).padStart(4, '0')}`).toLowerCase();
                const custName = (o.nama_pelanggan || '').toLowerCase();
                const tableStr = String(o.nomor_meja || '');
                return orderNum.includes(query) || custName.includes(query) || tableStr.includes(query);
            });
        }

        const selectedMeja = filterMejaEl ? filterMejaEl.value : '';
        if (selectedMeja) historyOrders = historyOrders.filter(o => String(o.nomor_meja) === String(selectedMeja));

        const filterStatusEl = document.getElementById('filterStatus');
        const selectedStatus = filterStatusEl ? filterStatusEl.value : '';
        if (selectedStatus) historyOrders = historyOrders.filter(o => o.status_pesanan === selectedStatus);

        _historyOrdersCache = historyOrders;

        if (historyOrders.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--grey);">Tidak ada riwayat transaksi yang cocok.</div>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            window.updateBulkActionUI();
            return;
        }

        const totalPages = Math.ceil(historyOrders.length / itemsPerPage);
        if (currentPageHistory > totalPages) currentPageHistory = totalPages;
        if (currentPageHistory < 1) currentPageHistory = 1;
        const startIndex = (currentPageHistory - 1) * itemsPerPage;
        const paginatedOrders = historyOrders.slice(startIndex, startIndex + itemsPerPage);

        const tbodyHtml = paginatedOrders.map(order => {
            const tglStr = new Date(order.waktu_pesan).toLocaleDateString('id-ID');
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = order.status_pesanan === 'selesai' 
                ? '<span style="background:#d1fae5; color:#065f46; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">SELESAI</span>'
                : '<span style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIBATALKAN</span>';

            const itemsText = order.items && order.items.length > 0
                ? order.items.map(it => `${it.kuantitas}x ${it.nama_menu}`).join(', ')
                : '-';

            const isSelected = window._isSelectMode && window._selectedOrders.has(String(order.id));

            return `
                <tr class="history-tr" data-id="${order.id}" 
                    style="border-bottom: 1px solid #e5e7eb; transition: background 0.15s; cursor: ${window._isSelectMode ? 'pointer' : 'default'}; ${isSelected ? 'background: #fee2e2;' : ''}"
                    onmouseover="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='var(--lighter)'"
                    onmouseout="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='transparent'"
                    onmousedown="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                    onmouseup="clearTimeout(window._pressTimer);"
                    onmouseleave="clearTimeout(window._pressTimer);"
                    ontouchstart="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                    ontouchend="clearTimeout(window._pressTimer);"
                    onclick="if(window._justLongPressed) return; if(window._isSelectMode) { window.toggleOrderSelection('${order.id}'); } else if (window._pressTimer) { clearTimeout(window._pressTimer); }">
                    <td style="padding: 12px 16px; font-weight: 600;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${window._isSelectMode ? `<input type="checkbox" class="history-checkbox" data-id="${order.id}" style="width:16px; height:16px; cursor:pointer;" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleOrderSelection('${order.id}');">` : ''}
                            <span>${order.order_num || 'SD-' + String(order.id).padStart(4, '0')}</span>
                        </div>
                    </td>
                    <td style="padding: 12px 16px; color: #6b7280;">${tglStr}, ${waktu}</td>
                    <td style="padding: 12px 16px; text-align: center; font-weight: 600;">Meja ${order.nomor_meja}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; color: #374151;">${itemsText}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #d97706;">${rp(order.total_harga)}</td>
                    <td style="padding: 12px 16px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px 16px; text-align: center;">
                        ${order.status_pesanan === 'selesai' ? `
                            <button onclick="event.stopPropagation(); cetakStruk('${order.id}')" style="background:#f3f4f6; border:1px solid #d1d5db; border-radius:6px; padding:6px 10px; font-size:0.75rem; font-weight:700; cursor:pointer; color:#374151; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Struk
                            </button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        }).join('');

        const selectAllChecked = paginatedOrders.length > 0 && paginatedOrders.every(o => window._selectedOrders.has(String(o.id)));

        container.innerHTML = `
            <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #374151;">
                            <th style="padding: 12px 16px; font-weight: 700;">
                                ${window._isSelectMode ? `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="selectAllHistory" style="width:16px; height:16px; cursor:pointer;" ${selectAllChecked ? 'checked' : ''} onchange="window.toggleSelectAllHistory(this.checked)">
                                    <span>Pilih Semua</span>
                                </div>
                                ` : 'ID Pesanan'}
                            </th>
                            <th style="padding: 12px 16px; font-weight: 700;">Tgl, Jam</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Meja</th>
                            <th style="padding: 12px 16px; font-weight: 700;">Pesanan</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Total</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Status</th>
                            <th style="padding: 12px 16px; font-weight: 700; text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
            </div>
        `;

        if (paginationContainer) {
            if (totalPages > 1) {
                let pagHtml = '';
                for (let i = 1; i <= totalPages; i++) {
                    const active = (i === currentPageHistory);
                    pagHtml += `
                        <button class="action-btn" 
                            style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; border: 1px solid ${active ? 'var(--brand)' : 'var(--border)'}; background: ${active ? 'var(--brand)' : 'white'}; color: ${active ? 'white' : 'var(--dark)'}; cursor: pointer; font-weight: ${active ? '700' : '500'};"
                            onclick="currentPageHistory = ${i}; renderHistory();">
                            ${i}
                        </button>
                    `;
                }
                paginationContainer.innerHTML = pagHtml;
            } else {
                paginationContainer.innerHTML = '';
            }
        }
        window.updateBulkActionUI();
    } catch (e) { console.error('Error renderHistory:', e); }
}


// ============================================================
// REKAP HARIAN & PENCETAKAN LAPORAN PENDAPATAN
// ============================================================
let currentSortColumn = 'tanggal';
let currentSortDirection = 'desc';
let _rekapDataCache = [];

function sortRekapData(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'desc';
    }
    currentPageRekap = 1;
    renderRekapHarian();
}

async function renderRekapHarian() {
    const container = document.getElementById('rekapContainer');
    const paginationContainer = document.getElementById('rekapPagination');
    if (!container) return;

    try {
        const res = await fetchWithAuth(`${API_BASE}/rekap-harian`);
        if (!res.ok) throw new Error('Gagal mengambil data rekap harian');
        let rekapData = await res.json();
        _rekapDataCache = rekapData;

        if (rekapData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--border);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg></div>
                    <div class="empty-title">Belum Ada Data Rekap</div>
                    <div class="empty-sub">Data rekap harian akan muncul otomatis saat ada pesanan berstatus selesai.</div>
                </div>
            `;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const grandTotalRevenue = rekapData.reduce((sum, item) => sum + Number(item.total_pendapatan || 0), 0);
        const grandTotalOrders = rekapData.reduce((sum, item) => sum + Number(item.total_pesanan || 0), 0);

        rekapData.sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];

            if (currentSortColumn === 'tanggal') {
                valA = new Date(valA);
                valB = new Date(valB);
            } else {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            }

            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        const totalPages = Math.ceil(rekapData.length / itemsPerPage);
        if (currentPageRekap > totalPages) currentPageRekap = totalPages;
        const startIndex = (currentPageRekap - 1) * itemsPerPage;
        const paginatedRekap = rekapData.slice(startIndex, startIndex + itemsPerPage);

        const getSortIcon = (colName) => {
            if (currentSortColumn !== colName) return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; opacity:0.3;"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>';
            return currentSortDirection === 'asc' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; color:var(--brand);"><path d="M18 15l-6-6-6 6"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; color:var(--brand);"><path d="M6 9l6 6 6-6"/></svg>';
        };

        container.innerHTML = `
            <div class="stats-row" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon-box green"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg></div>
                    <div><strong>${rp(grandTotalRevenue)}</strong><small>Akumulasi Pendapatan</small></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon-box orange"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></div>
                    <div><strong>${grandTotalOrders} Pesanan</strong><small>Total Keseluruhan Selesai</small></div>
                </div>
            </div>
            <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm);">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #f7ece4; border-bottom: 1px solid var(--border); color: #000000;">
                                <th onclick="sortRekapData('tanggal')" style="padding: 16px 20px; font-weight: 700; cursor: pointer; user-select: none;">
                                    Tanggal ${getSortIcon('tanggal')}
                                </th>
                                <th onclick="sortRekapData('total_pesanan')" style="padding: 16px 20px; font-weight: 700; text-align: center; cursor: pointer; user-select: none;">
                                    Jumlah Pesanan Selesai ${getSortIcon('total_pesanan')}
                                </th>
                                <th onclick="sortRekapData('total_pendapatan')" style="padding: 16px 20px; font-weight: 700; text-align: right; cursor: pointer; user-select: none;">
                                    Total Pendapatan Harian ${getSortIcon('total_pendapatan')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedRekap.map(row => {
                                const formattedDate = new Date(row.tanggal).toLocaleDateString('id-ID', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                });
                                return `
                                    <tr style="border-bottom: 1px solid var(--border); transition: background 0.15s;" onmouseover="this.style.background='var(--lighter)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 16px 20px; font-weight: 600; color: var(--dark);">${formattedDate}</td>
                                        <td style="padding: 16px 20px; text-align: center;"><span class="status-badge badge-selesai">${row.total_pesanan} Transaksi</span></td>
                                        <td style="padding: 16px 20px; text-align: right; font-weight: 800; color: var(--brand);">${rp(row.total_pendapatan)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        renderPaginationControls(paginationContainer, currentPageRekap, totalPages, (newPage) => {
            currentPageRekap = newPage;
            renderRekapHarian();
        });

    } catch (e) {
        console.error('Error renderRekapHarian:', e);
    }
}

function cetakRekapHarian() {
    if (!_rekapDataCache || _rekapDataCache.length === 0) {
        sd_error('Gagal', 'Tidak ada data rekap untuk dicetak.');
        return;
    }

    const cetakWaktu = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
    const grandTotalRevenue = _rekapDataCache.reduce((sum, item) => sum + Number(item.total_pendapatan || 0), 0);
    const grandTotalOrders = _rekapDataCache.reduce((sum, item) => sum + Number(item.total_pesanan || 0), 0);

    const rowsHtml = _rekapDataCache.map((row, index) => {
        const formattedDate = new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return `
            <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: center;">${row.total_pesanan} Transaksi</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${rp(row.total_pendapatan)}</td>
            </tr>
        `;
    }).join('');

    const headerHtml = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px; color: #0f172a;">SmartDine Resto</h3>
            <div style="font-size: 11px; color: #64748b;">Jl. Raya Kuliner No. 88<br>Telp: 0812-3456-7890</div>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 8px;">LAPORAN REKAPITULASI PENDAPATAN HARIAN</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Dicetak pada: ${cetakWaktu}</div>
        </div>
    `;

    const previewHtml = `
        <div style="font-family: Arial, sans-serif; font-size: 13px; color: #000; text-align: left; max-height: 450px; overflow-y: auto; padding: 5px;">
            ${headerHtml}
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0; font-size: 12px;">
                <div><strong>Total Transaksi:</strong> ${grandTotalOrders} Pesanan</div>
                <div><strong>Total Pendapatan:</strong> <span style="color: #ca5128; font-weight: bold;">${rp(grandTotalRevenue)}</span></div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f7ece4; border-bottom: 2px solid #cbd5e1; color: #0f172a;">
                        <th style="padding: 8px; text-align: center;">No</th>
                        <th style="padding: 8px; text-align: left;">Tanggal</th>
                        <th style="padding: 8px; text-align: center;">Pesanan Selesai</th>
                        <th style="padding: 8px; text-align: right;">Pendapatan Harian</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;

    SD_SWAL.fire({
        title: 'Preview Laporan Rekap', html: previewHtml, showCancelButton: true,
        confirmButtonText: 'Cetak Laporan', cancelButtonText: 'Batal', confirmButtonColor: 'var(--brand)', width: '680px'
    }).then((result) => {
        if (result.isConfirmed) {
            const printHtml = `
                <html>
                <head>
                    <title>Laporan Rekap Harian - SmartDine</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; padding: 25px; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                        .summary { display: flex; justify-content: space-between; border: 1px solid #000; padding: 10px 15px; margin-bottom: 20px; font-weight: bold; background: #f9f9f9; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
                        th { background-color: #f2f2f2; text-align: center; }
                        .text-center { text-align: center; } .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2 style="margin: 0 0 3px 0; font-size: 18px;">SmartDine Resto</h2>
                        <div style="font-size: 12px; color: #333;">Jl. Raya Kuliner No. 88 | Telp: 0812-3456-7890</div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">LAPORAN REKAPITULASI PENDAPATAN HARIAN</div>
                        <div style="font-size: 11px; color: #555; margin-top: 3px;">Dicetak pada: ${cetakWaktu}</div>
                    </div>
                    <div class="summary">
                        <div>Total Keseluruhan Pesanan: ${grandTotalOrders} Selesai</div>
                        <div>Akumulasi Pendapatan: ${rp(grandTotalRevenue)}</div>
                    </div>
                    <table>
                        <thead>
                            <tr><th style="width: 40px;">No</th><th>Tanggal</th><th class="text-center">Jumlah Pesanan Selesai</th><th class="text-right">Total Pendapatan Harian</th></tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                    <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); };</script>
                </body>
                </html>
            `;
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(printHtml);
            printWindow.document.close();
        }
    });
}

function renderPaginationControls(containerEl, currentPage, totalPages, callback) {
    if (!containerEl || totalPages <= 1) {
        if (containerEl) containerEl.innerHTML = '';
        return;
    }
    let html = `
        <button class="action-btn btn-ghost btn-sm" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="(${callback.toString()})(${currentPage - 1})">◀ Sebelumnya</button>
        <span style="font-size: 0.85rem; font-weight: 600; color: var(--grey); padding: 0 10px;">Hal ${currentPage} dari ${totalPages}</span>
        <button class="action-btn btn-ghost btn-sm" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="(${callback.toString()})(${currentPage + 1})">Berikutnya ▶</button>
    `;
    containerEl.innerHTML = html;
}