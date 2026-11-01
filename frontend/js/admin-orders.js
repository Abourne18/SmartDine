// ============================================================
// STATISTIK & PESANAN AKTIF (PANTAUAN DAPUR & KASIR)
// ============================================================
async function renderStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
            const data = await res.json();
            const statOrders = document.getElementById('statOrders');
            const statRevenue = document.getElementById('statRevenue');
            const statTables = document.getElementById('statTables');
            const statMenu = document.getElementById('statMenu');

            if (statOrders) statOrders.innerText = data.total_orders || 0;
            if (statRevenue) statRevenue.innerText = rp(data.total_revenue || 0);
            if (statTables) statTables.innerText = data.total_tables || 0;

            try {
                const menuRes = await fetch(`${API_BASE}/menu`);
                if (menuRes.ok) {
                    const menuData = await menuRes.json();
                    const availableMenuCount = menuData.filter(m => m.is_available === 1).length;
                    if (statMenu) statMenu.innerText = availableMenuCount;
                } else {
                    if (statMenu) statMenu.innerText = data.total_menu || 0;
                }
            } catch (err) {
                if (statMenu) statMenu.innerText = data.total_menu || 0;
            }
        }
    } catch (e) {
        console.warn('Gagal memuat statistik:', e);
    }
}

let adminRefreshInterval = null;

async function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        const allOrders = await res.json();

        // FILTER UTAMA: 
        // 1. Hanya ambil status aktif (menunggu, diproses, dihidangkan)
        // 2. KHUSUS status 'menunggu', pastikan waktu pesanan sudah lewat dari 30 detik agar baru muncul di admin
        const now = Date.now();
        const orders = allOrders.filter(o => {
            if (o.status_pesanan === 'diproses' || o.status_pesanan === 'dihidangkan') {
                return true;
            }
            if (o.status_pesanan === 'menunggu') {
                const waktuOrderMs = new Date(o.waktu_pesan).getTime();
                const elapsedSec = Math.floor((now - waktuOrderMs) / 1000);
                return elapsedSec >= 30; // Baru muncul di admin setelah >= 30 detik
            }
            return false;
        });

        const badge = document.getElementById('ordersBadge');
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center; padding:40px; color:var(--grey);">
                    <div class="empty-title" style="font-weight:700; font-size:1.1rem; margin-bottom:8px;">Belum Ada Pesanan Masuk</div>
                    <div class="empty-sub" style="font-size:0.85rem;">Pesanan dari pelanggan akan muncul otomatis setelah masa konfirmasi 30 detik selesai.</div>
                </div>
            `;
            if (badge) badge.style.display = 'none';
            return;
        }

        if (badge) { badge.textContent = orders.length; badge.style.display = 'inline-flex'; }

        container.innerHTML = orders.map(order => {
            const waktuStr = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = '';
            let actionButtonsLeft = '';
            let actionButtonsRight = '';

            if (order.status_pesanan === 'menunggu') {
                statusBadge = '<span class="status-badge" style="background:#fef3c7; color:#d97706; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">MENUNGGU</span>';
                actionButtonsLeft = `
                    <button class="action-btn btn-info" onclick="updateOrderStatus(${order.id}, 'diproses')" style="padding:8px 14px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Terima Pesanan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
            } else if (order.status_pesanan === 'diproses') {
                statusBadge = '<span class="status-badge" style="background:#fef9c3; color:#ca8a04; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIMASAK</span>';
                actionButtonsLeft = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'dihidangkan')" style="padding:8px 14px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Siap Dihidangkan</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
            } else if (order.status_pesanan === 'dihidangkan') {
                statusBadge = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:50px; font-weight:700; font-size:0.75rem;">DIHIDANGKAN</span>';
                actionButtonsLeft = `
                    <button class="action-btn btn-success" onclick="updateOrderStatus(${order.id}, 'selesai')" style="padding:8px 14px; background:#059669; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">✅ Selesai</button>
                    <button class="action-btn btn-cancel btn-sm" onclick="updateOrderStatus(${order.id}, 'dibatalkan')" style="padding:8px 14px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem;">Batalkan</button>
                `;
                actionButtonsRight = `
                    <button class="action-btn" onclick="cetakStruk('${order.id}')" style="padding:8px 14px; background:#f8fafc; color:#475569; border:1px solid #cbd5e1; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem; display:inline-flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg> Cetak Struk
                    </button>
                `;
            }

            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(it => `
                    <div class="oac-item-row" style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.9rem;">
                        <div class="oac-item-name" style="display:flex; gap:8px;"><div class="oac-item-qty" style="font-weight:700;">${it.kuantitas}x</div>${it.nama_menu}</div>
                        <div class="oac-item-price" style="font-weight:600;">${rp(it.subtotal)}</div>
                    </div>
                `).join('')
                : '<div style="color:var(--grey-light);">Tidak ada rincian item</div>';

            const catatanHtml = order.catatan ? `<div class="oac-note" style="background:#f9fafb; padding:8px 12px; border-radius:6px; font-size:0.85rem; margin-bottom:12px;"><strong>Catatan:</strong> ${order.catatan}</div>` : '';

            return `
                <div class="order-admin-card" style="background:white; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div class="oac-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <div>
                            <div class="oac-order-num" style="font-weight:800; font-size:1rem; color:#111827;">${order.order_num || formatOrderId(order.id)}</div>
                            <div class="oac-meta" style="display:flex; gap:8px; font-size:0.80rem; color:#6b7280; margin-top:4px;">
                                <span>Meja ${order.nomor_meja}</span> • 
                                <span>${order.nama_pelanggan || 'Pelanggan'}</span> • 
                                <span>${waktuStr}</span> • 
                                <span>${order.metode_pembayaran?.toUpperCase()}</span>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    ${catatanHtml}
                    <div class="oac-items" style="border-top:1px dashed #e5e7eb; border-bottom:1px dashed #e5e7eb; padding:12px 0; margin-bottom:12px;">
                        ${itemsHtml}
                        <div class="oac-total-row" style="display:flex; justify-content:space-between; font-weight:800; margin-top:8px; font-size:0.95rem;">
                            <span>Total Tagihan</span>
                            <span class="oac-grand" style="color:#d97706;">${rp(order.total_harga)}</span>
                        </div>
                    </div>
                    <div class="oac-actions" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:8px;">${actionButtonsLeft}</div>
                        <div>${actionButtonsRight}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Auto-refresh setiap 3 detik
        if (!adminRefreshInterval) {
            adminRefreshInterval = setInterval(() => {
                renderOrders();
            }, 3000);
        }

    } catch (error) {
        console.error('Error renderOrders:', error);
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/pesanan/${orderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status_pesanan: newStatus })
        });
        const data = await response.json();
        if (data.success) { 
            renderOrders(); 
            renderStats(); 
            if (typeof renderHistory === 'function') renderHistory(); 
            if (typeof renderTables === 'function') renderTables(); 
        } else {
            alert(data.message || 'Gagal mengubah status pesanan');
        }
    } catch (error) { 
        console.error('Error updateOrderStatus:', error); 
    }
}

// ============================================================
// FUNGSI GLOBAL CETAK STRUK KASIR
// ============================================================
window.cetakStruk = async function(orderId) {
    try {
        const res = await fetch(`${API_BASE}/pesanan`);
        const orders = await res.json();
        const order = orders.find(o => String(o.id) === String(orderId));

        if (!order) {
            if(typeof sd_error === 'function') sd_error('Gagal', 'Data pesanan tidak ditemukan.');
            return;
        }

        const cetakWaktu = new Date().toLocaleString('id-ID', {
            dateStyle: 'medium', timeStyle: 'short'
        });

        const logoSvg = `
            <svg width="32" height="32" viewBox="0 0 1024 948" xmlns="http://www.w3.org/2000/svg">
                <path fill="#D05A2B" fill-rule="evenodd" d="M 606 716 L 606 732 L 607 733 L 608 733 L 609 732 L 620 732 L 621 733 L 625 733 L 626 734 L 628 734 L 629 735 L 630 735 L 632 737 L 633 737 L 637 741 L 637 742 L 639 744 L 639 746 L 640 747 L 640 749 L 641 750 L 641 759 L 642 759 L 643 760 L 648 760 L 649 759 L 654 759 L 655 758 L 656 758 L 658 756 L 658 747 L 657 746 L 657 742 L 656 741 L 656 739 L 655 738 L 655 737 L 654 736 L 654 735 L 653 734 L 653 733 L 651 731 L 651 730 L 644 723 L 643 723 L 642 722 L 641 722 L 639 720 L 638 720 L 637 719 L 636 719 L 635 718 L 633 718 L 632 717 L 629 717 L 628 716 L 623 716 L 622 715 L 607 715 Z M 314 417 L 315 416 L 417 416 L 419 418 L 419 432 L 418 433 L 418 442 L 419 443 L 419 500 L 418 501 L 419 504 L 418 505 L 418 515 L 419 516 L 418 517 L 418 518 L 417 519 L 316 519 L 314 517 Z M 296 396 L 295 397 L 295 537 L 296 538 L 437 538 L 437 396 Z M 75 565 L 78 587 L 146 588 L 167 611 L 189 619 L 828 619 L 851 610 L 870 588 L 935 588 L 940 585 L 940 563 L 936 561 L 527 561 L 520 488 L 523 480 L 544 459 L 549 442 L 537 353 L 530 355 L 529 429 L 524 433 L 518 429 L 513 355 L 504 355 L 500 427 L 495 433 L 488 428 L 487 355 L 480 353 L 477 359 L 468 442 L 472 457 L 497 488 L 489 561 L 80 561 Z M 746 261 L 746 273 L 745 274 L 745 280 L 746 281 L 746 452 L 745 453 L 746 457 L 745 459 L 746 463 L 746 468 L 745 469 L 746 471 L 746 475 L 745 476 L 746 479 L 746 538 L 877 538 L 878 537 L 877 533 L 877 513 L 876 512 L 876 503 L 875 502 L 875 495 L 874 494 L 874 488 L 873 487 L 873 481 L 870 469 L 870 464 L 866 452 L 866 448 L 864 444 L 863 437 L 856 416 L 854 413 L 847 393 L 840 380 L 840 378 L 824 349 L 813 332 L 788 300 L 758 270 Z M 272 261 L 270 261 L 259 270 L 229 300 L 217 314 L 192 350 L 172 387 L 172 389 L 167 398 L 162 413 L 160 416 L 154 434 L 154 437 L 152 441 L 146 465 L 143 485 L 142 486 L 142 492 L 141 493 L 141 502 L 140 503 L 139 533 L 138 534 L 139 538 L 272 538 Z M 598 208 L 600 206 L 701 206 L 703 208 L 703 309 L 702 310 L 600 310 L 598 308 L 598 307 L 599 306 L 598 305 L 598 303 L 599 302 L 599 260 L 598 259 L 599 258 L 599 252 L 598 251 L 599 250 L 599 224 L 598 223 L 599 222 L 599 221 L 598 220 Z M 314 208 L 315 207 L 320 207 L 321 206 L 416 206 L 419 209 L 419 211 L 418 212 L 418 218 L 419 219 L 419 251 L 418 252 L 418 261 L 419 262 L 419 274 L 418 275 L 418 280 L 419 281 L 419 282 L 418 283 L 418 284 L 419 285 L 419 296 L 418 297 L 418 301 L 419 302 L 419 307 L 418 308 L 418 309 L 417 310 L 316 310 L 314 308 Z M 579 188 L 580 189 L 580 196 L 579 197 L 579 240 L 580 241 L 579 243 L 579 267 L 580 268 L 579 269 L 580 270 L 579 271 L 580 272 L 580 282 L 579 283 L 579 313 L 580 315 L 579 316 L 580 317 L 580 324 L 579 325 L 579 328 L 581 330 L 617 330 L 618 329 L 619 330 L 626 330 L 627 329 L 629 330 L 648 330 L 649 329 L 651 330 L 677 330 L 678 329 L 679 330 L 683 330 L 684 329 L 689 329 L 690 330 L 691 329 L 718 330 L 723 328 L 723 188 L 722 187 L 580 187 Z M 296 187 L 295 188 L 295 329 L 297 330 L 418 330 L 419 329 L 421 330 L 423 329 L 424 330 L 428 330 L 429 329 L 433 330 L 434 329 L 437 329 L 437 187 Z M 452 151 L 452 164 L 565 164 L 565 153 L 564 152 L 564 149 L 563 148 L 563 145 L 562 144 L 562 142 L 560 139 L 560 137 L 559 136 L 559 135 L 558 134 L 558 133 L 556 131 L 556 130 L 552 126 L 552 125 L 548 121 L 547 121 L 542 116 L 541 116 L 539 114 L 538 114 L 537 113 L 536 113 L 535 112 L 534 112 L 533 111 L 532 111 L 529 109 L 527 109 L 526 108 L 524 108 L 523 107 L 519 107 L 518 106 L 499 106 L 498 107 L 494 107 L 493 108 L 491 108 L 490 109 L 488 109 L 487 110 L 486 110 L 485 111 L 484 111 L 483 112 L 482 112 L 481 113 L 480 113 L 479 114 L 478 114 L 476 116 L 475 116 L 473 118 L 472 118 L 464 126 L 464 127 L 461 130 L 461 131 L 459 133 L 459 134 L 458 135 L 458 136 L 456 139 L 456 141 L 454 144 L 454 146 L 453 147 L 453 150 Z M 102 51 L 136 29 L 180 18 L 845 18 L 901 35 L 937 65 L 957 97 L 968 137 L 968 810 L 957 851 L 926 894 L 888 919 L 852 929 L 173 929 L 123 912 L 90 885 L 66 846 L 57 807 L 57 140 L 74 85 Z M 84 39 L 55 77 L 39 128 L 39 820 L 53 867 L 80 905 L 123 935 L 165 947 L 860 947 L 902 935 L 935 914 L 970 871 L 986 818 L 986 129 L 977 92 L 950 48 L 907 15 L 852 0 L 173 0 L 125 12 Z "/>
            </svg>
        `;

        const itemsHtml = (order.items || []).map(it => `
            <tr>
                <td style="padding: 6px 0; text-align: left; vertical-align: top; width: 65%;">
                    <div style="font-weight: bold; margin-bottom: 2px;">${it.nama_menu}</div>
                    <div style="font-size: 11px; color: #555;">${it.kuantitas} x ${typeof rp === 'function' ? rp(it.harga) : it.harga}</div>
                </td>
                <td style="padding: 6px 0; text-align: right; vertical-align: bottom; width: 35%; font-weight: bold;">
                    ${typeof rp === 'function' ? rp(it.harga * it.kuantitas) : 'Rp' + (it.harga * it.kuantitas)}
                </td>
            </tr>
        `).join('');

        const layoutStrukHtml = `
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; text-align: left; background: #fff; padding: 20px; border-radius: 8px; max-width: 320px; margin: 0 auto; line-height: 1.4;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: center; margin-bottom: 5px;">${logoSvg}</div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold;">SmartDine Resto</h3>
                    <div style="font-size: 12px; margin-top: 2px;">Jl. Raya Kuliner No. 88</div>
                    <div style="font-size: 12px;">Telp: 0812-3456-7890</div>
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin-bottom: 10px;"></div>
                
                <div style="font-size: 12px;">
                    <table style="width: 100%; font-family: inherit; font-size: 12px; border-collapse: collapse;">
                        <tr><td style="width: 75px; padding-bottom: 4px; vertical-align: top;">No. Order</td><td style="width: 10px; padding-bottom: 4px; vertical-align: top;">:</td><td style="padding-bottom: 4px; vertical-align: top; font-weight: bold;">${order.order_num || order.id}</td></tr>
                        <tr><td style="padding-bottom: 4px; vertical-align: top;">Meja</td><td style="padding-bottom: 4px; vertical-align: top;">:</td><td style="padding-bottom: 4px; vertical-align: top; font-weight: bold;">${order.nomor_meja}</td></tr>
                        <tr><td style="padding-bottom: 4px; vertical-align: top;">Waktu</td><td style="padding-bottom: 4px; vertical-align: top;">:</td><td style="padding-bottom: 4px; vertical-align: top;">${cetakWaktu}</td></tr>
                        <tr><td style="padding-bottom: 4px; vertical-align: top;">Kasir</td><td style="padding-bottom: 4px; vertical-align: top;">:</td><td style="padding-bottom: 4px; vertical-align: top;">Admin</td></tr>
                    </table>
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
                
                <table style="width: 100%; font-family: inherit; font-size: 12px; border-collapse: collapse;">
                    <tbody>${itemsHtml}</tbody>
                </table>
                
                <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
                
                <table style="width: 100%; font-family: inherit; font-size: 14px; font-weight: bold; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: left; padding: 4px 0;">TOTAL</td>
                        <td style="text-align: right; padding: 4px 0;">${typeof rp === 'function' ? rp(order.total_harga) : 'Rp' + order.total_harga}</td>
                    </tr>
                </table>
                
                <div style="font-size: 12px; margin-top: 5px;">Pembayaran: ${String(order.metode_pembayaran).toUpperCase()}</div>
                
                <div style="border-bottom: 1px dashed #000; margin: 15px 0 10px 0;"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Terima Kasih Atas Kunjungan Anda!</div>
            </div>
        `;

        SD_SWAL.fire({
            title: 'Preview Struk Pesanan',
            html: `<div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">${layoutStrukHtml}</div>`,
            showCancelButton: true,
            confirmButtonText: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:text-bottom;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Cetak Struk',
            cancelButtonText: 'Batal',
            confirmButtonColor: 'var(--brand)',
            width: '420px'
        }).then((result) => {
            if (result.isConfirmed) {
                const strukHtmlWindow = `
                    <html>
                    <head>
                        <title>Struk Pesanan - ${order.order_num || order.id}</title>
                        <style>
                            @page { margin: 0; }
                            body { margin: 0; padding: 10px; background: #fff; }
                        </style>
                    </head>
                    <body>
                        ${layoutStrukHtml}
                        <script>
                            window.onload = function() {
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 500);
                            };
                        </script>
                    </body>
                    </html>
                `;

                const printWindow = window.open('', '_blank', 'width=380,height=600');
                printWindow.document.write(strukHtmlWindow);
                printWindow.document.close();
            }
        });

    } catch (e) {
        console.error(e);
        if(typeof sd_error === 'function') sd_error('Error', 'Gagal memuat struk pesanan.');
    }
};