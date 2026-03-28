// ====================== DASHBOARD ======================
function loadDashboard() {
    // Lấy dữ liệu
    let vanDonList = JSON.parse(localStorage.getItem('danhSachVanDon')) || [];
    let phieuThuList = JSON.parse(localStorage.getItem('danhSachPhieuThu')) || [];

    // Ngày hôm nay
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    // Vận đơn hôm nay
    const vanDonHomNay = vanDonList.filter(vd => vd.ngayTao === todayStr);
    const soVanDonHomNay = vanDonHomNay.length;

    // Vận đơn tháng này
    const vanDonThangNay = vanDonList.filter(vd => {
        const date = new Date(vd.ngayTao);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    const soVanDonThangNay = vanDonThangNay.length;

    // Doanh thu tháng này (tổng giá trị vận đơn đã xác nhận hoặc chốt)
    let doanhThuThangNay = 0;
    vanDonThangNay.forEach(vd => {
        if (vd.trangThai === 'Đã xác nhận' || vd.trangThai === 'Đã chốt') {
            doanhThuThangNay += parseFloat(vd.giaTri.replace(/[^0-9]/g, '')) || 0;
        }
    });

    // Tổng công nợ (từ các vận đơn chưa thanh toán đủ)
    let tongCongNo = 0;
    vanDonList.forEach(vd => {
        if (vd.trangThai !== 'Đã hủy') {
            const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, '')) || 0;
            const daThu = vd.daThu || 0;
            tongCongNo += (giaTri - daThu);
        }
    });

    // Cập nhật các chỉ số
    document.getElementById('statHomNay').textContent = soVanDonHomNay;
    document.getElementById('statThangNay').textContent = soVanDonThangNay;
    document.getElementById('statDoanhThu').textContent = formatVND(doanhThuThangNay);
    document.getElementById('statCongNo').textContent = formatVND(tongCongNo);

    // Tính thay đổi so với tháng trước (giả lập – có thể tính thực nếu muốn)
    // Ở đây tạm dùng số ngẫu nhiên nhưng có thể bỏ qua
    // Thay bằng tính toán thực nếu có dữ liệu tháng trước.

    // Hiển thị 5 vận đơn gần nhất
    const vanDonGanDay = [...vanDonList].sort((a,b) => new Date(b.ngayTao) - new Date(a.ngayTao)).slice(0,5);
    const tbodyVanDon = document.getElementById('vanDonGanDayBody');
    if (vanDonGanDay.length === 0) {
        tbodyVanDon.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có vận đơn</td></tr>';
    } else {
        tbodyVanDon.innerHTML = vanDonGanDay.map(vd => {
            const thanhToanClass = vd.trangThaiThanhToan === 'Đã thanh toán' ? 'badge-paid' :
                                   vd.trangThaiThanhToan === 'Một phần' ? 'badge-partial' : 'badge-unpaid';
            return `
                <tr>
                    <td><span class="td-mono">${vd.id}</span></td>
                    <td><strong>${vd.khachHang || 'Không rõ'}</strong></td>
                    <td><div style="font-size:13px">${vd.tuyen || '—'}</div></td>
                    <td style="font-family:monospace">${vd.giaTri}</td>
                    <td><span class="badge ${thanhToanClass}">${vd.trangThaiThanhToan}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Top 5 công nợ
    // Sử dụng hàm tinhCongNo từ congno.js (nếu có)
    let topCongNo = [];
    if (typeof tinhCongNo === 'function') {
        const congNoList = tinhCongNo();
        topCongNo = [...congNoList].sort((a,b) => b.tongNo - a.tongNo).slice(0,5);
    } else {
        // Fallback: tự tính
        let congNoMap = new Map();
        vanDonList.forEach(vd => {
            if (vd.trangThai === 'Đã hủy') return;
            const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, '')) || 0;
            const daThu = vd.daThu || 0;
            const conNo = giaTri - daThu;
            if (conNo <= 0) return;
            const ten = vd.khachHang || 'Không rõ';
            if (!congNoMap.has(ten)) congNoMap.set(ten, { ten, tongNo: 0, soVanDon: 0 });
            const kh = congNoMap.get(ten);
            kh.tongNo += conNo;
            kh.soVanDon += 1;
        });
        topCongNo = Array.from(congNoMap.values()).sort((a,b) => b.tongNo - a.tongNo).slice(0,5);
    }

    const topCongNoDiv = document.getElementById('topCongNoBody');
    if (topCongNo.length === 0) {
        topCongNoDiv.innerHTML = '<div class="empty-state">Không có dữ liệu công nợ</div>';
    } else {
        topCongNoDiv.innerHTML = topCongNo.map((item, idx) => `
            <div class="congno-item">
                <div class="congno-rank ${idx < 2 ? 'top' : ''}">${idx+1}</div>
                <div class="congno-info">
                    <div class="congno-company">${item.ten}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${item.soVanDon} vận đơn chưa TT</div>
                </div>
                <div class="congno-amount">${formatVND(item.tongNo)}</div>
            </div>
        `).join('');
    }
}
