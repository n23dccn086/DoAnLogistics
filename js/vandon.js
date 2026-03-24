/**
 * Tạo vận đơn từ báo giá
 */
function createVanDon() {
    showToast('Đang tạo vận đơn mới...');
    setTimeout(() => {
        showPage('vandon-detail');
        showToast('Vận đơn đã được tạo thành công!');
    }, 1000);
}

/**
 * Xác nhận hủy vận đơn
 */
function confirmHuy() {
    const modal = document.getElementById('huyModal');
    if (modal) modal.classList.remove('active');

    showToast('Vận đơn đã được hủy thành công.');
    setTimeout(() => {
        showPage('vandon-list');
    }, 800);
}

/**
 * Chấp nhận tuyến (trong chi tiết báo giá)
 */
function acceptTuyen() {
    showToast('Tuyến đã được khách hàng chấp nhận.');
}

/**
 * Từ chối tuyến
 */
function rejectTuyen() {
    showToast('Tuyến đã bị khách hàng từ chối.');
}