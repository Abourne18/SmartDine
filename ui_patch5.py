import codecs

with codecs.open('frontend/js/admin-report.js', 'r', 'utf-8') as f:
    code = f.read()

# Replace the specific div with nothing
to_remove = '<div style="font-size: 1.1rem; font-weight: 700; color: var(--dark);">Laporan Rekapitulasi Pendapatan Harian</div>'
code = code.replace(to_remove, '')

with codecs.open('frontend/js/admin-report.js', 'w', 'utf-8') as f:
    f.write(code)
print("Removed title")
