let html5QrCode = null;

        function bukaScannerQR() {
            const modal = document.getElementById('scannerModal');
            const statusText = document.getElementById('scannerStatus');
            modal.style.display = 'flex';

            html5QrCode = new Html5Qrcode("reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            html5QrCode.start(
                { facingMode: "environment" },
                config,
                async (decodedText) => {
                    statusText.textContent = "QR Berhasil Dipindai! Memeriksa meja...";
                    
                    // Ambil nomor meja dari hasil scan (misal URL atau nomor langsung)
                    let tableNo = decodedText.trim();
                    if (tableNo.includes("?table=")) {
                        const urlParams = new URLSearchParams(tableNo.split('?')[1]);
                        tableNo = urlParams.get('table') || tableNo;
                    }

                    try {
                        // Cek status ketersediaan meja ke backend API
                        const response = await fetch('/api/meja');
                        const tables = await response.json();
                        
                        // Cari data meja berdasarkan nomornya
                        const targetTable = tables.find(t => String(t.nomor_meja) === String(tableNo));

                        await html5QrCode.stop();
                        modal.style.display = 'none';

                        window.location.href = `pelanggan.html?table=${tableNo}`;
                    } catch (err) {
                        console.error("Gagal memeriksa status meja:", err);
                        await html5QrCode.stop();
                        modal.style.display = 'none';
                        // Fallback jika terjadi kendala jaringan sesaat
                        window.location.href = `pelanggan.html?table=${tableNo}`;
                    }
                },
                (errorMessage) => {
                    // Error frame scanning diabaikan
                }
            ).catch(err => {
                console.error("Gagal mengakses kamera:", err);
                statusText.textContent = "Gagal mengakses kamera. Pastikan memberikan izin.";
            });
        }
