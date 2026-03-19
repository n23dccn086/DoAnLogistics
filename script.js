document.addEventListener("DOMContentLoaded", function () {
  // 1. QUẢN LÝ DỮ LIỆU (LocalStorage)
  let customerList = JSON.parse(localStorage.getItem("hhh_data")) || [];
  // Thêm vào phần đầu file (Quản lý dữ liệu)
  let shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];

  // Hàm Render bảng Vận Đơn
  window.renderShippingTable = function () {
    const shippingTableBody = document.getElementById("shipping-table-body");
    if (!shippingTableBody) return;

    shippingTableBody.innerHTML = "";
    if (shippingList.length === 0) {
      shippingTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có vận đơn nào</td></tr>`;
      return;
    }

    shippingList.forEach((item) => {
      shippingTableBody.innerHTML += `
      <tr>
        <td>#${item.vdCode}</td>
        <td><strong>${item.custName}</strong></td>
        <td><small>${item.route}</small></td>
        <td>${item.cargo}</td>
        <td style="color:var(--color-green); font-weight:700;">${item.price}</td>
        <td><span class="status-badge badge-blue">${item.status}</span></td>
      </tr>`;
    });
  };
  let systemConfig = JSON.parse(localStorage.getItem("hhh_config")) || {
    normal: 15000,
    fragile: 25000,
    cold: 45000,
    threshold: 100,
    discount: 20,
  };

  // 2. QUẢN LÝ TABS - Sửa lỗi không hiện các tab mới
  const menuItems = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-tab");

      // Xóa active ở Menu
      menuItems.forEach((i) => i.classList.remove("active"));
      // Ẩn tất cả các Tab nội dung
      tabContents.forEach((t) => {
        t.classList.remove("active");
        t.style.display = "none";
      });

      // Kích hoạt Menu và Tab được chọn
      this.classList.add("active");
      const targetTab = document.getElementById(targetId);

      if (targetTab) {
        targetTab.classList.add("active");
        targetTab.style.display = "block"; // Ép hiển thị

        // Fix lỗi bản đồ khi vào tab tạo báo giá
        if (targetId === "quotation-create" && typeof map !== "undefined") {
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }

        // Cập nhật dữ liệu tương ứng với từng Tab
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
        alert(
          "Vui lòng kiểm tra lại Tên khách hàng hoặc SĐT không được để trống!",
        );
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
  window.renderCustomerTables = function () {
    const quoteTableBody = document.querySelector("#quotation-list tbody");
    const customerTableBody = document.querySelector("#customer-list tbody");

    if (quoteTableBody) quoteTableBody.innerHTML = "";
    if (customerTableBody) customerTableBody.innerHTML = "";

    if (customerList.length === 0) {
      const emptyRow = `<tr><td colspan="9" style="text-align:center; padding:20px;">Chưa có dữ liệu báo giá</td></tr>`;
      if (quoteTableBody) quoteTableBody.innerHTML = emptyRow;
      return;
    }

    customerList.forEach((item) => {
      // Render cho bảng Danh sách báo giá (9 cột)
      if (quoteTableBody) {
        quoteTableBody.innerHTML += `
          <tr>
            <td>#${item.id}</td>
            <td>${item.date || "19/03/2026"}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.staff || "Admin"}</td>
            <td style="color:var(--color-green); font-weight:700;">${item.price}</td>
            <td>${item.expiry || "26/03/2026"}</td>
            <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
            <td>
               <button class="btn-outline" onclick="updateStatus('${item.id}')" style="width:auto; padding:5px 10px;">Đổi</button>
            </td>
            <td>
               <button class="btn-delete" onclick="deleteOrder('${item.id}')" style="color:red; border:none; background:none; cursor:pointer;">
                  <i class="fa-solid fa-trash-can"></i>
               </button>
            </td>
          </tr>`;
      }

      // Render cho bảng Khách hàng (Tab Khách hàng)
      if (customerTableBody) {
        customerTableBody.innerHTML += `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.date}</td>
            <td><span class="status-badge badge-blue">Thành viên</span></td>
            <td><button onclick="deleteOrder('${item.id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`;
      }
    });

    updateDashboardStats(); // Cập nhật số liệu trên Dashboard
  };
  window.renderShippingTable = function () {
    const shippingTableBody = document.getElementById("shipping-table-body");
    if (!shippingTableBody) return;

    shippingTableBody.innerHTML = "";
    if (shippingList.length === 0) {
      shippingTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Chưa có dữ liệu vận đơn</td></tr>`;
      return;
    }

    shippingList.forEach((item) => {
      shippingTableBody.innerHTML += `
        <tr>
          <td>#${item.vdCode}</td>
          <td><strong>${item.custName}</strong></td>
          <td><small>${item.route}</small></td>
          <td>${item.cargo}</td>
          <td style="color:var(--color-green); font-weight:700;">${item.price}</td>
          <td><span class="status-badge badge-blue">${item.status}</span></td>
        </tr>`;
    });
  };
  // Cập nhật trạng thái
  window.updateStatus = function (id) {
    const statuses = ["Chờ chốt", "Đã chốt", "Đã hủy"];
    let msg =
      "Chọn trạng thái:\n" +
      statuses.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const choice = prompt(msg, "1");
    if (choice >= 1 && choice <= 3) {
      const idx = customerList.findIndex((item) => item.id === id);
      customerList[idx].status = statuses[choice - 1];
      localStorage.setItem("hhh_data", JSON.stringify(customerList));
      renderCustomerTables();
    }
  };

  // Xóa đơn hàng
  window.deleteOrder = function (id) {
    if (confirm("Xóa đơn này?")) {
      customerList = customerList.filter((item) => item.id !== id);
      localStorage.setItem("hhh_data", JSON.stringify(customerList));
      renderCustomerTables();
    }
  };

  function getStatusClass(status) {
    switch (status) {
      case "Đã chốt":
        return "badge-green";
      case "Đang giao":
        return "badge-blue";
      case "Hoàn thành":
        return "badge-cyan";
      case "Đã hủy":
        return "badge-red";
      default:
        return "badge-amber";
    }
  }

  // Cập nhật số liệu Dashboard thực tế
  function updateDashboardStats() {
    const total = customerList
      .filter((i) => i.status !== "Đã hủy")
      .reduce((s, i) => s + (parseInt(i.price.replace(/\D/g, "")) || 0), 0);
    const completed = customerList.filter(
      (i) => i.status === "Hoàn thành",
    ).length;
    const pending = customerList.filter((i) => i.status === "Chờ duyệt").length;

    // Tìm các thẻ h2 trong stats-grid của tab Dashboard
    const dashboardCards = document.querySelectorAll(
      "#dashboard .stats-grid h2",
    );
    if (dashboardCards.length >= 3) {
      dashboardCards[0].innerText = total.toLocaleString("vi-VN") + "đ"; // Doanh thu
      dashboardCards[1].innerText = completed; // Đơn hoàn thành
      dashboardCards[2].innerText = pending; // Báo giá chờ
    }
  }

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

// Hàm giả lập lấy data từ báo giá (Dùng cho demo)
function loadQuotationData() {
  const code = document.getElementById("search-quotation").value;
  if (!code) return alert("Vui lòng nhập mã báo giá!");

  // Giả lập điền thông tin tự động
  document.getElementById("ship-cust-name").value =
    "Công ty TNHH Logistics ABC";
  document.getElementById("ship-price").value = "15,500,000 VNĐ";
  document.getElementById("ship-route").value =
    "Kho Hà Nội -> Cảng Cát Lái, HCM";
  document.getElementById("ship-cargo").value = "250kg - Hàng dễ vỡ";
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
  console.log("Đang làm mới dữ liệu cho tab:", tabId);

  // Kiểm tra xem hàm có tồn tại không trước khi gọi để tránh treo App
  switch (tabId) {
    case "dashboard":
      if (typeof updateDashboardStats === "function") {
        updateDashboardStats();
      }
      break;
    case "quotation-list":
    case "customer-list":
      if (typeof renderCustomerTables === "function") {
        renderCustomerTables();
      }
      break;
    case "shipping-list":
      if (typeof renderShippingTable === "function") {
        renderShippingTable();
      }
      break;
    // Các tab khác chưa có hàm render thì sẽ không báo lỗi nữa
    default:
      console.warn("Tab " + tabId + " chưa có hàm xử lý dữ liệu.");
  }
}
// Hàm cập nhật số liệu Dashboard (giúp hết lỗi ReferenceError)
function updateDashboardStats() {
  // Cập nhật số lượng khách hàng
  const totalCustomers = document.getElementById("total-customers");
  if (totalCustomers) {
    let customerList = JSON.parse(localStorage.getItem("hhh_data")) || [];
    totalCustomers.innerText = customerList.length;
  }

  // Cập nhật số lượng vận đơn
  const totalShipping = document.getElementById("total-shipping");
  if (totalShipping) {
    let shippingList = JSON.parse(localStorage.getItem("hhh_shipping")) || [];
    totalShipping.innerText = shippingList.length;
  }

  console.log("Đã cập nhật số liệu Dashboard");
}

// Hàm cập nhật Dashboard
function updateDashboardStats() {
  console.log("Cập nhật số liệu Dashboard...");
  const totalCust = document.getElementById("total-customers");
  if (totalCust) {
    const data = JSON.parse(localStorage.getItem("hhh_data")) || [];
    totalCust.innerText = data.length;
  }
}

// Hàm render Vận đơn (Nếu bạn chưa có)
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
function renderReceiptTable() {
  console.log("Render phiếu thu...");
}
function renderSystemConfig() {
  console.log("Render cấu hình...");
}
