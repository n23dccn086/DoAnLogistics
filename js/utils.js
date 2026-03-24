/**
 * Định dạng số tiền theo kiểu Việt Nam (ví dụ: 3.200.000đ)
 */
function formatVND(num) {
    if (!num) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

/**
 * Hiển thị Toast notification
 */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Cập nhật số lượng tuyến trong form tạo báo giá
 */
function updateSoTuyen() {
    const count = document.querySelectorAll('.tuyen-card').length;
    const el = document.getElementById('soTuyen');
    if (el) el.textContent = count;

    // Cập nhật tiêu đề từng tuyến
    document.querySelectorAll('.tuyen-title').forEach((title, index) => {
        title.textContent = `🚛 Tuyến ${index + 1}`;
    });
}

/**
 * Tính tổng giá trị tất cả các tuyến
 */
function updateTongGiaTri() {
    let total = 0;
    document.querySelectorAll('.tuyen-thanh-tien').forEach(el => {
        const val = el.textContent.replace(/[^0-9]/g, '');
        total += parseInt(val) || 0;
    });
    
    const tongEl = document.getElementById('tongGiaTri');
    if (tongEl) tongEl.textContent = formatVND(total);
}

/**
 * Tính thành tiền cho một tuyến vận chuyển
 */
function calcThanhTien(input) {
    const card = input.closest('.tuyen-card');
    if (!card) return;

    const select = card.querySelector('select');
    const kgInput = card.querySelector('input[type="number"]:not(.km-input)');
    const kmInput = card.querySelector('.km-input');

    const donGia = parseFloat(select.value) || 0;
    const kg = parseFloat(kgInput.value) || 0;
    const km = parseFloat(kmInput.value) || 0;

    const thanhTien = km * donGia * kg;

    // Hiển thị đơn giá
    const donGiaDisplay = card.querySelector('.don-gia-display');
    if (donGiaDisplay) {
        donGiaDisplay.textContent = donGia ? donGia.toLocaleString('vi-VN') : '—';
    }

    // Hiển thị thành tiền
    const thanhTienEl = card.querySelector('.tuyen-thanh-tien');
    if (thanhTienEl) {
        thanhTienEl.textContent = thanhTien ? formatVND(thanhTien) : '0đ';
    }

    updateTongGiaTri();
}

/**
 * Tính khoảng cách (demo - dùng random)
 */
function getKm(btn) {
    const card = btn.closest('.tuyen-card');
    if (!card) return;

    const kmInput = card.querySelector('.km-input');
    const originalText = btn.textContent;

    btn.textContent = '⏳';
    btn.disabled = true;

    setTimeout(() => {
        const km = Math.floor(Math.random() * 350) + 50; // random 50 - 400 km
        kmInput.value = km;
        btn.textContent = originalText;
        btn.disabled = false;
        
        calcThanhTien(kmInput);
        showToast(`Đã tính được ${km} km`);
    }, 1200);
}