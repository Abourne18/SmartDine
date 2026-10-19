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
                const response = await fetch('/api/login', {
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
});
