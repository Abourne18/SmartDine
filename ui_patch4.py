import codecs
import re

with codecs.open('frontend/js/admin-orders.js', 'r', 'utf-8') as f:
    code = f.read()

header = """
window._isSelectMode = false;
window._selectedOrders = new Set();
window._pressTimer = null;
window._justLongPressed = false; // Flag to prevent immediate uncheck on mouseup

window.reRenderTableOnly = function() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = window._selectedOrders.has(id);
        const tr = cb.closest('tr');
        if (window._selectedOrders.has(id)) {
            tr.style.background = '#fee2e2';
        } else {
            tr.style.background = 'transparent';
        }
    });
};

window.toggleSelectMode = function(orderId) {
    if (!window._isSelectMode) {
        window._isSelectMode = true;
        window._justLongPressed = true; // Block the immediate click event
        setTimeout(() => { window._justLongPressed = false; }, 400); // Clear flag shortly after
        
        window._selectedOrders.clear();
        if (orderId) window._selectedOrders.add(String(orderId));
        
        const trs = document.querySelectorAll('.history-tr');
        trs.forEach(tr => {
            tr.style.cursor = 'pointer';
            const id = tr.getAttribute('data-id');
            const td = tr.querySelector('.id-td');
            if (td && !td.querySelector('.row-checkbox')) {
                td.style.display = 'flex';
                td.style.alignItems = 'center';
                td.style.gap = '8px';
                td.innerHTML = `<input type="checkbox" class="row-checkbox" data-id="${id}" style="pointer-events:none;" ${window._selectedOrders.has(id) ? 'checked' : ''}>` + td.innerHTML;
            }
        });
        
        window.reRenderTableOnly();
        showTrashIcon();
    }
};

window.toggleOrderSelection = function(orderId) {
    if (window._justLongPressed) return; // Prevent toggling if we just long-pressed
    
    const id = String(orderId);
    if (window._selectedOrders.has(id)) {
        window._selectedOrders.delete(id);
    } else {
        window._selectedOrders.add(id);
    }
    
    window.reRenderTableOnly();
    
    if (window._selectedOrders.size === 0) {
        window._isSelectMode = false;
        hideTrashIcon();
        const trs = document.querySelectorAll('.history-tr');
        trs.forEach(tr => {
            tr.style.cursor = 'default';
            const cb = tr.querySelector('.row-checkbox');
            if (cb) cb.remove();
        });
    }
};

window.showTrashIcon = function() {
    let trashBtn = document.getElementById('bulkDeleteTrashBtn');
    if (!trashBtn) {
        trashBtn = document.createElement('button');
        trashBtn.id = 'bulkDeleteTrashBtn';
        trashBtn.className = 'action-btn';
        trashBtn.style.padding = '8px 12px';
        trashBtn.style.background = '#fee2e2';
        trashBtn.style.color = '#dc2626';
        trashBtn.style.border = '1px solid #fca5a5';
        trashBtn.style.borderRadius = '8px';
        trashBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Hapus Terpilih';
        trashBtn.onclick = async function() {
            if (window._selectedOrders.size === 0) return;
            if (!confirm(`Apakah Anda yakin ingin menghapus ${window._selectedOrders.size} riwayat transaksi secara permanen? Data rekap harian tidak akan berubah.`)) return;
            
            try {
                const res = await fetch(`${API_BASE}/pesanan/bulk`, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ ids: Array.from(window._selectedOrders) })
                });
                const result = await res.json();
                if (result.success) {
                    window._isSelectMode = false;
                    window._selectedOrders.clear();
                    hideTrashIcon();
                    renderHistory(); // Full reload to update table
                } else {
                    alert('Gagal menghapus: ' + result.error);
                }
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
            }
        };
        const searchInput = document.getElementById('searchHistory');
        if (searchInput && searchInput.parentNode) {
            searchInput.parentNode.insertBefore(trashBtn, searchInput.nextSibling);
        }
    }
    trashBtn.style.display = 'inline-flex';
};

window.hideTrashIcon = function() {
    const trashBtn = document.getElementById('bulkDeleteTrashBtn');
    if (trashBtn) trashBtn.style.display = 'none';
};
"""

# Now the HTML TR string, change 1000 to 500, and add the justLongPressed check.
old_tr_pattern = re.compile(
    r'<tr class="history-tr" data-id="\$\{order\.id\}" style="border-bottom: 1px solid var\(--border\); transition: background 0\.15s;.*?<td class="id-td" style="padding: 16px 20px; font-weight: 600; color: var\(--dark\);.*?\$\{order\.order_num\}\s*</td>',
    re.DOTALL
)

new_tr = """<tr class="history-tr" data-id="${order.id}" style="border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: ${window._isSelectMode ? 'pointer' : 'default'}; ${window._isSelectMode && window._selectedOrders.has(String(order.id)) ? 'background: #fee2e2;' : ''}" 
                  onmouseover="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='var(--lighter)'" 
                  onmouseout="if(!window._isSelectMode || !window._selectedOrders.has('${order.id}')) this.style.background='transparent'"
                  onmousedown="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                  onmouseup="clearTimeout(window._pressTimer);"
                  onmouseleave="clearTimeout(window._pressTimer);"
                  ontouchstart="if(!window._isSelectMode) window._pressTimer = setTimeout(() => window.toggleSelectMode('${order.id}'), 500);"
                  ontouchend="clearTimeout(window._pressTimer);"
                  onclick="if(window._justLongPressed) return; if(window._isSelectMode) { window.toggleOrderSelection('${order.id}'); } else if (window._pressTimer) { clearTimeout(window._pressTimer); }">
                    <td class="id-td" style="padding: 16px 20px; font-weight: 600; color: var(--dark); ${window._isSelectMode ? 'display: flex; align-items: center; gap: 8px;' : ''}">
                        ${window._isSelectMode ? `<input type="checkbox" class="row-checkbox" data-id="${order.id}" style="pointer-events:none;" ${window._selectedOrders.has(String(order.id)) ? 'checked' : ''}>` : ''}
                        ${order.order_num}
                    </td>"""

# We also replace the block of code again
code = re.sub(r'window\._isSelectMode = false;.*?// ============================================================', header + "\n// ============================================================", code, flags=re.DOTALL)

code = old_tr_pattern.sub(new_tr, code)

with codecs.open('frontend/js/admin-orders.js', 'w', 'utf-8') as f:
    f.write(code)
print("Fixed longpress bug")
