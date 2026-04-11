// ====================== VANDON.JS ======================

// ====================== CÁC HÀM TIỆN ÍCH ======================
// formatVND và showToast đã có trong utils.js, không cần khai báo lại

// ====================== TẠO VẬN ĐƠN (GỌI TỪ BÁO GIÁ) ======================
function createVanDon() {
  showToast("Đang tạo vận đơn mới...");
  setTimeout(() => {
    showPage("vandon-detail");
    showToast("Vận đơn đã được tạo thành công!");
  }, 1000);
}

// ====================== HỦY VẬN ĐƠN (CŨ) ======================
function confirmHuy() {
  const modal = document.getElementById("huyModal");
  if (modal) modal.classList.remove("active");
  showToast("Vận đơn đã được hủy thành công.");
  setTimeout(() => {
    showPage("vandon-list");
  }, 800);
}

// ====================== CHẤP NHẬN/TỪ CHỐI TUYẾN ======================
function acceptTuyen() {
  showToast("Tuyến đã được khách hàng chấp nhận.");
}
function rejectTuyen() {
  showToast("Tuyến đã bị khách hàng từ chối.");
}

// ====================== QUẢN LÝ VẬN ĐƠN ======================
let currentVanDon = null; // lưu vận đơn đang xem

// Load danh sách vận đơn (không phân trang)
// ==================== loadDanhSachVanDon() - ĐÃ SỬA ====================
async function loadDanhSachVanDon() {
    const tbody = document.getElementById("vandon-table-body");
    if (!tbody) return;

    const statusFilter = document.getElementById("filterStatus")?.value || "";
    const thanhToanFilter = document.getElementById("filterThanhToan")?.value || "";

    let url = 'vandon';
    const params = new URLSearchParams();
    if (statusFilter) params.append('trangThai', statusFilter);
    if (thanhToanFilter) params.append('thanhToan', thanhToanFilter);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const data = await callAPI(url);
        const list = data?.data || [];

        // Lấy danh sách khách hàng để kiểm tra khách bị xóa
        const khachData = await callAPI('khachhang?all=true');
        const activeKhachSet = new Set(
            (khachData?.data || []).map(kh => kh.tenCongTy)
        );

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;">Không có vận đơn nào</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(vd => {
            const ngayHienThi = vd.ngayTao || vd.ngayVanChuyen || "--";
            const thanhToanClass = vd.trangThaiThanhToan === "Đã thanh toán" ? "badge-paid" :
                                  vd.trangThaiThanhToan === "Một phần" ? "badge-partial" : "badge-unpaid";
            const trangThaiClass = vd.trangThai === "Đã chốt" ? "badge-paid" :
                                  vd.trangThai === "Đã hủy" ? "badge-cancelled" : "badge-confirmed";

            const isKhachDeleted = !activeKhachSet.has(vd.khachHang);
            const khachDisplay = isKhachDeleted
                ? `<span style="color: var(--danger);">${escapeHtml(vd.khachHang || "Không rõ")}</span><span style="display:block; font-size:10px; color: var(--warning);">⚠️ Đã ngưng hợp tác</span>`
                : `<strong>${escapeHtml(vd.khachHang || "Không rõ")}</strong>`;

            return `
                <tr>
                    <td><span class="td-mono">${escapeHtml(vd.id)}</span></td>
                    <td>${khachDisplay}</td>
                    <td><div style="font-size:13px">${escapeHtml(vd.tuyen || "—")}</div></td>
                    <td>${escapeHtml(ngayHienThi)}</td>
                    <td style="font-family:monospace;font-weight:600">${formatVND(vd.giaTri)}</td>
                    <td><span class="badge ${trangThaiClass}">${escapeHtml(vd.trangThai)}</span></td>
                    <td><span class="badge ${thanhToanClass}">${escapeHtml(vd.trangThaiThanhToan)}</span></td>
                    <td><button class="btn btn-ghost btn-sm" onclick="viewVanDonDetail('${vd.id}')">Chi tiết</button></td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Lỗi load danh sách vận đơn:", error);
        if (!error.message?.includes("401")) {
            showToast("Không thể tải danh sách vận đơn", "error");
        }
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--danger);">Không thể tải dữ liệu vận đơn.</td></tr>`;
    }
}

// Tìm kiếm vận đơn
function searchVanDonList() {
  const keyword = document.getElementById("searchVanDon").value.trim();
  const criteria = document.getElementById("searchCriteria").value;
  const tbody = document.getElementById("vandon-table-body");
  if (!tbody) return;

  if (keyword === "") {
    loadDanhSachVanDon();
    return;
  }

  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];

  const statusFilter = document.getElementById("filterStatus")?.value || "";
  let filtered = vanDonList;
  if (statusFilter) {
    filtered = filtered.filter((vd) => vd.trangThai === statusFilter);
  }

  const thanhToanFilter =
    document.getElementById("filterThanhToan")?.value || "";
  if (thanhToanFilter) {
    filtered = filtered.filter(
      (vd) => vd.trangThaiThanhToan === thanhToanFilter,
    );
  }

  const keywordLower = keyword.toLowerCase();

  if (criteria === "maVanDon") {
    filtered = filtered.filter((vd) =>
      vd.id.toLowerCase().includes(keywordLower),
    );
  } else {
    filtered = filtered.filter((vd) => {
      const tenKhach = vd.khachHang || "";
      return tenKhach.toLowerCase().includes(keywordLower);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:80px;">Không tìm thấy vận đơn nào với từ khóa "<strong>' +
      escapeHtml(keyword) +
      '</strong>"</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((vd) => {
      const ngayHienThi = vd.ngayTao || vd.ngayVanChuyen || "--";
      const thanhToanClass =
        vd.trangThaiThanhToan === "Đã thanh toán"
          ? "badge-paid"
          : vd.trangThaiThanhToan === "Một phần"
            ? "badge-partial"
            : "badge-unpaid";
      const trangThaiClass =
        vd.trangThai === "Đã chốt"
          ? "badge-paid"
          : vd.trangThai === "Đã hủy"
            ? "badge-cancelled"
            : "badge-confirmed";
      return `
            <tr>
                <td><span class="td-mono">${escapeHtml(vd.id)}</span></td>
                <td><strong>${escapeHtml(vd.khachHang || "Không rõ")}</strong></td>
                <td><div style="font-size:13px">${escapeHtml(vd.tuyen || "—")}</div></td>
                <td>${escapeHtml(ngayHienThi)}</td>
                <td style="font-family:monospace;font-weight:600">${vd.giaTri}</td>
                <td><span class="badge ${trangThaiClass}">${escapeHtml(vd.trangThai)}</span></td>
                <td><span class="badge ${thanhToanClass}">${escapeHtml(vd.trangThaiThanhToan)}</span></td>
                <td><button class="btn btn-ghost btn-sm" onclick="viewVanDonDetail('${vd.id}')">Chi tiết</button></td>
            </tr>
        `;
    })
    .join("");
}

// Xem chi tiết vận đơn
function viewVanDonDetail(id) {
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const vanDon = vanDonList.find((vd) => vd.id === id);
  if (vanDon) {
    localStorage.setItem("currentVanDonDetail", JSON.stringify(vanDon));
    showPage("vandon-detail");
  } else {
    showToast("Không tìm thấy vận đơn!", "error");
  }
}

// ====================== CHI TIẾT VẬN ĐƠN ======================

// Load chi tiết vận đơn
function loadVanDonDetail() {
  console.log("loadVanDonDetail bắt đầu");
  const data = localStorage.getItem("currentVanDonDetail");
  console.log("currentVanDonDetail:", data);
  if (!data) {
    const infoDiv = document.getElementById("infoVanDonCoDinh");
    if (infoDiv)
      infoDiv.innerHTML =
        '<p style="color:red">Không tìm thấy dữ liệu vận đơn! Hãy chọn vận đơn từ danh sách.</p>';
    return;
  }
  currentVanDon = JSON.parse(data);
  const vd = currentVanDon;
  console.log("Vận đơn đã tải:", vd);

  // Cập nhật header
  const maEl = document.getElementById("detailMaVanDon");
  if (maEl) maEl.textContent = vd.id;
  const trangThaiEl = document.getElementById("detailTrangThaiVanDon");
  if (trangThaiEl) trangThaiEl.textContent = vd.trangThai || "Đã xác nhận";
  const thanhToanEl = document.getElementById("detailTrangThaiThanhToan");
  if (thanhToanEl) {
    thanhToanEl.textContent = vd.trangThaiThanhToan;
    const thanhToanClass =
      vd.trangThaiThanhToan === "Đã thanh toán"
        ? "badge-paid"
        : vd.trangThaiThanhToan === "Một phần"
          ? "badge-partial"
          : "badge-unpaid";
    thanhToanEl.className = `badge ${thanhToanClass}`;
  }

  // Kiểm tra khách hàng có còn active không
  let khachHangList = JSON.parse(localStorage.getItem("khachHangList")) || [];
  let khachActive = true;
  let khachTen = vd.khachHang || "";
  if (khachTen) {
    const khachObj = khachHangList.find((kh) => kh.tenCongTy === khachTen);
    if (khachObj && khachObj.isActive === false) {
      khachActive = false;
    }
  }
  const khachHangDisplay = khachActive
    ? escapeHtml(khachTen)
    : `<span style="color: var(--danger);">${escapeHtml(khachTen)}</span><span style="display:block; font-size:10px; color: var(--warning);">⚠️ Đã ngưng hợp tác</span>`;

  // Thông tin cố định (chỉ một lần, không gắn với từng tuyến)
  // Lấy điểm đi/đến của tuyến đầu (nếu có) để hiển thị ở phần cố định, nhưng có thể hiển thị tổng hợp
  let diemDi = "",
    diemDen = "";
  if (vd.tuyenChiTiet && vd.tuyenChiTiet.length) {
    diemDi = vd.tuyenChiTiet[0].diemDi || "";
    diemDen = vd.tuyenChiTiet[0].diemDen || "";
  }
  const infoCoDinh = `
        <div class="info-item"><div class="info-label">Khách hàng</div><div class="info-value">${khachHangDisplay}</div></div>
        <div class="info-item"><div class="info-label">Ngày tạo vận đơn</div><div class="info-value">${escapeHtml(vd.ngayTao || vd.ngayVanChuyen || "--")}</div></div>
        <div class="info-item"><div class="info-label">Điểm lấy hàng (tổng quát)</div><div class="info-value">${escapeHtml(diemDi || "--")}</div></div>
        <div class="info-item"><div class="info-label">Điểm giao hàng (tổng quát)</div><div class="info-value">${escapeHtml(diemDen || "--")}</div></div>
        <div class="info-item"><div class="info-label">Tổng số tuyến</div><div class="info-value">${vd.tuyenChiTiet ? vd.tuyenChiTiet.length : 0}</div></div>
        <div class="info-item"><div class="info-label">Tổng giá trị</div><div class="info-value" style="color:var(--accent);font-weight:700">${vd.giaTri}</div></div>
    `;
  document.getElementById("infoVanDonCoDinh").innerHTML = infoCoDinh;

  // Hiển thị từng tuyến với các ô nhập riêng
  const container = document.getElementById("tuyenThucTeContainer");
  if (container && vd.tuyenChiTiet && vd.tuyenChiTiet.length) {
    let html = "";
    vd.tuyenChiTiet.forEach((tuyen, idx) => {
      // Lấy dữ liệu đã lưu (nếu có)
      const diaChiLay = tuyen.diaChiLayHang || "";
      const diaChiGiao = tuyen.diaChiGiaoHang || "";
      const tenLay = tuyen.nguoiLienHeLay_Ten || "";
      const sdtLay = tuyen.nguoiLienHeLay_SDT || "";
      const tenGiao = tuyen.nguoiLienHeGiao_Ten || "";
      const sdtGiao = tuyen.nguoiLienHeGiao_SDT || "";
      const ghiChu = tuyen.ghiChu || "";

      html += `
                <div class="tuyen-thuc-te" style="margin-bottom:24px; border:1px solid var(--border); border-radius:8px; padding:16px;">
                    <div style="font-weight:700; margin-bottom:12px; color:var(--accent);">🚛 Tuyến ${idx + 1}: ${escapeHtml(tuyen.diemDi)} → ${escapeHtml(tuyen.diemDen)} (${tuyen.khoangCach || 0} km)</div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Địa chỉ lấy hàng *</label>
                            <input type="text" class="form-input" name="diaChiLayHang_${idx}" value="${escapeHtml(diaChiLay)}" placeholder="Số nhà, đường, phường/xã">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Địa chỉ giao hàng *</label>
                            <input type="text" class="form-input" name="diaChiGiaoHang_${idx}" value="${escapeHtml(diaChiGiao)}" placeholder="Số nhà, đường, phường/xã">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Người liên hệ (lấy hàng) - Họ tên *</label>
                            <input type="text" class="form-input" name="nguoiLienHeLay_Ten_${idx}" value="${escapeHtml(tenLay)}" placeholder="Họ tên">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Người liên hệ (lấy hàng) - Số điện thoại *</label>
                            <input type="text" class="form-input" name="nguoiLienHeLay_SDT_${idx}" value="${escapeHtml(sdtLay)}" placeholder="Số điện thoại">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Người liên hệ (giao hàng) - Họ tên *</label>
                            <input type="text" class="form-input" name="nguoiLienHeGiao_Ten_${idx}" value="${escapeHtml(tenGiao)}" placeholder="Họ tên">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Người liên hệ (giao hàng) - Số điện thoại *</label>
                            <input type="text" class="form-input" name="nguoiLienHeGiao_SDT_${idx}" value="${escapeHtml(sdtGiao)}" placeholder="Số điện thoại">
                        </div>
                        <div class="form-group form-group-full">
                            <label class="form-label">Ghi chú</label>
                            <textarea class="form-input" name="ghiChu_${idx}" rows="2" placeholder="Ghi chú thêm...">${escapeHtml(ghiChu)}</textarea>
                        </div>
                    </div>
                </div>
            `;
    });
    container.innerHTML = html;
  } else if (container) {
    container.innerHTML =
      '<p style="padding:20px; text-align:center;">Không có dữ liệu tuyến</p>';
  }

  // Cập nhật thanh toán và lịch sử
  updateThanhToanUI(vd);
  renderLichSuThanhToan(vd.id);

  // Hiển thị lý do hủy
  const lyDoHuyDiv = document.getElementById("lyDoHuyDetail");
  if (lyDoHuyDiv) {
    if (vd.trangThai === "Đã hủy" && vd.lyDoHuy) {
      lyDoHuyDiv.innerHTML = `
                <div style="margin-top:16px; padding:12px; background: rgba(239,68,68,0.1); border-left: 3px solid var(--danger); border-radius: 8px;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: var(--danger);">❌ Lý do hủy:</div>
                    <div style="font-style: italic;">${escapeHtml(vd.lyDoHuy)}</div>
                </div>
            `;
    } else {
      lyDoHuyDiv.innerHTML = "";
    }
  }

  // Hiển thị nút Chốt đơn và Khôi phục
  const btnChotDon = document.getElementById("btnChotDon");
  const btnKhoiPhuc = document.getElementById("btnKhoiPhuc");
  if (btnChotDon) btnChotDon.style.display = "none";
  if (btnKhoiPhuc) btnKhoiPhuc.style.display = "none";

  if (vd.trangThai === "Đã xác nhận") {
    const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
    const daThu = vd.daThu || 0;
    if (daThu >= giaTri) {
      if (btnChotDon) btnChotDon.style.display = "inline-flex";
    }
  } else if (vd.trangThai === "Đã hủy") {
    if (btnKhoiPhuc) btnKhoiPhuc.style.display = "inline-flex";
  }
}

// Cập nhật UI thanh toán
function updateThanhToanUI(vd) {
  const giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
  const daThu = vd.daThu || 0;
  const conNo = giaTri - daThu;

  document.getElementById("giaTriVanDon").textContent = formatVND(giaTri);
  document.getElementById("daThanhToan").textContent = formatVND(daThu);
  document.getElementById("conNo").textContent = formatVND(conNo);
  const percent = giaTri === 0 ? 0 : (daThu / giaTri) * 100;
  document.getElementById("progressBar").style.width = percent + "%";

  // Cập nhật trạng thái thanh toán
  let trangThai = "Chưa thanh toán";
  if (daThu === 0) trangThai = "Chưa thanh toán";
  else if (daThu >= giaTri) trangThai = "Đã thanh toán";
  else trangThai = "Một phần";
  vd.trangThaiThanhToan = trangThai;
  document.getElementById("detailTrangThaiThanhToan").textContent = trangThai;
  const thanhToanClass =
    trangThai === "Đã thanh toán"
      ? "badge-paid"
      : trangThai === "Một phần"
        ? "badge-partial"
        : "badge-unpaid";
  document.getElementById("detailTrangThaiThanhToan").className =
    `badge ${thanhToanClass}`;

  // Lưu lại vào localStorage
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const index = vanDonList.findIndex((v) => v.id === vd.id);
  if (index !== -1) {
    vanDonList[index] = vd;
    localStorage.setItem("danhSachVanDon", JSON.stringify(vanDonList));
    localStorage.setItem("currentVanDonDetail", JSON.stringify(vd));
  }
}

// Hiển thị lịch sử thanh toán
function renderLichSuThanhToan(maVanDon) {
  const phieuThuList =
    JSON.parse(localStorage.getItem("danhSachPhieuThu")) || [];
  const lichSu = phieuThuList.filter((pt) => pt.maVanDon === maVanDon);
  const tbody = document.getElementById("lichSuThanhToanBody");
  if (lichSu.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center">Chưa có thanh toán</td></tr>';
    return;
  }
  tbody.innerHTML = lichSu
    .map(
      (pt) => `
        <tr>
            <td>${escapeHtml(pt.maPhieuThu)}</td>
            <td>${escapeHtml(pt.ngayThu)}</td>
            <td>${pt.hinhThuc === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt"}</td>
            <td style="font-family:monospace">${formatVND(pt.soTien)}</td>
            <td>${escapeHtml(pt.soThamChieu || "—")}</td>
        </tr>
    `,
    )
    .join("");
}

// Lưu thông tin thực tế
function saveVanDonInfo() {
  if (!currentVanDon) return;
  const container = document.getElementById("tuyenThucTeContainer");
  if (!container) return;

  const tuyenChiTiet = currentVanDon.tuyenChiTiet || [];
  let isValid = true;
  let errorMessages = [];

  for (let i = 0; i < tuyenChiTiet.length; i++) {
    const diaChiLay =
      document.querySelector(`[name="diaChiLayHang_${i}"]`)?.value.trim() || "";
    const diaChiGiao =
      document.querySelector(`[name="diaChiGiaoHang_${i}"]`)?.value.trim() ||
      "";
    const tenLay =
      document
        .querySelector(`[name="nguoiLienHeLay_Ten_${i}"]`)
        ?.value.trim() || "";
    const sdtLay =
      document
        .querySelector(`[name="nguoiLienHeLay_SDT_${i}"]`)
        ?.value.trim() || "";
    const tenGiao =
      document
        .querySelector(`[name="nguoiLienHeGiao_Ten_${i}"]`)
        ?.value.trim() || "";
    const sdtGiao =
      document
        .querySelector(`[name="nguoiLienHeGiao_SDT_${i}"]`)
        ?.value.trim() || "";

    // Kiểm tra từng trường
    if (!diaChiLay)
      errorMessages.push(`Tuyến ${i + 1}: thiếu địa chỉ lấy hàng`);
    if (!diaChiGiao)
      errorMessages.push(`Tuyến ${i + 1}: thiếu địa chỉ giao hàng`);
    if (!tenLay)
      errorMessages.push(`Tuyến ${i + 1}: thiếu họ tên người liên hệ lấy hàng`);
    if (!sdtLay)
      errorMessages.push(
        `Tuyến ${i + 1}: thiếu số điện thoại người liên hệ lấy hàng`,
      );
    if (!tenGiao)
      errorMessages.push(
        `Tuyến ${i + 1}: thiếu họ tên người liên hệ giao hàng`,
      );
    if (!sdtGiao)
      errorMessages.push(
        `Tuyến ${i + 1}: thiếu số điện thoại người liên hệ giao hàng`,
      );

    // Validate số điện thoại nếu có nhập
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8,9})$/;
    if (sdtLay && !phoneRegex.test(sdtLay))
      errorMessages.push(
        `Tuyến ${i + 1}: số điện thoại lấy hàng không hợp lệ (10-11 số, bắt đầu bằng 0)`,
      );
    if (sdtGiao && !phoneRegex.test(sdtGiao))
      errorMessages.push(
        `Tuyến ${i + 1}: số điện thoại giao hàng không hợp lệ (10-11 số, bắt đầu bằng 0)`,
      );

    // Lưu tạm vào đối tượng để sau khi kiểm tra xong mới gán
    tuyenChiTiet[i].diaChiLayHang = diaChiLay;
    tuyenChiTiet[i].diaChiGiaoHang = diaChiGiao;
    tuyenChiTiet[i].nguoiLienHeLay_Ten = tenLay;
    tuyenChiTiet[i].nguoiLienHeLay_SDT = sdtLay;
    tuyenChiTiet[i].nguoiLienHeGiao_Ten = tenGiao;
    tuyenChiTiet[i].nguoiLienHeGiao_SDT = sdtGiao;
    tuyenChiTiet[i].ghiChu =
      document.querySelector(`[name="ghiChu_${i}"]`)?.value.trim() || "";
  }

  if (errorMessages.length > 0) {
    showToast(errorMessages.join("\n"), "error");
    return;
  }

  currentVanDon.tuyenChiTiet = tuyenChiTiet;
  // Lưu vào localStorage
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const index = vanDonList.findIndex((v) => v.id === currentVanDon.id);
  if (index !== -1) vanDonList[index] = currentVanDon;
  localStorage.setItem("danhSachVanDon", JSON.stringify(vanDonList));
  localStorage.setItem("currentVanDonDetail", JSON.stringify(currentVanDon));
  showToast("Đã lưu thông tin vận đơn", "success");
}

// Xác nhận thanh toán
function xacNhanThanhToan() {
  if (!currentVanDon) return;
  const soTien = parseFloat(document.getElementById("soTienThanhToan").value);
  if (isNaN(soTien) || soTien <= 0) {
    showToast("⚠️ Số tiền thanh toán phải lớn hơn 0", "error");
    return;
  }
  const giaTri = parseFloat(currentVanDon.giaTri.replace(/[^0-9]/g, "")) || 0;
  const daThu = currentVanDon.daThu || 0;
  const conNo = giaTri - daThu;
  if (soTien > conNo) {
    showToast(
      `⚠️ Số tiền thanh toán vượt quá số nợ còn lại (Còn nợ: ${formatVND(conNo)})`,
      "error",
    );
    return;
  }
  if (conNo === 0) {
    showToast(
      "❌ Vận đơn đã được thanh toán đầy đủ, không thể thanh toán thêm",
      "error",
    );
    return;
  }

  // Tạo phiếu thu mới
  const phieuThuList =
    JSON.parse(localStorage.getItem("danhSachPhieuThu")) || [];
  const maPhieuThu = `PT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(phieuThuList.length + 1).padStart(4, "0")}`;
  const phieuThu = {
    maPhieuThu: maPhieuThu,
    maVanDon: currentVanDon.id,
    soTien: soTien,
    ngayThu: new Date().toISOString().split("T")[0],
    hinhThuc: document.getElementById("hinhThucThanhToan").value,
    soThamChieu: document.getElementById("soThamChieu").value.trim(),
    nguoiGhiNhan: "Nhân viên",
  };
  phieuThuList.unshift(phieuThu);
  localStorage.setItem("danhSachPhieuThu", JSON.stringify(phieuThuList));

  // Cập nhật vận đơn
  currentVanDon.daThu = daThu + soTien;
  updateThanhToanUI(currentVanDon);
  renderLichSuThanhToan(currentVanDon.id);
  document.getElementById("soTienThanhToan").value = "";
  document.getElementById("soThamChieu").value = "";
  showToast(`✅ Đã ghi nhận thanh toán ${formatVND(soTien)}`, "success");

  // Đồng bộ với danh sách vận đơn nếu đang mở
  if (document.getElementById("page-vandon-list")) {
    loadDanhSachVanDon();
  }
}

// Hủy vận đơn
let currentVanDonForPDF = null;

function showHuyVanDonModal() {
  document.getElementById("huyVanDonModal").classList.add("active");
}
function closeHuyModal() {
  document.getElementById("huyVanDonModal").classList.remove("active");
}
function xacNhanHuyVanDon() {
  const lyDo = document.getElementById("lyDoHuy").value.trim();
  if (!lyDo) {
    showToast("Vui lòng nhập lý do hủy", "error");
    return;
  }
  if (!currentVanDon) {
    showToast("Không có dữ liệu vận đơn!", "error");
    return;
  }
  currentVanDon.trangThai = "Đã hủy";
  currentVanDon.lyDoHuy = lyDo;
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const index = vanDonList.findIndex((v) => v.id === currentVanDon.id);
  if (index !== -1) vanDonList[index] = currentVanDon;
  localStorage.setItem("danhSachVanDon", JSON.stringify(vanDonList));
  localStorage.setItem("currentVanDonDetail", JSON.stringify(currentVanDon));
  closeHuyModal();
  showToast("Vận đơn đã được hủy", "success");
  loadVanDonDetail(); // Tải lại chi tiết để hiển thị lý do

  // Cập nhật danh sách vận đơn và công nợ nếu đang mở
  if (document.getElementById("page-vandon-list")) loadDanhSachVanDon();
  if (
    document.getElementById("page-congno") &&
    typeof loadCongNo === "function"
  )
    loadCongNo();

  setTimeout(() => {
    if (document.getElementById("page-vandon-detail")) showPage("vandon-list");
  }, 1500);
}

// Khôi phục vận đơn đã hủy
function khoiPhucVanDon() {
  if (!currentVanDon) return;
  if (currentVanDon.trangThai !== "Đã hủy") {
    showToast("Chỉ có thể khôi phục vận đơn đã hủy", "error");
    return;
  }
  currentVanDon.trangThai = "Đã xác nhận";
  // Xóa lý do hủy
  delete currentVanDon.lyDoHuy;
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const index = vanDonList.findIndex((v) => v.id === currentVanDon.id);
  if (index !== -1) vanDonList[index] = currentVanDon;
  localStorage.setItem("danhSachVanDon", JSON.stringify(vanDonList));
  localStorage.setItem("currentVanDonDetail", JSON.stringify(currentVanDon));
  showToast("Đã khôi phục vận đơn", "success");
  loadVanDonDetail(); // Cập nhật giao diện
  // Cập nhật danh sách vận đơn và công nợ nếu đang mở
  if (document.getElementById("page-vandon-list")) loadDanhSachVanDon();
  if (
    document.getElementById("page-congno") &&
    typeof loadCongNo === "function"
  )
    loadCongNo();
}

// Chốt đơn
function chotDonVanDon() {
  if (!currentVanDon) return;
  const giaTri = parseFloat(currentVanDon.giaTri.replace(/[^0-9]/g, "")) || 0;
  const daThu = currentVanDon.daThu || 0;
  if (daThu < giaTri) {
    showToast("Chỉ có thể chốt đơn khi đã thanh toán đủ", "error");
    return;
  }
  if (currentVanDon.trangThai !== "Đã xác nhận") {
    showToast(
      "Chỉ có thể chốt đơn khi vận đơn đang ở trạng thái Đã xác nhận",
      "error",
    );
    return;
  }
  currentVanDon.trangThai = "Đã chốt";
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const index = vanDonList.findIndex((v) => v.id === currentVanDon.id);
  if (index !== -1) vanDonList[index] = currentVanDon;
  localStorage.setItem("danhSachVanDon", JSON.stringify(vanDonList));
  localStorage.setItem("currentVanDonDetail", JSON.stringify(currentVanDon));
  showToast("Đã chốt đơn thành công", "success");
  loadVanDonDetail();
  if (document.getElementById("page-vandon-list")) {
    loadDanhSachVanDon();
  }
}

// ====================== PDF VÀ EMAIL ======================
function generateVanDonPDFHTML(vd) {
  let tenKhach = vd.khachHang || "";
  let ghiChu = vd.ghiChu || "";
  let giaTri = vd.giaTri;
  let daThu = vd.daThu || 0;
  let conNo = parseFloat(giaTri.replace(/[^0-9]/g, "")) - daThu;

  // --- Tạo HTML chi tiết từng tuyến ---
  let tuyenHtml = "";
  if (vd.tuyenChiTiet && vd.tuyenChiTiet.length) {
    tuyenHtml =
      '<div style="margin-bottom:30px;"><h3 style="color:#f97316; margin-bottom:15px;">CHI TIẾT CÁC TUYẾN</h3>';
    vd.tuyenChiTiet.forEach((t, idx) => {
      tuyenHtml += `
                <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
                    <div><strong>Tuyến ${idx + 1}:</strong> ${escapeHtml(t.diemDi)} → ${escapeHtml(t.diemDen)} (${t.khoangCach || 0} km)</div>
                    <div><span class="label">Địa chỉ lấy hàng:</span> ${escapeHtml(t.diaChiLayHang || "—")}</div>
                    <div><span class="label">Địa chỉ giao hàng:</span> ${escapeHtml(t.diaChiGiaoHang || "—")}</div>
                    <div><span class="label">Người liên hệ lấy:</span> ${escapeHtml(t.nguoiLienHeLay_Ten || "—")} - ${escapeHtml(t.nguoiLienHeLay_SDT || "—")}</div>
                    <div><span class="label">Người liên hệ giao:</span> ${escapeHtml(t.nguoiLienHeGiao_Ten || "—")} - ${escapeHtml(t.nguoiLienHeGiao_SDT || "—")}</div>
                    <div><span class="label">Loại hàng:</span> ${escapeHtml(t.loaiHang || "—")} | <span class="label">Trọng lượng:</span> ${t.trongLuong || 0} kg</div>
                    <div><span class="label">Đơn giá:</span> ${t.donGia ? formatVND(t.donGia) + " đ/km/kg" : "—"}</div>
                    ${t.ghiChu ? `<div><span class="label">Ghi chú:</span> ${escapeHtml(t.ghiChu)}</div>` : ""}
                </div>
            `;
    });
    tuyenHtml += "</div>";
  } else {
    tuyenHtml =
      '<div style="margin-bottom:30px;"><p>Không có dữ liệu tuyến</p></div>';
  }

  return `
        <div class="pdf-preview" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <div class="header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px;">
                <div class="company-name" style="font-size: 28px; font-weight: bold; color: #f97316;">HHH Logistics</div>
                <div class="quote-title" style="font-size: 16px; margin-top: 10px; color: #666;">VẬN ĐƠN VẬN CHUYỂN</div>
                <div style="font-size: 14px; margin-top: 5px;">Số: ${escapeHtml(vd.id)}</div>
            </div>
            <div style="margin-bottom: 30px;">
                <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">KHÁCH HÀNG:</span>
                    <span>${escapeHtml(tenKhach)}</span>
                </div>
                <div class="info-row"><span class="label">NGÀY TẠO VẬN ĐƠN:</span><span>${escapeHtml(vd.ngayTao || vd.ngayVanChuyen || "--")}</span></div>
            </div>

            <!-- CHÈN CHI TIẾT CÁC TUYẾN VÀO ĐÂY -->
            ${tuyenHtml}

            <div class="total" style="font-size: 20px; font-weight: bold; color: #f97316; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #f97316;">
                <div>GIÁ TRỊ VẬN ĐƠN: ${giaTri}</div>
                <div>ĐÃ THANH TOÁN: ${formatVND(daThu)}</div>
                <div>CÒN NỢ: ${formatVND(conNo)}</div>
            </div>
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
                * Vận đơn có hiệu lực kể từ ngày tạo<br>
                Mọi thắc mắc xin liên hệ: HHH Logistics - Hotline: 1900xxxx
            </div>
        </div>
    `;
}

function previewVanDonPDF() {
  if (!currentVanDon) {
    showToast("Không có dữ liệu vận đơn!", "error");
    return;
  }
  console.log("previewVanDonPDF chạy, currentVanDon:", currentVanDon);
  currentVanDonForPDF = currentVanDon;
  const pdfHTML = generateVanDonPDFHTML(currentVanDonForPDF);
  document.getElementById("pdfVanDonContent").innerHTML = pdfHTML;
  document.getElementById("pdfVanDonModal").classList.add("active");
}
function closePdfVanDonModal() {
  document.getElementById("pdfVanDonModal").classList.remove("active");
}
function downloadVanDonPDF() {
  const element = document.getElementById("pdfVanDonContent");
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `VanDon_${currentVanDonForPDF.id}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
  showToast("Đang tạo PDF...", "success");
}
function sendVanDonEmailWithPDF() {
  let emailKhach = "";
  if (currentVanDon.khachHangInfo) {
    const emailMatch = currentVanDon.khachHangInfo.match(/Email:\s*([^\s\n]+)/);
    if (emailMatch) emailKhach = emailMatch[1];
  }
  if (!emailKhach) {
    const subject = encodeURIComponent(
      `Vận đơn vận chuyển ${currentVanDon.id}`,
    );
    const body = encodeURIComponent(
      `Kính gửi Quý khách hàng,\n\nVui lòng xem file PDF đính kèm để biết chi tiết vận đơn.\n\nTrân trọng!`,
    );
    window.location.href = `mailto:${emailKhach}?subject=${subject}&body=${body}`;
    showToast("Đang mở email client...", "info");
  } else {
    showToast(`Đã gửi email đến ${emailKhach}`, "success");
  }
}
function sendVanDonEmail() {
  sendVanDonEmailWithPDF();
}

// ====================== KHỞI TẠO ======================
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-vandon-list")) {
    loadDanhSachVanDon();
  }
  if (document.getElementById("page-vandon-detail")) {
    loadVanDonDetail();
  }
});

// ====================== ESCAPE HTML ======================
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    })
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
      return c;
    });
}
