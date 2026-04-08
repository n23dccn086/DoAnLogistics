/**
 * Định dạng số tiền theo kiểu Việt Nam (ví dụ: 3.200.000đ)
 */
function formatVND(num) {
    if (num === undefined || num === null) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/**
 * Tạo mã vận đơn theo format VD-YYYYMMDD-XXXX
 * @param {Array} existingIds - Danh sách các id vận đơn đã có (để tìm số thứ tự lớn nhất trong ngày)
 */
function generateVanDonId(existingIds = []) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    let maxSeq = 0;
    const prefix = `VD-${dateStr}-`;
    existingIds.forEach(id => {
        if (id.startsWith(prefix)) {
            const seq = parseInt(id.slice(-4));
            if (seq > maxSeq) maxSeq = seq;
        }
    });
    const newSeq = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${newSeq}`;
}

/**
 * Tính số ngày quá hạn (dựa trên ngày tạo vận đơn)
 * @param {string} ngayTao - Ngày tạo vận đơn (YYYY-MM-DD)
 * @returns {number} Số ngày quá hạn (0 nếu chưa quá hạn)
 */
function tinhSoNgayQuaHan(ngayTao) {
    const today = new Date();
    const ngayTaoDate = new Date(ngayTao);
    const diffDays = Math.floor((today - ngayTaoDate) / (1000 * 60 * 60 * 24));
    return diffDays > 30 ? diffDays - 30 : 0;
}

/**
 * Validate email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate số điện thoại Việt Nam (10-11 số, đầu 03,05,07,08,09)
 */
function isValidPhone(phone) {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8,9})$/;
    return phoneRegex.test(phone);
}

/**
 * Lấy ngày hiện tại dạng YYYY-MM-DD
 */
function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Chuyển đổi chuỗi ngày từ DD/MM/YYYY sang YYYY-MM-DD
 */
function convertDateToDB(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

/**
 * Chuyển đổi ngày từ YYYY-MM-DD sang DD/MM/YYYY
 */
function convertDateFromDB(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

module.exports = {
    formatVND,
    escapeHtml,
    generateVanDonId,
    tinhSoNgayQuaHan,
    isValidEmail,
    isValidPhone,
    getToday,
    convertDateToDB,
    convertDateFromDB
};