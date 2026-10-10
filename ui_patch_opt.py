import codecs
import re

with codecs.open('frontend/js/admin-menu.js', 'r', 'utf-8') as f:
    code = f.read()

# First replace the HTML in renderMenu to include an ID so we can easily query it.
old_span = r'<span class="status-badge \$\{isAvail \? \'avail\' : \'occ\'\}" style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="toggleMenuStatus\(\$\{m\.id\}, \$\{m\.is_available\}\)">'
new_span = r'<span id="status-badge-${m.id}" class="status-badge ${isAvail ? \'avail\' : \'occ\'}" style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="toggleMenuStatus(${m.id}, ${m.is_available})">'
code = re.sub(old_span, new_span, code)

# Second, replace the toggleMenuStatus function
old_toggle = """async function toggleMenuStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
        await fetch(`${API_BASE}/menu/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: newStatus })
        });
        renderMenu();
    } catch (e) { console.error(e); }
}"""

new_toggle = """async function toggleMenuStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic UI Update (Ganti tampilan secara instan)
    const badge = document.getElementById(`status-badge-${id}`);
    if (badge) {
        if (newStatus === 1) {
            badge.className = 'status-badge avail';
            badge.innerHTML = 'TERSEDIA <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M21 8A9 9 0 0 0 6 5.3L3 8"/><path d="M3 22v-6h6"/><path d="M3 16a9 9 0 0 0 15 2.7L21 16"/></svg>';
        } else {
            badge.className = 'status-badge occ';
            badge.innerHTML = 'HABIS <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M21 8A9 9 0 0 0 6 5.3L3 8"/><path d="M3 22v-6h6"/><path d="M3 16a9 9 0 0 0 15 2.7L21 16"/></svg>';
        }
        // Perbarui onClick handler agar argumen status terbaru masuk jika diklik lagi
        badge.onclick = () => toggleMenuStatus(id, newStatus);
    }
    
    // Biarkan background mengirim request tanpa await yang menahan render
    fetch(`${API_BASE}/menu/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newStatus })
    }).catch(e => console.error(e));
}"""

code = code.replace(old_toggle, new_toggle)

with codecs.open('frontend/js/admin-menu.js', 'w', 'utf-8') as f:
    f.write(code)
print("Added Optimistic UI to admin-menu.js")
