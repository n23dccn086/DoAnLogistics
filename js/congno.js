// ====================== CÔNG NỢ KHÁCH HÀNG ======================

let currentCongNoList = []; // lưu danh sách công nợ hiện tại (đã lọc)

// Tính công nợ từ danh sách vận đơn
function tinhCongNo() {
    let vanDonList = JSON.parse(localStorage.getItem('danhSachVanDon')) || [];
    let congNoMap = new Map(); // key: tên khách hàng

    const today = new Date();

    vanDonList.forEach(vd => {
        // Chỉ tính vận đơn chưa thanh toán đủ và trạng thái chưa hủy (Đã xác nhận hoặc Đã chốt)
        if (vd.trangThai !== 'Đã xác nhận' && vd.trangThai !== 'Đã chốt') return;
        let giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, '')) || 0;
        let daThu = vd.daThu || 0;
        let conNo = giaTri - daThu;
        if (conNo <= 0) return; // bỏ qua vận đơn đã thanh toán đủ

        let tenKhach = vd.khachHang || 'Không rõ';
        let ngayTao = new Date(vd.ngayTao);
        let soNgayQuaHan = Math.floor((today - ngayTao) / (1000 * 60 * 60 * 24)) - 30;
        soNgayQuaHan = soNgayQuaHan > 0 ? soNgayQuaHan : 0;

        if (!congNoMap.has(tenKhach)) {
            congNoMap.set(tenKhach, {
                ten: tenKhach,
                tongNo: 0,
                soVanDon: 0,
                ngayCuNhat: vd.ngayTao,
                soNgayQuaHanMax: 0,
                chiTiet: []
            });
        }
        let kh = congNoMap.get(tenKhach);
        kh.tongNo += conNo;
        kh.soVanDon += 1;
        if (new Date(vd.ngayTao) < new Date(kh.ngayCuNhat)) {
            kh.ngayCuNhat = vd.ngayTao;
        }
        if (soNgayQuaHan > kh.soNgayQuaHanMax) {
            kh.soNgayQuaHanMax = soNgayQuaHan;
        }
        kh.chiTiet.push({
            maVanDon: vd.id,
            giaTri: formatVND(giaTri),
            daThu: formatVND(daThu),
            conNo: formatVND(conNo),
            ngayTao: vd.ngayTao,
            soNgayQuaHan: soNgayQuaHan
        });
    });

    return Array.from(congNoMap.values());
}

// Load và hiển thị công nợ
function loadCongNo() {
    let list = tinhCongNo();
    const search = document.getElementById('searchCongNo')?.value.trim().toLowerCase() || '';
    const filter = document.getElementById('filterTrangThaiNo')?.value || '';
    const sort = document.getElementById('sortCongNo')?.value || 'giam';

    let filtered = list.filter(item => {
        if (search && !item.ten.toLowerCase().includes(search)) return false;
        if (filter === 'quaHan' && item.soNgayQuaHanMax === 0) return false;
        return true;
    });

    // Sắp xếp
    if (sort === 'giam') {
        filtered.sort((a,b) => b.tongNo - a.tongNo);
    } else {
        filtered.sort((a,b) => a.tongNo - b.tongNo);
    }

    currentCongNoList = filtered;

    // Cập nhật tổng quan
    const tongCongNo = filtered.reduce((sum, item) => sum + item.tongNo, 0);
    const soKhachNo = filtered.length;
    const soKhachQuaHan = filtered.filter(item => item.soNgayQuaHanMax > 0).length;

    document.getElementById('tongCongNo').textContent = formatVND(tongCongNo);
    document.getElementById('soKhachNo').textContent = soKhachNo;
    document.getElementById('soKhachQuaHan').textContent = soKhachQuaHan;

    // Hiển thị bảng
    const tbody = document.getElementById('congno-table-body');
    if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:60px;">Không có dữ liệu công nợ</td></tr>';
    return;
}

    tbody.innerHTML = filtered.map(item => {
        const isQuaHan = item.soNgayQuaHanMax > 0;
        const rowClass = isQuaHan ? 'style="background: rgba(239,68,68,0.15);"' : '';
        const quaHanText = isQuaHan ? `<span class="overdue-badge">⚠ ${item.soNgayQuaHanMax} ngày</span>` : '—';

        return `
            <tr ${rowClass}>
                <td><strong>${item.ten}</strong></td>
                <td style="text-align:center">${item.soVanDon}</td>
                <td style="font-family:monospace; font-weight:700; color:var(--danger)">${formatVND(item.tongNo)}</td>
                <td>${item.ngayCuNhat}</td>
                <td>${quaHanText}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="xemChiTietCongNo('${item.ten}')">Xem chi tiết</button>
                    <button class="btn btn-accent btn-sm" onclick="thuTienKhachHang('${item.ten}')" style="margin-left:6px">Thu tiền</button>
                </td>
            </tr>
        `;
    }).join('');
}

function timKiemCongNo() {
    loadCongNo();
}

// Xem chi tiết công nợ (modal)
function xemChiTietCongNo(tenKhach) {
    const khach = currentCongNoList.find(k => k.ten === tenKhach);
    if (!khach) return;
    let html = `
        <h3 style="margin-bottom:16px">${tenKhach}</h3>
        <div class="table-wrapper">
            <table style="width:100%">
                <thead>
                    <tr><th>Mã vận đơn</th><th>Ngày tạo</th><th>Giá trị</th><th>Đã thu</th><th>Còn nợ</th><th>Quá hạn</th></tr>
                </thead>
                <tbody>
    `;
    khach.chiTiet.forEach(vd => {
        const quaHanText = vd.soNgayQuaHan > 0 ? `<span class="overdue-badge">⚠ ${vd.soNgayQuaHan} ngày</span>` : '—';
        html += `<tr>
            <td>${vd.maVanDon}</td>
            <td>${vd.ngayTao}</td>
            <td>${vd.giaTri}</td>
            <td>${vd.daThu}</td>
            <td>${vd.conNo}</td>
            <td>${quaHanText}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    document.getElementById('chiTietCongNoBody').innerHTML = html;
    document.getElementById('modalChiTietCongNo').classList.add('active');
}

function closeModalChiTiet() {
    document.getElementById('modalChiTietCongNo').classList.remove('active');
}

// Chuyển sang trang tạo phiếu thu với khách hàng được chọn
function thuTienKhachHang(tenKhach) {
    localStorage.setItem('khachHangPhieuThu', tenKhach);
    showPage('phieuthu-create');
}

// Xuất báo cáo PDF
let currentBaoCaoForPDF = null;

function xuatBaoCaoCongNoPDF() {
    if (currentCongNoList.length === 0) {
        showToast('Không có dữ liệu để xuất báo cáo', 'error');
        return;
    }
    currentBaoCaoForPDF = currentCongNoList;
    const html = generateBaoCaoHTML(currentBaoCaoForPDF);
    document.getElementById('pdfBaoCaoContent').innerHTML = html;
    document.getElementById('pdfBaoCaoModal').classList.add('active');
}

function generateBaoCaoHTML(list) {
    const tongCongNo = list.reduce((s, i) => s + i.tongNo, 0);
    let rows = '';
    list.forEach(item => {
        rows += `
            <tr style="border-bottom:1px solid #ddd;">
                <td style="padding:8px;">${item.ten}</td>
                <td style="padding:8px; text-align:center;">${item.soVanDon}</td>
                <td style="padding:8px; text-align:right;">${formatVND(item.tongNo)}</td>
                <td style="padding:8px;">${item.ngayCuNhat}</td>
                <td style="padding:8px; text-align:center;">${item.soNgayQuaHanMax > 0 ? item.soNgayQuaHanMax + ' ngày' : '—'}</td>
            </tr>
        `;
    });
    return `
        <div class="pdf-preview" style="font-family: Arial, sans-serif; max-width: 100%;">
            <div class="header" style="text-align:center; margin-bottom:30px;">
                <h1 style="color:#f97316;">HHH Logistics</h1>
                <h2>BÁO CÁO CÔNG NỢ KHÁCH HÀNG</h2>
                <p>Ngày lập: ${new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f97316; color:white;">
                        <th style="padding:10px;">Khách hàng</th>
                        <th style="padding:10px;">Số VĐ chưa TT</th>
                        <th style="padding:10px;">Tổng nợ</th>
                        <th style="padding:10px;">VĐ cũ nhất</th>
                        <th style="padding:10px;">Quá hạn</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot>
                    <tr style="border-top:2px solid #f97316;">
                        <td colspan="2" style="padding:10px; font-weight:bold;">TỔNG CỘNG</td>
                        <td style="padding:10px; text-align:right; font-weight:bold;">${formatVND(tongCongNo)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top:40px; text-align:center; font-size:12px; color:#999;">
                * Báo cáo được tạo tự động từ hệ thống HHH Logistics
            </div>
        </div>
    `;
}

function closePdfBaoCaoModal() {
    document.getElementById('pdfBaoCaoModal').classList.remove('active');
}
function downloadBaoCaoPDF() {
    const element = document.getElementById('pdfBaoCaoContent');
    const opt = {
        margin: [0.5,0.5,0.5,0.5],
        filename: `BaoCaoCongNo_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('Đang tạo PDF...', 'success');
}

// Khởi tạo khi load trang công nợ
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-congno')) {
        loadCongNo();
        const searchBtn = document.getElementById('searchCongNoBtn');
        if (searchBtn) searchBtn.onclick = timKiemCongNo;
        const xuatBaoCaoBtn = document.getElementById('xuatBaoCaoBtn');
        if (xuatBaoCaoBtn) xuatBaoCaoBtn.onclick = xuatBaoCaoCongNoPDF;
        const sortSelect = document.getElementById('sortCongNo');
        if (sortSelect) sortSelect.onchange = loadCongNo;
        const filterSelect = document.getElementById('filterTrangThaiNo');
        if (filterSelect) filterSelect.onchange = loadCongNo;
    }
});