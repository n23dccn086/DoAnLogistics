// ====================== KHACHHANG.JS - Quản lý Khách hàng ======================

let currentEditingKhachId = null;

// ==================== LOAD DANH SÁCH KHÁCH HÀNG ====================
async function loadDanhSachKhachHang() {
    const tbody = document.getElementById("khachhang-table-body");
    if (!tbody) return;

    try {
        const data = await callAPI('khachhang?all=true');
        const list = data?.data || [];

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:60px;">Chưa có khách hàng nào</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(kh => `
            <tr>
                <td><strong>${escapeHtml(kh.tenCongTy)}</strong></td>
                <td>${escapeHtml(kh.maSoThue || '')}</td>
                <td>${escapeHtml(kh.nguoiLienHe || '—')}</td>
                <td>${escapeHtml(kh.soDienThoai)}</td>
                <td>${escapeHtml(kh.email)}</td>
                <td>${escapeHtml(kh.diaChi || '—')}</td>
                <td style="text-align:center">${kh.tongVanDon || 0}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="editKhachHang(${kh.id})">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteKhachHang(${kh.id})" style="margin-left:5px;">Xóa</button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Lỗi load danh sách khách hàng:", error);
        if (!error.message?.includes("401")) {
            showToast("Không thể tải danh sách khách hàng", "error");
        }
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--danger);">Lỗi tải dữ liệu khách hàng.</td></tr>`;
    }
}

// ==================== HIỂN THỊ MODAL THÊM / SỬA ====================
function showAddKhachHangModal() {
    currentEditingKhachId = null;
    document.getElementById("modalKhachHangTitle").textContent = "Thêm khách hàng mới";
    document.getElementById("khId").value = "";
    document.getElementById("khTenCongTy").value = "";
    document.getElementById("khMaSoThue").value = "";
    document.getElementById("khNguoiLienHe").value = "";
    document.getElementById("khSoDienThoai").value = "";
    document.getElementById("khEmail").value = "";
    document.getElementById("khDiaChi").value = "";
    
    document.getElementById("modalKhachHang").classList.add("active");
}

async function editKhachHang(id) {
    try {
        const data = await callAPI(`khachhang/${id}`);
        const kh = data.data;

        currentEditingKhachId = kh.id;
        document.getElementById("modalKhachHangTitle").textContent = "Sửa khách hàng";
        document.getElementById("khId").value = kh.id;
        document.getElementById("khTenCongTy").value = kh.tenCongTy;
        document.getElementById("khMaSoThue").value = kh.maSoThue;
        document.getElementById("khNguoiLienHe").value = kh.nguoiLienHe || "";
        document.getElementById("khSoDienThoai").value = kh.soDienThoai;
        document.getElementById("khEmail").value = kh.email;
        document.getElementById("khDiaChi").value = kh.diaChi || "";

        document.getElementById("modalKhachHang").classList.add("active");
    } catch (error) {
        console.error(error);
        showToast("Không thể tải thông tin khách hàng", "error");
    }
}

// ==================== LƯU KHÁCH HÀNG (THÊM / SỬA) ====================
// ==================== LƯU KHÁCH HÀNG (THÊM / SỬA) ====================
async function saveKhachHang() {
    const id = document.getElementById("khId").value;
    const tenCongTy = document.getElementById("khTenCongTy").value.trim();
    const maSoThue = document.getElementById("khMaSoThue").value.trim();
    const nguoiLienHe = document.getElementById("khNguoiLienHe").value.trim();
    const soDienThoai = document.getElementById("khSoDienThoai").value.trim();
    const email = document.getElementById("khEmail").value.trim();
    const diaChi = document.getElementById("khDiaChi").value.trim();

    if (!tenCongTy || !maSoThue || !soDienThoai || !email) {
        showToast("Vui lòng nhập đầy đủ thông tin bắt buộc (*)", "error");
        return;
    }

    try {
        if (id) {
            // SỬA
            await callAPI(`khachhang/${id}`, {
                method: "PUT",
                body: JSON.stringify({ tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi })
            });
            showToast("Cập nhật khách hàng thành công!", "success");
        } else {
            // THÊM MỚI
            await callAPI('khachhang', {
                method: "POST",
                body: JSON.stringify({ tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi })
            });
            showToast("Thêm khách hàng mới thành công!", "success");
        }

        hideKhachHangModal();
        loadDanhSachKhachHang();   // Reload danh sách
    } catch (error) {
        console.error(error);
        showToast("Lỗi khi lưu khách hàng", "error");
    }
}

// ==================== XÓA KHÁCH HÀNG ====================
async function deleteKhachHang(id) {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này không?")) return;

    try {
        await callAPI(`khachhang/${id}`, { method: "DELETE" });
        showToast("Đã xóa khách hàng thành công", "success");
        loadDanhSachKhachHang();
    } catch (error) {
        console.error(error);
        showToast("Lỗi khi xóa khách hàng", "error");
    }
}

// ==================== ĐÓNG MODAL ====================
function hideKhachHangModal() {
    document.getElementById("modalKhachHang").classList.remove("active");
}

// ==================== KHỞI TẠO KHI LOAD TRANG ====================
document.addEventListener("DOMContentLoaded", function () {
    const page = document.getElementById("page-khachhang");
    if (page) {
        loadDanhSachKhachHang();
    }
});