document.addEventListener('DOMContentLoaded', () => {
    // Jika sudah memiliki session login, langsung arahkan ke dashboard
    if (localStorage.getItem('adminSession')) {
        window.location.href = 'admin.html';
    }

    // ==========================================
    // 1. KONEKSI API HALAMAN LOGIN
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value.trim();
            const pesan = document.getElementById('pesan');
            const submitBtn = document.getElementById('submitBtn');

            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Memproses...';
            submitBtn.disabled = true;
            pesan.innerText = '';

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('adminSession', JSON.stringify(result.data));
                    window.location.href = 'admin.html';
                } else {
                    pesan.style.color = '#d9534f';
                    pesan.innerText = result.message || 'Username atau password salah.';
                }
            } catch (error) {
                pesan.style.color = '#d9534f';
                pesan.innerText = 'Gagal terhubung ke server.';
                console.error('Error Login:', error);
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 2. KONEKSI API HALAMAN REGISTER
    // ==========================================
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nama = document.getElementById('regNama').value.trim();
            const user = document.getElementById('regUser').value.trim();
            const pass = document.getElementById('regPass').value.trim();
            const peran = document.getElementById('regPeran').value;
            
            const pesanEl = document.getElementById('pesan');
            const submitBtn = document.getElementById('regSubmitBtn');

            pesanEl.style.color = '#6b7280';
            pesanEl.innerText = 'Mendaftarkan akun...';
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Memproses...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        nama_lengkap: nama, 
                        username: user, 
                        password: pass, 
                        peran: peran 
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    pesanEl.style.color = '#27ae60';
                    pesanEl.innerText = result.message;
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    pesanEl.style.color = '#d9534f';
                    pesanEl.innerText = result.message;
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                pesanEl.style.color = '#d9534f';
                pesanEl.innerText = 'Gagal terhubung ke server Node.js.';
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                console.error('Error Register:', error);
            }
        });
    }
});
