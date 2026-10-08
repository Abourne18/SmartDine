import re

with open('c:/Documents/SmartDine/FromGit/frontend/admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

svg_path = 'M256,32l-256,128l0,48l16,8l0,160c0,13.255 10.745,24 24,24l16,0c13.255,0 24,-10.745 24,-24l0,-128l144,72l0,152c0,13.255 10.745,24 24,24l16,0c13.255,0 24,-10.745 24,-24l0,-152l144,-72l0,128c0,13.255 10.745,24 24,24l16,0c13.255,0 24,-10.745 24,-24l0,-160l16,-8l0,-48l-256,-128Zm0,35.777l194.446,97.223l-194.446,92.223l-194.446,-92.223l194.446,-97.223Z'

# 1. Sidebar Nav
html = re.sub(r'<span class="s-icon">🪑</span>',
              f'<span class="s-icon" style="display:flex; align-items:center;"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="currentColor" d="{svg_path}"></path></svg></span>',
              html)

# 2. Status Ketersediaan Meja header
html = re.sub(r'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"[^>]*><rect[^>]*></rect><path[^>]*></path><path[^>]*></path></svg>\s*Status Ketersediaan Meja',
              f'<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="color:var(--brand);"><path fill="currentColor" d="{svg_path}"></path></svg>\n        Status Ketersediaan Meja',
              html)

# 3. Stat Box (Meja Terdaftar)
html = re.sub(r'<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="#2563eb" stroke="#1d4ed8"[^>]*><rect[^>]*></rect><path[^>]*></path><path[^>]*></path></svg>',
              f'<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" width="25" height="25" style="color:#2563eb;"><path fill="currentColor" d="{svg_path}"></path></svg>',
              html)

with open('c:/Documents/SmartDine/FromGit/frontend/admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
