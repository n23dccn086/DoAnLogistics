/**
 * Chuyển đổi giữa các trang
 */
async function showPage(pageId) {
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

    // Gọi init cho từng trang cần khởi tạo thêm
    if (pageId === "baogia-create" && typeof initBaoGiaCreate === "function") {
      initBaoGiaCreate();
    }
  } catch (error) {
    contentArea.innerHTML = `
            <div style="text-align:center;padding:80px 20px;color:var(--text-muted);">
                <p style="font-size:18px;">Không tìm thấy trang "${pageId}"</p>
                <p style="margin-top:10px;">Vui lòng kiểm tra lại đường dẫn file.</p>
            </div>`;
    console.error("Load page error:", error);
  }

  window.scrollTo(0, 0);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU KHI CHUYỂN TAB ====================
  if (pageId === "khachhang") {
    setTimeout(() => {
      if (typeof loadDanhSachKhachHang === "function") {
        loadDanhSachKhachHang();
      }
    }, 100);
  }

  if (pageId === "baogia-create") {
    setTimeout(() => {
      if (typeof loadDanhSachKhachHang === "function") {
        loadDanhSachKhachHang();
      }
    }, 100);
  }

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU KHI CHUYỂN TRANG ====================
  if (pageId === "baogia-list") {
    setTimeout(() => {
      if (typeof loadDanhSachBaoGia === "function") {
        loadDanhSachBaoGia();
      }
    }, 150);
  }

if (pageId === "vandon-list") {
    setTimeout(() => {
        if (typeof loadDanhSachVanDon === "function") {
            console.log("🔄 Gọi loadDanhSachVanDon");
            loadDanhSachVanDon();
        } else {
            console.error("❌ loadDanhSachVanDon không tồn tại");
        }
    }, 150);
}


  if (pageId === "baogia-create") {
    setTimeout(() => {
      if (typeof initBaoGiaCreatePage === "function") {
        initBaoGiaCreatePage();
      }
    }, 150);
  }

  // ====================== TỰ ĐỘNG LOAD CHI TIẾT BÁO GIÁ ======================
  if (pageId === "baogia-detail") {
    setTimeout(() => {
      if (typeof loadBaoGiaDetail === "function") {
        loadBaoGiaDetail();
      }
    }, 200);
  }
}
