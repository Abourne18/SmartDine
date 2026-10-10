import codecs

with codecs.open('frontend/js/admin-menu.js', 'r', 'utf-8') as f:
    code = f.read()

code = code.replace(r"\'avail\' : \'occ\'", "'avail' : 'occ'")

with codecs.open('frontend/js/admin-menu.js', 'w', 'utf-8') as f:
    f.write(code)
print("Fixed quotes")
