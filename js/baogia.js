// =============================================
// ================= BAOGIA.JS =================
// =============================================

let tuyenCount = 1;

/* ====================== AUTOCOMPLETE ĐỊA CHỈ ====================== */
let autocompleteTimeout = null;

function setupAddressAutocomplete(input) {
    if (!input) return;

    let dropdown = input.parentNode.querySelector('.address-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'address-dropdown';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(dropdown);
    }

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearTimeout(autocompleteTimeout);

        if (query.length < 3) {
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            return;
        }

        autocompleteTimeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1`,
                    { headers: { 'Accept-Language': 'vi' } }
                );
                const data = await res.json();

                if (!data.length) { dropdown.style.display = 'none'; return; }

                dropdown.innerHTML = data.map(item => `
                    <div class="address-option"
                         data-lat="${item.lat}"
                         data-lon="${item.lon}"
                         data-display="${item.display_name}">
                        📍 ${item.display_name}
                    </div>
                `).join('');
                dropdown.style.display = 'block';

                dropdown.querySelectorAll('.address-option').forEach(opt => {
                    opt.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        input.value = opt.dataset.display;
                        input._lat = parseFloat(opt.dataset.lat);
                        input._lon = parseFloat(opt.dataset.lon);
                        dropdown.style.display = 'none';
                        geocodeAndUpdateMap(input);
                    });
                });
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        }, 400);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 200);
    });
    input.addEventListener('focus', () => {
        if (dropdown.innerHTML) dropdown.style.display = 'block';
    });
}

/* ====================== THÊM / XÓA TUYẾN ====================== */
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
                <input type="text" class="form-input start-address"
                       placeholder="VD: 123 Nguyễn Văn Linh, Q7, HCM" autocomplete="off">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Điểm đến *</label>
                <input type="text" class="form-input end-address"
                       placeholder="VD: 456 Trần Hưng Đạo, Cần Thơ" autocomplete="off">
            </div>
        </div>
        <div class="tuyen-map" style="height:380px;border-radius:10px;margin-bottom:14px;border:1px solid var(--border);"></div>
        <div class="form-grid-3" style="margin-bottom:14px">
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Loại hàng *</label>
                <select class="form-input filter-select" style="width:100%" onchange="calcThanhTien(this)">
                    <option value="">Chọn loại hàng</option>
                    <option value="500">Hàng thường</option>
                    <option value="700">Hàng cồng kềnh</option>
                    <option value="800">Hàng dễ vỡ</option>
                    <option value="1200">Hàng lạnh</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Trọng lượng (kg) *</label>
                <input type="number" class="form-input" placeholder="0" min="0" oninput="calcThanhTien(this)">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Khoảng cách (km)</label>
                <input type="number" class="form-input km-input" placeholder="0" readonly>
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
    setupAddressAutocomplete(div.querySelector('.start-address'));
    setupAddressAutocomplete(div.querySelector('.end-address'));

    requestAnimationFrame(() => requestAnimationFrame(() => initTuyenMap(div)));
}

function removeTuyen(btn) {
    const cards = document.querySelectorAll('.tuyen-card');
    if (cards.length <= 1) { showToast('Phải có ít nhất 1 tuyến vận chuyển!'); return; }
    btn.closest('.tuyen-card').remove();
    updateSoTuyen();
    updateTongGiaTri();
}

/* ====================== BẢN ĐỒ ====================== */
function initTuyenMap(tuyenCard) {
    const mapDiv = tuyenCard.querySelector('.tuyen-map');
    if (!mapDiv || mapDiv._leaflet_id) return;

    const map = L.map(mapDiv, { center: [16.0, 106.0], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 300);
    mapDiv._leaflet_map = map;
}

/* ====================== GEOCODE + VẼ ROUTE ====================== */
async function geocodeAndUpdateMap(inputElement) {
    if (!inputElement) return;
    const tuyenCard = inputElement.closest('.tuyen-card');
    if (!tuyenCard) return;

    const startInput    = tuyenCard.querySelector('.start-address');
    const endInput      = tuyenCard.querySelector('.end-address');
    const distanceInput = tuyenCard.querySelector('.km-input');
    const mapDiv        = tuyenCard.querySelector('.tuyen-map');

    const startAddr = startInput ? startInput.value.trim() : '';
    const endAddr   = endInput   ? endInput.value.trim()   : '';
    if (!startAddr || !endAddr) return;

    try {
        // Geocode điểm đi (dùng cache nếu có)
        let startLatLng;
        if (startInput._lat) {
            startLatLng = [startInput._lat, startInput._lon];
        } else {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddr)}&countrycodes=vn&limit=1`);
            const d = await r.json();
            if (!d[0]) { showToast('Không tìm thấy điểm đi!'); return; }
            startLatLng = [parseFloat(d[0].lat), parseFloat(d[0].lon)];
            startInput._lat = startLatLng[0]; startInput._lon = startLatLng[1];
        }

        // Geocode điểm đến
        let endLatLng;
        if (endInput._lat) {
            endLatLng = [endInput._lat, endInput._lon];
        } else {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endAddr)}&countrycodes=vn&limit=1`);
            const d = await r.json();
            if (!d[0]) { showToast('Không tìm thấy điểm đến!'); return; }
            endLatLng = [parseFloat(d[0].lat), parseFloat(d[0].lon)];
            endInput._lat = endLatLng[0]; endInput._lon = endLatLng[1];
        }

        // Tính route OSRM
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLatLng[1]},${startLatLng[0]};${endLatLng[1]},${endLatLng[0]}?overview=full&geometries=geojson`;
        const routeRes  = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.routes && routeData.routes.length > 0) {
            const distanceKm = (routeData.routes[0].distance / 1000).toFixed(1);
            if (distanceInput) { distanceInput.value = distanceKm; calcThanhTien(distanceInput); }

            // Vẽ bản đồ
            if (mapDiv && mapDiv._leaflet_map) {
                const map = mapDiv._leaflet_map;

                // Xóa layers cũ (trừ tile)
                map.eachLayer(layer => {
                    if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
                });

                // Polyline route
                const coords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                L.polyline(coords, { color: '#f97316', weight: 4, opacity: 0.9 }).addTo(map);

                // Marker A / B
                const makeIcon = (label, bg) => L.divIcon({
                    className: '',
                    html: `<div style="background:${bg};color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid white">${label}</div>`,
                    iconSize: [30, 30], iconAnchor: [15, 15]
                });

                L.marker(startLatLng, { icon: makeIcon('A', '#22c55e') }).addTo(map)
                    .bindPopup(`<b>Điểm đi</b><br>${startAddr}`);
                L.marker(endLatLng,   { icon: makeIcon('B', '#ef4444') }).addTo(map)
                    .bindPopup(`<b>Điểm đến</b><br>${endAddr}`);

                map.fitBounds([startLatLng, endLatLng], { padding: [40, 40] });
                map.invalidateSize();

                showToast(`📍 Khoảng cách: ${distanceKm} km`);
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi tính khoảng cách!');
    }
}

/* ====================== LƯU / PDF / EMAIL ====================== */
/**
 * VALIDATION TRƯỚC KHI LƯU BÁO GIÁ
 * Kiểm tra đầy đủ, không âm, không vượt giới hạn
 */
function validateBaoGia() {
    const tuyenCards = document.querySelectorAll('.tuyen-card');
    
    // 1. Kiểm tra có ít nhất 1 tuyến
    if (tuyenCards.length === 0) {
        showToast("Phải có ít nhất 1 tuyến vận chuyển!", "error");
        return false;
    }

    // 2. Kiểm tra thông tin chung
    const khachHang = document.getElementById('bgKhachHang').value.trim();
    if (!khachHang) {
        showToast("Vui lòng nhập thông tin Khách hàng!", "error");
        document.getElementById('bgKhachHang').focus();
        return false;
    }

    // 3. Kiểm tra từng tuyến
    for (let i = 0; i < tuyenCards.length; i++) {
        const card = tuyenCards[i];
        const tuyenNum = i + 1;

        const startAddr = card.querySelector('.start-address').value.trim();
        const endAddr   = card.querySelector('.end-address').value.trim();
        const weight    = parseFloat(card.querySelector('input[type="number"]:not(.km-input)').value) || 0;
        const distance  = parseFloat(card.querySelector('.km-input').value) || 0;
        const loaiHang  = card.querySelector('select').value;

        if (!startAddr) {
            showToast(`Tuyến ${tuyenNum}: Vui lòng nhập Điểm đi`, "error");
            card.querySelector('.start-address').focus();
            return false;
        }
        if (!endAddr) {
            showToast(`Tuyến ${tuyenNum}: Vui lòng nhập Điểm đến`, "error");
            card.querySelector('.end-address').focus();
            return false;
        }
        if (!loaiHang) {
            showToast(`Tuyến ${tuyenNum}: Vui lòng chọn Loại hàng`, "error");
            card.querySelector('select').focus();
            return false;
        }
        if (weight <= 0) {
            showToast(`Tuyến ${tuyenNum}: Trọng lượng phải lớn hơn 0 kg`, "error");
            return false;
        }
        if (weight > 50000) {
            showToast(`Tuyến ${tuyenNum}: Trọng lượng tối đa 50 tấn (50.000 kg)`, "error");
            return false;
        }
        if (distance <= 0) {
            showToast(`Tuyến ${tuyenNum}: Khoảng cách phải lớn hơn 0 km`, "error");
            return false;
        }
        if (distance > 3000) {
            showToast(`Tuyến ${tuyenNum}: Khoảng cách quá lớn (tối đa 3000 km)`, "error");
            return false;
        }
    }

    // 4. Kiểm tra tổng giá trị
    const tongGiaTri = parseFloat(document.getElementById('tongGiaTri').textContent.replace(/[^0-9]/g, '')) || 0;
    if (tongGiaTri <= 0) {
        showToast("Tổng giá trị báo giá phải lớn hơn 0đ", "error");
        return false;
    }

    return true; // Tất cả đều hợp lệ
}

/**
 * LƯU BÁO GIÁ - ĐÃ CÓ VALIDATION + LƯU VÀO LOCALSTORAGE
 */
function saveBaoGia() {
    if (!validateBaoGia()) {
        return;
    }

    const baoGiaData = {
        id: Date.now(),
        ngayLap: document.getElementById('ngayLap').value,
        hanHieuLuc: document.getElementById('hanHieuLuc').value,
        khachHangInfo: document.getElementById('bgKhachHangInfo').value || "Khách hàng không rõ",
        tongGiaTri: document.getElementById('tongGiaTri').textContent.trim(),
        trangThai: "Chưa duyệt",
        ngayTao: new Date().toISOString(),
        tuyen: []
    };

    // Thu thập tuyến
    document.querySelectorAll('.tuyen-card').forEach(card => {
        baoGiaData.tuyen.push({
            diemDi: card.querySelector('.start-address').value,
            diemDen: card.querySelector('.end-address').value,
            khoangCach: card.querySelector('.km-input').value
        });
    });

    let danhSachBaoGia = JSON.parse(localStorage.getItem('danhSachBaoGia')) || [];
    danhSachBaoGia.unshift(baoGiaData);
    localStorage.setItem('danhSachBaoGia', JSON.stringify(danhSachBaoGia));

    showToast("✅ Báo giá đã được lưu thành công!", "success");

    // Chuyển trang và load lại danh sách NGAY
    setTimeout(() => {
        showPage('baogia-list');
    }, 600);
}

function previewPDF() { showToast('Đang tạo file PDF... (Demo)'); }
function sendEmail()  { showToast('Email đang được gửi đến khách hàng...'); }

/* ====================== INIT (gọi sau khi navigation inject HTML) ====================== */
function initBaoGiaCreate() {
    tuyenCount = 1;
    const firstCard = document.querySelector('#tuyenList .tuyen-card');
    if (!firstCard) return;
    setupAddressAutocomplete(firstCard.querySelector('.start-address'));
    setupAddressAutocomplete(firstCard.querySelector('.end-address'));
    requestAnimationFrame(() => requestAnimationFrame(() => initTuyenMap(firstCard)));
}

// ====================== TỰ ĐỘNG +7 NGÀY CHO HẠN HIỆU LỰC ======================
document.addEventListener('DOMContentLoaded', function () {
    const ngayLap = document.getElementById('ngayLap');
    const hanHieuLuc = document.getElementById('hanHieuLuc');

    if (!ngayLap || !hanHieuLuc) {
        console.warn("Không tìm thấy input ngày lập hoặc hạn hiệu lực");
        return;
    }

    function capNhatHanHieuLuc() {
        const ngay = ngayLap.value;
        if (!ngay) return;

        const date = new Date(ngay);
        date.setDate(date.getDate() + 7);           // + 7 ngày

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        hanHieuLuc.value = `${yyyy}-${mm}-${dd}`;
    }

    // Set ngày hôm nay khi vào trang
    const today = new Date().toISOString().split('T')[0];
    ngayLap.value = today;
    capNhatHanHieuLuc();

    // Mỗi khi thay đổi ngày lập → cập nhật ngay
    ngayLap.addEventListener('change', capNhatHanHieuLuc);
    ngayLap.addEventListener('input', capNhatHanHieuLuc);
});

// ====================== QUẢN LÝ KHÁCH HÀNG & TẠO BÁO GIÁ ======================

let currentEditingKhachId = null;

// ==================== LOAD DANH SÁCH KHÁCH HÀNG ====================
function loadDanhSachKhachHang() {
    const list = JSON.parse(localStorage.getItem('khachHangList')) || [];

    // Load bảng trang Khách hàng
    const tbody = document.getElementById('khachhang-table-body');
    if (tbody) {
        tbody.innerHTML = list.length === 0 
            ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Chưa có khách hàng nào</td></tr>`
            : list.map(kh => `
                <tr>
                    <td><strong>${kh.tenCongTy}</strong></td>
                    <td style="font-family:monospace">${kh.maSoThue}</td>
                    <td>${kh.nguoiLienHe || '—'}</td>
                    <td>${kh.soDienThoai}</td>
                    <td>${kh.email || '—'}</td>
                    <td style="text-align:center">${kh.tongVanDon || 0}</td>
                    <td><button class="btn btn-ghost btn-sm" onclick="editKhachHang(${kh.id})">Sửa</button></td>
                </tr>
            `).join('');
    }

    // Load dropdown trong Tạo báo giá
    const select = document.getElementById('bgKhachHang');
    if (select) {
        select.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
        list.forEach(kh => {
            const opt = document.createElement('option');
            opt.value = kh.id;
            opt.textContent = `${kh.tenCongTy} (${kh.soDienThoai})`;
            opt.dataset.info = `Tên công ty: ${kh.tenCongTy}\nMST: ${kh.maSoThue}\nNgười liên hệ: ${kh.nguoiLienHe || '—'}\nSĐT: ${kh.soDienThoai}\nEmail: ${kh.email || '—'}`;
            select.appendChild(opt);
        });
    }
}

// ==================== TÌM KIẾM KHÁCH HÀNG ====================
function searchKhachHang() {
    const keyword = document.getElementById('searchKhachHang').value.trim();
    const criteria = document.getElementById('searchCriteria').value;
    const tbody = document.getElementById('khachhang-table-body');
    if (!tbody) return;

    const list = JSON.parse(localStorage.getItem('khachHangList')) || [];

    if (keyword === '') {
        loadDanhSachKhachHang();
        return;
    }

    let filtered = [];

    if (criteria === 'tenCongTy') {
        filtered = list.filter(kh => kh.tenCongTy?.toLowerCase().includes(keyword.toLowerCase()));
    } else if (criteria === 'maSoThue') {
        filtered = list.filter(kh => kh.maSoThue?.toString().includes(keyword));
    } else if (criteria === 'soDienThoai') {
        filtered = list.filter(kh => kh.soDienThoai?.includes(keyword));
    }

    tbody.innerHTML = filtered.length ? filtered.map(kh => `
        <tr>
            <td><strong>${kh.tenCongTy}</strong></td>
            <td style="font-family:monospace">${kh.maSoThue}</td>
            <td>${kh.nguoiLienHe || '—'}</td>
            <td>${kh.soDienThoai}</td>
            <td>${kh.email || '—'}</td>
            <td style="text-align:center">${kh.tongVanDon || 0}</td>
            <td><button class="btn btn-ghost btn-sm" onclick="editKhachHang(${kh.id})">Sửa</button></td>
        </tr>
    `).join('') : `<tr><td colspan="7" style="text-align:center;padding:60px;color:var(--text-muted);">Không tìm thấy kết quả</td></tr>`;
}

// ==================== MODAL THÊM / SỬA KHÁCH HÀNG ====================
function showAddKhachHangModal() { /* giữ nguyên hoặc dùng hàm cũ của bạn */ }
function editKhachHang(id) { /* giữ nguyên */ }
function hideKhachHangModal() { /* giữ nguyên */ }

// ==================== LƯU KHÁCH HÀNG + VALIDATION ====================
function saveKhachHang() { /* giữ nguyên hàm có validation SĐT & Email */ }

// ==================== TỰ ĐỘNG ĐIỀN THÔNG TIN KHI CHỌN KHÁCH HÀNG ====================
function tuDongDienThongTinKhachHang() {
    const select = document.getElementById('bgKhachHang');
    const infoArea = document.getElementById('bgKhachHangInfo');
    if (!select || !infoArea) return;

    const option = select.options[select.selectedIndex];
    infoArea.value = option && option.value !== "" ? (option.dataset.info || "") : "";
}

// ==================== XỬ LÝ NGÀY LẬP + HẠN HIỆU LỰC ====================
function capNhatHanHieuLuc() {
    const ngayLap = document.getElementById('ngayLap');
    const hanHieuLuc = document.getElementById('hanHieuLuc');
    if (!ngayLap || !hanHieuLuc || !ngayLap.value) return;

    const date = new Date(ngayLap.value);
    date.setDate(date.getDate() + 7);

    hanHieuLuc.value = date.toISOString().split('T')[0];
}

// ==================== KHỞI TẠO TRANG TẠO BÁO GIÁ ====================
function initBaoGiaCreatePage() {
    const today = new Date().toISOString().split('T')[0];
    const ngayLapInput = document.getElementById('ngayLap');

    if (ngayLapInput) {
        ngayLapInput.max = today;
        ngayLapInput.value = today;
    }

    capNhatHanHieuLuc();
    loadDanhSachKhachHang();
}

// ==================== KHỞI TẠO TOÀN BỘ (CHỈ 1 LẦN) ====================
document.addEventListener('DOMContentLoaded', function () {
    // Trang Khách hàng
    if (document.getElementById('page-khachhang')) {
        loadDanhSachKhachHang();
    }

    // Trang Tạo báo giá
    if (document.getElementById('page-baogia-create')) {
        initBaoGiaCreatePage();
    }
});

// ==================== LOAD DANH SÁCH BÁO GIÁ ====================
function loadDanhSachBaoGia() {
    const tbody = document.getElementById('baogia-table-body');
    if (!tbody) return;

    let list = JSON.parse(localStorage.getItem('danhSachBaoGia')) || [];

    const statusFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';

    if (statusFilter) {
        list = list.filter(bg => bg.trangThai === statusFilter);
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--text-muted);">Chưa có báo giá nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(bg => `
        <tr>
            <td><span class="td-mono">#BG${bg.id.toString().slice(-6)}</span></td>
            <td>${bg.khachHangInfo || 'Không rõ'}</td>
            <td>${bg.ngayLap}</td>
            <td>${bg.hanHieuLuc}</td>
            <td style="text-align:center">${bg.tuyen ? bg.tuyen.length : 0}</td>
            <td style="font-weight:600;color:var(--accent)">${bg.tongGiaTri}</td>
            <td><span class="badge badge-draft">${bg.trangThai}</span></td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="viewBaoGiaDetail(${bg.id})">Chi tiết</button>
            </td>
        </tr>
    `).join('');
}

// Tìm kiếm danh sách báo giá
// ==================== TÌM KIẾM DANH SÁCH BÁO GIÁ (CÓ NÚT TÌM) ====================
function searchBaoGiaList() {
    const keyword = document.getElementById('searchBaoGia').value.trim();
    const tbody = document.getElementById('baogia-table-body');
    if (!tbody) return;

    let list = JSON.parse(localStorage.getItem('danhSachBaoGia')) || [];

    // Nếu không nhập gì → load tất cả
    if (keyword === '') {
        loadDanhSachBaoGia();
        return;
    }

    // Tìm theo mã báo giá (cả #BG... và số cuối)
    const filtered = list.filter(bg => {
        const maBaoGia = `#BG${bg.id.toString().slice(-6)}`.toLowerCase();
        const keywordLower = keyword.toLowerCase();
        
        return maBaoGia.includes(keywordLower) || 
               bg.id.toString().includes(keyword);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:80px;color:var(--text-muted);">
                    Không tìm thấy báo giá nào với từ khóa "<strong>${keyword}</strong>"
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(bg => `
        <tr>
            <td><span class="td-mono">#BG${bg.id.toString().slice(-6)}</span></td>
            <td>${bg.khachHangInfo || 'Không rõ'}</td>
            <td>${bg.ngayLap}</td>
            <td>${bg.hanHieuLuc}</td>
            <td style="text-align:center">${bg.tuyen ? bg.tuyen.length : 0}</td>
            <td style="font-weight:600;color:var(--accent)">${bg.tongGiaTri}</td>
            <td><span class="badge badge-draft">${bg.trangThai}</span></td>
            <td><button class="btn btn-ghost btn-sm" onclick="viewBaoGiaDetail(${bg.id})">Chi tiết</button></td>
        </tr>
    `).join('');
}

// Khởi tạo trang Danh sách báo giá
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-baogia-list')) {
        loadDanhSachBaoGia();
    }
});

// ====================== XEM CHI TIẾT BÁO GIÁ ======================
function viewBaoGiaDetail(id) {
    const list = JSON.parse(localStorage.getItem('danhSachBaoGia')) || [];
    const baoGia = list.find(bg => bg.id === parseInt(id));

    if (!baoGia) {
        showToast("Không tìm thấy báo giá!", "error");
        return;
    }

    // Lưu đúng báo giá được chọn
    localStorage.setItem('currentBaoGiaDetail', JSON.stringify(baoGia));

    // Chuyển trang
    showPage('baogia-detail');
}

function loadBaoGiaDetail() {
    const data = localStorage.getItem('currentBaoGiaDetail');
    if (!data) {
        document.getElementById('detailContent').innerHTML = `
            <p style="text-align:center; padding:60px; color:var(--text-muted);">
                Không tìm thấy dữ liệu báo giá. Vui lòng thử lại.
            </p>`;
        return;
    }

    const bg = JSON.parse(data);

    // === SỬA MÃ BÁO GIÁ ĐÚNG ===
    document.getElementById('detailMaBaoGia').textContent = `#BG${bg.id.toString().slice(-6)}`;

    // Trạng thái & hạn
    document.getElementById('detailTrangThai').textContent = bg.trangThai || "Chưa duyệt";
    document.getElementById('detailHanHieuLuc').textContent = `Hết hạn: ${bg.hanHieuLuc || '--'}`;

    // Thông tin chung
    document.getElementById('infoChung').innerHTML = `
        <div class="info-item">
            <div class="info-label">Khách hàng</div>
            <div class="info-value">${bg.khachHangInfo ? bg.khachHangInfo.split('\n')[0] : 'Không rõ'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Ngày lập</div>
            <div class="info-value">${bg.ngayLap}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Hạn hiệu lực</div>
            <div class="info-value">${bg.hanHieuLuc}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Tổng giá trị</div>
            <div class="info-value" style="color:var(--accent);font-weight:700">${bg.tongGiaTri}</div>
        </div>
    `;

    // Danh sách tuyến
    let tuyenHTML = '';
    if (bg.tuyen && bg.tuyen.length > 0) {
        tuyenHTML = bg.tuyen.map((t, i) => `
            <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; padding:16px; margin-bottom:12px">
                <strong>Tuyến ${i+1}:</strong> ${t.diemDi || '-'} → ${t.diemDen || '-'} 
                <span style="float:right">(${t.khoangCach || 0} km)</span>
            </div>
        `).join('');
    } else {
        tuyenHTML = '<p>Không có dữ liệu tuyến vận chuyển</p>';
    }
    document.getElementById('tuyenListDetail').innerHTML = tuyenHTML;
}

// Tự động load khi vào trang detail
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-baogia-detail')) {
        loadBaoGiaDetail();
    }
});
// ====================== LOAD CHI TIẾT BÁO GIÁ ======================
function loadBaoGiaDetail() {
    const data = localStorage.getItem('currentBaoGiaDetail');
    if (!data) {
        document.getElementById('detailContent').innerHTML = `
            <p style="text-align:center; padding:60px; color:var(--text-muted);">
                Không tìm thấy dữ liệu báo giá. Vui lòng thử lại.
            </p>`;
        return;
    }

    const bg = JSON.parse(data);

    // Header
    document.getElementById('detailMaBaoGia').textContent = `#BG${bg.id.toString().slice(-6)}`;
    document.getElementById('detailTrangThai').textContent = bg.trangThai || "Chưa duyệt";
    document.getElementById('detailHanHieuLuc').textContent = `Hết hạn: ${bg.hanHieuLuc || '--'}`;

    // Thông tin chung
    let infoHTML = `
        <div class="info-grid">
            <div class="info-item"><div class="info-label">Khách hàng</div><div class="info-value">${bg.khachHangInfo ? bg.khachHangInfo.split('\n')[0] : 'Không rõ'}</div></div>
            <div class="info-item"><div class="info-label">Ngày lập</div><div class="info-value">${bg.ngayLap}</div></div>
            <div class="info-item"><div class="info-label">Hạn hiệu lực</div><div class="info-value">${bg.hanHieuLuc}</div></div>
            <div class="info-item"><div class="info-label">Tổng giá trị</div><div class="info-value" style="color:var(--accent);font-weight:700">${bg.tongGiaTri}</div></div>
        </div>
    `;

    document.getElementById('infoChung').innerHTML = infoHTML;

    // Danh sách tuyến
    let tuyenHTML = '';
    if (bg.tuyen && bg.tuyen.length > 0) {
        tuyenHTML = bg.tuyen.map((t, i) => `
            <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; padding:18px; margin-bottom:14px">
                <div style="font-weight:700; color:var(--accent); margin-bottom:12px">🚛 Tuyến ${i+1}</div>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">Điểm đi</div><div class="info-value">${t.diemDi || '-'}</div></div>
                    <div class="info-item"><div class="info-label">Điểm đến</div><div class="info-value">${t.diemDen || '-'}</div></div>
                    <div class="info-item"><div class="info-label">Khoảng cách</div><div class="info-value">${t.khoangCach || '0'} km</div></div>
                </div>
            </div>
        `).join('');
    } else {
        tuyenHTML = '<p>Không có dữ liệu tuyến</p>';
    }
    document.getElementById('tuyenListDetail').innerHTML = tuyenHTML;

    // Tổng kết
    document.getElementById('summaryBody').innerHTML = `
        <div class="summary-row"><span class="label">Tổng số tuyến</span><span>${bg.tuyen ? bg.tuyen.length : 0}</span></div>
        <div class="summary-total">
            <div class="total-label">Tổng cộng</div>
            <div class="total-value">${bg.tongGiaTri}</div>
        </div>
    `;
}

// Tự động load khi vào trang chi tiết
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-baogia-detail')) {
        loadBaoGiaDetail();
    }
});