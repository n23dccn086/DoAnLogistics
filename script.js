document.addEventListener("DOMContentLoaded", function () {
  // 1. QUẢN LÝ DỮ LIỆU (LocalStorage)
  let customerList = JSON.parse(localStorage.getItem("hhh_data")) || [];

  // 2. QUẢN LÝ TABS
  const menuItems = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-tab");
      menuItems.forEach((i) => i.classList.remove("active"));
      tabContents.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      const targetTab = document.getElementById(targetId);
      if (targetTab) {
        targetTab.classList.add("active");
        if (targetId === "quotation-create" && map) {
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
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

  // 4. CẤU HÌNH GIÁ
  let systemConfig = {
    normal: 15000,
    fragile: 25000,
    cold: 45000,
    threshold: 100,
    discount: 20,
  };

  // 5. TÌM KIẾM ĐỊA CHỈ & ROUTE
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
      const customerName = document.getElementById("cust-info").value;
      const totalMoney = document.getElementById(
        "total-price-display",
      ).innerText;
      if (!customerName || totalMoney === "0đ") {
        alert("Vui lòng nhập tên khách và tính giá trước khi lưu!");
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
    });
  }

  // 7. CẬP NHẬT BẢNG GIÁ HỆ THỐNG
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
      alert("Đã cập nhật đơn giá mới!");
      calculatePrice();
    });
  }

  // 8. CÁC HÀM VẼ BẢNG & TRẠNG THÁI (Global)
  window.renderCustomerTables = function () {
    const quoteTableBody = document.querySelector("#quotation-list tbody");
    const customerTableBody = document.querySelector("#customer-list tbody");

    if (customerList.length === 0) {
      const noData = `<tr><td colspan="5" style="text-align:center; padding:40px;">Chưa có dữ liệu</td></tr>`;
      if (quoteTableBody) quoteTableBody.innerHTML = noData;
      if (customerTableBody) customerTableBody.innerHTML = noData;
      updateDashboardStats();
      return;
    }

    if (quoteTableBody) quoteTableBody.innerHTML = "";
    if (customerTableBody) customerTableBody.innerHTML = "";

    customerList.forEach((item) => {
      if (quoteTableBody) {
        quoteTableBody.innerHTML += `
                    <tr>
                        <td style="padding:15px;">#${item.id}</td>
                        <td style="padding:15px;">${item.name}</td>
                        <td style="padding:15px; color:var(--color-green); font-weight:700;">${item.price}</td>
                        <td style="padding:15px;"><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
                        <td style="padding:15px;"><button onclick="updateStatus('${item.id}')" class="btn-outline" style="width:auto; padding:5px 10px;">Đổi</button></td>
                    </tr>`;
      }
      if (customerTableBody) {
        customerTableBody.innerHTML += `
                    <tr>
                        <td style="padding:15px;"><strong>${item.name}</strong></td>
                        <td style="padding:15px;">${item.date}</td>
                        <td style="padding:15px;"><span class="status-badge badge-blue">Thành viên</span></td>
                        <td style="padding:15px;"><button onclick="deleteOrder('${item.id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
                    </tr>`;
      }
    });
    updateDashboardStats();
  };

  window.updateStatus = function (id) {
    const statuses = [
      "Chờ duyệt",
      "Đã chốt",
      "Đang giao",
      "Hoàn thành",
      "Đã hủy",
    ];
    let msg =
      "Chọn trạng thái (1-5):\n" +
      statuses.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const choice = prompt(msg, "1");
    if (choice >= 1 && choice <= 5) {
      const idx = customerList.findIndex((item) => item.id === id);
      customerList[idx].status = statuses[choice - 1];
      localStorage.setItem("hhh_data", JSON.stringify(customerList));
      renderCustomerTables();
    }
  };

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

  function updateDashboardStats() {
    const total = customerList
      .filter((i) => i.status !== "Đã hủy")
      .reduce((s, i) => s + (parseInt(i.price.replace(/\D/g, "")) || 0), 0);
    const completed = customerList.filter(
      (i) => i.status === "Hoàn thành",
    ).length;
    const pending = customerList.filter((i) => i.status === "Chờ duyệt").length;

    if (document.getElementById("stat-revenue"))
      document.getElementById("stat-revenue").innerText =
        total.toLocaleString("vi-VN") + "đ";
    if (document.getElementById("stat-completed"))
      document.getElementById("stat-completed").innerText = completed;
    if (document.getElementById("stat-pending"))
      document.getElementById("stat-pending").innerText = pending;
  }

  // Khởi chạy lần đầu
  renderCustomerTables();
});
