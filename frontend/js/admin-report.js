// RENDER TABEL REKAP HARIAN DENGAN PAGINATION & CETAK LAPORAN
// ============================================================
let currentSortColumn = 'tanggal';
let currentSortDirection = 'desc';
let _rekapDataCache = []; // Cache data rekap untuk keperluan cetak laporan

function sortRekapData(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = column === 'tanggal' ? 'desc' : 'desc';
    }
    currentPageRekap = 1;
    renderRekapHarian();
}

async function renderRekapHarian() {
    const container = document.getElementById('rekapContainer');
    const paginationContainer = document.getElementById('rekapPagination');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/rekap-harian`);
        if (!res.ok) throw new Error('Gagal mengambil data rekap harian');
        let rekapData = await res.json();
        _rekapDataCache = rekapData; // Simpan data ke cache

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

        // Logika Sorting Data
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

        // Logika Pagination Rekap 10 item per halaman
        const totalPages = Math.ceil(rekapData.length / itemsPerPage);
        if (currentPageRekap > totalPages) currentPageRekap = totalPages;
        const startIndex = (currentPageRekap - 1) * itemsPerPage;
        const paginatedRekap = rekapData.slice(startIndex, startIndex + itemsPerPage);

        const getSortIcon = (colName) => {
            if (currentSortColumn !== colName) return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; opacity:0.3;"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>';
            return currentSortDirection === 'asc' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; color:var(--brand);"><path d="M18 15l-6-6-6 6"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; color:var(--brand);"><path d="M6 9l6 6 6-6"/></svg>';
        };

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--dark);">Laporan Rekapitulasi Pendapatan Harian</div>
                <button class="action-btn" style="background: var(--brand); color: white; display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(208, 90, 43, 0.2);" onclick="cetakRekapHarian()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Cetak Rekap
                </button>
            </div>

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
                                <th onclick="sortRekapData('tanggal')" style="padding: 16px 20px; font-weight: 700; cursor: pointer; user-select: none;" title="Klik untuk mengurutkan">
                                    Tanggal ${getSortIcon('tanggal')}
                                </th>
                                <th onclick="sortRekapData('total_pesanan')" style="padding: 16px 20px; font-weight: 700; text-align: center; cursor: pointer; user-select: none;" title="Klik untuk mengurutkan">
                                    Jumlah Pesanan Selesai ${getSortIcon('total_pesanan')}
                                </th>
                                <th onclick="sortRekapData('total_pendapatan')" style="padding: 16px 20px; font-weight: 700; text-align: right; cursor: pointer; user-select: none;" title="Klik untuk mengurutkan">
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
        container.innerHTML = `<div class="empty-state"><div class="empty-title" style="color:var(--danger);">Gagal memuat data rekap harian.</div></div>`;
    }
}

/// Fungsi Cetak Rekap Harian (Tampilan Tabel Formal dengan Header Selaras Struk)
function cetakRekapHarian() {
    if (!_rekapDataCache || _rekapDataCache.length === 0) {
        sd_error('Gagal', 'Tidak ada data rekap untuk dicetak.');
        return;
    }

    const cetakWaktu = new Date().toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium'
    });

    const grandTotalRevenue = _rekapDataCache.reduce((sum, item) => sum + Number(item.total_pendapatan || 0), 0);
    const grandTotalOrders = _rekapDataCache.reduce((sum, item) => sum + Number(item.total_pesanan || 0), 0);

    const rowsHtml = _rekapDataCache.map((row, index) => {
        const formattedDate = new Date(row.tanggal).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
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
            <div style="display:inline-block; width:45px; height:45px; margin-bottom: 4px;">
                <svg width="100%" height="100%" viewBox="0 0 1024 948" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#D05A2B" fill-rule="evenodd" d="M 606 716 L 606 732 L 607 733 L 608 733 L 609 732 L 620 732 L 621 733 L 625 733 L 626 734 L 628 734 L 629 735 L 630 735 L 632 737 L 633 737 L 637 741 L 637 742 L 639 744 L 639 746 L 640 747 L 640 749 L 641 750 L 641 759 L 642 759 L 643 760 L 648 760 L 649 759 L 654 759 L 655 758 L 656 758 L 658 756 L 658 747 L 657 746 L 657 742 L 656 741 L 656 739 L 655 738 L 655 737 L 654 736 L 654 735 L 653 734 L 653 733 L 651 731 L 651 730 L 644 723 L 643 723 L 642 722 L 641 722 L 639 720 L 638 720 L 637 719 L 636 719 L 635 718 L 633 718 L 632 717 L 629 717 L 628 716 L 623 716 L 622 715 L 607 715 Z M 314 417 L 315 416 L 417 416 L 419 418 L 419 432 L 418 433 L 418 442 L 419 443 L 419 500 L 418 501 L 419 504 L 418 505 L 418 515 L 419 516 L 418 517 L 418 518 L 417 519 L 316 519 L 314 517 Z M 296 396 L 295 397 L 295 537 L 296 538 L 437 538 L 437 396 Z M 75 565 L 78 587 L 146 588 L 167 611 L 189 619 L 828 619 L 851 610 L 870 588 L 935 588 L 940 585 L 940 563 L 936 561 L 527 561 L 520 488 L 523 480 L 544 459 L 549 442 L 537 353 L 530 355 L 529 429 L 524 433 L 518 429 L 513 355 L 504 355 L 500 427 L 495 433 L 488 428 L 487 355 L 480 353 L 477 359 L 468 442 L 472 457 L 497 488 L 489 561 L 80 561 Z M 746 261 L 746 273 L 745 274 L 745 280 L 746 281 L 746 452 L 745 453 L 746 457 L 745 459 L 746 463 L 746 468 L 745 469 L 746 471 L 746 475 L 745 476 L 746 479 L 746 538 L 877 538 L 878 537 L 877 533 L 877 513 L 876 512 L 876 503 L 875 502 L 875 495 L 874 494 L 874 488 L 873 487 L 873 481 L 870 469 L 870 464 L 866 452 L 866 448 L 864 444 L 863 437 L 856 416 L 854 413 L 847 393 L 840 380 L 840 378 L 824 349 L 813 332 L 788 300 L 758 270 Z M 272 261 L 270 261 L 259 270 L 229 300 L 217 314 L 192 350 L 172 387 L 172 389 L 167 398 L 162 413 L 160 416 L 154 434 L 154 437 L 152 441 L 146 465 L 143 485 L 142 486 L 142 492 L 141 493 L 141 502 L 140 503 L 139 533 L 138 534 L 139 538 L 272 538 Z M 598 208 L 600 206 L 701 206 L 703 208 L 703 309 L 702 310 L 600 310 L 598 308 L 598 307 L 599 306 L 598 305 L 598 303 L 599 302 L 599 260 L 598 259 L 599 258 L 599 252 L 598 251 L 599 250 L 599 224 L 598 223 L 599 222 L 599 221 L 598 220 Z M 314 208 L 315 207 L 320 207 L 321 206 L 416 206 L 419 209 L 419 211 L 418 212 L 418 218 L 419 219 L 419 251 L 418 252 L 418 261 L 419 262 L 419 274 L 418 275 L 418 280 L 419 281 L 419 282 L 418 283 L 418 284 L 419 285 L 419 296 L 418 297 L 418 301 L 419 302 L 419 307 L 418 308 L 418 309 L 417 310 L 316 310 L 314 308 Z M 579 188 L 580 189 L 580 196 L 579 197 L 579 240 L 580 241 L 579 243 L 579 267 L 580 268 L 579 269 L 580 270 L 579 271 L 580 272 L 580 282 L 579 283 L 579 313 L 580 315 L 579 316 L 580 317 L 580 324 L 579 325 L 579 328 L 581 330 L 617 330 L 618 329 L 619 330 L 626 330 L 627 329 L 629 330 L 648 330 L 649 329 L 651 330 L 677 330 L 678 329 L 679 330 L 683 330 L 684 329 L 689 329 L 690 330 L 691 329 L 718 330 L 723 328 L 723 188 L 722 187 L 580 187 Z M 296 187 L 295 188 L 295 329 L 297 330 L 418 330 L 419 329 L 421 330 L 423 329 L 424 330 L 428 330 L 429 329 L 433 330 L 434 329 L 437 329 L 437 187 Z M 452 151 L 452 164 L 565 164 L 565 153 L 564 152 L 564 149 L 563 148 L 563 145 L 562 144 L 562 142 L 560 139 L 560 137 L 559 136 L 559 135 L 558 134 L 558 133 L 556 131 L 556 130 L 552 126 L 552 125 L 548 121 L 547 121 L 542 116 L 541 116 L 539 114 L 538 114 L 537 113 L 536 113 L 535 112 L 534 112 L 533 111 L 532 111 L 529 109 L 527 109 L 526 108 L 524 108 L 523 107 L 519 107 L 518 106 L 499 106 L 498 107 L 494 107 L 493 108 L 491 108 L 490 109 L 488 109 L 487 110 L 486 110 L 485 111 L 484 111 L 483 112 L 482 112 L 481 113 L 480 113 L 479 114 L 478 114 L 476 116 L 475 116 L 473 118 L 472 118 L 464 126 L 464 127 L 461 130 L 461 131 L 459 133 L 459 134 L 458 135 L 458 136 L 456 139 L 456 141 L 454 144 L 454 146 L 453 147 L 453 150 Z M 102 51 L 136 29 L 180 18 L 845 18 L 901 35 L 937 65 L 957 97 L 968 137 L 968 810 L 957 851 L 926 894 L 888 919 L 852 929 L 173 929 L 123 912 L 90 885 L 66 846 L 57 807 L 57 140 L 74 85 Z M 84 39 L 55 77 L 39 128 L 39 820 L 53 867 L 80 905 L 123 935 L 165 947 L 860 947 L 902 935 L 935 914 L 970 871 L 986 818 L 986 129 L 977 92 L 950 48 L 907 15 L 852 0 L 173 0 L 125 12 Z "/>
                </svg>
            </div>
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
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;

    SD_SWAL.fire({
        title: 'Preview Laporan Rekap',
        html: previewHtml,
        showCancelButton: true,
        confirmButtonText: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:text-bottom;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Cetak Laporan',
        cancelButtonText: 'Batal',
        confirmButtonColor: 'var(--brand)',
        width: '680px'
    }).then((result) => {
        if (result.isConfirmed) {
            const printHtml = `
                <html>
                <head>
                    <title>Laporan Rekap Harian - SmartDine</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 25px; margin: 0; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                        .summary { display: flex; justify-content: space-between; border: 1px solid #000; padding: 10px 15px; margin-bottom: 20px; font-weight: bold; background: #f9f9f9; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
                        th { background-color: #f2f2f2; text-align: center; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="display:inline-block; width:45px; height:45px; margin-bottom: 4px;">
                            <svg width="100%" height="100%" viewBox="0 0 1024 948" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#D05A2B" fill-rule="evenodd" d="M 606 716 L 606 732 L 607 733 L 608 733 L 609 732 L 620 732 L 621 733 L 625 733 L 626 734 L 628 734 L 629 735 L 630 735 L 632 737 L 633 737 L 637 741 L 637 742 L 639 744 L 639 746 L 640 747 L 640 749 L 641 750 L 641 759 L 642 759 L 643 760 L 648 760 L 649 759 L 654 759 L 655 758 L 656 758 L 658 756 L 658 747 L 657 746 L 657 742 L 656 741 L 656 739 L 655 738 L 655 737 L 654 736 L 654 735 L 653 734 L 653 733 L 651 731 L 651 730 L 644 723 L 643 723 L 642 722 L 641 722 L 639 720 L 638 720 L 637 719 L 636 719 L 635 718 L 633 718 L 632 717 L 629 717 L 628 716 L 623 716 L 622 715 L 607 715 Z M 314 417 L 315 416 L 417 416 L 419 418 L 419 432 L 418 433 L 418 442 L 419 443 L 419 500 L 418 501 L 419 504 L 418 505 L 418 515 L 419 516 L 418 517 L 418 518 L 417 519 L 316 519 L 314 517 Z M 296 396 L 295 397 L 295 537 L 296 538 L 437 538 L 437 396 Z M 75 565 L 78 587 L 146 588 L 167 611 L 189 619 L 828 619 L 851 610 L 870 588 L 935 588 L 940 585 L 940 563 L 936 561 L 527 561 L 520 488 L 523 480 L 544 459 L 549 442 L 537 353 L 530 355 L 529 429 L 524 433 L 518 429 L 513 355 L 504 355 L 500 427 L 495 433 L 488 428 L 487 355 L 480 353 L 477 359 L 468 442 L 472 457 L 497 488 L 489 561 L 80 561 Z M 746 261 L 746 273 L 745 274 L 745 280 L 746 281 L 746 452 L 745 453 L 746 457 L 745 459 L 746 463 L 746 468 L 745 469 L 746 471 L 746 475 L 745 476 L 746 479 L 746 538 L 877 538 L 878 537 L 877 533 L 877 513 L 876 512 L 876 503 L 875 502 L 875 495 L 874 494 L 874 488 L 873 487 L 873 481 L 870 469 L 870 464 L 866 452 L 866 448 L 864 444 L 863 437 L 856 416 L 854 413 L 847 393 L 840 380 L 840 378 L 824 349 L 813 332 L 788 300 L 758 270 Z M 272 261 L 270 261 L 259 270 L 229 300 L 217 314 L 192 350 L 172 387 L 172 389 L 167 398 L 162 413 L 160 416 L 154 434 L 154 437 L 152 441 L 146 465 L 143 485 L 142 486 L 142 492 L 141 493 L 141 502 L 140 503 L 139 533 L 138 534 L 139 538 L 272 538 Z M 598 208 L 600 206 L 701 206 L 703 208 L 703 309 L 702 310 L 600 310 L 598 308 L 598 307 L 599 306 L 598 305 L 598 303 L 599 302 L 599 260 L 598 259 L 599 258 L 599 252 L 598 251 L 599 250 L 599 224 L 598 223 L 599 222 L 599 221 L 598 220 Z M 314 208 L 315 207 L 320 207 L 321 206 L 416 206 L 419 209 L 419 211 L 418 212 L 418 218 L 419 219 L 419 251 L 418 252 L 418 261 L 419 262 L 419 274 L 418 275 L 418 280 L 419 281 L 419 282 L 418 283 L 418 284 L 419 285 L 419 296 L 418 297 L 418 301 L 419 302 L 419 307 L 418 308 L 418 309 L 417 310 L 316 310 L 314 308 Z M 579 188 L 580 189 L 580 196 L 579 197 L 579 240 L 580 241 L 579 243 L 579 267 L 580 268 L 579 269 L 580 270 L 579 271 L 580 272 L 580 282 L 579 283 L 579 313 L 580 315 L 579 316 L 580 317 L 580 324 L 579 325 L 579 328 L 581 330 L 617 330 L 618 329 L 619 330 L 626 330 L 627 329 L 629 330 L 648 330 L 649 329 L 651 330 L 677 330 L 678 329 L 679 330 L 683 330 L 684 329 L 689 329 L 690 330 L 691 329 L 718 330 L 723 328 L 723 188 L 722 187 L 580 187 Z M 296 187 L 295 188 L 295 329 L 297 330 L 418 330 L 419 329 L 421 330 L 423 329 L 424 330 L 428 330 L 429 329 L 433 330 L 434 329 L 437 329 L 437 187 Z M 452 151 L 452 164 L 565 164 L 565 153 L 564 152 L 564 149 L 563 148 L 563 145 L 562 144 L 562 142 L 560 139 L 560 137 L 559 136 L 559 135 L 558 134 L 558 133 L 556 131 L 556 130 L 552 126 L 552 125 L 548 121 L 547 121 L 542 116 L 541 116 L 539 114 L 538 114 L 537 113 L 536 113 L 535 112 L 534 112 L 533 111 L 532 111 L 529 109 L 527 109 L 526 108 L 524 108 L 523 107 L 519 107 L 518 106 L 499 106 L 498 107 L 494 107 L 493 108 L 491 108 L 490 109 L 488 109 L 487 110 L 486 110 L 485 111 L 484 111 L 483 112 L 482 112 L 481 113 L 480 113 L 479 114 L 478 114 L 476 116 L 475 116 L 473 118 L 472 118 L 464 126 L 464 127 L 461 130 L 461 131 L 459 133 L 459 134 L 458 135 L 458 136 L 456 139 L 456 141 L 454 144 L 454 146 L 453 147 L 453 150 Z M 102 51 L 136 29 L 180 18 L 845 18 L 901 35 L 937 65 L 957 97 L 968 137 L 968 810 L 957 851 L 926 894 L 888 919 L 852 929 L 173 929 L 123 912 L 90 885 L 66 846 L 57 807 L 57 140 L 74 85 Z M 84 39 L 55 77 L 39 128 L 39 820 L 53 867 L 80 905 L 123 935 L 165 947 L 860 947 L 902 935 L 935 914 L 970 871 L 986 818 L 986 129 L 977 92 L 950 48 L 907 15 L 852 0 L 173 0 L 125 12 Z "/>
                            </svg>
                        </div>
                        <h2 style="margin: 0 0 3px 0; font-size: 18px;">SmartDine Resto</h2>
                        <div style="font-size: 12px; color: #333;">Jl. Raya Kuliner No. 88 | Telp: 0812-3456-7890</div>
                        <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">LAPORAN REKAPITULASI PENDAPATAN HARIAN</div>
                        <div style="font-size: 11px; color: #555; margin-top: 3px;">Dicetak pada: ${cetakWaktu} | Oleh: ${adminInfo.username || 'Admin'}</div>
                    </div>
                    <div class="summary">
                        <div>Total Keseluruhan Pesanan: ${grandTotalOrders} Selesai</div>
                        <div>Akumulasi Pendapatan: ${rp(grandTotalRevenue)}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px;">No</th>
                                <th>Tanggal</th>
                                <th class="text-center">Jumlah Pesanan Selesai</th>
                                <th class="text-right">Total Pendapatan Harian</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `;

            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.classList.remove('swal2-shown', 'swal2-height-auto');

            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(printHtml);
            printWindow.document.close();
        }
    });
}

// ============================================================
// HELPER: PEMBUAT TOMBOL PAGINATION
// ============================================================
function renderPaginationControls(containerEl, currentPage, totalPages, callback) {
    if (!containerEl || totalPages <= 1) {
        if (containerEl) containerEl.innerHTML = '';
        return;
    }

    let html = `
        <button class="action-btn btn-ghost btn-sm" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="(${callback.toString()})(${currentPage - 1})">
            ◀ Sebelumnya
        </button>
        <span style="font-size: 0.85rem; font-weight: 600; color: var(--grey); padding: 0 10px;">
            Hal ${currentPage} dari ${totalPages}
        </span>
        <button class="action-btn btn-ghost btn-sm" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="(${callback.toString()})(${currentPage + 1})">
            Berikutnya ▶
        </button>
    `;
    containerEl.innerHTML = html;
}


// ===== CATEGORY MANAGEMENT =====
window.toggleCatDropdown = function(mode) {
    const menu = document.getElementById('catMenu-' + mode);
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        document.querySelectorAll('.custom-select-menu').forEach(m => m.style.display = 'none');
        renderKategoriList(mode);
        document.getElementById('catInput-' + mode).value = '';
        menu.style.display = 'flex';
    }
};

window.renderKategoriList = function(mode) {
    if (!window._allKategoriCache) window._allKategoriCache = [];
    const list = document.getElementById('catList-' + mode);
    const selectedId = document.getElementById(mode + 'KategoriId').value;
    
    let html = `
        <div class="custom-option" style="color:var(--grey); ${!selectedId ? 'background: #f1f5f9; font-weight:700;' : ''}" onclick="selectCat('${mode}', '', '-- Pilih Kategori --')">
            <div style="flex:1;">-- Pilih Kategori --</div>
        </div>
    `;
    
    if (window._allKategoriCache.length > 0) {
        html += window._allKategoriCache.map(k => `
            <div class="custom-option" style="${k.id == selectedId ? 'background: #f1f5f9; font-weight:700;' : ''}">
                <div style="flex:1;" onclick="selectCat('${mode}', '${k.id}', '${k.nama_kategori}')">${k.nama_kategori}</div>
                <button class="custom-option-del" onclick="deleteCat('${k.id}', '${k.nama_kategori}', event)" title="Hapus ${k.nama_kategori}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
            </div>
        `).join('');
    }
    
    list.innerHTML = html;
};

window.selectCat = function(mode, id, name) {
    document.getElementById(mode + 'KategoriId').value = id;
    document.getElementById('catSelectedText-' + mode).innerText = name;
    document.getElementById('catMenu-' + mode).style.display = 'none';
};

window.deleteCat = async function(id, name, event) {
    event.stopPropagation();
    if (confirm('Yakin ingin menghapus kategori "' + name + '"?')) {
        try {
            const res = await fetch(`${API_BASE}/kategori/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                window._allKategoriCache = window._allKategoriCache.filter(k => k.id != id);
                // Clear selection if the deleted one was selected
                ['add', 'edit'].forEach(mode => {
                    const input = document.getElementById(mode + 'KategoriId');
                    if (input && input.value == id) {
                        input.value = '';
                        document.getElementById('catSelectedText-' + mode).innerText = '-- Pilih Kategori --';
                    }
                    const menu = document.getElementById('catMenu-' + mode);
                    if (menu && menu.style.display === 'flex') {
                        renderKategoriList(mode);
                    }
                });
            } else {
                alert(data.message || 'Gagal menghapus kategori');
            }
        } catch (e) {
            alert('Gagal menghubungi server');
        }
    }
};

window.handleCatEnter = async function(event, mode) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const nama = event.target.value.trim();
        if (nama) {
            try {
                const res = await fetch(`${API_BASE}/kategori`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama_kategori: nama })
                });
                const data = await res.json();
                if (data.success) {
                    if (!window._allKategoriCache) window._allKategoriCache = [];
                    window._allKategoriCache.push({ id: data.id, nama_kategori: data.nama_kategori });
                    selectCat(mode, data.id, data.nama_kategori);
                    event.target.value = '';
                } else {
                    alert(data.message || 'Gagal menambahkan');
                }
            } catch (e) {
                alert('Gagal menghubungi server');
            }
        }
    }
};

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-menu').forEach(m => m.style.display = 'none');
    }
});

window.clearEditImagePreview = function(e) {
    if (e) e.preventDefault();
    const fileInput = document.getElementById('editGambar');
    if (fileInput) fileInput.value = '';
    const box = document.getElementById('editImgPreviewBox');
    if (box) {
        const existing = box.querySelector('.new-preview');
        if (existing) existing.remove();
    }
};

window.removeExistingImage = function(e) {
    e.preventDefault();
    document.getElementById('hapusFotoLama').value = 'true';
    document.getElementById('existingImgContainer').style.display = 'none';
};


// ============================================================
// MODUL CETAK QR MEJA (Terintegrasi di Kelola Meja)
// ============================================================
function generateQRHtml(nomor_meja) {
    const customerUrl = `${window.location.origin}/pelanggan.html?table=${nomor_meja}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&ecc=H&data=${encodeURIComponent(customerUrl)}`;
    return `
    <div style="display:inline-block; border:2px solid #e2e8f0; border-radius:12px; padding:16px; margin:10px; text-align:center; min-width:200px; page-break-inside:avoid;">
        <div style="margin:0 0 8px 0; display:flex; align-items:center; justify-content:center;">
            <img src="${window.location.origin}/assets/logo.svg" style="height:32px; width:auto;" alt="SmartDine Logo">
        </div>
        <h2 style="margin:0 0 12px 0; font-size:1.5rem; color:#0f172a;">Meja ${nomor_meja}</h2>
        <div style="position:relative; width:160px; height:160px; margin:0 auto;">
              <img src="${qrImageUrl}" style="width:100%; height:100%; display:block;" />
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:0; border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.15); overflow:hidden;">
                  <img src="${window.location.origin}/assets/logo_square.svg" style="width:44px; height:44px; object-fit:contain;" />
              </div>
          </div>
        <p style="margin:12px 0 0 0; font-size:0.85rem; color:#64748b;">Scan untuk memesan</p>
    </div>
    `;
}

async function printQR(tableNo) {
    const content = document.getElementById('qrPrintContent');
    if(content) content.innerHTML = generateQRHtml(tableNo);
    
    const modal = document.getElementById('qrPrintModal');
    if(modal) modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
}

async function printAllQR() {
    try {
        const response = await fetch(`${API_BASE}/meja`);
        const tables = await response.json();
        
        let allHtml = '';
        tables.forEach(t => {
            allHtml += generateQRHtml(t.nomor_meja);
        });
        
        const content = document.getElementById('qrPrintContent');
        if(content) content.innerHTML = allHtml;
        
        const modal = document.getElementById('qrPrintModal');
        if(modal) modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
    } catch(e) {
        console.error("Gagal memuat meja untuk cetak QR:", e);
    }
}

function closeQRPrint() {
    const modal = document.getElementById('qrPrintModal');
    if(modal) modal.style.display = 'none'; document.body.style.overflow = '';
}

function executePrint() {
    const content = document.getElementById('qrPrintContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Cetak QR SmartDine</title>');
    printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; margin:0; padding:20px; } }</style>');
    printWindow.document.write('</head><body style="font-family:sans-serif; text-align:center;">');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Tunggu gambar load sebelum print
    setTimeout(() => {
        printWindow.print();
    }, 1000);
}

window.quickAddTable = async function() {
    const nomor = document.getElementById('quickTableNo').value.trim();
    if (!nomor) {
        sd_error('Validasi', 'Nomor meja tidak boleh kosong!');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/meja`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomor_meja: nomor, status: 'kosong' })
        });
        const data = await res.json();
        if (data.success) {
            renderTables();
            renderStats();
        } else {
            sd_error('Gagal', data.message);
        }
    } catch (e) { console.error(e); }
};
