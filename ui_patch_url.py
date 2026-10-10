import codecs

# 1. admin-core.js
with codecs.open('frontend/js/admin-core.js', 'r', 'utf-8') as f:
    code = f.read()
code = code.replace("const API_BASE = '/api';", "const API_BASE = 'http://localhost:3000/api';")
code = code.replace("const SERVER_URL = '/';", "const SERVER_URL = 'http://localhost:3000/';")
with codecs.open('frontend/js/admin-core.js', 'w', 'utf-8') as f:
    f.write(code)

# 2. pelanggan.js
with codecs.open('frontend/js/pelanggan.js', 'r', 'utf-8') as f:
    code = f.read()
code = code.replace("const API_BASE = '/api';", "const API_BASE = 'http://localhost:3000/api';")
code = code.replace("const ASSET_BASE = '';", "const ASSET_BASE = 'http://localhost:3000';")
with codecs.open('frontend/js/pelanggan.js', 'w', 'utf-8') as f:
    f.write(code)

# 3. login.js
with codecs.open('frontend/js/login.js', 'r', 'utf-8') as f:
    code = f.read()
code = code.replace("fetch('/api/", "fetch('http://localhost:3000/api/")
with codecs.open('frontend/js/login.js', 'w', 'utf-8') as f:
    f.write(code)

print("Reverted to localhost:3000")
