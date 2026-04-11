/**
 * Chuyển đổi giữa các trang
 */
async function showPage(pageId) {
  // ==================== KIỂM TRA TOKEN TRƯỚC KHI CHUYỂN TRANG ====================
  const token = localStorage.getItem("token");

  console.log(`🔄 showPage('${pageId}') được gọi | Token tồn tại: ${!!token}`);

  if (!token && pageId !== "login") {
    console.warn(`🚫 Không có token → Chuyển về login`);
    goToLogin();
    return;
  }

  // ==================== PHẦN CODE CŨ (giữ nguyên) ====================
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));

  const activeNav = document.getElementById("nav-" + pageId);
  if (activeNav) activeNav.classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    "baogia-list": "Danh sách Báo giá",
    "baogia-create": "Tạo Báo giá Mới",
    "baogia-detail": "Chi tiết Báo giá",
    "vandon-list": "Danh sách Vận đơn",
    "vandon-detail": "Chi tiết Vận đơn",
    "phieuthu-create": "Tạo Phiếu Thu",
    congno: "Công nợ Khách hàng",
    khachhang: "Quản lý Khách hàng",
    banggia: "Bảng giá Cước",
  };

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = titles[pageId] || "HHH Logistics";

  const contentArea = document.getElementById("pageContent");
  if (!contentArea) return;

  try {
    const response = await fetch(`pages/${pageId}.html`);
    if (!response.ok) throw new Error("Page not found");
    const html = await response.text();
    contentArea.innerHTML = html;
  } catch (error) {
    contentArea.innerHTML = `
            <div style="text-align:center;padding:80px 20px;color:var(--text-muted);">
                <p style="font-size:18px;">Không tìm thấy trang "${pageId}"</p>
            </div>`;
    console.error("Load page error:", error);
  }

  window.scrollTo(0, 0);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU ====================
  if (pageId === "dashboard") {
    setTimeout(() => {
      if (typeof loadDashboard === "function") loadDashboard();
    }, 100);
  }
  if (pageId === "khachhang") {
    setTimeout(() => {
      if (typeof loadDanhSachKhachHang === "function") loadDanhSachKhachHang();
    }, 100);
  }
  if (pageId === "baogia-list") {
    setTimeout(() => {
      if (typeof loadDanhSachBaoGia === "function") loadDanhSachBaoGia();
    }, 150);
  }
  if (pageId === "vandon-list") {
    setTimeout(() => {
      if (typeof loadDanhSachVanDon === "function") loadDanhSachVanDon();
    }, 150);
  }
  if (pageId === "congno") {
    setTimeout(() => {
      if (typeof loadCongNo === "function") loadCongNo();
    }, 150);
  }
  if (pageId === "banggia") {
    setTimeout(() => {
      if (typeof loadBangGia === "function") loadBangGia();
    }, 150);
  }
  if (pageId === "baogia-create") {
    setTimeout(() => {
      if (typeof loadDanhSachKhachHang === "function") loadDanhSachKhachHang();
      if (typeof initBaoGiaCreate === "function") initBaoGiaCreate();
    }, 150);
  }
  if (pageId === "phieuthu-create") {
    setTimeout(() => {
      if (typeof initPhieuThuCreate === "function") initPhieuThuCreate();
    }, 150);
  }
}
