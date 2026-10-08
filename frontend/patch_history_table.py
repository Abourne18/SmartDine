import re

with open('c:/Documents/SmartDine/FromGit/frontend/js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# We need to replace `container.innerHTML = paginatedOrders.map(order => { ... }).join('');`
# Since it's a large block, let's use a robust regex or string manipulation.

old_block_pattern = r"container\.innerHTML = paginatedOrders\.map\(order => \{[\s\S]*?\}\)\.join\(''\);"

new_block = r"""const tbodyHtml = paginatedOrders.map(order => {
            const tglStr = new Date(order.waktu_pesan).toLocaleDateString('id-ID');
            const waktu = new Date(order.waktu_pesan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            let statusBadge = order.status_pesanan === 'selesai' 
                ? '<span class="status-badge badge-selesai"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="20 6 9 17 4 12"></polyline></svg> SELESAI</span>'
                : '<span class="status-badge badge-dibatalkan"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> DIBATALKAN</span>';

            const itemsText = order.items && order.items.length > 0
                ? order.items.map(it => `${it.kuantitas}x ${it.nama_menu}`).join('<br>')
                : '-';

            let btnCetak = '';
            if(order.status_pesanan === 'selesai') {
                btnCetak = `<button class="action-btn btn-ghost btn-sm" style="border: 1px solid var(--border); padding: 4px 10px;" onclick="cetakStruk(${order.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Cetak</button>`;
            }

            return `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.15s;" onmouseover="this.style.background='var(--lighter)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 16px 20px; font-weight: 600; color: var(--dark);">${order.order_num || '#SD-' + order.id}</td>
                    <td style="padding: 16px 20px; color: var(--grey);">${tglStr}, ${waktu}</td>
                    <td style="padding: 16px 20px; text-align: center; font-weight: 600;">${order.nomor_meja}</td>
                    <td style="padding: 16px 20px; font-size: 0.85rem; color: var(--grey); line-height: 1.5;">${itemsText}</td>
                    <td style="padding: 16px 20px; text-align: center; font-weight: 600; color: var(--dark);">${order.metode_pembayaran ? order.metode_pembayaran.toUpperCase() : 'CASH'}</td>
                    <td style="padding: 16px 20px; text-align: right; font-weight: 800; color: var(--brand);">${rp(order.total_harga)}</td>
                    <td style="padding: 16px 20px; text-align: center;">
                        <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                            ${statusBadge}
                            ${btnCetak}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f7ece4; border-bottom: 1px solid var(--border); color: #000000;">
                            <th style="padding: 16px 20px; font-weight: 700; white-space: nowrap;">ID Pesanan</th>
                            <th style="padding: 16px 20px; font-weight: 700; white-space: nowrap;">Tgl, Jam</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Meja</th>
                            <th style="padding: 16px 20px; font-weight: 700;">Pesanan</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Metode Bayar</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: right;">Total</th>
                            <th style="padding: 16px 20px; font-weight: 700; text-align: center;">Status & Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
            </div>
        `;"""

if re.search(old_block_pattern, js):
    js = re.sub(old_block_pattern, new_block, js)
    with open('c:/Documents/SmartDine/FromGit/frontend/js/admin.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("History layout updated to table.")
else:
    print("Could not find the map block in renderHistory.")
