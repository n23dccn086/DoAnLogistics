// js/auth.js
async function doLogin() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!username || !password) {
        showToast("Vui lòng nhập tên đăng nhập và mật khẩu", "error");
        return;
    }

    try {
        console.log(`🔐 Đang đăng nhập với username: ${username}`);

        const data = await callAPI("auth/login", {
            method: "POST",
            body: JSON.stringify({ 
                tenDangNhap: username, 
                matKhau: password 
            }),
        });

        console.log("📦 Dữ liệu trả về từ server:", data);

        if (data && data.accessToken) {
            // Lưu token và user
            localStorage.setItem("token", data.accessToken);
            
            if (data.nguoiDung) {
                localStorage.setItem("user", JSON.stringify(data.nguoiDung));
            }

            console.log("✅ Token đã lưu thành công:", data.accessToken.substring(0, 20) + "...");

            showToast("Đăng nhập thành công!", "success");

            // Ẩn login, hiện app
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("appLayout").style.display = "flex";

            // Chuyển sang Dashboard
            setTimeout(() => {
                showPage("dashboard");
            }, 300);

        } else {
            console.error("❌ Server không trả về accessToken");
            throw new Error("Server không trả về token");
        }
    } catch (error) {
        console.error("💥 Login failed:", error);
        showToast(error.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.", "error");
    }
}

function doLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showToast("Đã đăng xuất");
  showPage("login");
}
