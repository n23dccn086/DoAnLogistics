// =============================================
// ================= BAOGIA.JS =================
// =============================================

let tuyenCount = 1;

/* ====================== AUTOCOMPLETE ĐỊA CHỈ ====================== */
let autocompleteTimeout = null;

function setupAddressAutocomplete(input) {
  if (!input) return;

  let dropdown = input.parentNode.querySelector(".address-dropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.className = "address-dropdown";
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(dropdown);
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(autocompleteTimeout);

    if (query.length < 3) {
      dropdown.innerHTML = "";
      dropdown.style.display = "none";
      return;
    }

    autocompleteTimeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "vi" } },
        );
        const data = await res.json();

        if (!data.length) {
          dropdown.style.display = "none";
          return;
        }

        dropdown.innerHTML = data
          .map(
            (item) => `
                    <div class="address-option"
                         data-lat="${item.lat}"
                         data-lon="${item.lon}"
                         data-display="${item.display_name}">
                        📍 ${item.display_name}
                    </div>
                `,
          )
          .join("");
        dropdown.style.display = "block";

        dropdown.querySelectorAll(".address-option").forEach((opt) => {
          opt.addEventListener("mousedown", (e) => {
            e.preventDefault();
            input.value = opt.dataset.display;
            input._lat = parseFloat(opt.dataset.lat);
            input._lon = parseFloat(opt.dataset.lon);
            dropdown.style.display = "none";
            geocodeAndUpdateMap(input);
          });
        });
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 400);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      dropdown.style.display = "none";
    }, 200);
  });
  input.addEventListener("focus", () => {
    if (dropdown.innerHTML) dropdown.style.display = "block";
  });
}

/* ====================== THÊM / XÓA TUYẾN ====================== */
function addTuyen() {
  tuyenCount++;
  const tuyenList = document.getElementById("tuyenList");
  if (!tuyenList) return;

  const div = document.createElement("div");
  div.className = "tuyen-card";
  div.innerHTML = `
        <div class="tuyen-header">
            <div class="tuyen-title">🚛 Tuyến ${tuyenCount}</div>
            <button class="btn btn-danger btn-sm" onclick="removeTuyen(this)">✕ Xóa</button>
        </div>
        <div class="form-grid" style="margin-bottom:14px">
            <div class="form-group" style="margin-bottom:0; position:relative">
                <label class="form-label">Điểm đi *</label>
                <input type="text" class="form-input start-address"
                       placeholder="VD: 123 Nguyễn Văn Linh, Q7, HCM" autocomplete="off">
            </div>
            <div class="form-group" style="margin-bottom:0; position:relative">
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

  // Thiết lập autocomplete
  setupAddressAutocomplete(div.querySelector(".start-address"));
  setupAddressAutocomplete(div.querySelector(".end-address"));

  // QUAN TRỌNG: ĐỢI DOM RENDER XONG MỚI KHỞI TẠO MAP
  setTimeout(() => {
    initTuyenMap(div);
  }, 100);
}

function removeTuyen(btn) {
  const cards = document.querySelectorAll(".tuyen-card");
  if (cards.length <= 1) {
    showToast("Phải có ít nhất 1 tuyến vận chuyển!");
    return;
  }
  btn.closest(".tuyen-card").remove();
  updateSoTuyen();
  updateTongGiaTri();
}

// ====================== BẢN ĐỒ ======================
function initTuyenMap(tuyenCard) {
  const mapDiv = tuyenCard.querySelector(".tuyen-map");
  if (!mapDiv) return;

  // Kiểm tra nếu đã có map thì không khởi tạo lại
  if (mapDiv._leaflet_id) return;

  // ĐẢM BẢO MAP DIV CÓ KÍCH THƯỚC
  if (mapDiv.offsetWidth === 0 || mapDiv.offsetHeight === 0) {
    console.log("Map container chưa có kích thước, đợi...");
    setTimeout(() => initTuyenMap(tuyenCard), 200);
    return;
  }

  try {
    const map = L.map(mapDiv, {
      center: [16.0, 106.0],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Lưu map vào DOM element để dùng sau
    mapDiv._leaflet_map = map;

    // Force invalidate size sau khi khởi tạo
    setTimeout(() => {
      map.invalidateSize();
      console.log("Map đã khởi tạo thành công");
    }, 100);
  } catch (error) {
    console.error("Lỗi khởi tạo map:", error);
  }
}
/* ====================== GEOCODE + VẼ ROUTE ====================== */
async function geocodeAndUpdateMap(inputElement) {
  if (!inputElement) return;
  const tuyenCard = inputElement.closest(".tuyen-card");
  if (!tuyenCard) return;

  const startInput = tuyenCard.querySelector(".start-address");
  const endInput = tuyenCard.querySelector(".end-address");
  const distanceInput = tuyenCard.querySelector(".km-input");
  const mapDiv = tuyenCard.querySelector(".tuyen-map");

  const startAddr = startInput ? startInput.value.trim() : "";
  const endAddr = endInput ? endInput.value.trim() : "";
  if (!startAddr || !endAddr) return;

  try {
    // Geocode điểm đi (dùng cache nếu có)
    let startLatLng;
    if (startInput._lat) {
      startLatLng = [startInput._lat, startInput._lon];
    } else {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddr)}&countrycodes=vn&limit=1`,
      );
      const d = await r.json();
      if (!d[0]) {
        showToast("Không tìm thấy điểm đi!");
        return;
      }
      startLatLng = [parseFloat(d[0].lat), parseFloat(d[0].lon)];
      startInput._lat = startLatLng[0];
      startInput._lon = startLatLng[1];
    }

    // Geocode điểm đến
    let endLatLng;
    if (endInput._lat) {
      endLatLng = [endInput._lat, endInput._lon];
    } else {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endAddr)}&countrycodes=vn&limit=1`,
      );
      const d = await r.json();
      if (!d[0]) {
        showToast("Không tìm thấy điểm đến!");
        return;
      }
      endLatLng = [parseFloat(d[0].lat), parseFloat(d[0].lon)];
      endInput._lat = endLatLng[0];
      endInput._lon = endLatLng[1];
    }

    // Tính route OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLatLng[1]},${startLatLng[0]};${endLatLng[1]},${endLatLng[0]}?overview=full&geometries=geojson`;
    const routeRes = await fetch(osrmUrl);
    const routeData = await routeRes.json();

    if (routeData.routes && routeData.routes.length > 0) {
      const distanceKm = (routeData.routes[0].distance / 1000).toFixed(1);
      if (distanceInput) {
        distanceInput.value = distanceKm;
        calcThanhTien(distanceInput);
      }

      // Vẽ bản đồ
      if (mapDiv && mapDiv._leaflet_map) {
        const map = mapDiv._leaflet_map;

        // Xóa layers cũ (trừ tile)
        map.eachLayer((layer) => {
          if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
        });

        // Polyline route
        const coords = routeData.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);
        L.polyline(coords, { color: "#f97316", weight: 4, opacity: 0.9 }).addTo(
          map,
        );

        // Marker A / B
        const makeIcon = (label, bg) =>
          L.divIcon({
            className: "",
            html: `<div style="background:${bg};color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid white">${label}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

        L.marker(startLatLng, { icon: makeIcon("A", "#22c55e") })
          .addTo(map)
          .bindPopup(`<b>Điểm đi</b><br>${startAddr}`);
        L.marker(endLatLng, { icon: makeIcon("B", "#ef4444") })
          .addTo(map)
          .bindPopup(`<b>Điểm đến</b><br>${endAddr}`);

        map.fitBounds([startLatLng, endLatLng], { padding: [40, 40] });
        map.invalidateSize();

        showToast(`📍 Khoảng cách: ${distanceKm} km`);
      }
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi khi tính khoảng cách!");
  }
}

/* ====================== LƯU / PDF / EMAIL ====================== */
/**
 * VALIDATION TRƯỚC KHI LƯU BÁO GIÁ
 * Kiểm tra đầy đủ, không âm, không vượt giới hạn
 */
function validateBaoGia() {
  const tuyenCards = document.querySelectorAll(".tuyen-card");

  // 1. Kiểm tra có ít nhất 1 tuyến
  if (tuyenCards.length === 0) {
    showToast("Phải có ít nhất 1 tuyến vận chuyển!", "error");
    return false;
  }

  // 2. Kiểm tra thông tin chung
  const khachHang = document.getElementById("bgKhachHang").value.trim();
  if (!khachHang) {
    showToast("Vui lòng nhập thông tin Khách hàng!", "error");
    document.getElementById("bgKhachHang").focus();
    return false;
  }

  // 3. Kiểm tra từng tuyến
  for (let i = 0; i < tuyenCards.length; i++) {
    const card = tuyenCards[i];
    const tuyenNum = i + 1;

    const startAddr = card.querySelector(".start-address").value.trim();
    const endAddr = card.querySelector(".end-address").value.trim();
    const weight =
      parseFloat(
        card.querySelector('input[type="number"]:not(.km-input)').value,
      ) || 0;
    const distance = parseFloat(card.querySelector(".km-input").value) || 0;
    const loaiHang = card.querySelector("select").value;

    if (!startAddr) {
      showToast(`Tuyến ${tuyenNum}: Vui lòng nhập Điểm đi`, "error");
      card.querySelector(".start-address").focus();
      return false;
    }
    if (!endAddr) {
      showToast(`Tuyến ${tuyenNum}: Vui lòng nhập Điểm đến`, "error");
      card.querySelector(".end-address").focus();
      return false;
    }
    if (!loaiHang) {
      showToast(`Tuyến ${tuyenNum}: Vui lòng chọn Loại hàng`, "error");
      card.querySelector("select").focus();
      return false;
    }
    if (weight <= 0) {
      showToast(`Tuyến ${tuyenNum}: Trọng lượng phải lớn hơn 0 kg`, "error");
      return false;
    }
    if (weight > 50000) {
      showToast(
        `Tuyến ${tuyenNum}: Trọng lượng tối đa 50 tấn (50.000 kg)`,
        "error",
      );
      return false;
    }
    if (distance <= 0) {
      showToast(`Tuyến ${tuyenNum}: Khoảng cách phải lớn hơn 0 km`, "error");
      return false;
    }
    if (distance > 3000) {
      showToast(
        `Tuyến ${tuyenNum}: Khoảng cách quá lớn (tối đa 3000 km)`,
        "error",
      );
      return false;
    }
  }

  // 4. Kiểm tra tổng giá trị
  const tongGiaTri =
    parseFloat(
      document.getElementById("tongGiaTri").textContent.replace(/[^0-9]/g, ""),
    ) || 0;
  if (tongGiaTri <= 0) {
    showToast("Tổng giá trị báo giá phải lớn hơn 0đ", "error");
    return false;
  }

  return true; // Tất cả đều hợp lệ
}

/**
 * LƯU BÁO GIÁ - ĐÃ CÓ VALIDATION + LƯU VÀO LOCALSTORAGE
 */
async function saveBaoGia() {
    if (!validateBaoGia()) return;

    const khachHangId = document.getElementById("bgKhachHang").value;
    const ngayLap = document.getElementById("ngayLap").value;
    const hanHieuLuc = document.getElementById("hanHieuLuc").value;
    const ghiChu = document.querySelector("#page-baogia-create textarea:not([readonly])")?.value.trim() || "";
    const tongGiaTri = parseFloat(document.getElementById("tongGiaTri").textContent.replace(/[^0-9]/g, "")) || 0;

    // Thu thập tuyến
    const tuyen = [];
    document.querySelectorAll(".tuyen-card").forEach(card => {
        const diemDi = card.querySelector(".start-address").value.trim();
        const diemDen = card.querySelector(".end-address").value.trim();
        const khoangCach = parseFloat(card.querySelector(".km-input").value) || 0;
        const loaiHang = card.querySelector("select option:checked").text;
        const trongLuong = parseFloat(card.querySelector('input[type="number"]:not(.km-input)').value) || 0;
        const donGia = parseFloat(card.querySelector(".don-gia-display").textContent.replace(/[^0-9]/g, "")) || 0;
        const thanhTien = khoangCach * donGia * trongLuong;
        tuyen.push({ diemDi, diemDen, khoangCach, loaiHang, trongLuong, donGia, thanhTien });
    });

    const payload = {
        khachHangId,
        ngayLap,
        hanHieuLuc,
        ghiChu,
        tuyen,
        tongGiaTri
    };

    try {
        await callAPI("baogia", { method: "POST", body: JSON.stringify(payload) });
        showToast("✅ Báo giá đã được lưu thành công!", "success");
        setTimeout(() => showPage("baogia-list"), 600);
    } catch (error) {
        showToast("Lỗi lưu báo giá: " + error.message, "error");
    }
}

function previewPDF() {
  showToast("Đang tạo file PDF... (Demo)");
}
function sendEmail() {
  showToast("Email đang được gửi đến khách hàng...");
}

/* ====================== INIT (gọi sau khi navigation inject HTML) ====================== */
function initBaoGiaCreate() {
  tuyenCount = 1;
  const firstCard = document.querySelector("#tuyenList .tuyen-card");
  if (!firstCard) return;
  setupAddressAutocomplete(firstCard.querySelector(".start-address"));
  setupAddressAutocomplete(firstCard.querySelector(".end-address"));
  requestAnimationFrame(() =>
    requestAnimationFrame(() => initTuyenMap(firstCard)),
  );
}

// ====================== TỰ ĐỘNG +7 NGÀY CHO HẠN HIỆU LỰC ======================
document.addEventListener("DOMContentLoaded", function () {
  const ngayLap = document.getElementById("ngayLap");
  const hanHieuLuc = document.getElementById("hanHieuLuc");

  if (!ngayLap || !hanHieuLuc) {
    console.warn("Không tìm thấy input ngày lập hoặc hạn hiệu lực");
    return;
  }

  function capNhatHanHieuLuc() {
    const ngay = ngayLap.value;
    if (!ngay) return;

    const date = new Date(ngay);
    date.setDate(date.getDate() + 7); // + 7 ngày

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    hanHieuLuc.value = `${yyyy}-${mm}-${dd}`;
  }

  // Set ngày hôm nay khi vào trang
  const today = new Date().toISOString().split("T")[0];
  ngayLap.value = today;
  capNhatHanHieuLuc();

  // Mỗi khi thay đổi ngày lập → cập nhật ngay
  ngayLap.addEventListener("change", capNhatHanHieuLuc);
  ngayLap.addEventListener("input", capNhatHanHieuLuc);
});

// ====================== QUẢN LÝ KHÁCH HÀNG & TẠO BÁO GIÁ ======================

let currentEditingKhachId = null;

// ==================== LOAD DANH SÁCH KHÁCH HÀNG ====================
async function loadDanhSachKhachHang() {
    const tbody = document.getElementById("khachhang-table-body");
    const select = document.getElementById("bgKhachHang"); // chú ý id đúng (bgKhachHang)

    try {
        const data = await callAPI("khachhang?all=true");
        const list = data.data || [];

        // Cập nhật bảng khách hàng
        if (tbody) {
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:60px;">Chưa có khách hàng nào</td></tr>';
            } else {
                tbody.innerHTML = list.map(kh => `
                    <tr>
                        <td><strong>${escapeHtml(kh.tenCongTy)}</strong></td>
                        <td>${escapeHtml(kh.maSoThue || "")}</td>
                        <td>${escapeHtml(kh.nguoiLienHe || "—")}</td>
                        <td>${escapeHtml(kh.soDienThoai)}</td>
                        <td>${kh.email ? escapeHtml(kh.email) : '<span style="color:var(--danger);">Chưa có email</span>'}</td>
                        <td>${escapeHtml(kh.diaChi || "—")}</td>
                        <td style="text-align:center">${kh.tongVanDon || 0}</td>
                        <td>
                            <button class="btn btn-ghost btn-sm" onclick="editKhachHang(${kh.id})">Sửa</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteKhachHang(${kh.id})" style="margin-left:5px;">Xóa</button>
                        </td>
                    </tr>
                `).join("");
            }
        }

        // Cập nhật dropdown chọn khách hàng trong form tạo báo giá
        if (select) {
            select.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
            list.forEach(kh => {
                const opt = document.createElement("option");
                opt.value = kh.id;
                opt.textContent = `${kh.tenCongTy} (${kh.soDienThoai})`;
                opt.dataset.info = `Tên công ty: ${kh.tenCongTy}\nMST: ${kh.maSoThue}\nNgười liên hệ: ${kh.nguoiLienHe || "—"}\nSĐT: ${kh.soDienThoai}\nEmail: ${kh.email || "—"}\nĐịa chỉ: ${kh.diaChi || "—"}`;
                select.appendChild(opt);
            });
        }

    } catch (error) {
        console.error("Lỗi load khách hàng:", error);
        showToast("Không thể tải danh sách khách hàng", "error");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--text-muted);">Lỗi tải dữ liệu.</td></tr>';
        }
    }
}

// ==================== TÌM KIẾM KHÁCH HÀNG ====================
function searchKhachHang() {
  const keyword = document.getElementById("searchKhachHang").value.trim();
  const criteria = document.getElementById("searchCriteria").value;
  const tbody = document.getElementById("khachhang-table-body");
  if (!tbody) return;

  const list = JSON.parse(localStorage.getItem("khachHangList")) || [];

  if (keyword === "") {
    loadDanhSachKhachHang();
    return;
  }

  let filtered = [];
  const keywordLower = keyword.toLowerCase();

  if (criteria === "tenCongTy") {
    filtered = list.filter((kh) =>
      kh.tenCongTy?.toLowerCase().includes(keywordLower),
    );
  } else if (criteria === "maSoThue") {
    filtered = list.filter((kh) => kh.maSoThue?.toString().includes(keyword));
  } else if (criteria === "soDienThoai") {
    filtered = list.filter((kh) => kh.soDienThoai?.includes(keyword));
  } else if (criteria === "email") {
    filtered = list.filter((kh) =>
      kh.email?.toLowerCase().includes(keywordLower),
    );
  }

  tbody.innerHTML = filtered.length
    ? filtered
        .map(
          (kh) => `
        <tr>
            <td><strong>${kh.tenCongTy || ""}</strong></td>
            <td style="font-family:monospace">${kh.maSoThue || ""}</td>
            <td>${kh.nguoiLienHe || "—"}</td>
            <td>${kh.soDienThoai || ""}</td>
            <td>${kh.email || '<span style="color:var(--danger);">Chưa có email</span>'}</td>
            <td>${kh.diaChi || "—"}</td>
            <td style="text-align:center">${kh.tongVanDon || 0}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="editKhachHang(${kh.id})">Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="deleteKhachHang(${kh.id})" style="margin-left:5px;">Xóa</button>
            </td>
        </tr>
    `,
        )
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:60px;color:var(--text-muted);">Không tìm thấy kết quả</td></tr>`;
}

// ==================== MODAL THÊM / SỬA KHÁCH HÀNG ====================
function showAddKhachHangModal() {
  currentEditingKhachId = null;
  document.getElementById("modalKhachHangTitle").innerText =
    "Thêm khách hàng mới";
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
        if (!kh) {
            showToast("Không tìm thấy khách hàng!", "error");
            return;
        }
        currentEditingKhachId = id;
        document.getElementById("modalKhachHangTitle").innerText = "Sửa thông tin khách hàng";
        document.getElementById("khTenCongTy").value = kh.tenCongTy;
        document.getElementById("khMaSoThue").value = kh.maSoThue;
        document.getElementById("khNguoiLienHe").value = kh.nguoiLienHe || "";
        document.getElementById("khSoDienThoai").value = kh.soDienThoai;
        document.getElementById("khEmail").value = kh.email || "";
        document.getElementById("khDiaChi").value = kh.diaChi || "";
        document.getElementById("modalKhachHang").classList.add("active");
    } catch (error) {
        console.error(error);
        showToast("Lỗi tải thông tin khách hàng", "error");
    }
}

async function deleteKhachHang(id) {
    if (!confirm("Bạn có chắc chắn muốn ngưng hợp tác với khách hàng này?")) return;
    try {
        await callAPI(`khachhang/${id}`, { method: "DELETE" });
        showToast("Đã ngưng hợp tác", "success");
        loadDanhSachKhachHang();
    } catch (error) {
        showToast("Lỗi xóa khách hàng", "error");
    }
}

function hideKhachHangModal() {
  document.getElementById("modalKhachHang").classList.remove("active");
}

// ==================== TỰ ĐỘNG ĐIỀN THÔNG TIN KHI CHỌN KHÁCH HÀNG ====================
function tuDongDienThongTinKhachHang() {
  const select = document.getElementById("bgKhachHang");
  const infoArea = document.getElementById("bgKhachHangInfo");
  if (!select || !infoArea) return;

  const option = select.options[select.selectedIndex];
  if (option && option.value !== "") {
    infoArea.value = option.dataset.info || "";
  } else {
    infoArea.value = "";
  }
}

// ==================== XỬ LÝ NGÀY LẬP + HẠN HIỆU LỰC ====================
function capNhatHanHieuLuc() {
  const ngayLap = document.getElementById("ngayLap");
  const hanHieuLuc = document.getElementById("hanHieuLuc");
  if (!ngayLap || !hanHieuLuc || !ngayLap.value) return;

  const date = new Date(ngayLap.value);
  date.setDate(date.getDate() + 7);

  hanHieuLuc.value = date.toISOString().split("T")[0];
}

// ==================== KHỞI TẠO TRANG TẠO BÁO GIÁ ====================
function initBaoGiaCreatePage() {
  const today = new Date().toISOString().split("T")[0];
  const ngayLapInput = document.getElementById("ngayLap");

  if (ngayLapInput) {
    ngayLapInput.max = today;
    ngayLapInput.value = today;
  }

  capNhatHanHieuLuc();
  loadDanhSachKhachHang();
}

// ==================== KHỞI TẠO TOÀN BỘ (CHỈ 1 LẦN) ====================
document.addEventListener("DOMContentLoaded", function () {
  // Trang Khách hàng
  if (document.getElementById("page-khachhang")) {
    loadDanhSachKhachHang();
  }

  // Trang Tạo báo giá
  if (document.getElementById("page-baogia-create")) {
    initBaoGiaCreatePage();
  }
});

// ==================== TÌM KIẾM DANH SÁCH BÁO GIÁ ====================
// Tìm kiếm danh sách báo giá
function searchBaoGiaList() {
  const keyword = document.getElementById("searchBaoGia").value.trim();
  const criteria = document.getElementById("searchCriteria").value;
  const tbody = document.getElementById("baogia-table-body");
  if (!tbody) return;

  let list = JSON.parse(localStorage.getItem("danhSachBaoGia")) || [];

  if (keyword === "") {
    loadDanhSachBaoGia();
    return;
  }

  let filtered = [];
  const keywordLower = keyword.toLowerCase();

  if (criteria === "maBaoGia") {
    filtered = list.filter((bg) => {
      const maBaoGia = `#BG${bg.id.toString().slice(-6)}`.toLowerCase();
      return maBaoGia.includes(keywordLower);
    });
  } else {
    filtered = list.filter((bg) => {
      const info = bg.khachHangInfo || "";
      return info.toLowerCase().includes(keywordLower);
    });
  }

  const statusFilter = document.getElementById("filterStatus")?.value || "";
  if (statusFilter) {
    filtered = filtered.filter((bg) => bg.trangThai === statusFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--text-muted);">Không tìm thấy báo giá nào với từ khóa "<strong>' +
      keyword +
      '</strong>"</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((bg) => {
      let tenKhach = "";
      if (bg.khachHangInfo) {
        const match = bg.khachHangInfo.match(/Tên công ty:\s*([^\n]+)/);
        tenKhach = match ? match[1] : bg.khachHangInfo.split("\n")[0];
      }
      const khachHangDisplay =
        tenKhach ||
        (bg.khachHangInfo ? bg.khachHangInfo.split("\n")[0] : "Không rõ");
      const trangThaiClass =
        bg.trangThai === "Chấp nhận"
          ? "badge-accepted"
          : bg.trangThai === "Từ chối"
            ? "badge-rejected"
            : bg.trangThai === "Đã gửi"
              ? "badge-sent"
              : "badge-draft";

      return (
        "<tr>" +
        '<td><span class="td-mono">#BG' +
        bg.id.toString().slice(-6) +
        "</span></td>" +
        "<td>" +
        khachHangDisplay +
        "</td>" +
        "<td>" +
        bg.ngayLap +
        "</td>" +
        "<td>" +
        bg.hanHieuLuc +
        "</td>" +
        '<td style="text-align:center">' +
        (bg.tuyen ? bg.tuyen.length : 0) +
        "</td>" +
        '<td style="font-weight:600;color:var(--accent)">' +
        bg.tongGiaTri +
        "</td>" +
        '<td><span class="badge ' +
        trangThaiClass +
        '">' +
        (bg.trangThai || "Chưa duyệt") +
        "</span></td>" +
        '<td><button class="btn btn-ghost btn-sm" onclick="viewBaoGiaDetail(' +
        bg.id +
        ')">Chi tiết</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="deleteBaoGia(' +
        bg.id +
        ')" style="margin-left:5px;">Xóa</button></td>' +
        "</tr>"
      );
    })
    .join("");
}
// Khởi tạo trang Danh sách báo giá
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-baogia-list")) {
    loadDanhSachBaoGia();
  }
});

// ====================== XEM CHI TIẾT BÁO GIÁ ======================
async function viewBaoGiaDetail(id) {
    try {
        const data = await callAPI(`baogia/${id}`);
        const baoGia = data.data;
        if (baoGia) {
            localStorage.setItem("currentBaoGiaDetail", JSON.stringify(baoGia));
            showPage("baogia-detail");
        } else {
            showToast("Không tìm thấy báo giá!", "error");
        }
    } catch (error) {
        console.error("Lỗi lấy chi tiết báo giá:", error);
        showToast("Không thể tải chi tiết báo giá", "error");
    }
}

// ====================== LOAD CHI TIẾT BÁO GIÁ (PHIÊN BẢN MỚI - ĐẢM BẢO CHẠY) ======================
function loadBaoGiaDetail() {
  const data = localStorage.getItem("currentBaoGiaDetail");

  if (!data) {
    const infoChung = document.getElementById("infoChung");
    if (infoChung) {
      infoChung.innerHTML = `
                <p style="color:red; text-align:center; padding:60px;">
                    Không tìm thấy dữ liệu báo giá!<br>
                    Vui lòng tạo và chọn lại báo giá.
                </p>`;
    }
    return;
  }

  const bg = JSON.parse(data);

  console.log("========== LOAD DETAIL ==========");
  console.log("ghiChuRieng:", bg.ghiChuRieng);
  console.log("=================================");

  // Cập nhật header
  const maBaoGiaEl = document.getElementById("detailMaBaoGia");
  if (maBaoGiaEl) maBaoGiaEl.textContent = `#BG${bg.id.toString().slice(-6)}`;

  const trangThaiEl = document.getElementById("detailTrangThai");
  if (trangThaiEl) {
    trangThaiEl.textContent = bg.trangThai || "Chưa duyệt";
    trangThaiEl.className = `badge ${bg.trangThai === "Chấp nhận" ? "badge-accepted" : bg.trangThai === "Từ chối" ? "badge-rejected" : bg.trangThai === "Đã gửi" ? "badge-sent" : "badge-draft"}`;
  }

  const hanHieuLucEl = document.getElementById("detailHanHieuLuc");
  if (hanHieuLucEl)
    hanHieuLucEl.textContent = `Hết hạn: ${bg.hanHieuLuc || "--"}`;

  // Thông tin chung
  const infoChungEl = document.getElementById("infoChung");
  if (infoChungEl) {
    infoChungEl.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Khách hàng</div>
                    <div class="info-value">${bg.khachHangInfo || "Không rõ"}</div>
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
            </div>
        `;
  }

  // 👇👇👇 HIỂN THỊ GHI CHÚ 👇👇👇
  const ghiChuEl = document.getElementById("ghiChuDetail");
  if (ghiChuEl) {
    if (bg.ghiChuRieng && bg.ghiChuRieng.trim() !== "") {
      ghiChuEl.innerHTML = `
                <div style="background: rgba(249,115,22,0.1); border-left: 3px solid #f97316; border-radius: 8px; padding: 16px;">
                    <div style="font-weight: 600; margin-bottom: 8px; color: #f97316;">📝 Ghi chú từ nhân viên:</div>
                    <div style="white-space: pre-wrap; line-height: 1.5;">${bg.ghiChuRieng}</div>
                </div>
            `;
    } else {
      ghiChuEl.innerHTML = `
                <div style="color: #8892a4; text-align: center; padding: 16px;">
                    <em>Không có ghi chú</em>
                </div>
            `;
    }
  } else {
    console.error("❌ KHÔNG TÌM THẤY PHẦN TỬ ghiChuDetail");
  }

  // Chi tiết tuyến
  const tuyenListEl = document.getElementById("tuyenListDetail");
  if (tuyenListEl) {
    let tuyenHTML =
      '<p style="padding:20px;color:var(--text-muted);">Không có tuyến nào</p>';
    if (bg.tuyen && bg.tuyen.length > 0) {
      tuyenHTML = bg.tuyen
        .map(
          (t, i) => `
                <div style="background:var(--bg-secondary);padding:16px;border-radius:10px;margin-bottom:12px;">
                    <strong>Tuyến ${i + 1}:</strong> ${t.diemDi} → ${t.diemDen} 
                    <span style="float:right;color:var(--accent)">${t.khoangCach} km</span>
                </div>
            `,
        )
        .join("");
    }
    tuyenListEl.innerHTML = tuyenHTML;
  }

  // Tổng kết
  const summaryEl = document.getElementById("summaryBody");
  if (summaryEl) {
    summaryEl.innerHTML = `
            <div class="summary-total">
                <div class="total-label">Tổng cộng</div>
                <div class="total-value">${bg.tongGiaTri}</div>
            </div>
        `;
  }
}
// Tự động load khi vào trang detail
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-baogia-detail")) {
    loadBaoGiaDetail();
  }
});

// Tự động load khi vào trang chi tiết
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("page-baogia-detail")) {
    loadBaoGiaDetail();
  }
});

// ====================== PDF & EMAIL FUNCTIONS ======================

let currentBaoGiaForPDF = null;

// Tạo HTML cho PDF
function generatePDFHTML(bg) {
  // Lấy thông tin khách hàng
  let khachHangInfo = {};
  const infoLines = bg.khachHangInfo ? bg.khachHangInfo.split("\n") : [];
  infoLines.forEach((line) => {
    if (line.includes("Tên công ty:"))
      khachHangInfo.tenCongTy = line.replace("Tên công ty:", "").trim();
    if (line.includes("MST:"))
      khachHangInfo.maSoThue = line.replace("MST:", "").trim();
    if (line.includes("Người liên hệ:"))
      khachHangInfo.nguoiLienHe = line.replace("Người liên hệ:", "").trim();
    if (line.includes("SĐT:"))
      khachHangInfo.soDienThoai = line.replace("SĐT:", "").trim();
    if (line.includes("Email:"))
      khachHangInfo.email = line.replace("Email:", "").trim();
    if (line.includes("Địa chỉ:"))
      khachHangInfo.diaChi = line.replace("Địa chỉ:", "").trim();
  });

  const tenCongTy = khachHangInfo.tenCongTy || bg.khachHangInfo || "Khách hàng";
  const ghiChuRieng = bg.ghiChuRieng || ""; // Ghi chú riêng từ nhân viên

  // Tạo HTML cho PDF
  return `
        <div class="pdf-preview" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <div class="header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px;">
                <div class="company-name" style="font-size: 28px; font-weight: bold; color: #f97316;">HHH Logistics</div>
                <div class="quote-title" style="font-size: 16px; margin-top: 10px; color: #666;">BÁO GIÁ VẬN CHUYỂN</div>
                <div style="font-size: 14px; margin-top: 5px;">Số: ${bg.id ? "#BG" + bg.id.toString().slice(-6) : "N/A"}</div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">KHÁCH HÀNG:</span>
                    <span style="font-weight: bold;">${tenCongTy}</span>
                </div>
                ${
                  khachHangInfo.maSoThue
                    ? `<div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">MÃ SỐ THUẾ:</span>
                    <span>${khachHangInfo.maSoThue}</span>
                </div>`
                    : ""
                }
                ${
                  khachHangInfo.nguoiLienHe
                    ? `<div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">NGƯỜI LIÊN HỆ:</span>
                    <span>${khachHangInfo.nguoiLienHe}</span>
                </div>`
                    : ""
                }
                ${
                  khachHangInfo.soDienThoai
                    ? `<div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">ĐIỆN THOẠI:</span>
                    <span>${khachHangInfo.soDienThoai}</span>
                </div>`
                    : ""
                }
                ${
                  khachHangInfo.email
                    ? `<div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">EMAIL:</span>
                    <span>${khachHangInfo.email}</span>
                </div>`
                    : ""
                }
                ${
                  khachHangInfo.diaChi
                    ? `<div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">ĐỊA CHỈ:</span>
                    <span>${khachHangInfo.diaChi}</span>
                </div>`
                    : ""
                }
                <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">NGÀY LẬP:</span>
                    <span>${bg.ngayLap}</span>
                </div>
                <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span class="label" style="font-weight: bold; color: #666;">HẠN HIỆU LỰC:</span>
                    <span>${bg.hanHieuLuc}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #f97316; margin-bottom: 15px;">CHI TIẾT TUYẾN VẬN CHUYỂN</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f97316; color: white;">
                            <th style="padding: 10px; text-align: left;">STT</th>
                            <th style="padding: 10px; text-align: left;">Điểm đi</th>
                            <th style="padding: 10px; text-align: left;">Điểm đến</th>
                            <th style="padding: 10px; text-align: right;">Khoảng cách</th>
                         </tr>
                    </thead>
                    <tbody>
                        ${
                          bg.tuyen && bg.tuyen.length > 0
                            ? bg.tuyen
                                .map(
                                  (t, i) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${i + 1}</td>
                                <td style="padding: 8px;">${t.diemDi || "-"}</td>
                                <td style="padding: 8px;">${t.diemDen || "-"}</td>
                                <td style="padding: 8px; text-align: right;">${t.khoangCach || 0} km</td>
                            </tr>
                        `,
                                )
                                .join("")
                            : '<tr><td colspan="4" style="padding: 20px; text-align: center;">Không có dữ liệu tuyến</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <div class="total" style="font-size: 20px; font-weight: bold; color: #f97316; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #f97316;">
                TỔNG GIÁ TRỊ: ${bg.tongGiaTri}
            </div>
            
            ${
              ghiChuRieng
                ? `
            <div class="note" style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #f97316;">
                <strong>📝 Ghi chú từ nhân viên:</strong><br>
                ${ghiChuRieng}
            </div>
            `
                : ""
            }
            
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
                * Báo giá này có hiệu lực đến ngày ${bg.hanHieuLuc}<br>
                Mọi thắc mắc xin liên hệ: HHH Logistics - Hotline: 1900xxxx
            </div>
        </div>
    `;
}

// Xem trước PDF và tải
function previewPDFAndDownload() {
  const data = localStorage.getItem("currentBaoGiaDetail");
  if (!data) {
    showToast("Không tìm thấy dữ liệu báo giá!", "error");
    return;
  }

  currentBaoGiaForPDF = JSON.parse(data);
  const pdfHTML = generatePDFHTML(currentBaoGiaForPDF);

  document.getElementById("pdfContent").innerHTML = pdfHTML;
  document.getElementById("pdfModal").classList.add("active");
}

function closePdfModal() {
  document.getElementById("pdfModal").classList.remove("active");
}

function downloadPDF() {
  const element = document.getElementById("pdfContent");
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `BaoGia_${currentBaoGiaForPDF.id.toString().slice(-6)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, letterRendering: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(element).save();
  showToast("Đang tạo PDF...", "success");
}

// Gửi email kèm PDF
function sendEmailWithPDF() {
  const data = localStorage.getItem("currentBaoGiaDetail");
  if (!data) {
    showToast("Không tìm thấy dữ liệu báo giá!", "error");
    return;
  }

  const bg = JSON.parse(data);

  // Lấy email khách hàng từ thông tin
  let emailKhach = "";
  if (bg.khachHangInfo) {
    const emailMatch = bg.khachHangInfo.match(/Email:\s*([^\s\n]+)/);
    if (emailMatch) emailKhach = emailMatch[1];
  }

  if (!emailKhach) {
    // Nếu không có email, dùng mailto để mở client email
    const subject = encodeURIComponent(
      `Báo giá vận chuyển ${bg.id ? "#BG" + bg.id.toString().slice(-6) : ""}`,
    );
    const body = encodeURIComponent(
      `Kính gửi Quý khách hàng,\n\nVui lòng xem file PDF đính kèm để biết chi tiết báo giá.\n\nTrân trọng!`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast("Đang mở email client...", "info");
  } else {
    // Dùng EmailJS (cần đăng ký tài khoản tại emailjs.com)
    // Đây là demo, bạn cần cấu hình EmailJS
    showToast(`Đã gửi email đến ${emailKhach}`, "success");
  }

  // Cập nhật trạng thái thành "Đã gửi"
  updateBaoGiaStatus(bg.id, "Đã gửi");
}

// Chấp nhận báo giá và tự động tạo vận đơn
function acceptBaoGia() {
    const data = localStorage.getItem("currentBaoGiaDetail");
    if (!data) return;
    const bg = JSON.parse(data);
    updateBaoGiaStatus(bg.id, "Chấp nhận");
}

// Hàm tạo vận đơn từ báo giá (có kiểm tra trùng)
function createVanDonFromBaoGia(bg) {
  console.log("🔧 Đang tạo vận đơn cho báo giá:", bg.id);

  // Kiểm tra trùng
  let danhSachVanDon = JSON.parse(localStorage.getItem("danhSachVanDon")) || [];
  const vanDonTonTai = danhSachVanDon.some((vd) => vd.maBaoGia === bg.id);
  if (vanDonTonTai) {
    console.log("⚠️ Báo giá này đã có vận đơn, không tạo mới");
    return null;
  }

  // Lấy tên khách hàng
  let tenKhach = "";
  if (bg.khachHangInfo) {
    const match = bg.khachHangInfo.match(/Tên công ty:\s*([^\n]+)/);
    tenKhach = match ? match[1] : bg.khachHangInfo.split("\n")[0];
  }
  console.log("📦 Khách hàng:", tenKhach);

  // Lấy thông tin từ tuyến đầu tiên (nếu có)
  let diemDi = "",
    diemDen = "",
    loaiHang = "",
    trongLuong = 0,
    khoangCach = 0,
    donGia = 0,
    tuyen = "";
  if (bg.tuyen && bg.tuyen.length > 0) {
    const tuyenDau = bg.tuyen[0];
    diemDi = tuyenDau.diemDi || "";
    diemDen = tuyenDau.diemDen || "";
    khoangCach = parseFloat(tuyenDau.khoangCach) || 0;
    loaiHang = tuyenDau.loaiHang || ""; // Lấy loại hàng
    trongLuong = parseFloat(tuyenDau.trongLuong) || 0; // Lấy trọng lượng
    donGia = parseFloat(tuyenDau.donGia) || 0; // Lấy đơn giá
    tuyen = `${diemDi} → ${diemDen}`;
    if (bg.tuyen.length > 1) tuyen += ` (+${bg.tuyen.length - 1} tuyến)`;
  }

  // Tạo mã vận đơn
  const maVanDon = generateVanDonId();
  console.log("🏷️ Mã vận đơn:", maVanDon);

  // Tạo vận đơn mới
  const vanDon = {
    id: maVanDon,
    maBaoGia: bg.id,
    khachHang: tenKhach,
    khachHangInfo: bg.khachHangInfo,
    tuyen: tuyen,
    tuyenChiTiet: bg.tuyen || [],
    ngayVanChuyen: bg.ngayLap,
    giaTri: bg.tongGiaTri,
    trangThai: "Đã xác nhận",
    trangThaiThanhToan: "Chưa thanh toán",
    ngayTao: new Date().toISOString().split("T")[0],
    daThu: 0,
    // Các trường chi tiết (từ báo giá)
    diemDi: diemDi,
    diemDen: diemDen,
    loaiHang: loaiHang,
    trongLuong: trongLuong,
    khoangCach: khoangCach,
    donGia: donGia,
    // Các trường thực tế (sẽ nhập sau)
    diaChiLayHang: "",
    diaChiGiaoHang: "",
    nguoiLienHeLay_Ten: "",
    nguoiLienHeLay_SDT: "",
    nguoiLienHeGiao_Ten: "",
    nguoiLienHeGiao_SDT: "",
    ghiChu: "",
  };

  danhSachVanDon.unshift(vanDon);
  localStorage.setItem("danhSachVanDon", JSON.stringify(danhSachVanDon));
  console.log("✅ Đã lưu vận đơn mới");
  console.log("📦 Tổng số vận đơn hiện tại:", danhSachVanDon.length);

  return vanDon;
}

// Hàm tạo mã vận đơn tự động
function generateVanDonId() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Lấy danh sách vận đơn hiện tại
  const danhSachVanDon =
    JSON.parse(localStorage.getItem("danhSachVanDon")) || [];

  // Tìm số thứ tự lớn nhất trong ngày hôm nay
  let maxSeq = 0;
  danhSachVanDon.forEach((vd) => {
    if (vd.id && vd.id.startsWith(`VD-${dateStr}`)) {
      const seq = parseInt(vd.id.slice(-4));
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  // Tăng số thứ tự lên 1
  const newSeq = String(maxSeq + 1).padStart(4, "0");
  const newId = `VD-${dateStr}-${newSeq}`;

  console.log("🔑 Tạo mã vận đơn mới:", newId);
  return newId;
}

// Từ chối báo giá
function rejectBaoGia() {
    const data = localStorage.getItem("currentBaoGiaDetail");
    if (!data) return;
    const bg = JSON.parse(data);
    updateBaoGiaStatus(bg.id, "Từ chối");
}

// Cập nhật trạng thái báo giá và đồng bộ vận đơn
async function updateBaoGiaStatus(baogiaId, newStatus) {
    try {
        await callAPI(`baogia/${baogiaId}/status`, {
            method: "PUT",
            body: JSON.stringify({ trangThai: newStatus })
        });
        showToast(`Đã cập nhật trạng thái thành "${newStatus}"`, "success");
        // Cập nhật lại chi tiết đang xem
        const detailData = await callAPI(`baogia/${baogiaId}`);
        localStorage.setItem("currentBaoGiaDetail", JSON.stringify(detailData.data));
        loadBaoGiaDetail(); // reload giao diện
        if (document.getElementById("page-vandon-list") && typeof loadDanhSachVanDon === "function") {
            loadDanhSachVanDon();
        }
    } catch (error) {
        showToast("Lỗi cập nhật trạng thái: " + error.message, "error");
    }
}

// ====================== PHÂN TRANG BÁO GIÁ ======================

// Load danh sách báo giá (không phân trang)
async function loadDanhSachBaoGia() {
    const tbody = document.getElementById("baogia-table-body");
    if (!tbody) return;

    const statusFilter = document.getElementById("filterStatus")?.value || "";
    let url = 'baogia';
    if (statusFilter) {
        url += `?trangThai=${encodeURIComponent(statusFilter)}`;
    }

    try {
        const data = await callAPI(url);
        const list = data.data || [];

        // Lấy danh sách khách hàng đang hoạt động để kiểm tra xem khách có bị xóa không
        const khachData = await callAPI('khachhang?all=true');
        const activeKhachSet = new Set(khachData.data.map(kh => kh.tenCongTy));

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;">Chưa có báo giá nào</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(bg => {
            let tenKhach = bg.tenCongTy || '';
            const isKhachDeleted = !activeKhachSet.has(tenKhach);
            const khachHangDisplay = isKhachDeleted
                ? `<span style="color: var(--danger);">${escapeHtml(tenKhach)}</span><span style="display:block; font-size:10px; color: var(--warning);">⚠️ Đã ngưng hợp tác</span>`
                : escapeHtml(tenKhach);

            const trangThaiViet = bg.trangThai; // backend trả về: Chưa duyệt, Đã gửi, Chấp nhận, Từ chối
            let trangThaiClass = "badge-draft";
            if (trangThaiViet === "Chấp nhận") trangThaiClass = "badge-accepted";
            else if (trangThaiViet === "Từ chối") trangThaiClass = "badge-rejected";
            else if (trangThaiViet === "Đã gửi") trangThaiClass = "badge-sent";
            // else "Chưa duyệt" -> badge-draft

            return `
                <tr>
                    <td><span class="td-mono">#BG${bg.id.toString().slice(-6)}</span></td>
                    <td>${khachHangDisplay}</td>
                    <td>${bg.ngayLap}</td>
                    <td>${bg.ngayHetHan}</td>
                    <td style="text-align:center">${bg.soChiTiet || 0}</td>
                    <td style="font-weight:600;color:var(--accent)">${formatVND(bg.tongGiaTri)}</td>
                    <td><span class="badge ${trangThaiClass}">${trangThaiViet}</span></td>
                    <td>
                        <button class="btn btn-ghost btn-sm" onclick="viewBaoGiaDetail(${bg.id})">Chi tiết</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBaoGia(${bg.id})" style="margin-left:5px;">Xóa</button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error("Lỗi load danh sách báo giá:", error);
        showToast("Không thể tải danh sách báo giá", "error");
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:80px;color:var(--text-muted);">Lỗi tải dữ liệu.</td></tr>`;
    }
}

// Thay đổi số lượng hiển thị mỗi trang
function changePageSize(size) {
  console.log("🔄 Đổi pageSize từ", pageSize, "thành", size);
  pageSize = size;
  currentPage = 1; // Reset về trang 1

  // Tính lại totalPages với pageSize mới
  totalPages = Math.ceil(currentBaoGiaList.length / pageSize);
  if (totalPages === 0) totalPages = 1;

  // Load lại dữ liệu
  loadDanhSachBaoGia();
}
// Cập nhật hàm loadDanhSachBaoGia khi filter thay đổi
// Thêm event listener cho filter status
document.addEventListener("DOMContentLoaded", function () {
  const filterStatus = document.getElementById("filterStatus");
  if (filterStatus) {
    filterStatus.addEventListener("change", function () {
      currentPage = 1;
      loadDanhSachBaoGia();
    });
  }
});

// Xóa báo giá và vận đơn liên quan
async function deleteBaoGia(id) {
    if (!confirm("Bạn có chắc muốn xóa báo giá này? Các vận đơn liên quan sẽ bị xóa?")) return;
    try {
        await callAPI(`baogia/${id}`, { method: "DELETE" });
        showToast("✅ Đã xóa báo giá thành công!", "success");
        loadDanhSachBaoGia(); // reload danh sách
        // Nếu đang ở trang vận đơn, reload luôn
        if (document.getElementById("page-vandon-list") && typeof loadDanhSachVanDon === "function") {
            loadDanhSachVanDon();
        }
    } catch (error) {
        showToast("Lỗi xóa báo giá: " + error.message, "error");
    }
}
