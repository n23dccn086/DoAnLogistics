/**
 * Cập nhật tổng kết phiếu thu
 */
function updatePTSummary() {
    const tongTienInput = document.getElementById('ptTongTien');
    const tongTien = parseInt(tongTienInput ? tongTienInput.value.replace(/[^0-9]/g, '') : 0) || 5000000;

    // Demo: phân bổ cứng
    const phanBo = 3600000 + 1400000;
    const chenhLech = tongTien - phanBo;
    const percent = Math.min((phanBo / tongTien) * 100, 100);

    // Cập nhật giao diện
    const soTienEl = document.getElementById('ptSoTien');
    const phanBoEl = document.getElementById('ptPhanBo');
    const chenhLechEl = document.getElementById('ptChenhLech');
    const progressBar = document.getElementById('ptProgressBar');

    if (soTienEl) soTienEl.textContent = formatVND(tongTien);
    if (phanBoEl) phanBoEl.textContent = formatVND(phanBo);
    if (chenhLechEl) {
        chenhLechEl.textContent = formatVND(Math.abs(chenhLech));
        chenhLechEl.style.color = chenhLech === 0 ? 'var(--success)' : 'var(--danger)';
    }
    if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.style.background = chenhLech === 0 ? 'var(--success)' : 'var(--warning)';
    }
}

/**
 * Lưu phiếu thu
 */
function savePhieuThu() {
    showToast('Phiếu thu đã được lưu thành công!');
    setTimeout(() => {
        showPage('congno');
    }, 1000);
}