// ====================== QUẢN LÝ BẢNG GIÁ CƯỚC ======================

let currentEditingBangGiaId = null;

// Load danh sách bảng giá
function loadBangGia() {
  const tbody = document.getElementById("banggia-table-body");
  if (!tbody) return;

  let list = JSON.parse(localStorage.getItem("bangGiaCuoc")) || [];
  const filterLoai = document.getElementById("filterLoaiHang").value;

  if (filterLoai) {
    list = list.filter((item) => item.loaiHang === filterLoai);
  }

  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:60px;">Chưa có dữ liệu bảng giá</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(
      (item) => `
        <tr>
            <td><strong>${item.loaiHang}</strong></td>
            <td>${item.kgTu.toLocaleString()}</td>
            <td>${item.kgDen.toLocaleString()}</td>
            <td style="font-family:monospace;font-weight:700;color:var(--accent)">${item.donGia.toLocaleString()}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="editBangGia(${item.id})">Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBangGia(${item.id})" style="margin-left:5px;">Xóa</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Hiển thị modal thêm mới
function showModalBangGia() {
  currentEditingBangGiaId = null;
  document.getElementById("modalBangGiaTitle").innerText = "Thêm mức giá";
  document.getElementById("bgLoaiHang").value = "Hàng thường";
  document.getElementById("bgKgTu").value = 0;
  document.getElementById("bgKgDen").value = 0;
  document.getElementById("bgDonGia").value = 0;
  document.getElementById("modalBangGia").classList.add("active");
}

// Hiển thị modal sửa
function editBangGia(id) {
  let list = JSON.parse(localStorage.getItem("bangGiaCuoc")) || [];
  const item = list.find((i) => i.id === id);
  if (!item) return;

  currentEditingBangGiaId = id;
  document.getElementById("modalBangGiaTitle").innerText = "Sửa mức giá";
  document.getElementById("bgLoaiHang").value = item.loaiHang;
  document.getElementById("bgKgTu").value = item.kgTu;
  document.getElementById("bgKgDen").value = item.kgDen;
  document.getElementById("bgDonGia").value = item.donGia;
  document.getElementById("modalBangGia").classList.add("active");
}

// Đóng modal
function hideModalBangGia() {
  document.getElementById("modalBangGia").classList.remove("active");
}

// Lưu (thêm mới hoặc cập nhật)
function saveBangGia() {
  const loaiHang = document.getElementById("bgLoaiHang").value;
  let kgTu = parseFloat(document.getElementById("bgKgTu").value);
  let kgDen = parseFloat(document.getElementById("bgKgDen").value);
  let donGia = parseFloat(document.getElementById("bgDonGia").value);

  // Validation
  if (isNaN(kgTu) || kgTu < 0) {
    showToast("Từ (kg) không được nhỏ hơn 0", "error");
    return;
  }
  if (isNaN(kgDen) || kgDen <= kgTu) {
    showToast("Đến (kg) phải lớn hơn Từ (kg)", "error");
    return;
  }
  if (isNaN(donGia) || donGia <= 0) {
    showToast("Đơn giá phải lớn hơn 0", "error");
    return;
  }

  let list = JSON.parse(localStorage.getItem("bangGiaCuoc")) || [];

  // Kiểm tra trùng khoảng kg với cùng loại hàng
  const isOverlap = list.some((item) => {
    if (currentEditingBangGiaId && item.id === currentEditingBangGiaId)
      return false;
    if (item.loaiHang !== loaiHang) return false;
    return (
      (kgTu >= item.kgTu && kgTu <= item.kgDen) ||
      (kgDen >= item.kgTu && kgDen <= item.kgDen) ||
      (kgTu <= item.kgTu && kgDen >= item.kgDen)
    );
  });

  if (isOverlap) {
    showToast(
      "Khoảng kg bị trùng với mức giá đã có của loại hàng này",
      "error",
    );
    return;
  }

  if (currentEditingBangGiaId) {
    // Cập nhật
    const index = list.findIndex((i) => i.id === currentEditingBangGiaId);
    if (index !== -1) {
      list[index] = { ...list[index], loaiHang, kgTu, kgDen, donGia };
      showToast("✅ Đã cập nhật mức giá", "success");
    }
  } else {
    // Thêm mới
    const newId = Date.now();
    list.push({ id: newId, loaiHang, kgTu, kgDen, donGia });
    showToast("✅ Đã thêm mức giá mới", "success");
  }

  localStorage.setItem("bangGiaCuoc", JSON.stringify(list));
  hideModalBangGia();
  loadBangGia();
}

// Xóa mức giá
function deleteBangGia(id) {
  if (!confirm("Bạn có chắc muốn xóa mức giá này?")) return;
  let list = JSON.parse(localStorage.getItem("bangGiaCuoc")) || [];
  const newList = list.filter((item) => item.id !== id);
  localStorage.setItem("bangGiaCuoc", JSON.stringify(newList));
  showToast("Đã xóa mức giá", "success");
  loadBangGia();
}

// Khởi tạo dữ liệu mẫu nếu chưa có
function initBangGiaMau() {
  let list = JSON.parse(localStorage.getItem("bangGiaCuoc")) || [];
  if (list.length === 0) {
    const mau = [
      {
        id: Date.now() + 1,
        loaiHang: "Hàng thường",
        kgTu: 0,
        kgDen: 5000,
        donGia: 500,
      },
      {
        id: Date.now() + 2,
        loaiHang: "Hàng thường",
        kgTu: 5001,
        kgDen: 10000,
        donGia: 450,
      },
      {
        id: Date.now() + 3,
        loaiHang: "Hàng cồng kềnh",
        kgTu: 0,
        kgDen: 5000,
        donGia: 700,
      },
      {
        id: Date.now() + 4,
        loaiHang: "Hàng dễ vỡ",
        kgTu: 0,
        kgDen: 3000,
        donGia: 800,
      },
      {
        id: Date.now() + 5,
        loaiHang: "Hàng lạnh",
        kgTu: 0,
        kgDen: 5000,
        donGia: 1200,
      },
    ];
    localStorage.setItem("bangGiaCuoc", JSON.stringify(mau));
    console.log("Đã tạo dữ liệu mẫu bảng giá");
  }
}

// Load khi vào trang
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-banggia")) {
    initBangGiaMau();
    loadBangGia();
  }
});
