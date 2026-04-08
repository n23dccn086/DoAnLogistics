// ====================== QUẢN LÝ PHIẾU THU ======================

let currentPhieuThu = null; // lưu phiếu thu vừa tạo để xuất PDF

// Lấy danh sách khách hàng có vận đơn (từ danh sách vận đơn)
function getDanhSachKhachHangCoVanDon() {
  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  let khachSet = new Set();
  vanDonList.forEach((vd) => {
    if (vd.khachHang) khachSet.add(vd.khachHang);
  });
  return Array.from(khachSet).sort();
}

// Load danh sách khách hàng vào combobox
function loadKhachHangSelect() {
  const select = document.getElementById("khachHangSelect");
  if (!select) return;
  let khachList = getDanhSachKhachHangCoVanDon();
  select.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
  khachList.forEach((kh) => {
    let opt = document.createElement("option");
    opt.value = kh;
    opt.textContent = kh;
    select.appendChild(opt);
  });
}

// Khi chọn khách hàng, load danh sách vận đơn còn nợ của khách đó
function loadVanDonCuaKhach() {
  const khach = document.getElementById("khachHangSelect").value;
  const container = document.getElementById("danhSachVanDonPhanBo");
  if (!khach) {
    container.innerHTML =
      '<p style="padding:20px; text-align:center;">Vui lòng chọn khách hàng</p>';
    return;
  }

  let vanDonList = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  let vanDonCuaKhach = vanDonList.filter((vd) => vd.khachHang === khach);
  // Lọc những vận đơn còn nợ (số tiền còn nợ > 0)
  let vanDonConNo = vanDonCuaKhach.filter((vd) => {
    let giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
    let daThu = vd.daThu || 0;
    return giaTri - daThu > 0;
  });

  if (vanDonConNo.length === 0) {
    container.innerHTML =
      '<p style="padding:20px; text-align:center;">Khách hàng này không có vận đơn còn nợ</p>';
    return;
  }

  let html = "";
  vanDonConNo.forEach((vd) => {
    let giaTri = parseFloat(vd.giaTri.replace(/[^0-9]/g, "")) || 0;
    let daThu = vd.daThu || 0;
    let conNo = giaTri - daThu;
    let tuyen = vd.tuyen || "—";
    html += `
            <div class="vandon-select-item" style="margin-bottom:12px; background:var(--bg-secondary); padding:12px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1">
                        <div style="font-weight:600; font-size:14px">${vd.id}</div>
                        <div style="font-size:12px; color:var(--text-muted)">${tuyen}</div>
                        <div style="font-size:12px; margin-top:4px">Còn nợ: ${formatVND(conNo)}</div>
                    </div>
                    <div class="amount-input-wrapper" style="width:160px">
                        <input type="number" class="form-input phanBoInput" data-id="${vd.id}" data-conno="${conNo}"
                               placeholder="0" min="0" step="1000" value="0" oninput="tinhChonhLech()">
                        <span class="currency" style="font-size:11px">đ</span>
                    </div>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
  // Gán sự kiện kiểm tra không vượt quá số nợ
  document.querySelectorAll(".phanBoInput").forEach((input) => {
    input.addEventListener("input", function () {
      let max = parseFloat(this.dataset.conno);
      let val = parseFloat(this.value);
      if (val > max) {
        this.value = max;
        showToast(
          `Số tiền phân bổ không được vượt quá số nợ (${formatVND(max)})`,
          "warning",
        );
        tinhChonhLech();
      } else if (val < 0) {
        this.value = 0;
        tinhChonhLech();
      }
    });
  });
  tinhChonhLech();
}

// Tính tổng phân bổ và chênh lệch
function tinhChonhLech() {
  const tongThuInput = document.getElementById("tongSoTienThu");
  let tongThu = parseFloat(tongThuInput.value) || 0;
  let tongPhanBo = 0;
  document.querySelectorAll(".phanBoInput").forEach((input) => {
    let val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) tongPhanBo += val;
  });
  let chenhLech = tongThu - tongPhanBo;

  document.getElementById("tongThuDisplay").textContent = formatVND(tongThu);
  document.getElementById("tongPhanBoDisplay").textContent =
    formatVND(tongPhanBo);
  const chenhLechSpan = document.getElementById("chenhLechDisplay");
  chenhLechSpan.textContent = formatVND(Math.abs(chenhLech));
  if (chenhLech === 0) {
    chenhLechSpan.style.color = "var(--success)";
  } else {
    chenhLechSpan.style.color = "var(--danger)";
  }

  let percent = tongThu === 0 ? 0 : (tongPhanBo / tongThu) * 100;
  document.getElementById("progressBarPhanBo").style.width =
    Math.min(percent, 100) + "%";
}

// Hiển thị/ẩn ô số tham chiếu theo hình thức
function toggleSoThamChieu() {
  const hinhThuc = document.getElementById("hinhThucThu").value;
  const soThamChieu = document.getElementById("soThamChieu");
  if (hinhThuc === "CHUYEN_KHOAN") {
    soThamChieu.required = true;
    soThamChieu.placeholder = "Số CK / mã giao dịch (bắt buộc)";
  } else {
    soThamChieu.required = false;
    soThamChieu.placeholder = "Số tham chiếu (không bắt buộc)";
  }
}

// Lưu phiếu thu
async function luuPhieuThu() {
    // Validate
    const khach = document.getElementById("khachHangSelect").value;
    if (!khach) {
        showToast("Vui lòng chọn khách hàng", "error");
        return;
    }
    const ngayThu = document.getElementById("ngayThu").value;
    if (!ngayThu) {
        showToast("Vui lòng chọn ngày thu", "error");
        return;
    }
    const tongThu = parseFloat(document.getElementById("tongSoTienThu").value);
    if (isNaN(tongThu) || tongThu <= 0) {
        showToast("Tổng số tiền thu phải lớn hơn 0", "error");
        return;
    }
    const hinhThuc = document.getElementById("hinhThucThu").value;
    const soThamChieu = document.getElementById("soThamChieu").value.trim();
    if (hinhThuc === "CHUYEN_KHOAN" && !soThamChieu) {
        showToast("Vui lòng nhập số tham chiếu (mã giao dịch)", "error");
        return;
    }

    // Lấy danh sách phân bổ
    let chiTiet = [];
    let tongPhanBo = 0;
    document.querySelectorAll(".phanBoInput").forEach((input) => {
        let val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
            let maVanDon = input.dataset.id;
            chiTiet.push({ maVanDon, soTien: val });
            tongPhanBo += val;
        }
    });

    if (tongPhanBo !== tongThu) {
        showToast(`Tổng phân bổ (${formatVND(tongPhanBo)}) không khớp với tổng thu (${formatVND(tongThu)})`, "error");
        return;
    }

    if (tongPhanBo === 0) {
        showToast("Chưa có khoản phân bổ nào", "error");
        return;
    }

    // Tạo payload
    const payload = {
        khachHangId: khach, // cần chuyển thành id? hiện tại select đang lưu tên khách, bạn cần sửa lại để lưu id
        ngayThu,
        hinhThuc,
        soThamChieu,
        ghiChu: document.getElementById("ghiChuPhieuThu").value.trim(),
        tongSoTien: tongThu,
        chiTiet
    };

    try {
        const result = await callAPI("phieuthu", { method: "POST", body: JSON.stringify(payload) });
        showToast("Đã lưu phiếu thu thành công", "success");
        // Lưu phiếu thu vừa tạo để xuất PDF
        currentPhieuThu = result.data;
        xemPhieuThuPDF();

        // Reload danh sách vận đơn và công nợ nếu đang mở
        if (typeof loadDanhSachVanDon === "function") loadDanhSachVanDon();
        if (typeof loadCongNo === "function") loadCongNo();

        // Chuyển về trang công nợ hoặc danh sách phiếu thu
        setTimeout(() => showPage("congno"), 1500);
    } catch (error) {
        console.error(error);
        showToast("Lỗi lưu phiếu thu: " + error.message, "error");
    }
}

// Tạo HTML cho PDF phiếu thu
function generatePhieuThuPDFHTML(pt) {
  let tongSoTien = formatVND(pt.tongSoTien);
  let html = `
        <div class="pdf-preview" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <div class="header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px;">
                <div class="company-name" style="font-size: 28px; font-weight: bold; color: #f97316;">HHH Logistics</div>
                <div class="quote-title" style="font-size: 16px; margin-top: 10px; color: #666;">PHIẾU THU TIỀN</div>
                <div style="font-size: 14px; margin-top: 5px;">Số: ${pt.maPhieuThu}</div>
            </div>
            <div style="margin-bottom: 30px;">
                <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">KHÁCH HÀNG:</span>
                    <span>${pt.maKhachHang}</span>
                </div>
                <div class="info-row"><span class="label">NGÀY THU:</span><span>${pt.ngayThu}</span></div>
                <div class="info-row"><span class="label">HÌNH THỨC:</span><span>${pt.hinhThuc === "CHUYEN_KHOAN" ? "Chuyển khoản" : "Tiền mặt"}</span></div>
                <div class="info-row"><span class="label">SỐ THAM CHIẾU:</span><span>${pt.soThamChieu || "—"}</span></div>
                <div class="info-row"><span class="label">TỔNG SỐ TIỀN:</span><span style="font-weight:bold; color:#f97316;">${tongSoTien}</span></div>
                ${pt.ghiChu ? `<div class="info-row"><span class="label">GHI CHÚ:</span><span>${pt.ghiChu}</span></div>` : ""}
            </div>
            <div style="margin-bottom: 30px;">
                <h3 style="color: #f97316; margin-bottom: 15px;">CHI TIẾT PHÂN BỔ</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f97316; color: white;">
                            <th style="padding: 10px; text-align: left;">Mã vận đơn</th>
                            <th style="padding: 10px; text-align: right;">Số tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pt.chiTiet
                          .map(
                            (ct) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${ct.maVanDon}</td>
                                <td style="padding: 8px; text-align: right;">${formatVND(ct.soTien)}</td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
            <div class="total" style="font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #f97316;">
                TỔNG CỘNG: ${tongSoTien}
            </div>
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
                * Phiếu thu này được tạo tự động từ hệ thống<br>
                Mọi thắc mắc xin liên hệ: HHH Logistics - Hotline: 1900xxxx
            </div>
        </div>
    `;
  return html;
}

// Xem PDF phiếu thu
function xemPhieuThuPDF() {
  if (!currentPhieuThu) {
    showToast("Chưa có phiếu thu để xem", "error");
    return;
  }
  const html = generatePhieuThuPDFHTML(currentPhieuThu);
  document.getElementById("pdfPhieuThuContent").innerHTML = html;
  document.getElementById("pdfPhieuThuModal").classList.add("active");
}

function closePdfPhieuThuModal() {
  document.getElementById("pdfPhieuThuModal").classList.remove("active");
}

function downloadPhieuThuPDF() {
  const element = document.getElementById("pdfPhieuThuContent");
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `PhieuThu_${currentPhieuThu.maPhieuThu}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
  showToast("Đang tạo PDF...", "success");
}

// Hàm khởi tạo trang tạo phiếu thu (gọi sau khi load HTML động)
function initPhieuThuCreate() {
  const today = new Date().toISOString().split("T")[0];
  const ngayThu = document.getElementById("ngayThu");
  if (ngayThu) ngayThu.value = today;

  loadKhachHangSelect(); // Load danh sách khách hàng vào dropdown
  toggleSoThamChieu(); // Xử lý ô số tham chiếu

  // Nếu được gọi từ trang công nợ (có lưu tên khách hàng)
  const khachHangPhieuThu = localStorage.getItem("khachHangPhieuThu");
  if (khachHangPhieuThu) {
    const select = document.getElementById("khachHangSelect");
    setTimeout(() => {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === khachHangPhieuThu) {
          select.selectedIndex = i;
          loadVanDonCuaKhach();
          break;
        }
      }
      localStorage.removeItem("khachHangPhieuThu");
    }, 200);
  }
}

// Khởi tạo trang tạo phiếu thu
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-phieuthu-create")) {
    initPhieuThuCreate();
  }
});
