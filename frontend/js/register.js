document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const nama = document.getElementById('regNama').value.trim();
            const user = document.getElementById('regUsername').value.trim();
            const pass = document.getElementById('regPassword').value;
            const peran = document.getElementById('regPeran').value;
            
            const pesan = document.getElementById('regPesan');
            const regBtn = document.getElementById('regBtn');

            regBtn.innerText = 'Memproses...';
            regBtn.disabled = true;
            pesan.innerText = '';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama_lengkap: nama, username: user, password: pass, peran: peran })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    pesan.style.color = '#16a34a'; // Hijau
                    pesan.innerText = result.message;
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    pesan.style.color = '#d9534f';
                    pesan.innerText = result.message;
                }
            } catch (error) {
                pesan.style.color = '#d9534f';
                pesan.innerText = 'Gagal terhubung ke server.';
            } finally {
                regBtn.innerText = 'Daftar Sekarang';
                regBtn.disabled = false;
            }
        });
    }
});