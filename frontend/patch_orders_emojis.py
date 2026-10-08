import re

# 1. Update admin.html
with open('c:/Documents/SmartDine/FromGit/frontend/admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

svg_reload = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>'
html = re.sub(r'>🔄\s*Segarkan</button>', f'>{svg_reload} Segarkan</button>', html)

with open('c:/Documents/SmartDine/FromGit/frontend/admin.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Update admin.js
with open('c:/Documents/SmartDine/FromGit/frontend/js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Emojis to SVGs mapping
svg_pin = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
svg_user = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
svg_clock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
svg_card = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>'

svg_hourglass = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M12 2v20"></path><path d="M8 2h8"></path><path d="M8 22h8"></path><path d="M15 16a3 3 0 0 0-3-3 3 3 0 0 0-3 3v6h6z"></path><path d="M15 8a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2h6z"></path></svg>'
svg_flame = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg>'
svg_cross = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
svg_bell = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
svg_check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="20 6 9 17 4 12"></polyline></svg>'
svg_chef = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>'

# Replace card badges
js = js.replace('📍', svg_pin)
js = js.replace('👤', svg_user)
js = js.replace('🕒', svg_clock)
js = js.replace('💳', svg_card)

# Replace status badges in generateOrders
js = js.replace('⏳ MENUNGGU', f'{svg_hourglass} MENUNGGU')
js = js.replace('🧑‍🍳 DIPROSES', f'{svg_flame} DIPROSES')
js = js.replace('🔔 DIHIDANGKAN', f'{svg_bell} DIHIDANGKAN')
js = js.replace('✅ SELESAI', f'{svg_check} SELESAI')
js = js.replace('❌ DIBATALKAN', f'{svg_cross} DIBATALKAN')

# Replace buttons in generateOrders
js = js.replace('🧑‍🍳 Proses Masak', f'{svg_chef} Proses Masak')
js = js.replace('🔔 Hidangkan', f'{svg_bell} Hidangkan')
js = js.replace('✅ Selesaikan', f'{svg_check} Selesaikan')
js = js.replace('❌ Batalkan', f'{svg_cross} Batalkan')

# Fix status icons inside getSortIcon or other random places (status_pesanan ? '⏳' ...)
js = re.sub(r"\? '⏳' : \(\w+\.status_pesanan === 'diproses' \? '🍳' : '🔔'\)", f"? '{svg_hourglass}' : (o.status_pesanan === 'diproses' ? '{svg_flame}' : '{svg_bell}')", js)
# Actually, the python replace above handles most literals, let's just make sure we hit the ternary if it was hardcoded with emojis.
# Let's replace the raw emojis just in case:
js = js.replace('⏳', svg_hourglass).replace('🍳', svg_flame).replace('🔔', svg_bell)

with open('c:/Documents/SmartDine/FromGit/frontend/js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Card emojis replaced.")
