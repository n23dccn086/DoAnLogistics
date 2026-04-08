document.addEventListener("DOMContentLoaded", () => {
  // Cho phép nhấn Enter để đăng nhập
  const loginPass = document.getElementById("loginPass");
  if (loginPass) {
    loginPass.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        doLogin();
      }
    });
  }

  // Load trang Dashboard khi vừa vào ứng dụng
  // (sẽ tự động chạy sau khi đăng nhập)
  window.onload = function () {
    const appLayout = document.getElementById("appLayout");
    if (appLayout && appLayout.style.display !== "none") {
      showPage("dashboard");
    }
  };

  console.log(
    "%cHHH Logistics - Hệ thống quản lý vận tải đã sẵn sàng!",
    "color: #f97316; font-weight: bold;",
  );
});

// Xóa dữ liệu cũ trong localStorage (để chuyển sang dùng API)
const keysToRemove = [
    "danhSachBaoGia",
    "khachHangList",
    "danhSachVanDon",
    "danhSachPhieuThu",
    "bangGiaCuoc",
    "currentBaoGiaDetail",
    "currentVanDonDetail",
    "khachHangPhieuThu"
];

keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Đã xóa key: ${key}`);
    }
});
