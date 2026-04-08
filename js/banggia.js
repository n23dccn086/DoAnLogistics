// ====================== QUẢN LÝ BẢNG GIÁ CƯỚC ======================

let currentEditingBangGiaId = null;

// Load danh sách bảng giá từ API
async function loadBangGia() {
    const tbody = document.getElementById("banggia-table-body");
    if (!tbody) return;

    const filterLoai = document.getElementById("filterLoaiHang").value;
    let url = 'banggia';
    if (filterLoai) {
        url += `?loaiHang=${encodeURIComponent(filterLoai)}`;
    }

    try {
        const data = await callAPI(url);
        const list = data.data || [];

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:60px;">Chưa có dữ liệu bảng giá</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => `
            <tr>
                <td><strong>${escapeHtml(item.loaiHang)}</strong></td>
                <td>${item.kgTu.toLocaleString()}</td>
                <td>${item.kgDen.toLocaleString()}</td>
                <td style="font-family:monospace;font-weight:700;color:var(--accent)">${item.donGia.toLocaleString()}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="editBangGia(${item.id})">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBangGia(${item.id})" style="margin-left:5px;">Xóa</button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Lỗi load bảng giá:", error);
        showToast("Không thể tải bảng giá", "error");
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:80px;color:var(--text-muted);">Lỗi tải dữ liệu.</td></tr>';
    }
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
async function editBangGia(id) {
    try {
        const data = await callAPI(`banggia/${id}`);
        const item = data.data;
        if (!item) {
            showToast("Không tìm thấy mức giá!", "error");
            return;
        }
        currentEditingBangGiaId = id;
        document.getElementById("modalBangGiaTitle").innerText = "Sửa mức giá";
        document.getElementById("bgLoaiHang").value = item.loaiHang;
        document.getElementById("bgKgTu").value = item.kgTu;
        document.getElementById("bgKgDen").value = item.kgDen;
        document.getElementById("bgDonGia").value = item.donGia;
        document.getElementById("modalBangGia").classList.add("active");
    } catch (error) {
        console.error(error);
        showToast("Lỗi tải thông tin mức giá", "error");
    }
}

// Đóng modal
function hideModalBangGia() {
    document.getElementById("modalBangGia").classList.remove("active");
}

// Lưu (thêm mới hoặc cập nhật)
async function saveBangGia() {
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

    try {
        if (currentEditingBangGiaId) {
            // Cập nhật
            await callAPI(`banggia/${currentEditingBangGiaId}`, {
                method: "PUT",
                body: JSON.stringify({ loaiHang, kgTu, kgDen, donGia })
            });
            showToast("✅ Đã cập nhật mức giá", "success");
        } else {
            // Thêm mới
            await callAPI("banggia", {
                method: "POST",
                body: JSON.stringify({ loaiHang, kgTu, kgDen, donGia })
            });
            showToast("✅ Đã thêm mức giá mới", "success");
        }
        hideModalBangGia();
        loadBangGia(); // reload danh sách
    } catch (error) {
        console.error(error);
        showToast(error.message || "Lỗi khi lưu mức giá", "error");
    }
}

// Xóa mức giá
async function deleteBangGia(id) {
    if (!confirm("Bạn có chắc muốn xóa mức giá này?")) return;
    try {
        await callAPI(`banggia/${id}`, { method: "DELETE" });
        showToast("Đã xóa mức giá", "success");
        loadBangGia();
    } catch (error) {
        console.error(error);
        showToast("Lỗi xóa mức giá", "error");
    }
}

// Load loại hàng vào filter (nếu cần)
async function loadLoaiHangFilter() {
    // Có thể lấy từ API loại hàng nếu có bảng riêng, hiện tại dùng hardcoded
    const select = document.getElementById("filterLoaiHang");
    if (select && select.options.length <= 1) {
        const options = ["", "Hàng thường", "Hàng cồng kềnh", "Hàng dễ vỡ", "Hàng lạnh"];
        select.innerHTML = options.map(opt => `<option value="${opt}">${opt || "Tất cả loại hàng"}</option>`).join("");
    }
}

// Khởi tạo dữ liệu mẫu nếu chưa có (không cần vì API sẽ trả dữ liệu từ DB)
// Xóa bỏ initBangGiaMau và các dùng localStorage

// Load khi vào trang
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("page-banggia")) {
        loadLoaiHangFilter();
        loadBangGia();
    }
});