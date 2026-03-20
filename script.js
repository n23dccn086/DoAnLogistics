document.addEventListener("DOMContentLoaded", function () {
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
  async function searchAddress(query, boxId, type) {
    if (query.length < 3) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`,
      );
      const data = await res.json();
      const box = document.getElementById(boxId);
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
          updateRoute();
        };
        box.appendChild(div);
      });
    } catch (e) {
      console.error("Lỗi địa chỉ:", e);
    }
  }

  document.getElementById("start-address").oninput = (e) =>
    searchAddress(e.target.value, "start-suggestions", "start");
  document.getElementById("end-address").oninput = (e) =>
    searchAddress(e.target.value, "end-suggestions", "end");

  async function updateRoute() {
    if (!startCoords || !endCoords) return;
    let pointList = [`${startCoords[1]},${startCoords[0]}`];
    if (Math.abs(startCoords[0] - endCoords[0]) > 5) {
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
        document.getElementById("distance-display").value = (
          route.distance / 1000
        ).toFixed(1);
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.geoJSON(route.geometry, {
          style: { color: "#06b6d4", weight: 6, opacity: 0.8 },
        }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
        calculatePrice();
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
  const btnSave = document.getElementById("btnSave");
  if (btnSave) {
    btnSave.addEventListener("click", function () {
      const customerName = document.getElementById("cust-info").value.trim();
      const totalMoney = document.getElementById(
        "total-price-display",
      ).innerText;
      const distance =
        parseFloat(document.getElementById("distance-display").value) || 0;

      if (!customerName || distance <= 0) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      const newOrder = {
        id: "BQ-" + Math.floor(Math.random() * 9000 + 1000),
        date: new Date().toLocaleDateString("vi-VN"),
        name: customerName,
        price: totalMoney,
        status: "Chờ duyệt",
      };

      customerList.push(newOrder);
      db.collection("quotations").add(newOrder); // Lưu lên Firebase Cloud
      localStorage.setItem("hhh_data", JSON.stringify(customerList));
      renderCustomerTables();
      alert("Đã lưu đơn hàng của " + customerName);
      document.getElementById("cust-info").value = "";
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
window.renderCustomerTables = function () {
    const quoteTableBody = document.getElementById("quotation-table-body");
    if (!quoteTableBody) return;

    // THAY .get() THÀNH .onSnapshot()
    // Hàm này sẽ tự chạy lại mỗi khi database có biến động
    db.collection("quotations").onSnapshot((snapshot) => {
        console.log("🔔 Database vừa có thay đổi!");
        quoteTableBody.innerHTML = "";

        if (snapshot.empty) {
            quoteTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Chưa có dữ liệu</td></tr>`;
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
                    <td><span class="status-badge ${getStatusClass(item.status)}">${item.status || 'Chưa chốt'}</span></td>
                    <td><button class="btn-outline" onclick="updateStatus('${docId}')">Đổi</button></td>
                    <td>
                       <button class="btn-delete" onclick="deleteOrder('${docId}')" style="color:red; border:none; background:none; cursor:pointer;">
                          <i class="fa-solid fa-trash-can"></i>
                       </button>
                    </td>
                </tr>`;
        });
    }, (error) => {
        console.error("Lỗi lắng nghe dữ liệu:", error);
    });
};

  // Cập nhật trạng thái
  // Cập nhật trạng thái trực tiếp lên Firestore
window.updateStatus = async function (docId) {
    const statuses = ["Chưa chốt", "Đã chốt", "Đã hủy"];
    
    // Tạo bảng chọn nhanh
    let msg = "Chọn trạng thái mới:\n1. Chưa chốt\n2. Đã chốt\n3. Đã hủy";
    const choice = prompt(msg, "1");

    if (choice && choice >= 1 && choice <= 3) {
        const newStatus = statuses[choice - 1];

        try {
            // Cập nhật lên Cloud Firestore
            await db.collection("quotations").doc(docId).update({
                status: newStatus
            });

            alert("Đã chuyển sang: " + newStatus);
            
            // Gọi lại hàm render để bảng cập nhật màu sắc/chữ mới
            renderCustomerTables(); 
            
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Lỗi kết nối Firebase: " + error.message);
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
            return "badge-green"; // Màu xanh lá
        case "Đã hủy":
            return "badge-red";   // Màu đỏ
        case "Chưa chốt":
        default:
            return "badge-amber"; // Màu cam/vàng
    }
}
  // Cập nhật số liệu Dashboard thực tế
  function updateDashboardStats() {
    console.log("--- Đang cập nhật số liệu Dashboard ---");

    // Lấy dữ liệu từ LocalStorage
    const customerData = JSON.parse(localStorage.getItem("hhh_data")) || [];
    const shippingData = JSON.parse(localStorage.getItem("hhh_shipping")) || [];

    // 1. Cập nhật các ô số lượng (Total Cards)
    const totalCustElem = document.getElementById("total-customers");
    const totalShipElem = document.getElementById("total-shipping");

    if (totalCustElem) totalCustElem.innerText = customerData.length;
    if (totalShipElem) totalShipElem.innerText = shippingData.length;

    // 2. Cập nhật các chỉ số chi tiết (Doanh thu, Hoàn thành, Chờ duyệt)
    // Giả định các thẻ h2 nằm trong .stats-grid của tab Dashboard
    const dashboardCards = document.querySelectorAll(
      "#dashboard .stats-grid h2",
    );

    if (dashboardCards.length >= 3) {
      // Tính tổng doanh thu từ các báo giá (loại bỏ chữ 'đ' và dấu chấm để cộng)
      const totalRevenue = customerData
        .filter((item) => item.status !== "Đã hủy")
        .reduce((sum, item) => {
          const priceNum = parseInt(item.price.replace(/\D/g, "")) || 0;
          return sum + priceNum;
        }, 0);

      const completedCount = customerData.filter(
        (item) => item.status === "Hoàn thành",
      ).length;
      const pendingCount = customerData.filter(
        (item) => item.status === "Chờ duyệt",
      ).length;

      // Gán giá trị lên giao diện
      dashboardCards[0].innerText = totalRevenue.toLocaleString("vi-VN") + "đ"; // Doanh thu
      dashboardCards[1].innerText = completedCount; // Đơn hoàn thành
      dashboardCards[2].innerText = pendingCount; // Báo giá chờ
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
  let shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];

  // Lấy mã vận đơn hiện tại từ giao diện (nếu có) hoặc tạo mới
  const vdCodeDisplay = document.getElementById("generated-vd-code").innerText;

  const newVD = {
    vdCode: vdCodeDisplay !== "---" ? vdCodeDisplay : generateVDCode(),
    custName: document.getElementById("ship-cust-name").value,
    route: document.getElementById("ship-route").value,
    cargo: document.getElementById("ship-cargo").value,
    price: document.getElementById("ship-price").value,
    status: "Đang xử lý",
    date: new Date().toLocaleDateString("vi-VN"),
  };

  if (!newVD.custName) {
    console.warn("Không có tên khách hàng, bỏ qua lưu vận đơn.");
    return;
  }

  shippingList.push(newVD);
  localStorage.setItem("hhh_shipping", JSON.stringify(shippingList));

  updateDashboardStats();
  if (typeof renderShippingTable === "function") renderShippingTable();
}
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

function loadQuotationData() {
  const code = document.getElementById("search-quotation").value.trim();
  if (!code) return alert("Vui lòng nhập mã báo giá!");

  // Lấy danh sách báo giá từ bộ nhớ
  const quotationList = JSON.parse(localStorage.getItem("hhh_data")) || [];

  // Tìm báo giá khớp với mã nhập vào
  const found = quotationList.find(
    (item) => item.qCode === code || item.id === code,
  );

  if (found) {
    // Điền dữ liệu thật từ báo giá vào form Tạo vận đơn
    document.getElementById("ship-cust-name").value = found.custName;
    document.getElementById("ship-price").value = found.totalPrice;
    document.getElementById("ship-route").value = found.route;
    document.getElementById("ship-cargo").value = found.cargoDesc;

    // Lưu email khách hàng vào một hidden field hoặc biến tạm để gửi mail sau này
    window.currentCustomerEmail = found.custEmail || "khachhang@example.com";

    alert("Đã tìm thấy báo giá và tự động điền thông tin!");
  } else {
    alert("Không tìm thấy mã báo giá này trong hệ thống!");
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

        case "shipping-list":
            if (typeof renderShippingTable === "function") renderShippingTable();
            break;

        case "receipt-list": 
            // Thêm kiểm tra function để giống các case trên, tránh lỗi App
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