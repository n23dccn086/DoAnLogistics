document.addEventListener("DOMContentLoaded", function () {
  // 1. QUẢN LÝ DỮ LIỆU (LocalStorage)
  let customerList = JSON.parse(localStorage.getItem("hhh_data")) || [];
  
  let systemConfig = JSON.parse(localStorage.getItem("hhh_config")) || {
    normal: 15000,
    fragile: 25000,
    cold: 45000,
    threshold: 100,
    discount: 20,
  };

  // 2. QUẢN LÝ TABS (ĐÃ SỬA LỖI CHỒNG TAB)
  const menuItems = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-tab");

      // Xóa class active ở Menu
      menuItems.forEach((i) => i.classList.remove("active"));
      // Ẩn tất cả các Tab nội dung
      tabContents.forEach((t) => {
        t.classList.remove("active");
        t.style.display = "none"; // Ép ẩn hoàn toàn
      });

      // Kích hoạt Menu hiện tại
      this.classList.add("active");

      // Hiển thị Tab được chọn
      const targetTab = document.getElementById(targetId);
      if (targetTab) {
        targetTab.classList.add("active");
        targetTab.style.display = "block"; // Hiện tab mục tiêu

        // Fix lỗi bản đồ bị xám khi ẩn/hiện
        if (targetId === "quotation-create" && map) {
          setTimeout(() => { map.invalidateSize(); }, 200);
        }
        
        // Cập nhật lại bảng khi vào tab danh sách
        if (targetId === "quotation-list" || targetId === "customer-list" || targetId === "dashboard") {
          renderCustomerTables();
        }
      }
    });
  });

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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`);
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
    } catch (e) { console.error("Lỗi địa chỉ:", e); }
  }

  document.getElementById("start-address").oninput = (e) => searchAddress(e.target.value, "start-suggestions", "start");
  document.getElementById("end-address").oninput = (e) => searchAddress(e.target.value, "end-suggestions", "end");

  async function updateRoute() {
    if (!startCoords || !endCoords) return;
    let pointList = [`${startCoords[1]},${startCoords[0]}`];
    if (Math.abs(startCoords[0] - endCoords[0]) > 5) {
      startCoords[0] > endCoords[0] ? pointList.push(...vnWaypoints) : pointList.push(vnWaypoints[1], vnWaypoints[0]);
    }
    pointList.push(`${endCoords[1]},${endCoords[0]}`);
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pointList.join(";")}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === "Ok") {
        const route = data.routes[0];
        document.getElementById("distance-display").value = (route.distance / 1000).toFixed(1);
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.geoJSON(route.geometry, { style: { color: "#06b6d4", weight: 6, opacity: 0.8 } }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
        calculatePrice();
      }
    } catch (e) { console.error("Lỗi tuyến đường:", e); }
  }

  // 5. TÍNH TOÁN GIÁ
  function calculatePrice() {
    const km = parseFloat(document.getElementById("distance-display").value) || 0;
    const weight = parseFloat(document.getElementById("weight-input").value) || 0;
    const type = document.getElementById("cargo-type").value;
    const unitPrice = systemConfig[type];
    let discount = weight >= systemConfig.threshold ? (100 - systemConfig.discount) / 100 : 1;
    const total = Math.round(km * weight * unitPrice * discount);
    document.getElementById("total-price-display").innerText = total.toLocaleString("vi-VN") + "đ";
  }

  document.getElementById("cargo-type").addEventListener("change", calculatePrice);
  document.getElementById("weight-input").addEventListener("input", calculatePrice);

  // 6. LƯU BÁO GIÁ
  const btnSave = document.getElementById("btnSave");
  if (btnSave) {
    btnSave.addEventListener("click", function () {
      const customerName = document.getElementById("cust-info").value.trim();
      const totalMoney = document.getElementById("total-price-display").innerText;
      const distance = parseFloat(document.getElementById("distance-display").value) || 0;
      
      if (!customerName || distance <= 0) {
        alert("Vui lòng kiểm tra lại Tên khách hàng hoặc SĐT không được để trống!");
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
      systemConfig.normal = parseFloat(document.getElementById("cfg-normal").value);
      systemConfig.fragile = parseFloat(document.getElementById("cfg-fragile").value);
      systemConfig.cold = parseFloat(document.getElementById("cfg-cold").value);
      systemConfig.threshold = parseFloat(document.getElementById("cfg-threshold").value);
      systemConfig.discount = parseFloat(document.getElementById("cfg-discount").value);
      
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
      const emptyRow = `<tr><td colspan="5" style="text-align:center; padding:20px;">Trống</td></tr>`;
      if (quoteTableBody) quoteTableBody.innerHTML = emptyRow;
      return;
    }

    customerList.forEach((item) => {
      if (quoteTableBody) {
        quoteTableBody.innerHTML += `
          <tr>
            <td>#${item.id}</td>
            <td>${item.name}</td>
            <td style="color:var(--color-green); font-weight:700;">${item.price}</td>
            <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
            <td><button onclick="updateStatus('${item.id}')" class="btn-outline" style="width:auto; padding:5px 10px;">Đổi</button></td>
          </tr>`;
      }
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
    updateDashboardStats();
  };

  // Cập nhật trạng thái
  window.updateStatus = function (id) {
    const statuses = ["Chờ duyệt", "Đã chốt", "Đang giao", "Hoàn thành", "Đã hủy"];
    let msg = "Chọn trạng thái (1-5):\n" + statuses.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const choice = prompt(msg, "1");
    if (choice >= 1 && choice <= 5) {
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
      case "Đã chốt": return "badge-green";
      case "Đang giao": return "badge-blue";
      case "Hoàn thành": return "badge-cyan";
      case "Đã hủy": return "badge-red";
      default: return "badge-amber";
    }
  }

  // Cập nhật số liệu Dashboard thực tế
  function updateDashboardStats() {
    const total = customerList
      .filter((i) => i.status !== "Đã hủy")
      .reduce((s, i) => s + (parseInt(i.price.replace(/\D/g, "")) || 0), 0);
    const completed = customerList.filter((i) => i.status === "Hoàn thành").length;
    const pending = customerList.filter((i) => i.status === "Chờ duyệt").length;

    // Tìm các thẻ h2 trong stats-grid của tab Dashboard
    const dashboardCards = document.querySelectorAll("#dashboard .stats-grid h2");
    if (dashboardCards.length >= 3) {
        dashboardCards[0].innerText = total.toLocaleString("vi-VN") + "đ"; // Doanh thu
        dashboardCards[1].innerText = completed; // Đơn hoàn thành
        dashboardCards[2].innerText = pending;   // Báo giá chờ
    }
  }

  // Khởi chạy lần đầu
  renderCustomerTables();
});