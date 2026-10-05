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
        (decodedText) => {
            statusText.textContent = "QR Berhasil Dipindai! Mengalihkan...";
            html5QrCode.stop().then(() => {
                modal.style.display = 'none';
                let tableNo = decodedText.trim();
                if (tableNo.includes("?table=")) {
                    window.location.href = decodedText;
                } else {
                    window.location.href = `pelanggan.html?table=${tableNo}`;
                }
            }).catch(err => console.error(err));
        },
        (errorMessage) => {}
    ).catch(err => {
        console.error("Gagal mengakses kamera:", err);
        statusText.textContent = "Gagal mengakses kamera. Berikan izin akses.";
    });
}

function tutupScannerQR() {
    const modal = document.getElementById('scannerModal');
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            modal.style.display = 'none';
        }).catch(() => {
            modal.style.display = 'none';
        });
    } else {
        modal.style.display = 'none';
    }
}