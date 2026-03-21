// 1. Cấu hình Firebase của bạn
  const firebaseConfig = {
    apiKey: "AIzaSyAXz45R6VTVIRT6_cc1n0I9vncV-FyJCq0",
    authDomain: "hhh-logistics.firebaseapp.com",
    projectId: "hhh-logistics",
    storageBucket: "hhh-logistics.firebasestorage.app",
    messagingSenderId: "718366482593",
    appId: "1:718366482593:web:26ddecbf4da586a63750e0",
    measurementId: "G-PJFK4CHPVR",
  };

  // Khởi tạo Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {

  // 1. QUẢN LÝ DỮ LIỆU (LocalStorage)
  let customerList = JSON.parse(localStorage.getItem("hhh_data")) || [];
  // Thêm vào phần đầu file (Quản lý dữ liệu)
  let shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];

  let systemConfig = JSON.parse(localStorage.getItem("hhh_config")) || {
    normal: 15000,
    fragile: 25000,
    cold: 45000,
    threshold: 100,
    discount: 20,
  };

  // 2. QUẢN LÝ TABS - Cập nhật bản chống lỗi
  const menuItems = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("data-tab");
      const targetTab = document.getElementById(targetId);

      // Kiểm tra xem ID tab có tồn tại trong HTML không
      if (!targetTab) {
        console.error(
          "Lỗi: Không tìm thấy vùng nội dung có ID là: " + targetId,
        );
        return;
      }

      // Xóa trạng thái active ở tất cả menu
      menuItems.forEach((i) => i.classList.remove("active"));

      // Ẩn tất cả các Tab nội dung và xóa class active
      tabContents.forEach((t) => {
        t.classList.remove("active");
        t.style.display = "none";
      });

      // Kích hoạt Menu và Tab được chọn
      this.classList.add("active");
      targetTab.classList.add("active");
      targetTab.style.display = "block"; // Ép hiển thị lại

      // Xử lý riêng cho bản đồ nếu vào tab tạo báo giá
      if (targetId === "quotation-create" && typeof map !== "undefined") {
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }

      // Cập nhật dữ liệu cho Tab đó
      if (typeof refreshTabData === "function") {
        refreshTabData(targetId);
      }
    });
  });

  // Hàm điều hướng phụ để dùng trong code (ví dụ bấm nút chuyển tab)
  window.switchTab = function (tabId) {
    const targetMenu = document.querySelector(
      `.menu-item[data-tab="${tabId}"]`,
    );
    if (targetMenu) targetMenu.click();
  };

  // 3. KHỞI TẠO BẢN ĐỒ
  const map = L.map("map").setView([15.8, 107.5], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  let routeLayer;
  let startCoords = null;
  let endCoords = null;
  const vnWaypoints = ["108.2022,16.0544", "109.2132,13.7745"];

  // 4. TÌM KIẾM ĐỊA CHỈ & ROUTE
  // --- 1. KHAI BÁO BIẾN CHỜ (ĐẶT Ở ĐẦU FILE) ---
let searchTimeout = null;

// --- 2. HÀM TÌM KIẾM ĐỊA CHỈ (ĐÃ TỐI ƯU) ---
async function searchAddress(query, boxId, type) {
    const box = document.getElementById(boxId);
    if (!box) return;

    if (query.length < 3) {
        box.innerHTML = "";
        return;
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`,
        );
        
        // Kiểm tra nếu bị chặn do gửi quá nhanh
        if (res.status === 429) {
            console.warn("Hệ thống đang bận, vui lòng đợi một chút...");
            return;
        }

        const data = await res.json();
        box.innerHTML = "";
        
        data.forEach((item) => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.innerText = item.display_name;
            div.onclick = () => {
                if (type === "start") {
                    startCoords = [parseFloat(item.lat), parseFloat(item.lon)];
                    document.getElementById("start-address").value = item.display_name;
                } else {
                    endCoords = [parseFloat(item.lat), parseFloat(item.lon)];
                    document.getElementById("end-address").value = item.display_name;
                }
                box.innerHTML = "";
                updateRoute(); // Tự động vẽ lại đường đi
            };
            box.appendChild(div);
        });
    } catch (e) {
        console.error("Lỗi địa chỉ:", e);
    }
}

// --- 3. GÁN SỰ KIỆN ONINPUT (DÙNG DEBOUNCE ĐỂ CHẶN LỖI 429) ---
document.getElementById("start-address").oninput = (e) => {
    clearTimeout(searchTimeout); // Xóa lần chờ trước
    const val = e.target.value;
    searchTimeout = setTimeout(() => {
        searchAddress(val, "start-suggestions", "start");
    }, 500); // Đợi người dùng ngừng gõ 0.5 giây mới gọi API
};

document.getElementById("end-address").oninput = (e) => {
    clearTimeout(searchTimeout);
    const val = e.target.value;
    searchTimeout = setTimeout(() => {
        searchAddress(val, "end-suggestions", "end");
    }, 500);
};

// --- 4. HÀM CẬP NHẬT TUYẾN ĐƯỜNG (GIỮ NGUYÊN LOGIC CỦA BẠN) ---
async function updateRoute() {
    if (!startCoords || !endCoords) return;
    
    // Sửa lỗi bản đồ bị xám/lệch khi thay đổi kích thước bằng CSS
    if (window.map) {
        setTimeout(() => { map.invalidateSize(); }, 100);
    }

    let pointList = [`${startCoords[1]},${startCoords[0]}`];
    
    if (typeof vnWaypoints !== 'undefined' && Math.abs(startCoords[0] - endCoords[0]) > 5) {
        startCoords[0] > endCoords[0]
            ? pointList.push(...vnWaypoints)
            : pointList.push(vnWaypoints[1], vnWaypoints[0]);
    }
    
    pointList.push(`${endCoords[1]},${endCoords[0]}`);

    try {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pointList.join(";")}?overview=full&geometries=geojson`,
        );
        const data = await res.json();
        
        if (data.code === "Ok") {
            const route = data.routes[0];
            const distanceInput = document.getElementById("distance-display");
            if (distanceInput) {
                distanceInput.value = (route.distance / 1000).toFixed(1);
            }

            if (window.routeLayer) map.removeLayer(window.routeLayer);
            
            window.routeLayer = L.geoJSON(route.geometry, {
                style: { color: "#06b6d4", weight: 6, opacity: 0.8 },
            }).addTo(map);

            map.fitBounds(window.routeLayer.getBounds(), { padding: [40, 40] });
            
            if (typeof calculatePrice === "function") calculatePrice();
        }
    } catch (e) {
        console.error("Lỗi tuyến đường:", e);
    }
}

  // 5. TÍNH TOÁN GIÁ
  function calculatePrice() {
    const km =
      parseFloat(document.getElementById("distance-display").value) || 0;
    const weight =
      parseFloat(document.getElementById("weight-input").value) || 0;
    const type = document.getElementById("cargo-type").value;
    const unitPrice = systemConfig[type];
    let discount =
      weight >= systemConfig.threshold
        ? (100 - systemConfig.discount) / 100
        : 1;
    const total = Math.round(km * weight * unitPrice * discount);
    document.getElementById("total-price-display").innerText =
      total.toLocaleString("vi-VN") + "đ";
  }

  document
    .getElementById("cargo-type")
    .addEventListener("change", calculatePrice);
  document
    .getElementById("weight-input")
    .addEventListener("input", calculatePrice);

  // 6. LƯU BÁO GIÁ
  // Tìm nút lưu trong tab Báo giá
const btnSave = document.getElementById("btnSave"); 

if (btnSave) {
    btnSave.addEventListener("click", async function() {
        const custName = document.getElementById("cust-info").value;
        const priceTotal = document.getElementById("total-price-display").innerText;
        const weightInput = document.getElementById("weight-input").value;
        const typeInput = document.getElementById("cargo-type").value;

        if(!custName || priceTotal === "0đ") return alert("Vui lòng nhập đầy đủ thông tin!");

        const newOrder = {
            id: "BQ-" + Math.floor(Math.random() * 9000 + 1000),
            date: new Date().toLocaleDateString("vi-VN"),
            name: custName,
            price: priceTotal,
            weight: weightInput,
            cargoType: typeInput,
            status: "Chờ duyệt",
            staff: "Admin"
        };

        try {
            // Lưu lên Cloud Firebase (Để bảng renderCustomerTables lấy được dữ liệu)
            await db.collection("quotations").add(newOrder);
            
            // Lưu dự phòng LocalStorage
            customerList.push(newOrder);
            localStorage.setItem("hhh_data", JSON.stringify(customerList));

            alert("Báo giá đã được lưu lên hệ thống Cloud!");
            renderCustomerTables(); 
        } catch (e) {
            alert("Lỗi lưu Cloud: " + e.message);
        }
    });
}

  // 7. CẬP NHẬT CẤU HÌNH GIÁ
  const btnUpdate = document.getElementById("btnUpdateConfig");
  if (btnUpdate) {
    btnUpdate.addEventListener("click", function () {
      systemConfig.normal = parseFloat(
        document.getElementById("cfg-normal").value,
      );
      systemConfig.fragile = parseFloat(
        document.getElementById("cfg-fragile").value,
      );
      systemConfig.cold = parseFloat(document.getElementById("cfg-cold").value);
      systemConfig.threshold = parseFloat(
        document.getElementById("cfg-threshold").value,
      );
      systemConfig.discount = parseFloat(
        document.getElementById("cfg-discount").value,
      );

      localStorage.setItem("hhh_config", JSON.stringify(systemConfig));
      alert("Đã cập nhật đơn giá hệ thống!");
    });
  }

  // 8. RENDER BẢNG DỮ LIỆU
// Sửa lại hàm Render Báo giá để lấy từ Firebase
// Hàm render Báo giá tự động cập nhật (Real-time)
// Thêm tham số filterValue để dùng chung cho cả lọc Trạng thái và lọc Mã
window.renderCustomerTables = function (filterValue = 'Tất cả') {
    const quoteTableBody = document.getElementById("quotation-table-body");
    if (!quoteTableBody) return;

    // 1. Cập nhật giao diện Tab Active (chỉ dành cho lọc trạng thái)
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.trim() === filterValue) tab.classList.add('active');
    });

    // 2. Xây dựng Query Firestore
    let query = db.collection("quotations");

    if (filterValue !== 'Tất cả') {
        // Kiểm tra nếu filterValue là mã báo giá (thường bắt đầu bằng BQ-)
        if (filterValue.startsWith('BQ-')) {
            query = query.where("id", "==", filterValue);
        } else {
            // Ngược lại thì lọc theo trạng thái
            query = query.where("status", "==", filterValue);
        }
    }

    // 3. Lắng nghe dữ liệu Realtime
    query.onSnapshot((snapshot) => {
        quoteTableBody.innerHTML = "";

        if (snapshot.empty) {
            quoteTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Không tìm thấy báo giá phù hợp</td></tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            const item = doc.data();
            const docId = doc.id;
            
            const hienThiTen = item.name || item.customerName || "Khách lẻ";
            const hienThiGia = item.price || item.totalPrice || "0đ";

            quoteTableBody.innerHTML += `
                <tr>
                    <td>#${item.id || 'BQ-Mới'}</td>
                    <td>${item.date || '20/03/2026'}</td>
                    <td><strong>${hienThiTen}</strong></td>
                    <td>${item.staff || "Admin"}</td>
                    <td style="color:var(--color-green); font-weight:700;">${hienThiGia}</td>
                    <td>${item.expiry || "27/03/2026"}</td>
                    <td><span class="status-badge ${getStatusClass(item.status)}">${item.status || 'Chờ chốt'}</span></td>
                    <td><button class="btn-outline" onclick="updateStatus('${docId}')">Đổi</button></td>
                    <td>
                       <button class="btn-delete" onclick="deleteOrder('${docId}')" style="color:red; border:none; background:none; cursor:pointer;">
                          <i class="fa-solid fa-trash-can"></i>
                       </button>
                    </td>
                </tr>`;
        });
    }, (error) => {
        console.error("Lỗi khi lọc dữ liệu:", error);
    });
};

  // Cập nhật trạng thái
  // Cập nhật trạng thái trực tiếp lên Firestore
window.updateStatus = async function (docId) {
    // Thêm "Chờ chốt" vào danh sách
    const statuses = ["Chờ chốt", "Đã chốt", "Chờ duyệt", "Đã hủy"];
    
    // Tạo bảng thông báo lựa chọn
    let msg = "Chọn trạng thái mới:\n";
    statuses.forEach((s, i) => {
        msg += `${i + 1}. ${s}\n`;
    });
    
    const choice = prompt(msg, "1");

    if (choice && choice >= 1 && choice <= statuses.length) {
        const newStatus = statuses[choice - 1];

        try {
            // Cập nhật lên Firestore
            await db.collection("quotations").doc(docId).update({
                status: newStatus
            });

            alert("Đã cập nhật trạng thái thành: " + newStatus);
            
            // Nếu bạn đang dùng Real-time (onSnapshot) thì bảng sẽ tự nhảy, 
            // nếu không thì gọi lại hàm render:
            if (typeof renderCustomerTables === "function") renderCustomerTables();
            
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Lỗi: " + error.message);
        }
    }
};

  // Xóa đơn hàng
  // Xóa đơn hàng trực tiếp trên Firebase Cloud
window.deleteOrder = async function (docId) {
    // 1. Hỏi xác nhận trước khi xóa
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn báo giá này khỏi hệ thống Cloud không?")) {
        try {
            // 2. Thực hiện lệnh xóa trên Firestore dùng docId
            await db.collection("quotations").doc(docId).delete();
            
            alert("Đã xóa dữ liệu thành công!");

            // 3. Cập nhật lại LocalStorage để đồng bộ giao diện ngay lập tức (nếu bạn vẫn dùng cả hai)
            customerList = customerList.filter((item) => item.id !== docId);
            localStorage.setItem("hhh_data", JSON.stringify(customerList));

            // 4. Load lại bảng để người dùng thấy dòng đó biến mất
            renderCustomerTables(); 
            
        } catch (error) {
            console.error("Lỗi khi xóa đơn:", error);
            alert("Không thể xóa dữ liệu. Lỗi: " + error.message);
        }
    }
};

  function getStatusClass(status) {
    switch (status) {
        case "Đã chốt":
            return "badge-green";  // Xanh lá - Thành công
        case "Chờ chốt":
            return "badge-blue";   // Xanh dương - Đang xử lý
        case "Chờ duyệt":
            return "badge-amber";  // Vàng/Cam - Đợi cấp trên
        case "Đã hủy":
            return "badge-red";    // Đỏ - Thất bại/Dừng
        default:
            return "badge-gray";   // Xám - Mặc định
    }
}
  // Cập nhật số liệu Dashboard thực tế
  async function updateDashboardStats() {
    console.log("--- Đang cập nhật từ Firebase theo ảnh thực tế ---");

    try {
        // KIỂM TRA: Tên collection trong ngoặc phải khớp 100% với Firebase của bạn
        const snapshot = await db.collection("quotations").get(); 
        
        let totalRevenue = 0;
        let completedCount = 0;
        let pendingCount = 0;

        snapshot.forEach((doc) => {
            const item = doc.data();
            const status = item.status || "";

            // Xử lý giá tiền: "47.815.600đ" -> 47815600
            if (item.price && status !== "Đã hủy") {
                // Xóa tất cả những gì không phải là số (xóa dấu chấm, xóa chữ đ)
                const priceNum = parseInt(item.price.toString().replace(/\D/g, "")) || 0;
                totalRevenue += priceNum;
            }

            // Đếm trạng thái
            if (status === "Hoàn thành" || status === "Đã chốt") {
                completedCount++;
            }
            if (status === "Chờ duyệt") {
                pendingCount++;
            }
        });

        // Cập nhật giao diện
        const cards = document.querySelectorAll("#dashboard .stats-grid h2");
        if (cards.length >= 3) {
            cards[0].innerText = totalRevenue.toLocaleString("vi-VN") + "đ";
            cards[1].innerText = completedCount;
            cards[2].innerText = pendingCount;
        }

        const totalCustElem = document.getElementById("total-customers");
        if (totalCustElem) totalCustElem.innerText = snapshot.size;

    } catch (error) {
        console.error("Lỗi cập nhật Dashboard:", error);
    }
}
  document
    .getElementById("btn-confirm-shipping")
    ?.addEventListener("click", async (e) => {
      const targetEmail =
        window.currentCustomerEmail || "khachhang@example.com";
      await handleExport("shipping-create", "Van_Don_Logistics", targetEmail);
      saveNewShipping();
    });
  // Khởi chạy lần đầu
  renderCustomerTables();
});

// Hàm tạo mã vận đơn tự động
function generateVDCode() {
  const now = new Date();
  const dateStr =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Tạo 4 số ngẫu nhiên
  return `VD-${dateStr}-${randomSuffix}`;
}
// 2. CHÈN HÀM saveNewShipping VÀO ĐÂY
function saveNewShipping() {
    const vdCode = document.getElementById("generated-vd-code").innerText;
    if (vdCode.includes("XXXX")) return alert("Vui lòng nhấn lấy thông tin báo giá trước!");

    const newVD = {
        vdCode: vdCode,
        custName: document.getElementById("ship-cust-name").value,
        weight: document.getElementById("ship-weight").value,
        cargo: document.getElementById("ship-cargo").value,
        price: document.getElementById("ship-price").value,
        status: "Đang xử lý",
        date: new Date().toLocaleDateString("vi-VN")
    };

    let shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];
    shippingList.push(newVD);
    localStorage.setItem("hhh_shipping", JSON.stringify(shippingList));
    
    alert("Vận đơn " + vdCode + " đã được khởi tạo!");
    renderShippingTable();
}

// Gán sự kiện cho nút Xác nhận tạo vận đơn
document.getElementById("btnConfirmShipping")?.addEventListener("click", function () {
    const newCode = generateVDCode();
    document.getElementById("generated-vd-code").innerText = newCode;
    saveNewShipping();
});
// Giả lập khi nhấn nút "Xác nhận tạo vận đơn"
document
  .getElementById("btnConfirmShipping")
  ?.addEventListener("click", function () {
    const vdCode = generateVDCode();

    // 1. Hiển thị thông báo thành công
    alert(`Thành công!
Mã vận đơn: ${vdCode}
Trạng thái: CONFIRMED
Hệ thống đang gửi Email xác nhận + PDF cho khách hàng...`);

    // 2. Cập nhật mã lên giao diện
    document.getElementById("generated-vd-code").innerText = vdCode;

    // 3. Logic chuyển về tab danh sách (tùy chọn)
    // switchTab('shipping-list');
  });

// Hàm lấy dữ liệu từ Báo giá đổ vào Vận đơn
window.loadQuotationData = function() {
    const code = document.getElementById("search-quotation").value.trim();
    if (!code) return alert("Vui lòng nhập mã báo giá!");

    // Ưu tiên tìm trong LocalStorage (hoặc bạn có thể fetch từ Firebase nếu muốn)
    const data = JSON.parse(localStorage.getItem("hhh_data")) || [];
    const found = data.find(item => item.id === code || item.id === "BQ-" + code);

    if (found) {
        document.getElementById("ship-cust-name").value = found.name || "";
        document.getElementById("ship-price").value = found.price || "";
        
        // Sửa lỗi: Gán đúng vào ID ship-weight và ship-cargo trong HTML
        if (document.getElementById("ship-weight")) {
            document.getElementById("ship-weight").value = found.weight + " kg";
        }
        if (document.getElementById("ship-cargo")) {
            const typeLabels = { "normal": "Hàng thường", "fragile": "Dễ vỡ", "cold": "Đông lạnh" };
            document.getElementById("ship-cargo").value = typeLabels[found.cargoType] || found.cargoType;
        }
        alert("Đã lấy dữ liệu từ mã: " + found.id);
    } else {
        alert("Không tìm thấy mã báo giá này trong máy!");
    }
}
function confirmDelete(id) {
  if (
    confirm(
      `Bạn có chắc chắn muốn xóa báo giá ${id} không? Hành động này không thể hoàn tác.`,
    )
  ) {
    // Code xử lý xóa ở đây (ví dụ: xóa dòng trong array data)
    alert(`Đã xóa thành công báo giá ${id}`);
    // Cập nhật lại giao diện...
  }
}

function refreshTabData(tabId) {
    console.log("🔄 Đang làm mới dữ liệu cho tab:", tabId);

    switch (tabId) {
        case "dashboard":
            if (typeof updateDashboardStats === "function") updateDashboardStats();
            break;

        case "quotation-list":
        case "customer-list":
            if (typeof renderCustomerTables === "function") renderCustomerTables();
            break;

        // THÊM CASE MỚI CHO TRUNG TÂM PHÊ DUYỆT TẠI ĐÂY
        case "approval-center": 
            if (typeof renderApprovalCenter === "function") {
                renderApprovalCenter();
            } else {
                console.error("Lỗi: Hàm renderApprovalCenter chưa được định nghĩa!");
            }
            break;

        case "shipping-list":
            if (typeof renderShippingTable === "function") renderShippingTable();
            break;

        case "receipt-list": 
            if (typeof renderReceiptTable === "function") {
                renderReceiptTable();
            } else {
                console.error("Lỗi: Hàm renderReceiptTable chưa được định nghĩa!");
            }
            break;

        default:
            console.warn("⚠️ Tab " + tabId + " chưa có hàm xử lý dữ liệu.");
    }
}

// Hàm render Vận đơn
function renderShippingTable() {
  const body = document.getElementById("shipping-table-body");
  if (!body) return;

  const shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];
  body.innerHTML = shippingList.length
    ? shippingList
        .map(
          (item) => `
            <tr>
                <td>#${item.vdCode}</td>
                <td>${item.custName}</td>
                <td>${item.route}</td>
                <td>${item.cargo}</td>
                <td>${item.price}</td>
                <td><span class="status-badge">${item.status}</span></td>
            </tr>`,
        )
        .join("")
    : '<tr><td colspan="6" style="text-align:center">Chưa có vận đơn</td></tr>';
}

// 1. Hàm lấy dữ liệu riêng cho Tab Phê duyệt
async function renderApprovalCenter() {
    const body = document.getElementById("approval-table-body");
    if (!body) return;

    body.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang kiểm tra đơn đợi duyệt...</td></tr>`;

    try {
        // LỌC: Chỉ lấy những đơn có status là "Chờ duyệt"
        const snapshot = await db.collection("quotations")
                                 .where("status", "==", "Chờ duyệt")
                                 .get();

        body.innerHTML = "";

        if (snapshot.empty) {
            body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">Không có báo giá nào cần phê duyệt hiện tại.</td></tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            const item = doc.data();
            const docId = doc.id;

            body.innerHTML += `
                <tr>
                    <td>#${item.id}</td>
                    <td><strong>${item.name || item.customerName}</strong></td>
                    <td style="color:#059669; font-weight:bold;">${item.price}</td>
                    <td>${item.staff || "Admin"}</td>
                    <td><span class="status-badge badge-amber">Chờ duyệt</span></td>
                    <td>
                        <button class="btn-approve" onclick="handleDecision('${docId}', 'Đã chốt')">Duyệt</button>
                        <button class="btn-reject" onclick="handleDecision('${docId}', 'Đã hủy')">Từ chối</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Lỗi Phê duyệt:", error);
    }
}

// 2. Hàm xử lý Duyệt hoặc Từ chối
window.handleDecision = async function(docId, newStatus) {
    const action = newStatus === 'Đã chốt' ? "PHÊ DUYỆT" : "TỪ CHỐI";
    if (confirm(`Bạn có chắc chắn muốn ${action} báo giá này?`)) {
        try {
            await db.collection("quotations").doc(docId).update({
                status: newStatus
            });
            alert("Thao tác thành công!");
            renderApprovalCenter(); // Cập nhật lại bảng phê duyệt
            if (typeof renderCustomerTables === "function") renderCustomerTables(); // Cập nhật lại bảng tổng
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    }
};

// Các hàm trống cho các tab Thu tiền/Hệ thống để tránh lỗi ReferenceError
// Hàm lấy và hiển thị danh sách Phiếu Thu từ Firebase
async function renderReceiptTable() {
  const body = document.getElementById("receipt-table-body");
  if (!body) return;

  // Xóa trắng bảng và hiện trạng thái đang tải (tùy chọn)
  body.innerHTML = `<tr><td colspan="8" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;

  try {
    const snapshot = await db.collection("receipts").get();
    
    // TRƯỜNG HỢP 1: Bảng trên Firebase đang trống
    if (snapshot.empty) {
      body.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 30px; color: #64748b;">
            <i class="fa-solid fa-file-invoice" style="font-size: 20px; margin-bottom: 10px; display: block;"></i>
            Chưa có phiếu thu nào
          </td>
        </tr>`;
      return;
    }

    // TRƯỜNG HỢP 2: Có dữ liệu, tiến hành đổ vào bảng
    body.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      body.innerHTML += `
        <tr>
          <td>#${data.id || 'PT-Auto'}</td>
          <td>${data.date || ''}</td>
          <td><strong>${data.customerName || 'N/A'}</strong></td>
          <td>${data.amount || '0đ'}</td>
          <td>${data.method || 'Tiền mặt'}</td>
          <td><span class="status-badge">${data.status || 'Hoàn thành'}</span></td>
          <td><button class="btn-outline">Sửa</button></td>
          <td>
            <button onclick="deleteReceipt('${doc.id}')" style="color:red; background:none; border:none; cursor:pointer;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
    });

  } catch (error) {
    console.error("Lỗi Firebase:", error);
    // TRƯỜNG HỢP 3: Nếu lỗi, mình vẫn để "Chưa có phiếu thu" theo ý bạn
    // Hoặc bạn có thể để: "Hệ thống đang cập nhật..."
    body.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 30px; color: #64748b;">
          Chưa có phiếu thu
        </td>
      </tr>`;
  }
}

// Hàm xóa phiếu thu
window.deleteReceipt = async function(docId) {
  if (confirm("Bạn có chắc chắn muốn xóa phiếu thu này?")) {
    try {
      await db.collection("receipts").doc(docId).delete();
      alert("Đã xóa phiếu thu!");
      renderReceiptTable(); // Tải lại bảng sau khi xóa
    } catch (error) {
      alert("Lỗi khi xóa: " + error.message);
    }
  }
};
function renderSystemConfig() {
  console.log("Render cấu hình...");
}

// 1. Khởi tạo EmailJS (Lấy Key tại emailjs.com)
(function () {
  emailjs.init("YOUR_PUBLIC_KEY");
})();

// 2. Hàm xử lý PDF & Email
async function handleExport(elementId, fileName, customerEmail) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Cấu hình PDF
  const opt = {
    margin: 0.5,
    filename: fileName + ".pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  try {
    // Thông báo cho user
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "Đang xử lý...";
    btn.disabled = true;

    // TẠO PDF VÀ TẢI VỀ
    await html2pdf().set(opt).from(element).save();

    // GỬI MAIL (Sử dụng Template đã tạo trên EmailJS)
    // Lưu ý: Để gửi kèm file PDF thực tế, EmailJS bản miễn phí thường gửi link hoặc content.
    // Ở đây ta gửi thông báo xác nhận kèm chi tiết.
    await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      to_email: customerEmail,
      subject: "Thông báo từ Hệ thống Logistics HHH",
      message: `Hệ thống đã ghi nhận ${fileName} của quý khách. File đính kèm đã được tải về máy của nhân viên.`,
      file_name: fileName,
    });

    alert("Thành công: Đã lưu PDF và gửi mail cho khách hàng!");
    btn.innerText = originalText;
    btn.disabled = false;
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Có lỗi xảy ra khi tạo file hoặc gửi mail.");
  }
}
window.resetTabInput = function(buttonElement) {
    // Tìm thẻ div (tab-content) bao quanh nút bấm này
    const parentTab = buttonElement.closest('.tab-content');
    
    if (parentTab) {
        // 1. Xóa tất cả các ô input và textarea
        const inputs = parentTab.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.value = "";
        });

        // 2. Đưa các ô chọn (select) về mặc định
        const selects = parentTab.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });

        // 3. Xử lý riêng cho các thẻ hiển thị giá tiền (nếu có)
        const priceDisplay = parentTab.querySelector('#total-price-display');
        if (priceDisplay) {
            priceDisplay.innerText = "0đ";
        }

        // 4. Xóa đường vẽ trên bản đồ (nếu đang ở tab báo giá)
        if (parentTab.id === "quotation-create" && typeof routeLayer !== 'undefined' && routeLayer) {
            map.removeLayer(routeLayer);
        }

        console.log("Đã xóa sạch dữ liệu trong tab: " + parentTab.id);
    }
};

window.handleFilterByCode = function() {
    const code = prompt("Nhập mã báo giá cần tìm (Ví dụ: BQ-4661):");
    if (code && code.trim() !== "") {
        // Gọi lại hàm render với tham số là mã vừa nhập
        renderCustomerTables(code.trim().toUpperCase());
    }
};

// Thêm hàm này vào cuối file script.js của bạn
window.loadQuotationList = function() {
    console.log("Đang tải danh sách báo giá...");
    // Gọi hàm render chính mà bạn đã có trong code 1000 dòng
    if (typeof renderCustomerTables === "function") {
        renderCustomerTables('Tất cả'); 
    } else {
        console.error("Lỗi: Không tìm thấy hàm renderCustomerTables trong file 1000 dòng.");
    }
};