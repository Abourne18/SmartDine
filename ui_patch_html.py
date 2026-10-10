import codecs

with codecs.open('frontend/admin.html', 'r', 'utf-8') as f:
    code = f.read()

# Make section header a flex container and add button
old_section = """<!-- TAB: REKAP HARIAN -->
        <div id="atab-rekap" style="display:none" class="fade-in">
          <div class="section-header">"""

new_section = """<!-- TAB: REKAP HARIAN -->
        <div id="atab-rekap" style="display:none" class="fade-in">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">"""

code = code.replace(old_section, new_section)

# Find the H2 closing tag in this block to insert button
old_h2 = "Rekap Harian & Pendapatan</h2>"
new_h2 = 'Rekap Harian & Pendapatan</h2>\n            <button class="action-btn" style="background: var(--brand); color: white; display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(208, 90, 43, 0.2);" onclick="cetakRekapHarian()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>Cetak Rekap</button>'

code = code.replace(old_h2, new_h2)

with codecs.open('frontend/admin.html', 'w', 'utf-8') as f:
    f.write(code)
print("Patched admin.html")
