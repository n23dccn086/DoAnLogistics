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

// ====================== QUẢN LÝ VẬN ĐƠN ======================

// Load danh sách vận đơn (không phân trang)
function loadDanhSachVanDon() {
    const tbody = document.getElementById('vandon-table-body');
    if (!tbody) return;

    let vanDonList = JSON.parse(localStorage.getItem('danhSachVanDon')) || [];

    const statusFilter = document.getElementById('filterStatus')?.value || '';
    let filtered = vanDonList;
    if (statusFilter) {
        filtered = filtered.filter(vd => vd.trangThai === statusFilter);
    }

    const thanhToanFilter = document.getElementById('filterThanhToan')?.value || '';
    if (thanhToanFilter) {
        filtered = filtered.filter(vd => vd.trangThaiThanhToan === thanhToanFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;">Chưa có vận đơn nào</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(vd => `
        <tr>
            <td><span class="td-mono">${vd.id}</span></td>
            <td><strong>${vd.khachHang || 'Không rõ'}</strong></td>
            <td><div style="font-size:13px">${vd.tuyen || '—'}</div></td>
            <td>${vd.ngayVanChuyen}</td>
            <td style="font-family:monospace;font-weight:600">${vd.giaTri}</td>
            <td><span class="badge badge-confirmed">${vd.trangThai}</span></td>
            <td><span class="badge ${vd.trangThaiThanhToan === 'Đã thanh toán' ? 'badge-paid' : vd.trangThaiThanhToan === 'Một phần' ? 'badge-partial' : 'badge-unpaid'}">${vd.trangThaiThanhToan}</span></td>
            <td><button class="btn btn-ghost btn-sm" onclick="viewVanDonDetail('${vd.id}')">Chi tiết</button></td>
        </tr>
    `).join('');
}

// Tìm kiếm vận đơn
function searchVanDonList() {
    const keyword = document.getElementById('searchVanDon').value.trim();
    const criteria = document.getElementById('searchCriteria').value;
    const tbody = document.getElementById('vandon-table-body');
    if (!tbody) return;
    
    if (keyword === '') {
        loadDanhSachVanDon();
        return;
    }
    
    let vanDonList = JSON.parse(localStorage.getItem('danhSachVanDon')) || [];
    
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    let filtered = vanDonList;
    if (statusFilter) {
        filtered = filtered.filter(vd => vd.trangThai === statusFilter);
    }
    
    const thanhToanFilter = document.getElementById('filterThanhToan')?.value || '';
    if (thanhToanFilter) {
        filtered = filtered.filter(vd => vd.trangThaiThanhToan === thanhToanFilter);
    }
    
    const keywordLower = keyword.toLowerCase();
    
    if (criteria === 'maVanDon') {
        filtered = filtered.filter(vd => vd.id.toLowerCase().includes(keywordLower));
    } else {
        filtered = filtered.filter(vd => {
            const tenKhach = vd.khachHang || '';
            return tenKhach.toLowerCase().includes(keywordLower);
        });
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:80px;">Không tìm thấy vận đơn nào với từ khóa "<strong>' + keyword + '</strong>"</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(vd => {
        const thanhToanClass = vd.trangThaiThanhToan === 'Đã thanh toán' ? 'badge-paid' :
                               vd.trangThaiThanhToan === 'Một phần' ? 'badge-partial' : 'badge-unpaid';
        
        return '<tr>' +
            '<td><span class="td-mono">' + vd.id + '</span></td>' +
            '<td><strong>' + (vd.khachHang || 'Không rõ') + '</strong></td>' +
            '<td><div style="font-size:13px">' + (vd.tuyen || '—') + '</div></td>' +
            '<td>' + vd.ngayVanChuyen + '</td>' +
            '<td style="font-family:monospace;font-weight:600">' + vd.giaTri + '</td>' +
            '<td><span class="badge badge-confirmed">' + vd.trangThai + '</span></td>' +
            '<td><span class="badge ' + thanhToanClass + '">' + vd.trangThaiThanhToan + '</span></td>' +
            '<td><button class="btn btn-ghost btn-sm" onclick="viewVanDonDetail(\'' + vd.id + '\')">Chi tiết</button></td>' +
            '</tr>';
    }).join('');
}

// Xem chi tiết vận đơn
function viewVanDonDetail(id) {
    // Lấy danh sách vận đơn
    let danhSachVanDon = JSON.parse(localStorage.getItem('danhSachVanDon')) || [];
    const vanDon = danhSachVanDon.find(vd => vd.id === id);
    
    if (vanDon) {
        localStorage.setItem('currentVanDonDetail', JSON.stringify(vanDon));
        showPage('vandon-detail');
    } else {
        showToast("Không tìm thấy vận đơn!", "error");
    }
}

// Khởi tạo khi load trang
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-vandon-list')) {
        console.log("🔄 Khởi tạo trang danh sách vận đơn");
        loadDanhSachVanDon();
    }
});