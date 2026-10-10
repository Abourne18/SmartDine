import codecs

with codecs.open('frontend/js/pelanggan.js', 'r', 'utf-8') as f:
    code = f.read()

# Add polling at the bottom of the file
code += "\n\n// Polling sederhana untuk update status menu secara otomatis tiap 5 detik\nsetInterval(loadMenu, 5000);\n"

with codecs.open('frontend/js/pelanggan.js', 'w', 'utf-8') as f:
    f.write(code)
print("Added polling!")
