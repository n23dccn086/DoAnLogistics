let tuyenCount = 1;

/**
 * Thêm một tuyến vận chuyển mới
 */
function addTuyen() {
    tuyenCount++;
    const tuyenList = document.getElementById('tuyenList');
    if (!tuyenList) return;

    const div = document.createElement('div');
    div.className = 'tuyen-card';
    div.innerHTML = `
        <div class="tuyen-header">
            <div class="tuyen-title">🚛 Tuyến ${tuyenCount}</div>
            <button class="btn btn-danger btn-sm" onclick="removeTuyen(this)">✕ Xóa</button>
        </div>
        <div class="form-grid" style="margin-bottom:14px">
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Điểm đi *</label>
                <input type="text" class="form-input" placeholder="VD: 123 Nguyễn Văn Linh, Q7, HCM" oninput="calcKm(this)">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Điểm đến *</label>
                <input type="text" class="form-input" placeholder="VD: 456 Trần Hưng Đạo, Cần Thơ" oninput="calcKm(this)">
            </div>
        </div>
        <div class="form-grid-3" style="margin-bottom:14px">
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Loại hàng *</label>
                <select class="form-input filter-select" style="width:100%" onchange="calcThanhTien(this)">
                    <option value="">Chọn loại hàng</option>
                    <option value="500">Hàng thường (500đ/km/kg)</option>
                    <option value="700">Hàng cồng kềnh (700đ/km/kg)</option>
                    <option value="800">Hàng dễ vỡ (800đ/km/kg)</option>
                    <option value="1200">Hàng lạnh (1.200đ/km/kg)</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Trọng lượng (kg) *</label>
                <input type="number" class="form-input" placeholder="0" min="0" oninput="calcThanhTien(this)">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Khoảng cách</label>
                <div style="display:flex;gap:8px">
                    <input type="number" class="form-input km-input" placeholder="0" style="flex:1" oninput="calcThanhTien(this)">
                    <button class="btn btn-ghost btn-sm" onclick="getKm(this)" title="Tính km tự động">📍 Tính km</button>
                </div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
                <div class="form-label" style="margin-bottom:8px">Đơn giá áp dụng</div>
                <div class="km-display">
                    <span>💰</span>
                    <span class="km-value don-gia-display">—</span>
                    <span style="color:var(--text-muted);font-size:12px">đ/km/kg</span>
                </div>
            </div>
            <div>
                <div class="form-label" style="margin-bottom:8px">Thành tiền</div>
                <div class="thanh-tien-display tuyen-thanh-tien">0đ</div>
            </div>
        </div>
    `;
    tuyenList.appendChild(div);
    updateSoTuyen();
}

/**
 * Xóa một tuyến vận chuyển
 */
function removeTuyen(btn) {
    const cards = document.querySelectorAll('.tuyen-card');
    if (cards.length <= 1) {
        showToast('Phải có ít nhất 1 tuyến vận chuyển!');
        return;
    }
    btn.closest('.tuyen-card').remove();
    updateSoTuyen();
    updateTongGiaTri();
}

/**
 * Lưu báo giá
 */
function saveBaoGia() {
    showToast('Báo giá đã được lưu thành công!');
    setTimeout(() => {
        showPage('baogia-list');
    }, 1200);
}

/**
 * Xem trước PDF (demo)
 */
function previewPDF() {
    showToast('Đang tạo file PDF... (Demo)');
}

/**
 * Gửi email cho khách hàng (demo)
 */
function sendEmail() {
    showToast('Email đang được gửi đến khách hàng...');
}

/**
 * Tạo vận đơn từ báo giá
 */
function createVanDon() {
    showToast('Đang tạo vận đơn...');
    setTimeout(() => {
        showPage('vandon-detail');
        showToast('Vận đơn đã được tạo thành công!');
    }, 800);
}