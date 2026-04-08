// ====================== DASHBOARD ======================
function loadDashboard() {
  // Lấy dữ liệu
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  let phieuThuList = JSON.parse(localStorage.getItem("danhSachPhieuThu")) || [];

  // Ngày hôm nay
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  // Vận đơn hôm nay (lọc theo ngày tạo)
  const vanDonHomNay = vanDonList.filter((vd) => vd.ngayTao === todayStr);
  const soVanDonHomNay = vanDonHomNay.length;

  // Vận đơn tháng này
  const vanDonThangNay = vanDonList.filter((vd) => {
    const date = new Date(vd.ngayTao);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
  const soVanDonThangNay = vanDonThangNay.length;

  // Doanh thu tháng này (tổng giá trị vận đơn đã xác nhận hoặc chốt)
  let doanhThuThangNay = 0;
  vanDonThangNay.forEach((vd) => {
    if (vd.trangThai === "Đã xác nhận" || vd.trangThai === "Đã chốt") {
      const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
      doanhThuThangNay += giaTri;
    }
  });

  // Tổng công nợ (từ vận đơn chưa thanh toán đủ và chưa bị hủy)
  let tongCongNo = 0;
  vanDonList.forEach((vd) => {
    if (vd.trangThai !== "Đã hủy") {
      const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
      const daThu = vd.daThu || 0;
      tongCongNo += giaTri - daThu;
    }
  });

  // Cập nhật các chỉ số
  const statHomNay = document.getElementById("statHomNay");
  if (statHomNay) statHomNay.textContent = soVanDonHomNay;
  const statThangNay = document.getElementById("statThangNay");
  if (statThangNay) statThangNay.textContent = soVanDonThangNay;
  const statDoanhThu = document.getElementById("statDoanhThu");
  if (statDoanhThu) statDoanhThu.textContent = formatVND(doanhThuThangNay);
  const statCongNo = document.getElementById("statCongNo");
  if (statCongNo) statCongNo.textContent = formatVND(tongCongNo);

  // Tính % thay đổi (giả lập so với tháng trước, nếu có dữ liệu)
  // Có thể bỏ qua hoặc tính thực tế nếu muốn.

  // Hiển thị 5 vận đơn gần đây
  const vanDonGanDay = [...vanDonList]
    .sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao))
    .slice(0, 5);
  const tbodyVanDon = document.getElementById("vanDonGanDayBody");
  if (tbodyVanDon) {
    if (vanDonGanDay.length === 0) {
      tbodyVanDon.innerHTML =
        '<tr><td colspan="5" style="text-align:center">Chưa có vận đơn</td></tr>';
    } else {
      tbodyVanDon.innerHTML = vanDonGanDay
        .map((vd) => {
          const thanhToanClass =
            vd.trangThaiThanhToan === "Đã thanh toán"
              ? "badge-paid"
              : vd.trangThaiThanhToan === "Một phần"
                ? "badge-partial"
                : "badge-unpaid";
          return `
                    <tr>
                        <td><span class="td-mono">${escapeHtml(vd.id)}</span></td>
                        <td><strong>${escapeHtml(vd.khachHang || "Không rõ")}</strong></td>
                        <td><div style="font-size:13px">${escapeHtml(vd.tuyen || "—")}</div></td>
                        <td style="font-family:monospace">${vd.giaTri}</td>
                        <td><span class="badge ${thanhToanClass}">${vd.trangThaiThanhToan}</span></td>
                    </tr>
                `;
        })
        .join("");
    }
  }

  // Top 5 công nợ
  // Tính công nợ theo khách hàng
  let congNoMap = new Map();
  vanDonList.forEach((vd) => {
    if (vd.trangThai === "Đã hủy") return;
    const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
    const daThu = vd.daThu || 0;
    const conNo = giaTri - daThu;
    if (conNo <= 0) return;
    const ten = vd.khachHang || "Không rõ";
    if (!congNoMap.has(ten))
      congNoMap.set(ten, { ten, tongNo: 0, soVanDon: 0 });
    const kh = congNoMap.get(ten);
    kh.tongNo += conNo;
    kh.soVanDon += 1;
  });
  const topCongNo = Array.from(congNoMap.values())
    .sort((a, b) => b.tongNo - a.tongNo)
    .slice(0, 5);
  const topCongNoDiv = document.getElementById("topCongNoBody");
  if (topCongNoDiv) {
    if (topCongNo.length === 0) {
      topCongNoDiv.innerHTML =
        '<div class="empty-state">Không có dữ liệu công nợ</div>';
    } else {
      topCongNoDiv.innerHTML = topCongNo
        .map(
          (item, idx) => `
                <div class="congno-item">
                    <div class="congno-rank ${idx < 2 ? "top" : ""}">${idx + 1}</div>
                    <div class="congno-info">
                        <div class="congno-company">${escapeHtml(item.ten)}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${item.soVanDon} vận đơn chưa TT</div>
                    </div>
                    <div class="congno-amount">${formatVND(item.tongNo)}</div>
                </div>
            `,
        )
        .join("");
    }
  }
}
